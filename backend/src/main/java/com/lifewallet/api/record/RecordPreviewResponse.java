package com.lifewallet.api.record;

import java.time.LocalDate;
import java.util.List;

import com.lifewallet.api.agent.AgentActivity;
import com.lifewallet.api.agent.DimensionSummary;

public record RecordPreviewResponse(
        LocalDate lifeDate,
        String content,
        String summary,
        String stateDescription,
        List<AgentActivity> activities,
        List<DimensionSummary> dimensionSummary,
        boolean needsConfirmation
) {
}
