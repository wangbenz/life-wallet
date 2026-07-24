package com.lifewallet.api.feedback;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;

import com.lifewallet.api.common.ApiException;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    private static final Map<String, String> TO_DATABASE = Map.of(
            "accurate", "ACCURATE", "partial", "PARTIAL", "inaccurate", "INACCURATE"
    );
    private static final Map<String, String> FROM_DATABASE = Map.of(
            "ACCURATE", "accurate", "PARTIAL", "partial", "INACCURATE", "inaccurate"
    );

    private final JdbcTemplate jdbcTemplate;

    public FeedbackService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RecordFeedbackResponse> getRecordFeedback(String ownerKey) {
        return jdbcTemplate.query(
                "SELECT f.record_id, f.accuracy, f.created_at FROM record_feedback f JOIN life_record r ON r.record_id = f.record_id JOIN life_account a ON a.account_id = r.account_id WHERE a.owner_key = ? ORDER BY f.created_at DESC",
                (rs, row) -> new RecordFeedbackResponse(rs.getLong(1), FROM_DATABASE.get(rs.getString(2)), rs.getTimestamp(3).toInstant()),
                ownerKey
        );
    }

    @Transactional
    public RecordFeedbackResponse saveRecordFeedback(String ownerKey, RecordFeedbackRequest request) {
        int owned = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM life_record r JOIN life_account a ON a.account_id = r.account_id WHERE r.record_id = ? AND a.owner_key = ?",
                Integer.class, request.recordId(), ownerKey
        );
        if (owned == 0) throw new ApiException("RECORD_NOT_FOUND", "这条记录不存在或不属于当前用户。");
        jdbcTemplate.update("DELETE FROM record_feedback WHERE record_id = ?", request.recordId());
        jdbcTemplate.update(
                "INSERT INTO record_feedback (record_id, accuracy) VALUES (?, ?)",
                request.recordId(), TO_DATABASE.get(request.rating())
        );
        return getRecordFeedback(ownerKey).stream().filter(item -> item.recordId() == request.recordId()).findFirst().orElseThrow();
    }

    public List<ExperienceFeedbackResponse> getExperienceFeedback(String ownerKey) {
        return jdbcTemplate.query(
                "SELECT f.feedback_id, f.feedback_text, f.created_at FROM experience_feedback f JOIN life_account a ON a.account_id = f.account_id WHERE a.owner_key = ? ORDER BY f.created_at DESC",
                (rs, row) -> new ExperienceFeedbackResponse(rs.getLong(1), rs.getString(2), rs.getTimestamp(3).toInstant()),
                ownerKey
        );
    }

    public ExperienceFeedbackResponse saveExperienceFeedback(String ownerKey, ExperienceFeedbackRequest request) {
        List<Long> accounts = jdbcTemplate.queryForList("SELECT account_id FROM life_account WHERE owner_key = ?", Long.class, ownerKey);
        if (accounts.isEmpty()) throw new ApiException("ACCOUNT_NOT_FOUND", "请先创建人生账户。");
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO experience_feedback (account_id, feedback_text) VALUES (?, ?)", new String[] {"feedback_id"}
            );
            statement.setLong(1, accounts.getFirst());
            statement.setString(2, request.content().trim());
            return statement;
        }, keys);
        long id = keys.getKey().longValue();
        return getExperienceFeedback(ownerKey).stream().filter(item -> item.feedbackId() == id).findFirst().orElseThrow();
    }
}
