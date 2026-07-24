package com.lifewallet.api.record;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.lifewallet.api.agent.AgentActivity;
import com.lifewallet.api.agent.AgentAnalysis;
import com.lifewallet.api.agent.DimensionSummary;
import com.lifewallet.api.common.ApiException;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class JdbcRecordStore implements RecordPersistence {

    private final JdbcTemplate jdbcTemplate;

    public JdbcRecordStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public RecordState save(
            String ownerKey,
            LocalDate lifeDate,
            String content,
            Instant createdAt,
            AgentAnalysis analysis
    ) {
        return insert(ownerKey, lifeDate, content, createdAt, analysis, "ANALYZED");
    }

    @Override
    @Transactional
    public RecordState saveConfirmed(String ownerKey, Long recordId, LocalDate lifeDate, String content, Instant now, AgentAnalysis analysis) {
        if (recordId == null) return insert(ownerKey, lifeDate, content, now, analysis, "CONFIRMED");
        int updated = jdbcTemplate.update(
                "UPDATE life_record r SET life_date = ?, original_content = ?, record_status = 'CONFIRMED', intent = ?, summary = ?, needs_confirmation = ?, row_version = row_version + 1, updated_at = ? WHERE record_id = ? AND account_id = (SELECT account_id FROM life_account WHERE owner_key = ?)",
                Date.valueOf(lifeDate), content, analysis.intent(), analysis.summary(), analysis.needsConfirmation(),
                Timestamp.from(now), recordId, ownerKey
        );
        if (updated == 0) throw new ApiException("RECORD_NOT_FOUND", "这条记录不存在或不属于当前用户。");
        jdbcTemplate.update("DELETE FROM life_activity WHERE record_id = ?", recordId);
        jdbcTemplate.update("DELETE FROM life_dimension_summary WHERE record_id = ?", recordId);
        saveDetails(recordId, analysis);
        return findById(recordId);
    }

    private RecordState insert(String ownerKey, LocalDate lifeDate, String content, Instant createdAt, AgentAnalysis analysis, String status) {
        long accountId = accountId(ownerKey);
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO life_record (account_id, life_date, original_content, record_status, intent, summary, needs_confirmation, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    new String[] {"record_id"}
            );
            statement.setLong(1, accountId);
            statement.setDate(2, Date.valueOf(lifeDate));
            statement.setString(3, content);
            statement.setString(4, status);
            statement.setString(5, analysis.intent());
            statement.setString(6, analysis.summary());
            statement.setBoolean(7, analysis.needsConfirmation());
            statement.setTimestamp(8, Timestamp.from(createdAt));
            statement.setTimestamp(9, Timestamp.from(createdAt));
            return statement;
        }, keyHolder);
        Number id = keyHolder.getKey();
        if (id == null) {
            throw new IllegalStateException("数据库没有返回新记录 ID。");
        }
        long recordId = id.longValue();
        saveDetails(recordId, analysis);
        return new RecordState(recordId, lifeDate, content, status, createdAt, analysis);
    }

    private void saveDetails(long recordId, AgentAnalysis analysis) {
        for (int index = 0; index < analysis.activities().size(); index++) {
            AgentActivity activity = analysis.activities().get(index);
            jdbcTemplate.update(
                    "INSERT INTO life_activity (record_id, activity_position, title, source_text, duration_minutes, life_dimension, domain_name, topic, is_estimated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    recordId, index, activity.title(), activity.sourceText(), activity.durationMinutes(), activity.dimension(),
                    activity.domain(), activity.topic(), activity.estimated()
            );
        }
        for (DimensionSummary summary : analysis.dimensionSummary()) {
            jdbcTemplate.update(
                    "INSERT INTO life_dimension_summary (record_id, life_dimension, duration_minutes) VALUES (?, ?, ?)",
                    recordId, summary.dimension(), summary.durationMinutes()
            );
        }
    }

    @Override
    public Optional<RecordState> findLatestByLifeDate(String ownerKey, LocalDate lifeDate) {
        List<Long> ids = jdbcTemplate.queryForList(
                "SELECT r.record_id FROM life_record r JOIN life_account a ON a.account_id = r.account_id WHERE a.owner_key = ? AND r.life_date = ? AND r.record_status <> 'DELETED' ORDER BY r.created_at DESC, r.record_id DESC LIMIT 1",
                Long.class,
                ownerKey,
                Date.valueOf(lifeDate)
        );
        return ids.stream().findFirst().map(this::findById);
    }

    @Override
    public List<RecordState> findRecent(String ownerKey, int limit) {
        return jdbcTemplate.queryForList(
                        "SELECT r.record_id FROM life_record r JOIN life_account a ON a.account_id = r.account_id WHERE a.owner_key = ? AND r.record_status <> 'DELETED' ORDER BY r.created_at DESC, r.record_id DESC LIMIT ?",
                        Long.class,
                        ownerKey,
                        limit
                ).stream()
                .map(this::findById)
                .toList();
    }

    @Override
    public void delete(String ownerKey, long recordId) {
        int updated = jdbcTemplate.update(
                "UPDATE life_record SET record_status = 'DELETED', row_version = row_version + 1, updated_at = CURRENT_TIMESTAMP WHERE record_id = ? AND account_id = (SELECT account_id FROM life_account WHERE owner_key = ?)",
                recordId, ownerKey
        );
        if (updated == 0) throw new ApiException("RECORD_NOT_FOUND", "这条记录不存在或不属于当前用户。");
    }

    private RecordState findById(long recordId) {
        RecordRow row = jdbcTemplate.queryForObject(
                "SELECT record_id, life_date, original_content, record_status, intent, summary, needs_confirmation, created_at FROM life_record WHERE record_id = ?",
                (resultSet, rowNumber) -> new RecordRow(
                        resultSet.getLong("record_id"),
                        resultSet.getDate("life_date").toLocalDate(),
                        resultSet.getString("original_content"),
                        resultSet.getString("record_status"),
                        resultSet.getString("intent"),
                        resultSet.getString("summary"),
                        resultSet.getBoolean("needs_confirmation"),
                        resultSet.getTimestamp("created_at").toInstant()
                ),
                recordId
        );
        if (row == null) {
            throw new IllegalStateException("记录不存在：" + recordId);
        }
        List<AgentActivity> activities = jdbcTemplate.query(
                "SELECT title, source_text, duration_minutes, life_dimension, domain_name, topic, is_estimated FROM life_activity WHERE record_id = ? ORDER BY activity_position",
                (resultSet, rowNumber) -> new AgentActivity(
                        resultSet.getString("title"),
                        resultSet.getString("source_text"),
                        resultSet.getInt("duration_minutes"),
                        resultSet.getString("life_dimension"),
                        resultSet.getString("domain_name"),
                        resultSet.getString("topic"),
                        resultSet.getBoolean("is_estimated")
                ),
                recordId
        );
        List<DimensionSummary> summaries = jdbcTemplate.query(
                "SELECT life_dimension, duration_minutes FROM life_dimension_summary WHERE record_id = ? ORDER BY life_dimension",
                (resultSet, rowNumber) -> new DimensionSummary(
                        resultSet.getString("life_dimension"),
                        resultSet.getInt("duration_minutes")
                ),
                recordId
        );
        AgentAnalysis analysis = new AgentAnalysis(
                row.intent(), row.summary(), activities, summaries, row.needsConfirmation()
        );
        return new RecordState(
                row.recordId(), row.lifeDate(), row.content(), row.status(), row.createdAt(), analysis
        );
    }

    private long accountId(String ownerKey) {
        List<Long> ids = jdbcTemplate.queryForList(
                "SELECT account_id FROM life_account WHERE owner_key = ?",
                Long.class,
                ownerKey
        );
        return ids.stream().findFirst()
                .orElseThrow(() -> new ApiException("ACCOUNT_NOT_FOUND", "请先创建人生账户。"));
    }

    private record RecordRow(
            long recordId,
            LocalDate lifeDate,
            String content,
            String status,
            String intent,
            String summary,
            boolean needsConfirmation,
            Instant createdAt
    ) {
    }
}
