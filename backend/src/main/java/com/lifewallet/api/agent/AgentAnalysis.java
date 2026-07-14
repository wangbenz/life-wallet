package com.lifewallet.api.agent;

import java.util.List;

public record AgentAnalysis(
        String intent,
        String summary,
        List<AgentActivity> activities,
        List<DimensionSummary> dimensionSummary,
        boolean needsConfirmation
) {
}
