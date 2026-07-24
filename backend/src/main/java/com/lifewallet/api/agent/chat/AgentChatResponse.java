package com.lifewallet.api.agent.chat;

import java.util.List;

public record AgentChatResponse(
        String conversationId,
        String turnId,
        String status,
        String message,
        List<Long> recordIds,
        PendingActionResponse pendingAction
) {
}
