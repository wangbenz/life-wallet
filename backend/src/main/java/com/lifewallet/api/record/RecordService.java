package com.lifewallet.api.record;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lifewallet.api.agent.AgentAnalysis;
import com.lifewallet.api.agent.LifeModelClient;
import com.lifewallet.api.agent.DimensionSummary;
import com.lifewallet.api.common.ApiException;

@Service
public class RecordService {

    private static final String TEST_OWNER_KEY = "test-owner";
    private static final Set<String> LIFE_DIMENSIONS = Set.of("成长", "创造", "关系", "健康", "生活", "休闲", "睡眠");

    private final RecordPersistence recordStore;
    private final LifeModelClient lifeModelClient;
    private final Clock clock;

    @Autowired
    public RecordService(RecordPersistence recordStore, LifeModelClient lifeModelClient) {
        this(recordStore, lifeModelClient, Clock.systemDefaultZone());
    }

    RecordService(RecordPersistence recordStore, LifeModelClient lifeModelClient, Clock clock) {
        this.recordStore = recordStore;
        this.lifeModelClient = lifeModelClient;
        this.clock = clock;
    }

    public RecordResponse createRecord(RecordRequest request) {
        return createRecord(TEST_OWNER_KEY, request);
    }

    public RecordResponse createRecord(String ownerKey, RecordRequest request) {
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

        RecordState record = recordStore.save(ownerKey, request.lifeDate(), content, Instant.now(clock), analysis);
        return toResponse(record);
    }

    public RecordPreviewResponse previewRecord(RecordRequest request) {
        AgentAnalysis analysis = analyze(request.lifeDate(), request.content());
        List<com.lifewallet.api.agent.AgentActivity> sourcedActivities = analysis.activities().stream()
                .map(activity -> activity.sourceText() == null
                        ? new com.lifewallet.api.agent.AgentActivity(
                                activity.title(), request.content().trim(), activity.durationMinutes(), activity.dimension(),
                                activity.domain(), activity.topic(), activity.estimated()
                        )
                        : activity)
                .toList();
        return new RecordPreviewResponse(
                request.lifeDate(), request.content().trim(), analysis.summary(), "", sourcedActivities,
                analysis.dimensionSummary(), analysis.needsConfirmation()
        );
    }

    public RecordResponse confirmRecord(String ownerKey, ConfirmRecordRequest request) {
        validateLifeDate(request.lifeDate());
        request.activities().forEach(activity -> {
            if (activity.durationMinutes() < 1 || activity.durationMinutes() > 1440) {
                throw new ApiException("INVALID_ACTIVITY", "活动时长必须在 1 到 1440 分钟之间。");
            }
            if (activity.title() == null || activity.title().isBlank() || activity.title().length() > 120) {
                throw new ApiException("INVALID_ACTIVITY", "活动名称不能为空且不能超过 120 字。");
            }
            if (!LIFE_DIMENSIONS.contains(activity.dimension())) {
                throw new ApiException("INVALID_ACTIVITY", "活动一级分类无效。");
            }
            if (activity.domain() == null || activity.domain().isBlank() || activity.domain().length() > 64
                    || activity.topic() == null || activity.topic().isBlank() || activity.topic().length() > 120
                    || activity.sourceText() != null && activity.sourceText().length() > 2000) {
                throw new ApiException("INVALID_ACTIVITY", "活动的领域、主题或原文来源无效。");
            }
        });
        Map<String, Integer> totals = new LinkedHashMap<>();
        request.activities().forEach(activity -> totals.merge(activity.dimension(), activity.durationMinutes(), Integer::sum));
        List<DimensionSummary> summaries = totals.entrySet().stream()
                .map(entry -> new DimensionSummary(entry.getKey(), entry.getValue()))
                .toList();
        AgentAnalysis analysis = new AgentAnalysis(
                request.recordId() == null ? "RECORD_LIFE" : "UPDATE_RECORD",
                request.summary().trim(), request.activities(), summaries, request.needsConfirmation()
        );
        return toResponse(recordStore.saveConfirmed(
                ownerKey, request.recordId(), request.lifeDate(), request.content().trim(), Instant.now(clock), analysis
        ));
    }

    public void deleteRecord(String ownerKey, long recordId) {
        recordStore.delete(ownerKey, recordId);
    }

    private AgentAnalysis analyze(LocalDate lifeDate, String rawContent) {
        validateLifeDate(lifeDate);
        try {
            return lifeModelClient.analyze(rawContent.trim());
        } catch (RuntimeException exception) {
            throw new ApiException("AGENT_PARSE_FAILED", "这次没有理解成功，可以稍后再试，或把记录写得更具体一点。");
        }
    }

    private void validateLifeDate(LocalDate lifeDate) {
        if (lifeDate.isAfter(LocalDate.now(clock))) {
            throw new ApiException("INVALID_LIFE_DATE", "记录日期不能晚于今天。");
        }
    }

    public RecordResponse getTodayRecord() {
        return getTodayRecord(TEST_OWNER_KEY);
    }

    public RecordResponse getTodayRecord(String ownerKey) {
        LocalDate today = LocalDate.now(clock);

        return recordStore.findLatestByLifeDate(ownerKey, today)
                .map(this::toResponse)
                .orElseThrow(() -> new ApiException("TODAY_RECORD_NOT_FOUND", "今天还没有记录。"));
    }

    public List<RecordResponse> getRecentRecords() {
        return getRecentRecords(TEST_OWNER_KEY);
    }

    public List<RecordResponse> getRecentRecords(String ownerKey) {
        return recordStore.findRecent(ownerKey, 10).stream()
                .map(this::toResponse)
                .toList();
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
