package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class JwtSigningKeyRotationService {

    private static final Logger logger = LoggerFactory.getLogger(JwtSigningKeyRotationService.class);
    private static final String ALGORITHM = "HmacSHA256";
    private static final int KEY_SIZE = 256;
    
    @Value("${app.security.jwt.rotation.enabled:true}")
    private boolean rotationEnabled;
    
    @Value("${app.security.jwt.rotation.grace-period-days:7}")
    private int gracePeriodDays;
    
    private final ConcurrentMap<String, JwtKeyVersion> keys = new ConcurrentHashMap<>();
    private volatile String currentKeyId = "default";

    public static class JwtKeyVersion {
        private final String keyId;
        private final String encodedKey;
        private final Instant createdAt;
        private final Instant expiresAt;
        private final boolean active;
        
        public JwtKeyVersion(String keyId, String encodedKey, Instant createdAt, Instant expiresAt, boolean active) {
            this.keyId = keyId;
            this.encodedKey = encodedKey;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
            this.active = active;
        }
        
        public String getKeyId() {
            return keyId;
        }
        
        public String getEncodedKey() {
            return encodedKey;
        }
        
        public Instant getCreatedAt() {
            return createdAt;
        }
        
        public Instant getExpiresAt() {
            return expiresAt;
        }
        
        public boolean isActive() {
            return active;
        }
        
        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public void initializeKeys() {
        if (keys.isEmpty()) {
            try {
                String keyId = "key-" + System.currentTimeMillis();
                String encodedKey = generateSigningKey();
                Instant now = Instant.now();
                Instant expiry = now.plus(90, ChronoUnit.DAYS);
                
                JwtKeyVersion keyVersion = new JwtKeyVersion(keyId, encodedKey, now, expiry, true);
                keys.put(keyId, keyVersion);
                currentKeyId = keyId;
                
                logger.info("Initialized JWT signing key: {} (expires: {})", keyId, expiry);
            } catch (NoSuchAlgorithmException e) {
                logger.error("Failed to initialize JWT signing key", e);
                throw new RuntimeException("Failed to initialize JWT signing key", e);
            }
        }
    }

    public String getCurrentKeyId() {
        return currentKeyId;
    }

    public String getCurrentSigningKey() {
        JwtKeyVersion currentKey = keys.get(currentKeyId);
        if (currentKey == null) {
            throw new IllegalStateException("No current signing key available");
        }
        return currentKey.getEncodedKey();
    }

    public String getSigningKey(String keyId) {
        JwtKeyVersion keyVersion = keys.get(keyId);
        if (keyVersion == null) {
            throw new IllegalArgumentException("Key not found: " + keyId);
        }
        return keyVersion.getEncodedKey();
    }

    public boolean isKeyValid(String keyId) {
        JwtKeyVersion keyVersion = keys.get(keyId);
        return keyVersion != null && !keyVersion.isExpired();
    }

    @Scheduled(cron = "${app.security.jwt.rotation.cron:0 0 3 1 * ?}")
    public void rotateSigningKeys() {
        if (!rotationEnabled) {
            return;
        }
        
        logger.info("Starting JWT signing key rotation");
        
        try {
            JwtKeyVersion currentKey = keys.get(currentKeyId);
            if (currentKey == null) {
                logger.warn("No current key found, initializing new key");
                initializeKeys();
                return;
            }
            
            if (!shouldRotate(currentKey)) {
                logger.info("Current key does not require rotation yet");
                return;
            }
            
            String newKeyId = "key-" + System.currentTimeMillis();
            String newEncodedKey = generateSigningKey();
            Instant now = Instant.now();
            Instant newExpiry = now.plus(90, ChronoUnit.DAYS);
            
            JwtKeyVersion newKeyVersion = new JwtKeyVersion(newKeyId, newEncodedKey, now, newExpiry, true);
            keys.put(newKeyId, newKeyVersion);
            
            JwtKeyVersion oldKeyVersion = new JwtKeyVersion(
                currentKey.getKeyId(),
                currentKey.getEncodedKey(),
                currentKey.getCreatedAt(),
                now.plus(gracePeriodDays, ChronoUnit.DAYS),
                false
            );
            keys.put(currentKey.getKeyId(), oldKeyVersion);
            
            currentKeyId = newKeyId;
            
            logger.info("Rotated JWT signing key. New key: {} (expires: {}), Old key grace period: {} days", 
                newKeyId, newExpiry, gracePeriodDays);
            
        } catch (NoSuchAlgorithmException e) {
            logger.error("Failed to rotate JWT signing key", e);
        }
    }

    private boolean shouldRotate(JwtKeyVersion keyVersion) {
        Instant rotationThreshold = keyVersion.getExpiresAt().minus(30, ChronoUnit.DAYS);
        return Instant.now().isAfter(rotationThreshold);
    }

    private String generateSigningKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
        keyGenerator.init(KEY_SIZE);
        SecretKey secretKey = keyGenerator.generateKey();
        return Base64.getEncoder().encodeToString(secretKey.getEncoded());
    }

    @Scheduled(cron = "${app.security.jwt.cleanup.cron:0 0 4 * * ?}")
    public void cleanupExpiredKeys() {
        logger.info("Starting cleanup of expired JWT signing keys");
        
        keys.entrySet().removeIf(entry -> {
            JwtKeyVersion keyVersion = entry.getValue();
            if (keyVersion.isExpired() && !keyVersion.isActive()) {
                logger.info("Cleaned up expired JWT signing key: {}", entry.getKey());
                return true;
            }
            return false;
        });
    }
}
