package com.example.backend.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SmsErrorMapper {

    private static final Map<String, ErrorInfo> ERROR_CODE_MAP = new HashMap<>();

    static {
        ERROR_CODE_MAP.put("TWILIO_20003", new ErrorInfo("Authentication failed", false, false));
        ERROR_CODE_MAP.put("TWILIO_20404", new ErrorInfo("Resource not found", false, false));
        ERROR_CODE_MAP.put("TWILIO_21211", new ErrorInfo("Invalid 'To' phone number", false, false));
        ERROR_CODE_MAP.put("TWILIO_21408", new ErrorInfo("Permission to send to unverified number", false, false));
        ERROR_CODE_MAP.put("TWILIO_21601", new ErrorInfo("Phone number not capable of receiving SMS", false, false));
        ERROR_CODE_MAP.put("TWILIO_21610", new ErrorInfo("Message cannot be sent to landline", false, false));
        ERROR_CODE_MAP.put("TWILIO_21612", new ErrorInfo("Unable to reach destination", true, false));
        ERROR_CODE_MAP.put("TWILIO_21614", new ErrorInfo("Invalid mobile number", false, false));
        ERROR_CODE_MAP.put("TWILIO_30001", new ErrorInfo("Queue overflow", true, false));
        ERROR_CODE_MAP.put("TWILIO_30002", new ErrorInfo("Account suspended", false, false));
        ERROR_CODE_MAP.put("TWILIO_30003", new ErrorInfo("Unreachable destination handset", true, false));
        ERROR_CODE_MAP.put("TWILIO_30004", new ErrorInfo("Message blocked by carrier", false, false));
        ERROR_CODE_MAP.put("TWILIO_30005", new ErrorInfo("Unknown destination handset", false, false));
        ERROR_CODE_MAP.put("TWILIO_30006", new ErrorInfo("Landline or unreachable carrier", false, false));
        ERROR_CODE_MAP.put("TWILIO_30007", new ErrorInfo("Carrier violation or spam", false, false));
        ERROR_CODE_MAP.put("TWILIO_30008", new ErrorInfo("Unknown error", true, false));
        ERROR_CODE_MAP.put("TWILIO_30022", new ErrorInfo("Exceeded max price", false, false));
        
        ERROR_CODE_MAP.put("AWS_THROTTLING", new ErrorInfo("Rate limit exceeded", true, true));
        ERROR_CODE_MAP.put("AWS_INVALID_PARAMETER", new ErrorInfo("Invalid parameter value", false, false));
        ERROR_CODE_MAP.put("AWS_INTERNAL_ERROR", new ErrorInfo("Internal AWS service error", true, false));
        ERROR_CODE_MAP.put("AWS_INVALID_SMS", new ErrorInfo("Invalid SMS message", false, false));
        ERROR_CODE_MAP.put("AWS_OPTED_OUT", new ErrorInfo("Phone number opted out", false, false));
        ERROR_CODE_MAP.put("AWS_UNKNOWN", new ErrorInfo("Unknown AWS error", true, false));
        
        ERROR_CODE_MAP.put("INVALID_PHONE", new ErrorInfo("Invalid phone number format", false, false));
        ERROR_CODE_MAP.put("MESSAGE_TOO_LONG", new ErrorInfo("Message exceeds length limit", false, false));
        ERROR_CODE_MAP.put("RATE_LIMIT", new ErrorInfo("Rate limit exceeded", true, true));
        ERROR_CODE_MAP.put("QUOTA_EXCEEDED", new ErrorInfo("Daily/monthly quota exceeded", true, true));
        ERROR_CODE_MAP.put("CARRIER_BLOCKED", new ErrorInfo("Blocked by carrier", false, false));
        ERROR_CODE_MAP.put("SPAM_DETECTED", new ErrorInfo("Message flagged as spam", false, false));
        ERROR_CODE_MAP.put("INSUFFICIENT_FUNDS", new ErrorInfo("Insufficient account balance", false, false));
        ERROR_CODE_MAP.put("NETWORK_ERROR", new ErrorInfo("Network communication error", true, false));
        ERROR_CODE_MAP.put("TIMEOUT", new ErrorInfo("Request timeout", true, false));
    }

    public ErrorInfo getErrorInfo(String errorCode) {
        if (errorCode == null) {
            return new ErrorInfo("Unknown error", true, false);
        }
        return ERROR_CODE_MAP.getOrDefault(errorCode, new ErrorInfo("Unmapped error code: " + errorCode, true, false));
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
