package com.lifewallet.api.agent.chat;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Repository;

@Repository
public class DeepSeekSecretStore {

    private final JdbcTemplate jdbcTemplate;

    public DeepSeekSecretStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<EncryptedSecret> find(String secretName) {
        List<EncryptedSecret> secrets = jdbcTemplate.query(
                "SELECT encrypted_value, nonce_value, algorithm_name FROM service_secret WHERE secret_name = ?",
                (resultSet, rowNumber) -> new EncryptedSecret(
                        resultSet.getString("encrypted_value"),
                        resultSet.getString("nonce_value"),
                        resultSet.getString("algorithm_name")
                ),
                secretName
        );
        return secrets.stream().findFirst();
    }

    public void save(String secretName, EncryptedSecret secret) {
        int updated = jdbcTemplate.update(
                "UPDATE service_secret SET encrypted_value = ?, nonce_value = ?, algorithm_name = ?, updated_at = CURRENT_TIMESTAMP WHERE secret_name = ?",
                secret.encryptedValue(), secret.nonceValue(), secret.algorithmName(), secretName
        );
        if (updated == 0) {
            try {
                jdbcTemplate.update(
                        "INSERT INTO service_secret (secret_name, encrypted_value, nonce_value, algorithm_name) VALUES (?, ?, ?, ?)",
                        secretName, secret.encryptedValue(), secret.nonceValue(), secret.algorithmName()
                );
            } catch (DuplicateKeyException concurrentInsert) {
                // 多实例同时首次启动时，后完成的实例使用同一轮部署提供的密钥覆盖密文。
                jdbcTemplate.update(
                        "UPDATE service_secret SET encrypted_value = ?, nonce_value = ?, algorithm_name = ?, updated_at = CURRENT_TIMESTAMP WHERE secret_name = ?",
                        secret.encryptedValue(), secret.nonceValue(), secret.algorithmName(), secretName
                );
            }
        }
    }
}
