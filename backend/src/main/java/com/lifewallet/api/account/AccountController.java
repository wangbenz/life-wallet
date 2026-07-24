package com.lifewallet.api.account;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/account")
@Validated
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public AccountResponse getAccount(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey
    ) {
        return accountService.getAccount(ownerKey);
    }

    @PostMapping
    public AccountResponse saveAccount(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey,
            @Valid @RequestBody AccountRequest request
    ) {
        return accountService.saveAccount(ownerKey, request);
    }
}
