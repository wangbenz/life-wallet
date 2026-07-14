package com.lifewallet.api.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.lifewallet.api.common.ApiException;

class AccountServiceTest {

    private final Clock clock = Clock.fixed(
            Instant.parse("2026-07-09T00:00:00Z"),
            ZoneId.of("UTC")
    );

    @Test
    void savesAndCalculatesLifeDays() {
        AccountService service = new AccountService(new AccountStore(), clock);

        AccountResponse response = service.saveAccount(new AccountRequest(
                LocalDate.of(1995, 1, 1),
                80
        ));

        assertThat(response.accountId()).isEqualTo(1L);
        assertThat(response.totalLifeDays()).isEqualTo(29220L);
        assertThat(response.usedLifeDays()).isEqualTo(11512L);
        assertThat(response.remainingLifeDays()).isEqualTo(17708L);
    }

    @Test
    void rejectsFutureBirthday() {
        AccountService service = new AccountService(new AccountStore(), clock);

        assertThatThrownBy(() -> service.saveAccount(new AccountRequest(
                LocalDate.of(2027, 1, 1),
                80
        )))
                .isInstanceOf(ApiException.class)
                .hasMessage("生日不能晚于今天。");
    }
}
