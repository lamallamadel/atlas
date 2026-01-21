package com.example.backend.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailErrorMapper {

    private static final Map<String, ErrorInfo> ERROR_CODE_MAP = new HashMap<>();

    static {
        ERROR_CODE_MAP.put("SMTP_421", new ErrorInfo("Service not available, try later", true, false));
        ERROR_CODE_MAP.put("SMTP_450", new ErrorInfo("Requested mail action not taken: mailbox unavailable", true, false));
        ERROR_CODE_MAP.put("SMTP_451", new ErrorInfo("Requested action aborted: local error in processing", true, false));
        ERROR_CODE_MAP.put("SMTP_452", new ErrorInfo("Requested action not taken: insufficient system storage", true, false));
        ERROR_CODE_MAP.put("SMTP_500", new ErrorInfo("Syntax error, command unrecognized", false, false));
        ERROR_CODE_MAP.put("SMTP_501", new ErrorInfo("Syntax error in parameters or arguments", false, false));
        ERROR_CODE_MAP.put("SMTP_502", new ErrorInfo("Command not implemented", false, false));
        ERROR_CODE_MAP.put("SMTP_503", new ErrorInfo("Bad sequence of commands", false, false));
        ERROR_CODE_MAP.put("SMTP_504", new ErrorInfo("Command parameter not implemented", false, false));
        ERROR_CODE_MAP.put("SMTP_550", new ErrorInfo("Requested action not taken: mailbox unavailable", false, false));
        ERROR_CODE_MAP.put("SMTP_551", new ErrorInfo("User not local; please try forward path", false, false));
        ERROR_CODE_MAP.put("SMTP_552", new ErrorInfo("Requested mail action aborted: exceeded storage allocation", false, false));
        ERROR_CODE_MAP.put("SMTP_553", new ErrorInfo("Requested action not taken: mailbox name not allowed", false, false));
        ERROR_CODE_MAP.put("SMTP_554", new ErrorInfo("Transaction failed", false, false));
        
        ERROR_CODE_MAP.put("AUTH_FAILED", new ErrorInfo("SMTP authentication failed", false, false));
        ERROR_CODE_MAP.put("INVALID_EMAIL", new ErrorInfo("Invalid email address format", false, false));
        ERROR_CODE_MAP.put("CONNECTION_FAILED", new ErrorInfo("Could not connect to SMTP server", true, false));
        ERROR_CODE_MAP.put("TLS_FAILED", new ErrorInfo("TLS/SSL negotiation failed", true, false));
        ERROR_CODE_MAP.put("TIMEOUT", new ErrorInfo("Connection timeout", true, false));
        ERROR_CODE_MAP.put("MESSAGE_TOO_LARGE", new ErrorInfo("Message exceeds size limit", false, false));
        ERROR_CODE_MAP.put("RECIPIENT_REJECTED", new ErrorInfo("Recipient address rejected", false, false));
        ERROR_CODE_MAP.put("SENDER_REJECTED", new ErrorInfo("Sender address rejected", false, false));
        ERROR_CODE_MAP.put("RELAY_DENIED", new ErrorInfo("Relay access denied", false, false));
        ERROR_CODE_MAP.put("RATE_LIMIT", new ErrorInfo("Rate limit exceeded", true, true));
        ERROR_CODE_MAP.put("QUOTA_EXCEEDED", new ErrorInfo("Daily/monthly quota exceeded", true, true));
        ERROR_CODE_MAP.put("SPAM_DETECTED", new ErrorInfo("Message rejected as spam", false, false));
        ERROR_CODE_MAP.put("BLACKLISTED", new ErrorInfo("Sender IP/domain blacklisted", false, false));
        ERROR_CODE_MAP.put("INVALID_ATTACHMENT", new ErrorInfo("Invalid or corrupted attachment", false, false));
        ERROR_CODE_MAP.put("ENCODING_ERROR", new ErrorInfo("Character encoding error", false, false));
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
