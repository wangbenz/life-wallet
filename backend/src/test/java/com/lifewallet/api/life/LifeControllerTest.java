package com.lifewallet.api.life;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.lifewallet.api.agent.AgentActivity;
import com.lifewallet.api.agent.AgentAnalysis;
import com.lifewallet.api.agent.LifeModelClient;
import com.lifewallet.api.record.RecordRequest;
import com.lifewallet.api.record.RecordService;
import com.lifewallet.api.record.RecordStore;

class LifeControllerTest {

    @Test
    void returnsRecentLifeRecords() {
        LifeModelClient agent = content -> new AgentAnalysis(
                "RECORD_TODAY",
                "今天主要投入在创造上。",
                List.of(new AgentActivity("写代码", 120, "创造", "工作", "写代码", false)),
                List.of(),
                false
        );
        RecordService recordService = new RecordService(new RecordStore(), agent);
        recordService.createRecord(new RecordRequest(LocalDate.now(), "今天写代码两小时。"));

        LifeController controller = new LifeController(recordService);

        assertThat(controller.getRecentRecords())
                .singleElement()
                .satisfies(record -> assertThat(record.summary()).isEqualTo("今天主要投入在创造上。"));
    }
}
