package com.lifewallet.api.account;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class JdbcAccountStore implements AccountPersistence {

    private final JdbcTemplate jdbcTemplate;

    public JdbcAccountStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<AccountState> find(String ownerKey) {
        List<AccountState> accounts = jdbcTemplate.query(
                "SELECT account_id, birthday, expected_life_years FROM life_account WHERE owner_key = ?",
                (resultSet, rowNumber) -> new AccountState(
                        resultSet.getLong("account_id"),
                        resultSet.getDate("birthday").toLocalDate(),
                        resultSet.getInt("expected_life_years")
                ),
                ownerKey
        );
        return accounts.stream().findFirst();
    }

    @Override
    @Transactional
    public AccountState save(String ownerKey, LocalDate birthday, int expectedLifeYears) {
        Optional<AccountState> existing = find(ownerKey);
        if (existing.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE life_account SET birthday = ?, expected_life_years = ?, row_version = row_version + 1, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?",
                    Date.valueOf(birthday), expectedLifeYears, existing.get().accountId()
            );
            return new AccountState(existing.get().accountId(), birthday, expectedLifeYears);
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO life_account (owner_key, birthday, expected_life_years) VALUES (?, ?, ?)",
                        new String[] {"account_id"}
                );
                statement.setString(1, ownerKey);
                statement.setDate(2, Date.valueOf(birthday));
                statement.setInt(3, expectedLifeYears);
                return statement;
            }, keyHolder);
        } catch (DuplicateKeyException exception) {
            // 同一安装首次请求并发时，唯一键决定唯一账户；随后按更新处理。
            return save(ownerKey, birthday, expectedLifeYears);
        }
        Number id = keyHolder.getKey();
        if (id == null) {
            throw new IllegalStateException("数据库没有返回新账户 ID。");
        }
        return new AccountState(id.longValue(), birthday, expectedLifeYears);
    }
}
