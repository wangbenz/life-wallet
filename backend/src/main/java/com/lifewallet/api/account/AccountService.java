package com.lifewallet.api.account;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lifewallet.api.common.ApiException;

@Service
public class AccountService {

    private static final String TEST_OWNER_KEY = "test-owner";

    private final AccountPersistence accountStore;
    private final Clock clock;

    @Autowired
    public AccountService(AccountPersistence accountStore) {
        this(accountStore, Clock.systemDefaultZone());
    }

    AccountService(AccountPersistence accountStore, Clock clock) {
        this.accountStore = accountStore;
        this.clock = clock;
    }

    public AccountResponse getAccount() {
        return getAccount(TEST_OWNER_KEY);
    }

    public AccountResponse getAccount(String ownerKey) {
        return accountStore.find(ownerKey)
                .map(this::toResponse)
                .orElseThrow(() -> new ApiException("ACCOUNT_NOT_FOUND", "还没有创建人生账户。"));
    }

    public AccountResponse saveAccount(AccountRequest request) {
        return saveAccount(TEST_OWNER_KEY, request);
    }

    public AccountResponse saveAccount(String ownerKey, AccountRequest request) {
        LocalDate today = LocalDate.now(clock);

        if (request.birthday().isAfter(today)) {
            throw new ApiException("INVALID_BIRTHDAY", "生日不能晚于今天。");
        }
        if (!request.birthday().plusYears(request.expectedLifeYears()).isAfter(today)) {
            throw new ApiException("INVALID_EXPECTED_LIFE", "预期寿命需要大于当前年龄，且不超过 120 岁。");
        }

        AccountState account = accountStore.save(ownerKey, request.birthday(), request.expectedLifeYears());
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
