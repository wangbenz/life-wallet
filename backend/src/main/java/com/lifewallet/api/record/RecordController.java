package com.lifewallet.api.record;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/agent/records")
@Validated
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @PostMapping("/preview")
    public RecordPreviewResponse previewRecord(@Valid @RequestBody RecordRequest request) {
        return recordService.previewRecord(request);
    }

    @PostMapping("/confirm")
    public RecordResponse confirmRecord(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey,
            @Valid @RequestBody ConfirmRecordRequest request
    ) {
        return recordService.confirmRecord(ownerKey, request);
    }

    @DeleteMapping("/{recordId}")
    public org.springframework.http.ResponseEntity<Void> deleteRecord(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey,
            @PathVariable long recordId
    ) {
        recordService.deleteRecord(ownerKey, recordId);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    @GetMapping("/today")
    public RecordResponse getTodayRecord(@RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey) {
        return recordService.getTodayRecord(ownerKey);
    }
}
