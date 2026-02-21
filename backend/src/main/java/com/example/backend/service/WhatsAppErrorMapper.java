package com.example.backend.service;

import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppErrorMapper {

    private static final Map<String, ErrorInfo> ERROR_CODE_MAP = new HashMap<>();

    static {
        ERROR_CODE_MAP.put("0", new ErrorInfo("Temporary error", true, false));
        ERROR_CODE_MAP.put("1", new ErrorInfo("Service temporarily unavailable", true, false));
        ERROR_CODE_MAP.put(
                "2",
                new ErrorInfo(
                        "Phone number connected to different WhatsApp Business Account",
                        false,
                        false));
        ERROR_CODE_MAP.put("3", new ErrorInfo("Business account rate limited", true, true));
        ERROR_CODE_MAP.put("4", new ErrorInfo("Temporary error with phone number", true, false));
        ERROR_CODE_MAP.put("5", new ErrorInfo("Permanent error with phone number", false, false));

        ERROR_CODE_MAP.put("100", new ErrorInfo("Invalid parameter", false, false));
        ERROR_CODE_MAP.put("130", new ErrorInfo("Rate limit hit", true, true));
        ERROR_CODE_MAP.put("131000", new ErrorInfo("Generic user error", false, false));
        ERROR_CODE_MAP.put("131005", new ErrorInfo("Generic message send error", true, false));
        ERROR_CODE_MAP.put("131008", new ErrorInfo("Required parameter missing", false, false));
        ERROR_CODE_MAP.put("131009", new ErrorInfo("Parameter value invalid", false, false));
        ERROR_CODE_MAP.put("131016", new ErrorInfo("Service temporarily unavailable", true, false));
        ERROR_CODE_MAP.put("131021", new ErrorInfo("Recipient not on WhatsApp", false, false));
        ERROR_CODE_MAP.put("131026", new ErrorInfo("Message undeliverable", true, false));
        ERROR_CODE_MAP.put("131031", new ErrorInfo("Recipient blocked", false, false));
        ERROR_CODE_MAP.put("131042", new ErrorInfo("Phone number format invalid", false, false));
        ERROR_CODE_MAP.put("131045", new ErrorInfo("Message too long", false, false));
        ERROR_CODE_MAP.put("131047", new ErrorInfo("Invalid parameter value", false, false));
        ERROR_CODE_MAP.put("131051", new ErrorInfo("Unsupported message type", false, false));
        ERROR_CODE_MAP.put("131052", new ErrorInfo("Media download error", false, false));
        ERROR_CODE_MAP.put("131053", new ErrorInfo("Media upload error", false, false));

        ERROR_CODE_MAP.put("132000", new ErrorInfo("Generic platform error", true, false));
        ERROR_CODE_MAP.put("132001", new ErrorInfo("Message send failed", true, false));
        ERROR_CODE_MAP.put(
                "132005", new ErrorInfo("Re-engagement message send failed", true, false));
        ERROR_CODE_MAP.put("132007", new ErrorInfo("Message blocked by spam filter", false, false));
        ERROR_CODE_MAP.put("132012", new ErrorInfo("Phone number restricted", false, false));
        ERROR_CODE_MAP.put(
                "132015", new ErrorInfo("Cannot send message after 24 hour window", false, false));
        ERROR_CODE_MAP.put(
                "132016", new ErrorInfo("Out of session window - template required", false, false));
        ERROR_CODE_MAP.put(
                "132068",
                new ErrorInfo("Business account blocked from sending messages", false, false));
        ERROR_CODE_MAP.put(
                "132069", new ErrorInfo("Business account sending limit reached", true, true));

        ERROR_CODE_MAP.put("133000", new ErrorInfo("Invalid phone number", false, false));
        ERROR_CODE_MAP.put("133004", new ErrorInfo("Template not found", false, false));
        ERROR_CODE_MAP.put("133005", new ErrorInfo("Template paused", false, false));
        ERROR_CODE_MAP.put("133006", new ErrorInfo("Template disabled", false, false));
        ERROR_CODE_MAP.put(
                "133008", new ErrorInfo("Template parameter count mismatch", false, false));
        ERROR_CODE_MAP.put("133009", new ErrorInfo("Template missing parameters", false, false));
        ERROR_CODE_MAP.put(
                "133010", new ErrorInfo("Template parameter format invalid", false, false));
        ERROR_CODE_MAP.put("133015", new ErrorInfo("Template not approved", false, false));
        ERROR_CODE_MAP.put("133016", new ErrorInfo("Template rejected", false, false));

        ERROR_CODE_MAP.put("135000", new ErrorInfo("Generic template error", false, false));

        ERROR_CODE_MAP.put("190", new ErrorInfo("Access token expired", true, false));
        ERROR_CODE_MAP.put("200", new ErrorInfo("Permissions error", false, false));
        ERROR_CODE_MAP.put(
                "368", new ErrorInfo("Temporarily blocked for policy violations", true, false));
        ERROR_CODE_MAP.put("470", new ErrorInfo("Message expired", false, false));
        ERROR_CODE_MAP.put("471", new ErrorInfo("User unavailable", true, false));

        ERROR_CODE_MAP.put("80007", new ErrorInfo("Rate limit exceeded", true, true));
    }

    public ErrorInfo getErrorInfo(String errorCode) {
        if (errorCode == null) {
            return new ErrorInfo("Unknown error", true, false);
        }
        return ERROR_CODE_MAP.getOrDefault(
                errorCode, new ErrorInfo("Unmapped error code: " + errorCode, true, false));
    }

    public boolean isRetryable(String errorCode) {
        return getErrorInfo(errorCode).isRetryable();
    }

    public boolean isRateLimitError(String errorCode) {
        return getErrorInfo(errorCode).isRateLimitError();
    }

    public String getErrorMessage(String errorCode) {
        return getErrorInfo(errorCode).getMessage();
    }

    public static class ErrorInfo {
        private final String message;
        private final boolean retryable;
        private final boolean rateLimitError;

        public ErrorInfo(String message, boolean retryable, boolean rateLimitError) {
            this.message = message;
            this.retryable = retryable;
            this.rateLimitError = rateLimitError;
        }

        public String getMessage() {
            return message;
        }

        public boolean isRetryable() {
            return retryable;
        }

        public boolean isRateLimitError() {
            return rateLimitError;
        }
    }
}
