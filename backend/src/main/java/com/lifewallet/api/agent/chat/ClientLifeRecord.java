package com.lifewallet.api.agent.chat;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClientLifeRecord(
        long recordId,
        @NotNull LocalDate lifeDate,
        @NotBlank @Size(max = 2000) String content,
        @NotNull @Size(max = 20) List<@Valid ClientActivity> activities
) {
}
