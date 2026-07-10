package com.lifewallet.api.record;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.lifewallet.api.common.ApiException;
import com.lifewallet.api.agent.AgentActivity;
import com.lifewallet.api.agent.AgentAnalysis;
import com.lifewallet.api.agent.LifeModelClient;

class RecordServiceTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-07-10T00:00:00Z"),
            ZoneOffset.UTC
    );

    @Test
    void createsRecordWithTrimmedContent() {
        RecordService service = new RecordService(new RecordStore(), stubAgent(), FIXED_CLOCK);

        RecordResponse response = service.createRecord(new RecordRequest(
                LocalDate.parse("2026-07-10"),
                "  今天修了一个前端白屏问题。  "
        ));

        assertThat(response.recordId()).isEqualTo(1001L);
        assertThat(response.lifeDate()).isEqualTo(LocalDate.parse("2026-07-10"));
        assertThat(response.content()).isEqualTo("今天修了一个前端白屏问题。");
        assertThat(response.status()).isEqualTo("ANALYZED");
        assertThat(response.createdAt()).isEqualTo(Instant.parse("2026-07-10T00:00:00Z"));
        assertThat(response.summary()).isEqualTo("今天主要投入在创造上。");
        assertThat(response.activities()).hasSize(1);
    }

    @Test
    void rejectsFutureLifeDate() {
        RecordService service = new RecordService(new RecordStore(), stubAgent(), FIXED_CLOCK);

        assertThatThrownBy(() -> service.createRecord(new RecordRequest(
                LocalDate.parse("2026-07-11"),
                "明天的事还没发生。"
        )))
                .isInstanceOf(ApiException.class)
                .hasMessage("记录日期不能晚于今天。");
    }

    @Test
    void returnsLatestTodayRecord() {
        RecordService service = new RecordService(new RecordStore(), stubAgent(), FIXED_CLOCK);

        service.createRecord(new RecordRequest(LocalDate.parse("2026-07-10"), "第一条记录"));
        RecordResponse latest = service.createRecord(new RecordRequest(LocalDate.parse("2026-07-10"), "第二条记录"));

        assertThat(service.getTodayRecord()).isEqualTo(latest);
    }

    @Test
    void returnsRecentRecordsWithNewestFirst() {
        RecordService service = new RecordService(new RecordStore(), stubAgent(), FIXED_CLOCK);

        RecordResponse first = service.createRecord(new RecordRequest(LocalDate.parse("2026-07-09"), "昨天的记录"));
        RecordResponse second = service.createRecord(new RecordRequest(LocalDate.parse("2026-07-10"), "今天的记录"));

        assertThat(service.getRecentRecords())
                .extracting(RecordResponse::recordId)
                .containsExactly(second.recordId(), first.recordId());
    }

    @Test
    void returnsFriendlyErrorWhenAgentFails() {
        LifeModelClient failingAgent = content -> {
            throw new IllegalStateException("invalid model output");
        };
        RecordService service = new RecordService(new RecordStore(), failingAgent, FIXED_CLOCK);

        assertThatThrownBy(() -> service.createRecord(new RecordRequest(
                LocalDate.parse("2026-07-10"),
                "今天写代码"
        )))
                .isInstanceOf(ApiException.class)
                .hasMessage("这次没有理解成功，可以稍后再试，或把记录写得更具体一点。");
    }

    private LifeModelClient stubAgent() {
        return content -> new AgentAnalysis(
                "RECORD_TODAY",
                "今天主要投入在创造上。",
                List.of(new AgentActivity("写代码", 120, "创造", "工作", "写代码", false)),
                List.of(),
                false
        );
    }
}
