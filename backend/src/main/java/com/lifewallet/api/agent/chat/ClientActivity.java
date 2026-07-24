package com.lifewallet.api.agent.chat;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClientActivity(
        @NotBlank @Size(max = 120) String title,
        @Min(1) @Max(1440) int durationMinutes,
        @NotBlank @Size(max = 32) String dimension,
        @NotBlank @Size(max = 64) String domain
) {
}
