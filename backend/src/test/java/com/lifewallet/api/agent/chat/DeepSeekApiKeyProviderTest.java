package com.lifewallet.api.agent.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;

class DeepSeekApiKeyProviderTest {

    @TempDir
    Path tempDir;

    @Test
    void importsBootstrapKeyAsCiphertextAndKeepsPlaintextOutOfStore() throws Exception {
        String plaintext = "test-deepseek-secret";
        Path apiKeyFile = Files.writeString(tempDir.resolve("deepseek-key"), plaintext);
        Path masterKeyFile = writeMasterKey();
        DeepSeekSecretStore store = mock(DeepSeekSecretStore.class);
        when(store.find("deepseek_api_key")).thenReturn(Optional.empty());
        DeepSeekSecretCipher cipher = new DeepSeekSecretCipher();
        DeepSeekApiKeyProvider provider = new DeepSeekApiKeyProvider(
                properties(apiKeyFile.toString(), masterKeyFile.toString()), store, cipher
        );

        provider.afterPropertiesSet();

        ArgumentCaptor<EncryptedSecret> secretCaptor = ArgumentCaptor.forClass(EncryptedSecret.class);
        verify(store).save(eq("deepseek_api_key"), secretCaptor.capture());
        assertThat(secretCaptor.getValue().encryptedValue()).doesNotContain(plaintext);
        assertThat(cipher.decrypt(secretCaptor.getValue(), readMasterKey(masterKeyFile))).isEqualTo(plaintext);
        assertThat(provider.getApiKey()).isEqualTo(plaintext);
    }

    @Test
    void loadsPersistedKeyAtStartupWithoutBootstrapFile() throws Exception {
        Path masterKeyFile = writeMasterKey();
        byte[] masterKey = readMasterKey(masterKeyFile);
        DeepSeekSecretCipher cipher = new DeepSeekSecretCipher();
        DeepSeekSecretStore store = mock(DeepSeekSecretStore.class);
        when(store.find("deepseek_api_key"))
                .thenReturn(Optional.of(cipher.encrypt("persisted-secret", masterKey)));
        DeepSeekApiKeyProvider provider = new DeepSeekApiKeyProvider(
                properties("", masterKeyFile.toString()), store, cipher
        );

        provider.afterPropertiesSet();

        assertThat(provider.getApiKey()).isEqualTo("persisted-secret");
    }

    @Test
    void nonEmptyBootstrapFileRotatesPersistedKey() throws Exception {
        Path masterKeyFile = writeMasterKey();
        byte[] masterKey = readMasterKey(masterKeyFile);
        Path apiKeyFile = Files.writeString(tempDir.resolve("rotated-key"), "rotated-secret");
        DeepSeekSecretCipher cipher = new DeepSeekSecretCipher();
        DeepSeekSecretStore store = mock(DeepSeekSecretStore.class);
        when(store.find("deepseek_api_key"))
                .thenReturn(Optional.of(cipher.encrypt("old-secret", masterKey)));
        DeepSeekApiKeyProvider provider = new DeepSeekApiKeyProvider(
                properties(apiKeyFile.toString(), masterKeyFile.toString()), store, cipher
        );

        provider.afterPropertiesSet();

        ArgumentCaptor<EncryptedSecret> secretCaptor = ArgumentCaptor.forClass(EncryptedSecret.class);
        verify(store).save(eq("deepseek_api_key"), secretCaptor.capture());
        assertThat(cipher.decrypt(secretCaptor.getValue(), masterKey)).isEqualTo("rotated-secret");
        assertThat(provider.getApiKey()).isEqualTo("rotated-secret");
    }

    @Test
    void remainsUnavailableWhenDatabaseAndBootstrapAreEmpty() {
        DeepSeekSecretStore store = mock(DeepSeekSecretStore.class);
        when(store.find("deepseek_api_key")).thenReturn(Optional.empty());
        DeepSeekApiKeyProvider provider = new DeepSeekApiKeyProvider(
                properties("", ""), store, new DeepSeekSecretCipher()
        );

        provider.afterPropertiesSet();

        assertThatThrownBy(provider::getApiKey)
                .isInstanceOf(AgentServiceException.class)
                .hasMessageContaining("没有配置模型密钥");
    }

    private DeepSeekProperties properties(String apiKeyFile, String masterKeyFile) {
        return new DeepSeekProperties(
                "https://api.deepseek.com",
                "",
                apiKeyFile,
                masterKeyFile,
                true,
                "deepseek-v4-flash",
                Duration.ofSeconds(1),
                Duration.ofSeconds(2),
                4
        );
    }

    private Path writeMasterKey() throws Exception {
        byte[] key = new byte[32];
        new java.security.SecureRandom().nextBytes(key);
        return Files.writeString(tempDir.resolve("master-key"), Base64.getEncoder().encodeToString(key));
    }

    private byte[] readMasterKey(Path path) throws Exception {
        return Base64.getDecoder().decode(Files.readString(path).trim());
    }
}
