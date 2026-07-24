package com.lifewallet.api.database;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class DatabaseMigrationTest {

    private static final List<String> BUSINESS_TABLES = List.of(
            "life_account",
            "life_record",
            "life_activity",
            "life_dimension_summary",
            "record_feedback",
            "experience_feedback",
            "agent_conversation",
            "agent_turn",
            "service_secret"
    );

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void flywayCreatesAllBusinessTables() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
                String.class
        );

        assertThat(tables).containsAll(BUSINESS_TABLES);
        Integer successfulMigrations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1' AND success = TRUE",
                Integer.class
        );
        assertThat(successfulMigrations).isEqualTo(1);
        Integer secretMigration = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '2' AND success = TRUE",
                Integer.class
        );
        assertThat(secretMigration).isEqualTo(1);
    }

    @Test
    void accountDeletionCascadesThroughRecordsAndAgentConversation() {
        String ownerKey = "migration-test-owner";
        jdbcTemplate.update(
                "INSERT INTO life_account (owner_key, birthday, expected_life_years) VALUES (?, ?, ?)",
                ownerKey,
                Date.valueOf(LocalDate.of(1990, 1, 1)),
                80
        );
        Long accountId = jdbcTemplate.queryForObject(
                "SELECT account_id FROM life_account WHERE owner_key = ?",
                Long.class,
                ownerKey
        );
        jdbcTemplate.update(
                "INSERT INTO life_record (account_id, life_date, original_content, record_status, intent, summary, needs_confirmation) VALUES (?, ?, ?, ?, ?, ?, ?)",
                accountId,
                Date.valueOf(LocalDate.now()),
                "今天散步 30 分钟",
                "CONFIRMED",
                "RECORD_TODAY",
                "今天留出了一段健康活动。",
                false
        );
        Long recordId = jdbcTemplate.queryForObject(
                "SELECT record_id FROM life_record WHERE account_id = ?",
                Long.class,
                accountId
        );
        jdbcTemplate.update(
                "INSERT INTO life_activity (record_id, activity_position, title, duration_minutes, life_dimension, domain_name, topic, is_estimated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                recordId, 0, "散步", 30, "健康", "运动", "散步", false
        );
        jdbcTemplate.update(
                "INSERT INTO life_dimension_summary (record_id, life_dimension, duration_minutes) VALUES (?, ?, ?)",
                recordId, "健康", 30
        );
        jdbcTemplate.update(
                "INSERT INTO record_feedback (record_id, accuracy, comment_text) VALUES (?, ?, ?)",
                recordId, "ACCURATE", "识别准确"
        );
        jdbcTemplate.update(
                "INSERT INTO experience_feedback (account_id, feedback_text) VALUES (?, ?)",
                accountId, "整体记录流程很轻。"
        );
        jdbcTemplate.update(
                "INSERT INTO agent_conversation (conversation_id, owner_key, account_id, last_record_id) VALUES (?, ?, ?, ?)",
                "conv_migration_test", ownerKey, accountId, recordId
        );
        jdbcTemplate.update(
                "INSERT INTO agent_turn (turn_id, conversation_id, client_turn_id, turn_status, user_message, assistant_message) VALUES (?, ?, ?, ?, ?, ?)",
                "turn_migration_test", "conv_migration_test", "client_turn_migration_test",
                "COMPLETED", "我今天记了什么？", "今天记录了散步 30 分钟。"
        );

        jdbcTemplate.update("DELETE FROM life_account WHERE account_id = ?", accountId);

        assertThat(countWhere("life_account", "owner_key", ownerKey)).isZero();
        assertThat(countWhere("life_record", "record_id", recordId)).isZero();
        assertThat(countWhere("life_activity", "record_id", recordId)).isZero();
        assertThat(countWhere("life_dimension_summary", "record_id", recordId)).isZero();
        assertThat(countWhere("record_feedback", "record_id", recordId)).isZero();
        assertThat(countWhere("experience_feedback", "account_id", accountId)).isZero();
        assertThat(countWhere("agent_conversation", "conversation_id", "conv_migration_test")).isZero();
        assertThat(countWhere("agent_turn", "turn_id", "turn_migration_test")).isZero();
    }

    @Test
    void databaseConstraintsRejectInvalidDomainValues() {
        String ownerKey = "invalid-years-owner";
        assertThatThrownBy(() -> jdbcTemplate.update(
                "INSERT INTO life_account (owner_key, birthday, expected_life_years) VALUES (?, ?, ?)",
                ownerKey,
                Date.valueOf(LocalDate.of(1990, 1, 1)),
                121
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    private int countWhere(String table, String column, Object value) {
        // 表名和列名来自本测试中的固定白名单，不接受外部输入。
        Integer result = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?",
                Integer.class,
                value
        );
        return result == null ? 0 : result;
    }
}
