package com.lifewallet.api.account;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AccountRequest(
        @NotNull(message = "birthday is required")
        LocalDate birthday,

        @NotNull(message = "expectedLifeYears is required")
        @Min(value = 1, message = "expectedLifeYears must be at least 1")
        @Max(value = 120, message = "expectedLifeYears must be at most 120")
        Integer expectedLifeYears
) {
}
