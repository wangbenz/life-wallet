package com.lifewallet.api.agent.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class AgentRuntimeTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final AgentToolRegistry toolRegistry = new AgentToolRegistry(objectMapper);
    private final DeepSeekProperties properties = new DeepSeekProperties(
            "https://api.deepseek.com",
            "",
            "",
            "deepseek-v4-flash",
            Duration.ofSeconds(1),
            Duration.ofSeconds(2),
            4
    );

    @Test
    void queryReadsRecordsThenReturnsModelAnswerAndIsIdempotent() {
        FakeAgentModel model = new FakeAgentModel(
                toolTurn("call_1", "list_records", "{\"scope\":\"today\"}"),
                finalTurn("今天有 1 条已确认记录。")
        );
        AgentRuntime runtime = runtime(model);
        AgentChatRequest request = request("client_1", "我今天记了什么？");

        AgentChatResponse first = runtime.chat(request);
        AgentChatResponse repeated = runtime.chat(request);

        assertThat(first.status()).isEqualTo("COMPLETED");
        assertThat(first.recordIds()).containsExactly(1001L);
        assertThat(repeated).isEqualTo(first);
        assertThat(model.calls).isEqualTo(2);
    }

    @Test
    void updateReadsTargetBeforeReturningConfirmation() {
        FakeAgentModel model = new FakeAgentModel(
                toolTurn("call_1", "list_records", "{\"scope\":\"context\"}"),
                toolTurn(
                        "call_2",
                        "update_activity_duration",
                        "{\"recordId\":1001,\"activityIndex\":0,\"newMinutes\":480}"
                )
        );
        AgentRuntime runtime = runtime(model);

        AgentChatResponse response = runtime.chat(request("client_2", "把这条记录的工作改成 8 小时"));

        assertThat(response.status()).isEqualTo("NEEDS_CONFIRMATION");
        assertThat(response.pendingAction().type()).isEqualTo("UPDATE_DURATION");
        assertThat(response.pendingAction().oldMinutes()).isEqualTo(120);
        assertThat(response.pendingAction().newMinutes()).isEqualTo(480);
    }

    @Test
    void createReturnsPendingActionWithoutWritingServerState() {
        FakeAgentModel model = new FakeAgentModel(toolTurn(
                "call_1",
                "create_life_record",
                "{\"lifeDate\":\"2026-07-24\",\"content\":\"晚上散步 30 分钟\"}"
        ));

        AgentChatResponse response = runtime(model).chat(request("client_3", "记下晚上散步 30 分钟"));

        assertThat(response.status()).isEqualTo("NEEDS_CONFIRMATION");
        assertThat(response.pendingAction().type()).isEqualTo("CREATE_RECORD");
        assertThat(response.pendingAction().content()).isEqualTo("晚上散步 30 分钟");
    }

    @Test
    void outOfScopeQuestionFinishesWithoutToolCall() {
        FakeAgentModel model = new FakeAgentModel(finalTurn("我只处理 Life Wallet 里的生活记录。"));

        AgentChatResponse response = runtime(model).chat(request("client_4", "解释一下量子力学"));

        assertThat(response.status()).isEqualTo("COMPLETED");
        assertThat(response.pendingAction()).isNull();
        assertThat(response.recordIds()).isEmpty();
    }

    private AgentRuntime runtime(AgentModel model) {
        return new AgentRuntime(model, toolRegistry, new ConversationStore(), properties);
    }

    private AgentChatRequest request(String clientTurnId, String message) {
        ClientLifeRecord record = new ClientLifeRecord(
                1001L,
                LocalDate.of(2026, 7, 24),
                "上午工作 2 小时",
                List.of(new ClientActivity("工作", 120, "创造", "工作"))
        );
        return new AgentChatRequest(
                null,
                clientTurnId,
                message,
                LocalDate.of(2026, 7, 24),
                1001L,
                List.of(record)
        );
    }

    private AgentModelTurn finalTurn(String content) {
        return new AgentModelTurn(content, List.of(), Map.of("role", "assistant", "content", content));
    }

    private AgentModelTurn toolTurn(String id, String name, String arguments) {
        Map<String, Object> function = Map.of("name", name, "arguments", arguments);
        Map<String, Object> call = Map.of("id", id, "type", "function", "function", function);
        Map<String, Object> assistantMessage = new LinkedHashMap<>();
        assistantMessage.put("role", "assistant");
        assistantMessage.put("content", null);
        assistantMessage.put("tool_calls", List.of(call));
        return new AgentModelTurn(
                "",
                List.of(new AgentToolCall(id, name, arguments)),
                assistantMessage
        );
    }

    private static final class FakeAgentModel implements AgentModel {
        private final Queue<AgentModelTurn> turns;
        private int calls;

        private FakeAgentModel(AgentModelTurn... turns) {
            this.turns = new ArrayDeque<>(List.of(turns));
        }

        @Override
        public AgentModelTurn complete(
                List<Map<String, Object>> messages,
                List<Map<String, Object>> tools,
                String conversationId
        ) {
            calls++;
            return turns.remove();
        }
    }
}
