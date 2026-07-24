package com.lifewallet.api.agent;

public record AgentActivity(
        String title,
        String sourceText,
        int durationMinutes,
        String dimension,
        String domain,
        String topic,
        boolean estimated
) {
    public AgentActivity(String title, int durationMinutes, String dimension, String domain, String topic, boolean estimated) {
        this(title, null, durationMinutes, dimension, domain, topic, estimated);
    }
}
