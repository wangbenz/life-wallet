package com.lifewallet.api.agent.chat;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("life-wallet.agent.deepseek")
public record DeepSeekProperties(
        String baseUrl,
        String apiKey,
        String apiKeyFile,
        String model,
        Duration connectTimeout,
        Duration readTimeout,
        int maxSteps
) {
}
