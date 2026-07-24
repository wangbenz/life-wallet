package com.lifewallet.api.data;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data")
@Validated
public class DataManagementController {

    private final DataManagementService dataManagementService;

    public DataManagementController(DataManagementService dataManagementService) {
        this.dataManagementService = dataManagementService;
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteData(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey
    ) {
        dataManagementService.deleteOwnerData(ownerKey);
        return ResponseEntity.noContent().build();
    }
}
