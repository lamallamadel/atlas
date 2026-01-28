package com.example.backend.service;

import org.jasypt.encryption.StringEncryptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class FieldEncryptionService {

    private static final Logger logger = LoggerFactory.getLogger(FieldEncryptionService.class);

    private final StringEncryptor encryptor;

    public FieldEncryptionService(@Qualifier("jasyptStringEncryptor") StringEncryptor encryptor) {
        this.encryptor = encryptor;
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }
        try {
            return encryptor.encrypt(plainText);
        } catch (Exception e) {
            logger.error("Failed to encrypt field", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }
        try {
            return encryptor.decrypt(encryptedText);
        } catch (Exception e) {
            logger.error("Failed to decrypt field", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
