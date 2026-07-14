package com.lifewallet.api.agent;

public record AgentActivity(
        String title,
        int durationMinutes,
        String dimension,
        String domain,
        String topic,
        boolean estimated
) {
}
