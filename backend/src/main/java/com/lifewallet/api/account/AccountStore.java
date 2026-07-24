package com.lifewallet.api.account;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

public class AccountStore implements AccountPersistence {

    private final AtomicReference<AccountState> account = new AtomicReference<>();

    public Optional<AccountState> find() {
        return Optional.ofNullable(account.get());
    }

    public void save(AccountState accountState) {
        account.set(accountState);
    }

    @Override
    public Optional<AccountState> find(String ownerKey) {
        return find();
    }

    @Override
    public AccountState save(String ownerKey, java.time.LocalDate birthday, int expectedLifeYears) {
        AccountState saved = new AccountState(1L, birthday, expectedLifeYears);
        save(saved);
        return saved;
    }
}
