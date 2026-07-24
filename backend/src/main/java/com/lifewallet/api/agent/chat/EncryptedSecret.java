package com.lifewallet.api.agent.chat;

record EncryptedSecret(String encryptedValue, String nonceValue, String algorithmName) {
}
