package com.lifewallet.api.account;

import java.time.LocalDate;

public record AccountState(
        Long accountId,
        LocalDate birthday,
        Integer expectedLifeYears
) {
}
