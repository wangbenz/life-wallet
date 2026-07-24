package com.lifewallet.api.record;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import com.lifewallet.api.agent.AgentAnalysis;

public class RecordStore implements RecordPersistence {

    private final AtomicLong idSequence = new AtomicLong(1000L);
    private final List<RecordState> records = new ArrayList<>();

    public synchronized RecordState save(
            LocalDate lifeDate,
            String content,
            Instant createdAt,
            AgentAnalysis analysis
    ) {
        RecordState record = new RecordState(
                idSequence.incrementAndGet(),
                lifeDate,
                content,
                "ANALYZED",
                createdAt,
                analysis
        );

        records.add(record);
        return record;
    }

    @Override
    public RecordState save(String ownerKey, LocalDate lifeDate, String content, Instant createdAt, AgentAnalysis analysis) {
        return save(lifeDate, content, createdAt, analysis);
    }

    @Override
    public synchronized RecordState saveConfirmed(String ownerKey, Long recordId, LocalDate lifeDate, String content, Instant now, AgentAnalysis analysis) {
        RecordState saved = new RecordState(recordId == null ? idSequence.incrementAndGet() : recordId, lifeDate, content, "CONFIRMED", now, analysis);
        records.removeIf(record -> record.recordId().equals(saved.recordId()));
        records.add(saved);
        return saved;
    }

    public synchronized Optional<RecordState> findLatestByLifeDate(LocalDate lifeDate) {
        return records.stream()
                .filter(record -> record.lifeDate().equals(lifeDate))
                .max(Comparator.comparing(RecordState::createdAt)
                        .thenComparing(RecordState::recordId));
    }

    @Override
    public Optional<RecordState> findLatestByLifeDate(String ownerKey, LocalDate lifeDate) {
        return findLatestByLifeDate(lifeDate);
    }

    public synchronized List<RecordState> findRecent(int limit) {
        // Life 页只需要轻量回看最近记录；按创建时间倒序，方便用户看到最新的人生账单。
        return records.stream()
                .sorted(Comparator.comparing(RecordState::createdAt)
                        .thenComparing(RecordState::recordId)
                        .reversed())
                .limit(limit)
                .toList();
    }

    @Override
    public List<RecordState> findRecent(String ownerKey, int limit) {
        return findRecent(limit);
    }

    @Override
    public synchronized void delete(String ownerKey, long recordId) {
        records.removeIf(record -> record.recordId() == recordId);
    }
}
