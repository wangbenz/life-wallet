package com.lifewallet.api.agent.chat;

public record AgentToolCall(
        String id,
        String name,
        String arguments
) {
}
