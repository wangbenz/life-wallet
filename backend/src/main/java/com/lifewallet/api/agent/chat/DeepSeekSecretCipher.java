package com.lifewallet.api.agent.chat;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

@Component
public class DeepSeekSecretCipher {

    static final String ALGORITHM = "AES-256-GCM";
    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;
    private final SecureRandom secureRandom = new SecureRandom();

    EncryptedSecret encrypt(String plaintext, byte[] masterKey) {
        validateKey(masterKey);
        byte[] nonce = new byte[NONCE_BYTES];
        secureRandom.nextBytes(nonce);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(masterKey, "AES"), new GCMParameterSpec(TAG_BITS, nonce));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return new EncryptedSecret(
                    Base64.getEncoder().encodeToString(encrypted),
                    Base64.getEncoder().encodeToString(nonce),
                    ALGORITHM
            );
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("无法加密 DeepSeek 密钥。", exception);
        }
    }

    String decrypt(EncryptedSecret secret, byte[] masterKey) {
        validateKey(masterKey);
        if (!ALGORITHM.equals(secret.algorithmName())) {
            throw new IllegalStateException("数据库中的 DeepSeek 密钥加密算法不受支持。");
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.DECRYPT_MODE,
                    new SecretKeySpec(masterKey, "AES"),
                    new GCMParameterSpec(TAG_BITS, Base64.getDecoder().decode(secret.nonceValue()))
            );
            return new String(
                    cipher.doFinal(Base64.getDecoder().decode(secret.encryptedValue())),
                    StandardCharsets.UTF_8
            );
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new IllegalStateException("无法解密数据库中的 DeepSeek 密钥，请检查主密钥。", exception);
        }
    }

    private void validateKey(byte[] masterKey) {
        if (masterKey.length != 32) {
            throw new IllegalStateException("DeepSeek 数据库加密主密钥必须是 Base64 编码的 32 字节随机值。");
        }
    }
}
