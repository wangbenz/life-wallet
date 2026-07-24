package com.lifewallet.api.agent.chat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;

@Component
@DependsOn("flywayInitializer")
public class DeepSeekApiKeyProvider implements InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(DeepSeekApiKeyProvider.class);
    private static final String SECRET_NAME = "deepseek_api_key";

    private final DeepSeekProperties properties;
    private final DeepSeekSecretStore secretStore;
    private final DeepSeekSecretCipher secretCipher;
    private volatile String apiKey;

    public DeepSeekApiKeyProvider(
            DeepSeekProperties properties,
            DeepSeekSecretStore secretStore,
            DeepSeekSecretCipher secretCipher
    ) {
        this.properties = properties;
        this.secretStore = secretStore;
        this.secretCipher = secretCipher;
    }

    @Override
    public void afterPropertiesSet() {
        if (!properties.secretPersistenceEnabled()) {
            apiKey = readBootstrapKey();
            logConfigurationState("启动配置");
            return;
        }

        String bootstrapKey = readBootstrapKey();
        var persistedSecret = secretStore.find(SECRET_NAME);
        if (persistedSecret.isPresent() && bootstrapKey != null) {
            // 运维人员再次提供非空导入文件时视为主动轮换，覆盖旧密文但不暴露旧值。
            secretStore.save(SECRET_NAME, secretCipher.encrypt(bootstrapKey, readMasterKey()));
            apiKey = bootstrapKey;
            log.info("DeepSeek 密钥已轮换、加密写入数据库并加载到内存。");
            return;
        }
        if (persistedSecret.isPresent()) {
            apiKey = normalize(secretCipher.decrypt(persistedSecret.get(), readMasterKey()));
            if (apiKey == null) {
                throw new IllegalStateException("数据库中的 DeepSeek 密钥为空。");
            }
            log.info("DeepSeek 密钥已从数据库解密并加载到内存。");
            return;
        }

        if (bootstrapKey == null) {
            logConfigurationState("数据库");
            return;
        }

        // 首次启动只把导入文件作为引导来源；加密入库后，后续启动以数据库为准。
        secretStore.save(SECRET_NAME, secretCipher.encrypt(bootstrapKey, readMasterKey()));
        apiKey = bootstrapKey;
        log.info("DeepSeek 密钥已加密写入数据库并加载到内存。");
    }

    public String getApiKey() {
        String loadedKey = apiKey;
        if (loadedKey == null) {
            throw new AgentServiceException(
                    "AGENT_NOT_CONFIGURED",
                    "Life Agent 还没有配置模型密钥，请稍后再试。"
            );
        }
        return loadedKey;
    }

    private String readBootstrapKey() {
        String configuredKey = normalize(properties.apiKey());
        if (configuredKey != null) {
            return configuredKey;
        }
        String path = normalize(properties.apiKeyFile());
        if (path == null) {
            return null;
        }
        try {
            return normalize(Files.readString(Path.of(path)));
        } catch (IOException exception) {
            throw new IllegalStateException("无法读取 DeepSeek 首次导入密钥文件。", exception);
        }
    }

    private byte[] readMasterKey() {
        String path = normalize(properties.masterKeyFile());
        if (path == null) {
            throw new IllegalStateException("启用 DeepSeek 密钥数据库存储时必须配置 DEEPSEEK_MASTER_KEY_FILE。");
        }
        try {
            String encoded = Files.readString(Path.of(path)).trim();
            return Base64.getDecoder().decode(encoded);
        } catch (IOException | IllegalArgumentException exception) {
            throw new IllegalStateException("无法读取 DeepSeek 数据库加密主密钥。", exception);
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void logConfigurationState(String source) {
        if (apiKey == null) {
            log.warn("{}中没有 DeepSeek 密钥，Agent 将保持不可用。", source);
        } else {
            log.info("DeepSeek 密钥已从{}加载到内存，数据库持久化已关闭。", source);
        }
    }
}
