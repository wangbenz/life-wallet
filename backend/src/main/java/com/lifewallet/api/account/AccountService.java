package com.lifewallet.api.account;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lifewallet.api.common.ApiException;

@Service
public class AccountService {

    private static final long ACCOUNT_ID = 1L;

    private final AccountStore accountStore;
    private final Clock clock;

    @Autowired
    public AccountService(AccountStore accountStore) {
        this(accountStore, Clock.systemDefaultZone());
    }

    AccountService(AccountStore accountStore, Clock clock) {
        this.accountStore = accountStore;
        this.clock = clock;
    }

    public AccountResponse getAccount() {
        return accountStore.find()
                .map(this::toResponse)
                .orElseThrow(() -> new ApiException("ACCOUNT_NOT_FOUND", "还没有创建人生账户。"));
    }

    public AccountResponse saveAccount(AccountRequest request) {
        LocalDate today = LocalDate.now(clock);

        if (request.birthday().isAfter(today)) {
            throw new ApiException("INVALID_BIRTHDAY", "生日不能晚于今天。");
        }

        AccountState account = new AccountState(
                ACCOUNT_ID,
                request.birthday(),
                request.expectedLifeYears()
        );

        accountStore.save(account);
        return toResponse(account);
    }

    private AccountResponse toResponse(AccountState account) {
        LocalDate today = LocalDate.now(clock);
        LocalDate expectedEndDate = account.birthday().plusYears(account.expectedLifeYears());

        // 人生账户的核心换算：预期寿命转成总天数，再用今天扣减出已消耗和剩余天数。
        // 这里暂时按“天”计算，保持第一版 H5 Demo 的世界观简单直观。
        long totalLifeDays = ChronoUnit.DAYS.between(account.birthday(), expectedEndDate);
        long usedLifeDays = Math.max(0, ChronoUnit.DAYS.between(account.birthday(), today));
        long remainingLifeDays = Math.max(0, totalLifeDays - usedLifeDays);

        return new AccountResponse(
                account.accountId(),
                account.birthday(),
                account.expectedLifeYears(),
                totalLifeDays,
                usedLifeDays,
                remainingLifeDays
        );
    }
}
