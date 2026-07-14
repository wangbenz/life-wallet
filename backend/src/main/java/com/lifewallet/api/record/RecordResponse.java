package com.lifewallet.api.record;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.lifewallet.api.agent.AgentActivity;
import com.lifewallet.api.agent.DimensionSummary;

public record RecordResponse(
        Long recordId,
        LocalDate lifeDate,
        String content,
        String status,
        Instant createdAt,
        String intent,
        String summary,
        List<AgentActivity> activities,
        List<DimensionSummary> dimensionSummary,
        boolean needsConfirmation
) {
}
