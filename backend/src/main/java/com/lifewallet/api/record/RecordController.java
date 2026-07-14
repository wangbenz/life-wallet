package com.lifewallet.api.record;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent/records")
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @PostMapping
    public RecordResponse createRecord(@Valid @RequestBody RecordRequest request) {
        return recordService.createRecord(request);
    }

    @GetMapping("/today")
    public RecordResponse getTodayRecord() {
        return recordService.getTodayRecord();
    }
}
