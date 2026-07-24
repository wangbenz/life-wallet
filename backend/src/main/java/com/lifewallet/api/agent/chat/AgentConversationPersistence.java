package com.lifewallet.api.agent.chat;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface AgentConversationPersistence {

    Optional<AgentChatResponse> findResponse(String ownerKey, String clientTurnId);

    ConversationState getOrCreate(String ownerKey, String requestedId);

    void rememberResponse(String ownerKey, String clientTurnId, AgentChatResponse response);

    interface ConversationState {

        String conversationId();

        List<Map<String, Object>> recentMessages();

        void append(String role, String content);

        Optional<AgentChatResponse> findResponse(String clientTurnId);

        void remember(String clientTurnId, AgentChatResponse response);
    }
}
