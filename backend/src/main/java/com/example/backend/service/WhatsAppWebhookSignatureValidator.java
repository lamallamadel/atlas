package com.example.backend.service;

import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class WhatsAppWebhookSignatureValidator {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppWebhookSignatureValidator.class);
    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String SIGNATURE_PREFIX = "sha256=";

    private final WhatsAppProviderConfigRepository providerConfigRepository;

    public WhatsAppWebhookSignatureValidator(WhatsAppProviderConfigRepository providerConfigRepository) {
        this.providerConfigRepository = providerConfigRepository;
    }

    public boolean validateSignature(String payload, String signature, String orgId) {
        if (payload == null || signature == null || orgId == null) {
            logger.warn("Null parameter in signature validation: payload={}, signature={}, orgId={}", 
                payload != null, signature != null, orgId);
            return false;
        }

        if (!signature.startsWith(SIGNATURE_PREFIX)) {
            logger.warn("Signature does not start with expected prefix for orgId: {}", orgId);
            return false;
        }

        Optional<WhatsAppProviderConfig> configOpt = providerConfigRepository.findByOrgId(orgId);
        if (configOpt.isEmpty()) {
            logger.warn("WhatsApp provider config not found for orgId: {}", orgId);
            return false;
        }

        WhatsAppProviderConfig config = configOpt.get();
        String webhookSecret = config.getWebhookSecretEncrypted();
        
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            logger.warn("Webhook secret not configured for orgId: {}", orgId);
            return false;
        }

        try {
            String expectedSignature = computeSignature(payload, webhookSecret);
            boolean isValid = constantTimeEquals(signature, expectedSignature);
            
            if (!isValid) {
                logger.warn("Signature validation failed for orgId: {}", orgId);
            }
            
            return isValid;
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            logger.error("Error computing signature for orgId {}: {}", orgId, e.getMessage(), e);
            return false;
        }
    }

    public String computeSignature(String payload, String secret) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        return SIGNATURE_PREFIX + HexFormat.of().formatHex(hash);
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        
        if (a.length() != b.length()) {
            return false;
        }
        
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        
        return result == 0;
    }
}
