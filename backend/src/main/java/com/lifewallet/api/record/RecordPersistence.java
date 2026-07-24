package com.lifewallet.api.record;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.lifewallet.api.agent.AgentAnalysis;

public interface RecordPersistence {

    RecordState save(String ownerKey, LocalDate lifeDate, String content, Instant createdAt, AgentAnalysis analysis);

    RecordState saveConfirmed(String ownerKey, Long recordId, LocalDate lifeDate, String content, Instant now, AgentAnalysis analysis);

    Optional<RecordState> findLatestByLifeDate(String ownerKey, LocalDate lifeDate);

    List<RecordState> findRecent(String ownerKey, int limit);

    void delete(String ownerKey, long recordId);
}
