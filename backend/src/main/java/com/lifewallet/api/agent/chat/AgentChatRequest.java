package com.lifewallet.api.agent.chat;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record AgentChatRequest(
        @Size(max = 80) String conversationId,
        @NotBlank @Size(max = 100) String clientTurnId,
        @NotBlank @Size(max = 2000) String message,
        @NotNull @PastOrPresent LocalDate lifeDate,
        Long contextRecordId,
        @NotNull @Size(max = 20) List<@Valid ClientLifeRecord> records
) {
}
