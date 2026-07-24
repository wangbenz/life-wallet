package com.lifewallet.api.agent.chat;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.support.TransactionTemplate;

@Repository
public class JdbcConversationStore implements AgentConversationPersistence {

    private static final int MAX_TURNS = 6;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public JdbcConversationStore(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            TransactionTemplate transactionTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public Optional<AgentChatResponse> findResponse(String ownerKey, String clientTurnId) {
        List<AgentChatResponse> responses = jdbcTemplate.query(
                "SELECT t.turn_id, t.conversation_id, t.turn_status, t.assistant_message, t.record_ids_json, t.pending_action_json FROM agent_turn t JOIN agent_conversation c ON c.conversation_id = t.conversation_id WHERE c.owner_key = ? AND t.client_turn_id = ?",
                (resultSet, rowNumber) -> new AgentChatResponse(
                        resultSet.getString("conversation_id"),
                        resultSet.getString("turn_id"),
                        resultSet.getString("turn_status"),
                        resultSet.getString("assistant_message"),
                        readJson(resultSet.getString("record_ids_json"), new TypeReference<List<Long>>() {}, List.of()),
                        readJson(resultSet.getString("pending_action_json"), PendingActionResponse.class, null)
                ),
                ownerKey,
                clientTurnId
        );
        return responses.stream().findFirst();
    }

    @Override
    public ConversationState getOrCreate(String ownerKey, String requestedId) {
        String conversationId = requestedId == null || requestedId.isBlank()
                ? "conv_" + UUID.randomUUID()
                : requestedId;
        List<String> owners = jdbcTemplate.queryForList(
                "SELECT owner_key FROM agent_conversation WHERE conversation_id = ?",
                String.class,
                conversationId
        );
        if (!owners.isEmpty()) {
            if (!owners.getFirst().equals(ownerKey)) {
                throw new AgentServiceException("CONVERSATION_NOT_FOUND", "这段对话不存在，请重新开始。" );
            }
            return new JdbcConversationState(ownerKey, conversationId);
        }
        try {
            jdbcTemplate.update(
                    "INSERT INTO agent_conversation (conversation_id, owner_key, active_life_date) VALUES (?, ?, ?)",
                    conversationId, ownerKey, Date.valueOf(LocalDate.now())
            );
        } catch (DuplicateKeyException exception) {
            return getOrCreate(ownerKey, conversationId);
        }
        return new JdbcConversationState(ownerKey, conversationId);
    }

    @Override
    public void rememberResponse(String ownerKey, String clientTurnId, AgentChatResponse response) {
        // JdbcConversationState.remember 已在一个数据库事务中保存完整轮次。
    }

    private final class JdbcConversationState implements ConversationState {
        private final String ownerKey;
        private final String conversationId;
        private final Map<String, String> pendingMessages = new LinkedHashMap<>();

        private JdbcConversationState(String ownerKey, String conversationId) {
            this.ownerKey = ownerKey;
            this.conversationId = conversationId;
        }

        @Override
        public String conversationId() {
            return conversationId;
        }

        @Override
        public List<Map<String, Object>> recentMessages() {
            List<TurnMessages> turns = jdbcTemplate.query(
                    "SELECT user_message, assistant_message FROM agent_turn WHERE conversation_id = ? ORDER BY created_at DESC, turn_id DESC LIMIT ?",
                    (resultSet, rowNumber) -> new TurnMessages(
                            resultSet.getString("user_message"),
                            resultSet.getString("assistant_message")
                    ),
                    conversationId,
                    MAX_TURNS
            );
            Collections.reverse(turns);
            List<Map<String, Object>> messages = new ArrayList<>();
            turns.forEach(turn -> {
                messages.add(Map.of("role", "user", "content", turn.user()));
                messages.add(Map.of("role", "assistant", "content", turn.assistant()));
            });
            return messages;
        }

        @Override
        public synchronized void append(String role, String content) {
            pendingMessages.put(role, content);
        }

        @Override
        public Optional<AgentChatResponse> findResponse(String clientTurnId) {
            return JdbcConversationStore.this.findResponse(ownerKey, clientTurnId);
        }

        @Override
        public synchronized void remember(String clientTurnId, AgentChatResponse response) {
            String userMessage = pendingMessages.remove("user");
            String assistantMessage = pendingMessages.remove("assistant");
            if (userMessage == null || assistantMessage == null) {
                throw new IllegalStateException("保存 Agent 轮次前缺少对话消息。" );
            }
            transactionTemplate.executeWithoutResult(status -> {
                jdbcTemplate.update(
                        "INSERT INTO agent_turn (turn_id, conversation_id, client_turn_id, turn_status, user_message, assistant_message, record_ids_json, pending_action_type, pending_action_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        response.turnId(),
                        conversationId,
                        clientTurnId,
                        response.status(),
                        userMessage,
                        assistantMessage,
                        writeJson(response.recordIds()),
                        response.pendingAction() == null ? null : response.pendingAction().type(),
                        writeJson(response.pendingAction())
                );
                jdbcTemplate.update(
                        "UPDATE agent_conversation SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?",
                        conversationId
                );
            });
        }
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new AgentServiceException("CONVERSATION_SAVE_FAILED", "对话结果无法保存。", exception);
        }
    }

    private <T> T readJson(String value, Class<T> type, T fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return objectMapper.readValue(value, type);
        } catch (JsonProcessingException exception) {
            throw new AgentServiceException("CONVERSATION_READ_FAILED", "对话记录无法读取。", exception);
        }
    }

    private <T> T readJson(String value, TypeReference<T> type, T fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return objectMapper.readValue(value, type);
        } catch (JsonProcessingException exception) {
            throw new AgentServiceException("CONVERSATION_READ_FAILED", "对话记录无法读取。", exception);
        }
    }

    private record TurnMessages(String user, String assistant) {
    }
}
