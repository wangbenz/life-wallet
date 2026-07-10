package com.lifewallet.api.life;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lifewallet.api.record.RecordResponse;
import com.lifewallet.api.record.RecordService;

@RestController
@RequestMapping("/api/life")
public class LifeController {

    private final RecordService recordService;

    public LifeController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping("/recent-records")
    public List<RecordResponse> getRecentRecords() {
        return recordService.getRecentRecords();
    }
}
