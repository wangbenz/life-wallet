package com.lifewallet.api.agent.chat;

import java.util.List;
import java.util.Map;

public record AgentModelTurn(
        String content,
        List<AgentToolCall> toolCalls,
        Map<String, Object> assistantMessage
) {
}
