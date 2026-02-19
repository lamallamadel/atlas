package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WhatsAppWebhookSignatureValidatorTest {

    @Mock private WhatsAppProviderConfigRepository providerConfigRepository;

    @InjectMocks private WhatsAppWebhookSignatureValidator validator;

    private String orgId = "test-org";
    private String webhookSecret = "test-secret-key";
    private String payload = "{\"object\":\"whatsapp_business_account\",\"entry\":[]}";
    private WhatsAppProviderConfig config;

    @BeforeEach
    void setUp() {
        config = new WhatsAppProviderConfig();
        config.setOrgId(orgId);
        config.setWebhookSecretEncrypted(webhookSecret);
    }

    @Test
    void validateSignature_ReturnsTrue_ForValidSignature() throws Exception {
        when(providerConfigRepository.findByOrgId(orgId)).thenReturn(Optional.of(config));

        String signature = validator.computeSignature(payload, webhookSecret);
        boolean result = validator.validateSignature(payload, signature, orgId);

        assertTrue(result);
    }

    @Test
    void validateSignature_ReturnsFalse_ForInvalidSignature() {
        when(providerConfigRepository.findByOrgId(orgId)).thenReturn(Optional.of(config));

        String invalidSignature = "sha256=invalid";
        boolean result = validator.validateSignature(payload, invalidSignature, orgId);

        assertFalse(result);
    }

    @Test
    void validateSignature_ReturnsFalse_WhenConfigNotFound() {
        when(providerConfigRepository.findByOrgId(orgId)).thenReturn(Optional.empty());

        String signature = "sha256=somesignature";
        boolean result = validator.validateSignature(payload, signature, orgId);

        assertFalse(result);
    }

    @Test
    void validateSignature_ReturnsFalse_WhenSecretNotConfigured() {
        config.setWebhookSecretEncrypted(null);
        when(providerConfigRepository.findByOrgId(orgId)).thenReturn(Optional.of(config));

        String signature = "sha256=somesignature";
        boolean result = validator.validateSignature(payload, signature, orgId);

        assertFalse(result);
    }

    @Test
    void validateSignature_ReturnsFalse_ForNullPayload() {
        boolean result = validator.validateSignature(null, "sha256=signature", orgId);

        assertFalse(result);
    }

    @Test
    void validateSignature_ReturnsFalse_ForNullSignature() {
        boolean result = validator.validateSignature(payload, null, orgId);

        assertFalse(result);
    }

    @Test
    void validateSignature_ReturnsFalse_ForNullOrgId() {
        boolean result = validator.validateSignature(payload, "sha256=signature", null);

        assertFalse(result);
    }

    @Test
    void validateSignature_ReturnsFalse_WhenSignatureMissingPrefix() {
        when(providerConfigRepository.findByOrgId(orgId)).thenReturn(Optional.of(config));

        String signatureWithoutPrefix = "somehexvalue";
        boolean result = validator.validateSignature(payload, signatureWithoutPrefix, orgId);

        assertFalse(result);
    }

    @Test
    void computeSignature_GeneratesConsistentSignature() throws Exception {
        String signature1 = validator.computeSignature(payload, webhookSecret);
        String signature2 = validator.computeSignature(payload, webhookSecret);

        assertEquals(signature1, signature2);
        assertTrue(signature1.startsWith("sha256="));
    }

    @Test
    void computeSignature_GeneratesDifferentSignatures_ForDifferentPayloads() throws Exception {
        String signature1 = validator.computeSignature(payload, webhookSecret);
        String signature2 = validator.computeSignature(payload + "modified", webhookSecret);

        assertNotEquals(signature1, signature2);
    }

    @Test
    void computeSignature_GeneratesDifferentSignatures_ForDifferentSecrets() throws Exception {
        String signature1 = validator.computeSignature(payload, webhookSecret);
        String signature2 = validator.computeSignature(payload, "different-secret");

        assertNotEquals(signature1, signature2);
    }

    @Test
    void validateSignature_ProtectsAgainstTimingAttacks() {
        when(providerConfigRepository.findByOrgId(orgId)).thenReturn(Optional.of(config));

        String validSignature =
                "sha256=6f54e7d3b6e3c3b2f1d8a9c4b5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4";
        String invalidSignature1 =
                "sha256=0000000000000000000000000000000000000000000000000000000000000000";
        String invalidSignature2 =
                "sha256=6f54e7d3b6e3c3b2f1d8a9c4b5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e5";

        long start1 = System.nanoTime();
        validator.validateSignature(payload, invalidSignature1, orgId);
        long duration1 = System.nanoTime() - start1;

        long start2 = System.nanoTime();
        validator.validateSignature(payload, invalidSignature2, orgId);
        long duration2 = System.nanoTime() - start2;

        double ratio = (double) Math.max(duration1, duration2) / Math.min(duration1, duration2);
        assertTrue(
                ratio < 10.0, "Timing difference too large, might be vulnerable to timing attacks");
    }
}
