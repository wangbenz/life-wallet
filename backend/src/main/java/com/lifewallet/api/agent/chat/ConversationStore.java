package com.lifewallet.api.agent.chat;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class ConversationStore implements AgentConversationPersistence {

    private static final int MAX_MESSAGES = 12;
    private final Map<String, ConversationState> conversations = new ConcurrentHashMap<>();
    private final Map<String, AgentChatResponse> responsesByClientTurn = new ConcurrentHashMap<>();

    public ConversationState getOrCreate(String requestedId) {
        String conversationId = requestedId == null || requestedId.isBlank()
                ? "conv_" + UUID.randomUUID()
                : requestedId;
        return conversations.computeIfAbsent(conversationId, ConversationState::new);
    }

    @Override
    public ConversationState getOrCreate(String ownerKey, String requestedId) {
        return getOrCreate(requestedId);
    }

    public Optional<AgentChatResponse> findResponse(String clientTurnId) {
        return Optional.ofNullable(responsesByClientTurn.get(clientTurnId));
    }

    @Override
    public Optional<AgentChatResponse> findResponse(String ownerKey, String clientTurnId) {
        return findResponse(clientTurnId);
    }

    public void rememberResponse(String clientTurnId, AgentChatResponse response) {
        responsesByClientTurn.put(clientTurnId, response);
        if (responsesByClientTurn.size() > 500) {
            responsesByClientTurn.keySet().stream().limit(100).forEach(responsesByClientTurn::remove);
        }
    }

    @Override
    public void rememberResponse(String ownerKey, String clientTurnId, AgentChatResponse response) {
        rememberResponse(clientTurnId, response);
    }

    public static final class ConversationState implements AgentConversationPersistence.ConversationState {
        private final String conversationId;
        private final List<Map<String, Object>> messages = new ArrayList<>();
        private final Map<String, AgentChatResponse> responsesByClientTurn = new LinkedHashMap<>();

        private ConversationState(String conversationId) {
            this.conversationId = conversationId;
        }

        public String conversationId() {
            return conversationId;
        }

        public synchronized List<Map<String, Object>> recentMessages() {
            int from = Math.max(0, messages.size() - MAX_MESSAGES);
            return new ArrayList<>(messages.subList(from, messages.size()));
        }

        public synchronized void append(String role, String content) {
            messages.add(Map.of("role", role, "content", content));
        }

        public synchronized Optional<AgentChatResponse> findResponse(String clientTurnId) {
            return Optional.ofNullable(responsesByClientTurn.get(clientTurnId));
        }

        public synchronized void remember(String clientTurnId, AgentChatResponse response) {
            responsesByClientTurn.put(clientTurnId, response);
            while (responsesByClientTurn.size() > 30) {
                responsesByClientTurn.remove(responsesByClientTurn.keySet().iterator().next());
            }
        }
    }
}
