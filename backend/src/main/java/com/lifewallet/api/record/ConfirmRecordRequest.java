package com.lifewallet.api.record;

import java.time.LocalDate;
import java.util.List;

import com.lifewallet.api.agent.AgentActivity;
import com.lifewallet.api.agent.DimensionSummary;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConfirmRecordRequest(
        Long recordId,
        @NotNull LocalDate lifeDate,
        @NotBlank @Size(max = 2000) String content,
        @NotBlank @Size(max = 1000) String summary,
        @NotNull @Size(min = 1, max = 20) List<AgentActivity> activities,
        @NotNull @Size(max = 7) List<DimensionSummary> dimensionSummary,
        boolean needsConfirmation
) {
}
