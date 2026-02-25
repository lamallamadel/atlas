package com.example.backend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SecretsRotationService {

    private static final Logger logger = LoggerFactory.getLogger(SecretsRotationService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ConcurrentMap<String, SecretVersion> secrets = new ConcurrentHashMap<>();

    @Value("${app.security.secret.rotation.enabled:true}")
    private boolean rotationEnabled;

    @Value("${app.security.secret.rotation.overlap-period-hours:24}")
    private int overlapPeriodHours;

    public static class SecretVersion {
        private final String value;
        private final Instant createdAt;
        private final Instant expiresAt;

        public SecretVersion(String value, Instant createdAt, Instant expiresAt) {
            this.value = value;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
        }

        public String getValue() {
            return value;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }

        public boolean isValid() {
            return !isExpired();
        }
    }

    public void registerSecret(String key, String initialValue) {
        if (!secrets.containsKey(key)) {
            Instant now = Instant.now();
            Instant expiry = now.plus(30, ChronoUnit.DAYS);
            secrets.put(key, new SecretVersion(initialValue, now, expiry));
            logger.info("Registered secret: {} (expires: {})", key, expiry);
        }
    }

    public String getCurrentSecret(String key) {
        SecretVersion version = secrets.get(key);
        if (version == null) {
            throw new IllegalStateException("Secret not found: " + key);
        }
        return version.getValue();
    }

    public boolean validateSecret(String key, String secretToValidate) {
        SecretVersion current = secrets.get(key);
        if (current == null) {
            return false;
        }

        if (current.getValue().equals(secretToValidate) && current.isValid()) {
            return true;
        }

        String previousKey = key + ":previous";
        SecretVersion previous = secrets.get(previousKey);
        return previous != null
                && previous.getValue().equals(secretToValidate)
                && previous.isValid();
    }

    @Scheduled(cron = "${app.security.secret.rotation.cron:0 0 2 * * ?}")
    public void rotateSecrets() {
        if (!rotationEnabled) {
            return;
        }

        logger.info("Starting scheduled secret rotation");
        int rotatedCount = 0;

        for (String key : secrets.keySet()) {
            if (key.endsWith(":previous")) {
                continue;
            }

            SecretVersion current = secrets.get(key);
            if (current != null && shouldRotate(current)) {
                rotateSecret(key);
                rotatedCount++;
            }
        }

        logger.info("Completed secret rotation. Rotated {} secrets", rotatedCount);
    }

    private boolean shouldRotate(SecretVersion version) {
        Instant rotationThreshold =
                version.getExpiresAt().minus(overlapPeriodHours, ChronoUnit.HOURS);
        return Instant.now().isAfter(rotationThreshold);
    }

    private void rotateSecret(String key) {
        SecretVersion current = secrets.get(key);
        if (current == null) {
            return;
        }

        String previousKey = key + ":previous";
        secrets.put(previousKey, current);

        String newSecretValue = generateSecureSecret();
        Instant now = Instant.now();
        Instant newExpiry = now.plus(30, ChronoUnit.DAYS);
        SecretVersion newVersion = new SecretVersion(newSecretValue, now, newExpiry);

        secrets.put(key, newVersion);

        logger.info("Rotated secret: {} (new expiry: {})", key, newExpiry);
    }

    public void forceRotation(String key) {
        if (!secrets.containsKey(key)) {
            throw new IllegalArgumentException("Secret not found: " + key);
        }

        rotateSecret(key);
        logger.info("Forced rotation for secret: {}", key);
    }

    private String generateSecureSecret() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public void cleanupExpiredSecrets() {
        secrets.entrySet()
                .removeIf(
                        entry -> {
                            if (entry.getKey().endsWith(":previous")) {
                                SecretVersion version = entry.getValue();
                                if (version.isExpired()) {
                                    logger.info(
                                            "Cleaned up expired previous secret: {}",
                                            entry.getKey());
                                    return true;
                                }
                            }
                            return false;
                        });
    }
}
