package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WhatsAppErrorMapperTest {

    private WhatsAppErrorMapper errorMapper;

    @BeforeEach
    void setUp() {
        errorMapper = new WhatsAppErrorMapper();
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForRateLimitError() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("130");

        assertEquals("Rate limit hit", info.getMessage());
        assertTrue(info.isRetryable());
        assertTrue(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForInvalidParameter() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("131047");

        assertEquals("Invalid parameter value", info.getMessage());
        assertFalse(info.isRetryable());
        assertFalse(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForSessionWindowExpired() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("132016");

        assertEquals("Out of session window - template required", info.getMessage());
        assertFalse(info.isRetryable());
        assertFalse(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForTemplateNotFound() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("133004");

        assertEquals("Template not found", info.getMessage());
        assertFalse(info.isRetryable());
        assertFalse(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForRecipientBlocked() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("131031");

        assertEquals("Recipient blocked", info.getMessage());
        assertFalse(info.isRetryable());
        assertFalse(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForTemporaryError() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("131016");

        assertEquals("Service temporarily unavailable", info.getMessage());
        assertTrue(info.isRetryable());
        assertFalse(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForBusinessAccountRateLimit() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("132069");

        assertEquals("Business account sending limit reached", info.getMessage());
        assertTrue(info.isRetryable());
        assertTrue(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsCorrectInfo_ForQuotaExceeded() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("80007");

        assertEquals("Rate limit exceeded", info.getMessage());
        assertTrue(info.isRetryable());
        assertTrue(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsDefault_ForUnknownCode() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo("999999");

        assertTrue(info.getMessage().contains("Unmapped"));
        assertTrue(info.isRetryable());
        assertFalse(info.isRateLimitError());
    }

    @Test
    void getErrorInfo_ReturnsDefault_ForNullCode() {
        WhatsAppErrorMapper.ErrorInfo info = errorMapper.getErrorInfo(null);

        assertEquals("Unknown error", info.getMessage());
        assertTrue(info.isRetryable());
        assertFalse(info.isRateLimitError());
    }

    @Test
    void isRetryable_ReturnsTrueForRetryableErrors() {
        assertTrue(errorMapper.isRetryable("130"));
        assertTrue(errorMapper.isRetryable("131016"));
        assertTrue(errorMapper.isRetryable("132069"));
    }

    @Test
    void isRetryable_ReturnsFalseForNonRetryableErrors() {
        assertFalse(errorMapper.isRetryable("131047"));
        assertFalse(errorMapper.isRetryable("131031"));
        assertFalse(errorMapper.isRetryable("133004"));
    }

    @Test
    void isRateLimitError_ReturnsTrueForRateLimitErrors() {
        assertTrue(errorMapper.isRateLimitError("130"));
        assertTrue(errorMapper.isRateLimitError("132069"));
        assertTrue(errorMapper.isRateLimitError("80007"));
    }

    @Test
    void isRateLimitError_ReturnsFalseForNonRateLimitErrors() {
        assertFalse(errorMapper.isRateLimitError("131047"));
        assertFalse(errorMapper.isRateLimitError("133004"));
        assertFalse(errorMapper.isRateLimitError("131031"));
    }

    @Test
    void getErrorMessage_ReturnsCorrectMessage() {
        assertEquals("Rate limit hit", errorMapper.getErrorMessage("130"));
        assertEquals("Template not found", errorMapper.getErrorMessage("133004"));
        assertEquals("Unknown error", errorMapper.getErrorMessage(null));
    }
}
