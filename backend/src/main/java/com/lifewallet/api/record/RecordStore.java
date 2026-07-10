package com.lifewallet.api.record;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Repository;

import com.lifewallet.api.agent.AgentAnalysis;

@Repository
public class RecordStore {

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

    public synchronized Optional<RecordState> findLatestByLifeDate(LocalDate lifeDate) {
        return records.stream()
                .filter(record -> record.lifeDate().equals(lifeDate))
                .max(Comparator.comparing(RecordState::createdAt)
                        .thenComparing(RecordState::recordId));
    }
}
