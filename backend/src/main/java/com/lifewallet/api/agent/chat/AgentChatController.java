package com.lifewallet.api.agent.chat;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/agent/chat")
@Validated
public class AgentChatController {

    private final AgentRuntime agentRuntime;

    public AgentChatController(AgentRuntime agentRuntime) {
        this.agentRuntime = agentRuntime;
    }

    @PostMapping
    public AgentChatResponse chat(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey,
            @Valid @RequestBody AgentChatRequest request
    ) {
        return agentRuntime.chat(ownerKey, request);
    }
}
