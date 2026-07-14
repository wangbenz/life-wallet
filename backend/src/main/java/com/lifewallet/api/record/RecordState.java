package com.lifewallet.api.record;

import java.time.Instant;
import java.time.LocalDate;

import com.lifewallet.api.agent.AgentAnalysis;

public record RecordState(
        Long recordId,
        LocalDate lifeDate,
        String content,
        String status,
        Instant createdAt,
        AgentAnalysis analysis
) {
}
