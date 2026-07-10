package com.lifewallet.api.record;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lifewallet.api.agent.AgentAnalysis;
import com.lifewallet.api.agent.LifeModelClient;
import com.lifewallet.api.common.ApiException;

@Service
public class RecordService {

    private final RecordStore recordStore;
    private final LifeModelClient lifeModelClient;
    private final Clock clock;

    @Autowired
    public RecordService(RecordStore recordStore, LifeModelClient lifeModelClient) {
        this(recordStore, lifeModelClient, Clock.systemDefaultZone());
    }

    RecordService(RecordStore recordStore, LifeModelClient lifeModelClient, Clock clock) {
        this.recordStore = recordStore;
        this.lifeModelClient = lifeModelClient;
        this.clock = clock;
    }

    public RecordResponse createRecord(RecordRequest request) {
        LocalDate today = LocalDate.now(clock);

        // 记录日期不能超过今天，避免用户误提交未来账单。
        if (request.lifeDate().isAfter(today)) {
            throw new ApiException("INVALID_LIFE_DATE", "记录日期不能晚于今天。");
        }

        String content = request.content().trim();
        AgentAnalysis analysis;
        try {
            // 当前 LifeModelClient 由轻量规则 Agent 实现；后续可以替换为真实 LLM 调用。
            analysis = lifeModelClient.analyze(content);
        } catch (RuntimeException exception) {
            // Agent 失败时不把内部异常暴露给前端，统一返回用户能理解的温和提示。
            throw new ApiException("AGENT_PARSE_FAILED", "这次没有理解成功，可以稍后再试，或把记录写得更具体一点。");
        }

        RecordState record = recordStore.save(request.lifeDate(), content, Instant.now(clock), analysis);
        return toResponse(record);
    }

    public RecordResponse getTodayRecord() {
        LocalDate today = LocalDate.now(clock);

        return recordStore.findLatestByLifeDate(today)
                .map(this::toResponse)
                .orElseThrow(() -> new ApiException("TODAY_RECORD_NOT_FOUND", "今天还没有记录。"));
    }

    private RecordResponse toResponse(RecordState record) {
        return new RecordResponse(
                record.recordId(),
                record.lifeDate(),
                record.content(),
                record.status(),
                record.createdAt(),
                record.analysis().intent(),
                record.analysis().summary(),
                record.analysis().activities(),
                record.analysis().dimensionSummary(),
                record.analysis().needsConfirmation()
        );
    }
}
