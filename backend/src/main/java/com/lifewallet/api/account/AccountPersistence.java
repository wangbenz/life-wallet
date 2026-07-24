package com.lifewallet.api.account;

import java.time.LocalDate;
import java.util.Optional;

public interface AccountPersistence {

    Optional<AccountState> find(String ownerKey);

    AccountState save(String ownerKey, LocalDate birthday, int expectedLifeYears);
}
