package com.lifewallet.api.life;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import com.lifewallet.api.record.RecordResponse;
import com.lifewallet.api.record.RecordService;

@RestController
@RequestMapping("/api/life")
@Validated
public class LifeController {

    private final RecordService recordService;

    public LifeController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping("/recent-records")
    public List<RecordResponse> getRecentRecords(@RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey) {
        return recordService.getRecentRecords(ownerKey);
    }
}
