package com.lifewallet.api.account;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.stereotype.Repository;

@Repository
public class AccountStore {

    private final AtomicReference<AccountState> account = new AtomicReference<>();

    public Optional<AccountState> find() {
        return Optional.ofNullable(account.get());
    }

    public void save(AccountState accountState) {
        account.set(accountState);
    }
}
