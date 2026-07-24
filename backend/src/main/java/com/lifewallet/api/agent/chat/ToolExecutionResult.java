package com.lifewallet.api.agent.chat;

import java.util.List;

public record ToolExecutionResult(
        String content,
        List<Long> recordIds,
        PendingActionResponse pendingAction,
        String confirmationMessage
) {
    public static ToolExecutionResult read(String content, List<Long> recordIds) {
        return new ToolExecutionResult(content, recordIds, null, null);
    }

    public static ToolExecutionResult pending(PendingActionResponse pendingAction, String message) {
        return new ToolExecutionResult("", List.of(), pendingAction, message);
    }
}
