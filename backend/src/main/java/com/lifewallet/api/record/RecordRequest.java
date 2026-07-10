package com.lifewallet.api.record;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RecordRequest(
        @NotNull(message = "lifeDate is required")
        LocalDate lifeDate,

        @NotBlank(message = "content is required")
        @Size(max = 2000, message = "content must be at most 2000 characters")
        String content
) {
}
