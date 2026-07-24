package com.lifewallet.api.agent.chat;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class AgentRuntime {

    private static final String SYSTEM_PROMPT = """
            你是 Life Wallet 的 Life Agent，只处理用户自己的生活记录。
            你可以查询已确认记录，或准备新增、修改时长、删除记录。
            任何查询都必须调用 list_records；修改和删除前必须先读取记录，不能猜 recordId、activityIndex 或旧时长。
            写工具只会生成待确认操作，绝不能告诉用户已经写入或删除。
            信息不足时用简短中文追问。与生活记录无关的问题要克制说明能力边界，不做通用问答。
            回答保持温和、简洁，不诊断、不评判，也不补全用户没有记录的时间。
            """;

    private final AgentModel agentModel;
    private final AgentToolRegistry toolRegistry;
    private final AgentConversationPersistence conversationStore;
    private final DeepSeekProperties properties;

    public AgentRuntime(
            AgentModel agentModel,
            AgentToolRegistry toolRegistry,
            AgentConversationPersistence conversationStore,
            DeepSeekProperties properties
    ) {
        this.agentModel = agentModel;
        this.toolRegistry = toolRegistry;
        this.conversationStore = conversationStore;
        this.properties = properties;
    }

    public AgentChatResponse chat(AgentChatRequest request) {
        return chat("test-owner", request);
    }

    public AgentChatResponse chat(String ownerKey, AgentChatRequest request) {
        AgentChatResponse previousResponse = conversationStore.findResponse(ownerKey, request.clientTurnId()).orElse(null);
        if (previousResponse != null) {
            return previousResponse;
        }
        AgentConversationPersistence.ConversationState conversation = conversationStore.getOrCreate(ownerKey, request.conversationId());
        AgentChatResponse response = conversation.findResponse(request.clientTurnId())
                .orElseGet(() -> runTurn(conversation, request));
        conversationStore.rememberResponse(ownerKey, request.clientTurnId(), response);
        return response;
    }

    private AgentChatResponse runTurn(
            AgentConversationPersistence.ConversationState conversation,
            AgentChatRequest request
    ) {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        messages.addAll(conversation.recentMessages());
        String userContent = "当前生活日：" + request.lifeDate()
                + "\n当前目标记录 ID：" + (request.contextRecordId() == null ? "无" : request.contextRecordId())
                + "\n用户输入：" + request.message().trim();
        messages.add(Map.of("role", "user", "content", userContent));

        Set<Long> observedRecordIds = new LinkedHashSet<>();
        int maxSteps = Math.max(1, Math.min(properties.maxSteps(), 6));
        for (int step = 0; step < maxSteps; step++) {
            AgentModelTurn modelTurn = agentModel.complete(messages, toolRegistry.definitions(), conversation.conversationId());
            if (modelTurn.toolCalls().isEmpty()) {
                String message = modelTurn.content() == null || modelTurn.content().isBlank()
                        ? "这次没有得到可用回复，请换一种说法再试。"
                        : modelTurn.content().trim();
                AgentChatResponse response = response(
                        conversation,
                        request.clientTurnId(),
                        "COMPLETED",
                        message,
                        List.copyOf(observedRecordIds),
                        null
                );
                rememberConversation(conversation, request.message(), message, request.clientTurnId(), response);
                return response;
            }

            // 第一版只执行模型返回的第一个 Tool Call，避免并行副作用和难以解释的确认状态。
            AgentToolCall call = modelTurn.toolCalls().getFirst();
            ToolExecutionResult result = toolRegistry.execute(call, request);
            observedRecordIds.addAll(result.recordIds());
            if (result.pendingAction() != null) {
                Long targetRecordId = result.pendingAction().recordId();
                if (targetRecordId != null && !observedRecordIds.contains(targetRecordId)) {
                    messages.add(modelTurn.assistantMessage());
                    messages.add(Map.of(
                            "role", "tool",
                            "tool_call_id", call.id(),
                            "content", "修改或删除前必须先调用 list_records 读取目标记录。"
                    ));
                    continue;
                }
                AgentChatResponse response = response(
                        conversation,
                        request.clientTurnId(),
                        "NEEDS_CONFIRMATION",
                        result.confirmationMessage(),
                        List.copyOf(observedRecordIds),
                        result.pendingAction()
                );
                rememberConversation(
                        conversation,
                        request.message(),
                        result.confirmationMessage(),
                        request.clientTurnId(),
                        response
                );
                return response;
            }

            messages.add(modelTurn.assistantMessage());
            messages.add(Map.of(
                    "role", "tool",
                    "tool_call_id", call.id(),
                    "content", result.content()
            ));
        }

        AgentChatResponse response = response(
                conversation,
                request.clientTurnId(),
                "FAILED",
                "这次处理步骤太多，已安全停止，没有修改任何记录。请把问题说得更具体一点。",
                List.copyOf(observedRecordIds),
                null
        );
        rememberConversation(conversation, request.message(), response.message(), request.clientTurnId(), response);
        return response;
    }

    private AgentChatResponse response(
            AgentConversationPersistence.ConversationState conversation,
            String clientTurnId,
            String status,
            String message,
            List<Long> recordIds,
            PendingActionResponse pendingAction
    ) {
        return new AgentChatResponse(
                conversation.conversationId(),
                "turn_" + UUID.randomUUID(),
                status,
                message,
                recordIds,
                pendingAction
        );
    }

    private void rememberConversation(
            AgentConversationPersistence.ConversationState conversation,
            String userMessage,
            String assistantMessage,
            String clientTurnId,
            AgentChatResponse response
    ) {
        conversation.append("user", userMessage.trim());
        conversation.append("assistant", assistantMessage);
        conversation.remember(clientTurnId, response);
    }
}
