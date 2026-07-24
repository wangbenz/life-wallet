package com.lifewallet.api.agent.chat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.stereotype.Component;

@Component
public class DeepSeekApiKeyProvider {

    private final DeepSeekProperties properties;

    public DeepSeekApiKeyProvider(DeepSeekProperties properties) {
        this.properties = properties;
    }

    public String getApiKey() {
        if (properties.apiKey() != null && !properties.apiKey().isBlank()) {
            return properties.apiKey().trim();
        }
        if (properties.apiKeyFile() == null || properties.apiKeyFile().isBlank()) {
            throw new AgentServiceException(
                    "AGENT_NOT_CONFIGURED",
                    "Life Agent 还没有配置模型密钥，请稍后再试。"
            );
        }
        try {
            // 支持 systemd credential 或其他只读 secret 文件，密钥不进入仓库和普通配置文件。
            String key = Files.readString(Path.of(properties.apiKeyFile())).trim();
            if (key.isBlank()) {
                throw new AgentServiceException("AGENT_NOT_CONFIGURED", "Life Agent 的模型密钥为空。");
            }
            return key;
        } catch (IOException exception) {
            throw new AgentServiceException("AGENT_NOT_CONFIGURED", "Life Agent 无法读取模型密钥。", exception);
        }
    }
}
