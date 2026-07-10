package com.lifewallet.api.account;

import java.time.LocalDate;

public record AccountResponse(
        Long accountId,
        LocalDate birthday,
        Integer expectedLifeYears,
        Long totalLifeDays,
        Long usedLifeDays,
        Long remainingLifeDays
) {
}
