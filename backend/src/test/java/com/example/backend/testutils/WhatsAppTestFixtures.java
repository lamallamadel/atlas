package com.example.backend.testutils;

import com.example.backend.entity.OutboundAttemptEntity;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppSessionWindow;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundAttemptStatus;
import com.example.backend.entity.enums.OutboundMessageStatus;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Comprehensive WhatsApp test utilities for creating realistic test scenarios.
 *
 * <p>This class provides:
 *
 * <ul>
 *   <li>Factory methods for OutboundMessageEntity with realistic scenarios
 *   <li>WhatsAppSessionWindowBuilder fluent API for various window states
 *   <li>MockWhatsAppServerContainer using Testcontainers WireMock
 *   <li>Assertion helpers for verifying message status transitions
 * </ul>
 */
public class WhatsAppTestFixtures {

    private static final String DEFAULT_ORG_ID = "test-org";
    private static final String DEFAULT_PHONE = "+33612345678";
    private static final String DEFAULT_IDEMPOTENCY_PREFIX = "test-idem";

    // ========== Factory Methods for OutboundMessageEntity ==========

    /**
     * Creates a freeform message within active session window. Use case: User replies within 24
     * hours, allowing freeform text messages.
     */
    public static OutboundMessageEntity createFreeformMessageWithinWindow(String orgId) {
        OutboundMessageEntity message = createBaseMessage(orgId);
        message.setTemplateCode(null);
        message.setSubject("Freeform message");

        Map<String, Object> payload = new HashMap<>();
        payload.put("body", "Thank you for your inquiry. We'll get back to you shortly.");
        payload.put("preview_url", false);
        message.setPayloadJson(payload);

        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setAttemptCount(0);
        return message;
    }

    /**
     * Creates a template message for use outside session window. Use case: Re-engagement after
     * 24-hour window expires, requires approved template.
     */
    public static OutboundMessageEntity createTemplateMessageOutsideWindow(String orgId) {
        OutboundMessageEntity message = createBaseMessage(orgId);
        message.setTemplateCode("welcome_notification");
        message.setSubject("Welcome template");

        Map<String, Object> payload = new HashMap<>();
        payload.put("template_name", "welcome_notification");
        payload.put("language", "en");

        Map<String, Object> components = new HashMap<>();
        Map<String, Object> body = new HashMap<>();
        body.put("type", "body");
        body.put("parameters", new Object[] {Map.of("type", "text", "text", "John Doe")});
        components.put("body", body);

        payload.put("components", components);
        message.setPayloadJson(payload);

        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setAttemptCount(0);
        return message;
    }

    /**
     * Creates a message that has exhausted all retry attempts. Use case: Permanent failure after
     * max retries for transient errors.
     */
    public static OutboundMessageEntity createRetryExhaustedMessage(String orgId) {
        OutboundMessageEntity message = createFreeformMessageWithinWindow(orgId);
        message.setStatus(OutboundMessageStatus.FAILED);
        message.setAttemptCount(5);
        message.setMaxAttempts(5);
        message.setErrorCode("131016");
        message.setErrorMessage("Service temporarily unavailable - max retries exhausted");
        return message;
    }

    /**
     * Creates a message in SENDING state (mid-processing). Use case: Message accepted by provider,
     * awaiting delivery confirmation.
     */
    public static OutboundMessageEntity createSendingMessage(String orgId) {
        OutboundMessageEntity message = createFreeformMessageWithinWindow(orgId);
        message.setStatus(OutboundMessageStatus.SENDING);
        message.setAttemptCount(1);
        message.setProviderMessageId("wamid.sending123");
        return message;
    }

    /** Creates a successfully sent message. Use case: Message sent and acknowledged by WhatsApp. */
    public static OutboundMessageEntity createSentMessage(String orgId) {
        OutboundMessageEntity message = createFreeformMessageWithinWindow(orgId);
        message.setStatus(OutboundMessageStatus.SENT);
        message.setAttemptCount(1);
        message.setProviderMessageId("wamid.success123");
        return message;
    }

    /**
     * Creates a delivered message (end-to-end delivery confirmation). Use case: Message delivered
     * to recipient's device.
     */
    public static OutboundMessageEntity createDeliveredMessage(String orgId) {
        OutboundMessageEntity message = createSentMessage(orgId);
        message.setStatus(OutboundMessageStatus.DELIVERED);
        return message;
    }

    /**
     * Creates a message with rate limit error (429). Use case: Testing rate limit handling and
     * backoff strategies.
     */
    public static OutboundMessageEntity createRateLimitedMessage(String orgId) {
        OutboundMessageEntity message = createFreeformMessageWithinWindow(orgId);
        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setAttemptCount(1);
        message.setErrorCode("130");
        message.setErrorMessage("Rate limit exceeded - retry after 60 seconds");
        return message;
    }

    /**
     * Creates a message with session window expiry error (131047). Use case: Freeform message
     * attempted outside 24-hour window.
     */
    public static OutboundMessageEntity createSessionExpiredMessage(String orgId) {
        OutboundMessageEntity message = createFreeformMessageWithinWindow(orgId);
        message.setStatus(OutboundMessageStatus.FAILED);
        message.setAttemptCount(1);
        message.setErrorCode("131047");
        message.setErrorMessage("Re-engagement message - 24-hour session window expired");
        return message;
    }

    /**
     * Creates a message with invalid parameters error (non-retryable). Use case: Testing permanent
     * failure handling.
     */
    public static OutboundMessageEntity createInvalidParametersMessage(String orgId) {
        OutboundMessageEntity message = createTemplateMessageOutsideWindow(orgId);
        message.setStatus(OutboundMessageStatus.FAILED);
        message.setAttemptCount(1);
        message.setErrorCode("131042");
        message.setErrorMessage("Parameter format error - invalid phone number");
        return message;
    }

    /** Creates a message for load testing scenario with custom payload. */
    public static OutboundMessageEntity createLoadTestMessage(
            String orgId, String phoneNumber, int sequenceNumber) {
        OutboundMessageEntity message = createBaseMessage(orgId);
        message.setTo(phoneNumber);
        message.setIdempotencyKey(DEFAULT_IDEMPOTENCY_PREFIX + "-load-" + sequenceNumber);

        Map<String, Object> payload = new HashMap<>();
        payload.put("body", "Load test message #" + sequenceNumber);
        payload.put("sequence", sequenceNumber);
        message.setPayloadJson(payload);

        message.setStatus(OutboundMessageStatus.QUEUED);
        return message;
    }

    /** Creates base message with common defaults. */
    private static OutboundMessageEntity createBaseMessage(String orgId) {
        OutboundMessageEntity message = new OutboundMessageEntity();
        message.setOrgId(orgId != null ? orgId : DEFAULT_ORG_ID);
        message.setChannel(MessageChannel.WHATSAPP);
        message.setTo(DEFAULT_PHONE);
        message.setIdempotencyKey(DEFAULT_IDEMPOTENCY_PREFIX + "-" + UUID.randomUUID());
        message.setAttemptCount(0);
        message.setMaxAttempts(5);
        message.setCreatedAt(LocalDateTime.now());
        message.setUpdatedAt(LocalDateTime.now());
        return message;
    }

    // ========== WhatsAppSessionWindowBuilder ==========

    /**
     * Fluent builder for WhatsAppSessionWindow with various states.
     *
     * <p>Usage:
     *
     * <pre>
     * WhatsAppSessionWindow expiredWindow = WhatsAppTestFixtures.sessionWindow()
     *     .forOrgId("test-org")
     *     .forPhoneNumber("+33612345678")
     *     .expired(2)  // expired 2 hours ago
     *     .build();
     * </pre>
     */
    public static WhatsAppSessionWindowBuilder sessionWindow() {
        return new WhatsAppSessionWindowBuilder();
    }

    public static class WhatsAppSessionWindowBuilder {
        private String orgId = DEFAULT_ORG_ID;
        private String phoneNumber = DEFAULT_PHONE;
        private LocalDateTime windowOpensAt;
        private LocalDateTime windowExpiresAt;
        private LocalDateTime lastInboundMessageAt;
        private LocalDateTime lastOutboundMessageAt;

        /** Set the organization ID. */
        public WhatsAppSessionWindowBuilder forOrgId(String orgId) {
            this.orgId = orgId;
            return this;
        }

        /** Set the phone number (will be normalized with + prefix). */
        public WhatsAppSessionWindowBuilder forPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Create an expired session window.
         *
         * @param hoursExpired How many hours ago the window expired
         */
        public WhatsAppSessionWindowBuilder expired(int hoursExpired) {
            LocalDateTime now = LocalDateTime.now();
            this.lastInboundMessageAt = now.minusHours(24 + hoursExpired);
            this.windowOpensAt = this.lastInboundMessageAt;
            this.windowExpiresAt = this.lastInboundMessageAt.plusHours(24);
            return this;
        }

        /**
         * Create an active session window.
         *
         * @param hoursRemaining How many hours remain until expiry
         */
        public WhatsAppSessionWindowBuilder active(int hoursRemaining) {
            if (hoursRemaining < 0 || hoursRemaining > 24) {
                throw new IllegalArgumentException("hoursRemaining must be between 0 and 24");
            }
            LocalDateTime now = LocalDateTime.now();
            this.lastInboundMessageAt = now.minusHours(24 - hoursRemaining);
            this.windowOpensAt = this.lastInboundMessageAt;
            this.windowExpiresAt = this.lastInboundMessageAt.plusHours(24);
            return this;
        }

        /** Create a session window with custom times. */
        public WhatsAppSessionWindowBuilder withCustomWindow(
                LocalDateTime opensAt, LocalDateTime expiresAt) {
            this.windowOpensAt = opensAt;
            this.windowExpiresAt = expiresAt;
            this.lastInboundMessageAt = opensAt;
            return this;
        }

        /** Set the last inbound message time. */
        public WhatsAppSessionWindowBuilder withLastInboundAt(LocalDateTime timestamp) {
            this.lastInboundMessageAt = timestamp;
            return this;
        }

        /** Set the last outbound message time. */
        public WhatsAppSessionWindowBuilder withLastOutboundAt(LocalDateTime timestamp) {
            this.lastOutboundMessageAt = timestamp;
            return this;
        }

        /** Create a "nearly expired" session window (expires in 1 minute). */
        public WhatsAppSessionWindowBuilder nearlyExpired() {
            return active(0).withCustomWindow(windowOpensAt, LocalDateTime.now().plusMinutes(1));
        }

        /** Create a "just opened" session window (opened 1 minute ago). */
        public WhatsAppSessionWindowBuilder justOpened() {
            LocalDateTime now = LocalDateTime.now();
            this.lastInboundMessageAt = now.minusMinutes(1);
            this.windowOpensAt = this.lastInboundMessageAt;
            this.windowExpiresAt = this.lastInboundMessageAt.plusHours(24);
            return this;
        }

        /** Build the WhatsAppSessionWindow entity. */
        public WhatsAppSessionWindow build() {
            if (windowOpensAt == null || windowExpiresAt == null) {
                throw new IllegalStateException(
                        "Must call active(), expired(), or withCustomWindow() before build()");
            }

            WhatsAppSessionWindow window = new WhatsAppSessionWindow();
            window.setOrgId(orgId);
            window.setPhoneNumber(phoneNumber.startsWith("+") ? phoneNumber : "+" + phoneNumber);
            window.setWindowOpensAt(windowOpensAt);
            window.setWindowExpiresAt(windowExpiresAt);
            window.setLastInboundMessageAt(
                    lastInboundMessageAt != null ? lastInboundMessageAt : windowOpensAt);
            window.setLastOutboundMessageAt(lastOutboundMessageAt);
            window.setCreatedAt(windowOpensAt);
            window.setUpdatedAt(LocalDateTime.now());
            return window;
        }

        /**
         * Create a null window (no session exists).
         *
         * @return null
         */
        public WhatsAppSessionWindow missing() {
            return null;
        }
    }

    // ========== MockWhatsAppServerContainer ==========

    /**
     * Testcontainers-based WireMock server for mocking WhatsApp Cloud API.
     *
     * <p>Provides pre-configured stubs for common scenarios:
     *
     * <ul>
     *   <li>200 Success responses
     *   <li>429 Rate limit errors
     *   <li>470 Rate limit exceeded (quota)
     *   <li>131047 Re-engagement (session expired)
     *   <li>401 Unauthorized
     *   <li>500 Server errors
     * </ul>
     *
     * <p>Usage:
     *
     * <pre>
     * try (MockWhatsAppServerContainer mock = new MockWhatsAppServerContainer()) {
     *     mock.start();
     *     String baseUrl = mock.getBaseUrl();
     *     // Configure your WhatsApp provider to use baseUrl
     *     mock.stubSuccess();
     *     // Make requests...
     * }
     * </pre>
     */
    public static class MockWhatsAppServerContainer
            extends GenericContainer<MockWhatsAppServerContainer> {
        private static final int WIREMOCK_PORT = 8080;
        private static final String WIREMOCK_IMAGE = "wiremock/wiremock:3.3.1";

        public MockWhatsAppServerContainer() {
            super(DockerImageName.parse(WIREMOCK_IMAGE));
            withExposedPorts(WIREMOCK_PORT);
            withCommand("--verbose");
        }

        /** Get the base URL for the mock server. */
        public String getBaseUrl() {
            return "http://" + getHost() + ":" + getMappedPort(WIREMOCK_PORT);
        }

        /**
         * Stub a successful message send (200 OK). Returns provider message ID
         * "wamid.test_success_123".
         */
        public void stubSuccess() {
            stubSuccess("wamid.test_success_123");
        }

        /** Stub a successful message send with custom message ID. */
        public void stubSuccess(String messageId) {
            String body =
                    String.format(
                            """
                {
                    "messaging_product": "whatsapp",
                    "contacts": [{"input": "+33612345678", "wa_id": "33612345678"}],
                    "messages": [{"id": "%s"}]
                }
                """,
                            messageId);

            stubPost("/v17.0/.*/messages", 200, body);
        }

        /** Stub a 429 rate limit error. Returns error code 130 with retry_after hint. */
        public void stubRateLimit429() {
            stubRateLimit429(60);
        }

        /** Stub a 429 rate limit error with custom retry_after seconds. */
        public void stubRateLimit429(int retryAfterSeconds) {
            String body =
                    String.format(
                            """
                {
                    "error": {
                        "message": "Too many messages sent. Please wait and retry.",
                        "type": "OAuthException",
                        "code": 130,
                        "error_data": {
                            "messaging_product": "whatsapp",
                            "details": "Rate limit hit",
                            "retry_after": %d
                        },
                        "fbtrace_id": "test_trace_429"
                    }
                }
                """,
                            retryAfterSeconds);

            stubPost("/v17.0/.*/messages", 429, body);
        }

        /** Stub a 470 rate limit exceeded error (quota exceeded). */
        public void stubRateLimitExceeded470() {
            String body =
                    """
                {
                    "error": {
                        "message": "Rate limit exceeded. Please wait until the next window.",
                        "type": "OAuthException",
                        "code": 470,
                        "error_subcode": 2494055,
                        "error_data": {
                            "messaging_product": "whatsapp",
                            "details": "Message quota exceeded"
                        },
                        "fbtrace_id": "test_trace_470"
                    }
                }
                """;

            stubPost("/v17.0/.*/messages", 429, body);
        }

        /**
         * Stub a 131047 re-engagement error (24-hour window expired). This error occurs when
         * sending freeform messages outside the session window.
         */
        public void stubReEngagement131047() {
            String body =
                    """
                {
                    "error": {
                        "message": "Re-engagement message",
                        "type": "OAuthException",
                        "code": 131047,
                        "error_subcode": 2494079,
                        "error_data": {
                            "messaging_product": "whatsapp",
                            "details": "Message failed to send because more than 24 hours have passed since the customer last replied to this number."
                        },
                        "fbtrace_id": "test_trace_131047"
                    }
                }
                """;

            stubPost("/v17.0/.*/messages", 400, body);
        }

        /** Stub a 401 unauthorized error. */
        public void stubUnauthorized401() {
            String body =
                    """
                {
                    "error": {
                        "message": "Invalid OAuth access token.",
                        "type": "OAuthException",
                        "code": 190,
                        "error_subcode": 463,
                        "fbtrace_id": "test_trace_401"
                    }
                }
                """;

            stubPost("/v17.0/.*/messages", 401, body);
        }

        /** Stub a 500 internal server error. */
        public void stubServerError500() {
            String body =
                    """
                {
                    "error": {
                        "message": "An unexpected error has occurred. Please retry your request later.",
                        "type": "OAuthException",
                        "code": 2,
                        "fbtrace_id": "test_trace_500"
                    }
                }
                """;

            stubPost("/v17.0/.*/messages", 500, body);
        }

        /** Stub an invalid parameter error (non-retryable). */
        public void stubInvalidParameters131042() {
            String body =
                    """
                {
                    "error": {
                        "message": "Parameter format error",
                        "type": "OAuthException",
                        "code": 131042,
                        "error_data": {
                            "messaging_product": "whatsapp",
                            "details": "Invalid phone number format"
                        },
                        "fbtrace_id": "test_trace_131042"
                    }
                }
                """;

            stubPost("/v17.0/.*/messages", 400, body);
        }

        /** Stub a timeout/network error simulation. */
        public void stubTimeout() {
            stubPost("/v17.0/.*/messages", 0, "", 30000);
        }

        /** Clear all stubs (reset to default state). */
        public void clearStubs() {
            stubDelete("/__admin/mappings", 200, "{}");
        }

        /** Internal helper to create POST stub. */
        private void stubPost(String urlPattern, int status, String responseBody) {
            stubPost(urlPattern, status, responseBody, 0);
        }

        /** Internal helper to create POST stub with delay. */
        private void stubPost(String urlPattern, int status, String responseBody, int delayMs) {
            String delayJson =
                    delayMs > 0 ? String.format(", \"fixedDelayMilliseconds\": %d", delayMs) : "";

            String stubBody =
                    String.format(
                            """
                {
                    "request": {
                        "method": "POST",
                        "urlPattern": "%s"
                    },
                    "response": {
                        "status": %d,
                        "body": "%s",
                        "headers": {
                            "Content-Type": "application/json"
                        }%s
                    }
                }
                """,
                            urlPattern, status, escapeJson(responseBody), delayJson);

            execInContainerUnchecked(
                    "curl",
                    "-X",
                    "POST",
                    "http://localhost:" + WIREMOCK_PORT + "/__admin/mappings",
                    "-H",
                    "Content-Type: application/json",
                    "-d",
                    stubBody);
        }

        /** Internal helper to create DELETE stub. */
        private void stubDelete(String url, int status, String responseBody) {
            execInContainerUnchecked(
                    "curl", "-X", "DELETE", "http://localhost:" + WIREMOCK_PORT + url);
        }

        /** Helper to escape JSON for embedding in JSON strings. */
        private String escapeJson(String json) {
            return json.replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
        }

        /** Execute command in container (wrapper for checked exception). */
        private void execInContainerUnchecked(String... command) {
            try {
                execInContainer(command);
            } catch (Exception e) {
                throw new RuntimeException("Failed to execute command in container", e);
            }
        }
    }

    // ========== Assertion Helpers ==========

    /** Assertion helpers for verifying message status transitions. */
    public static class MessageStatusAssertions {

        /** Verify message transitioned from QUEUED to SENT. */
        public static void assertQueuedToSent(
                OutboundMessageEntity message, String expectedProviderId) {
            if (message.getStatus() != OutboundMessageStatus.SENT) {
                throw new AssertionError(
                        String.format("Expected status SENT but was %s", message.getStatus()));
            }
            if (!expectedProviderId.equals(message.getProviderMessageId())) {
                throw new AssertionError(
                        String.format(
                                "Expected provider ID %s but was %s",
                                expectedProviderId, message.getProviderMessageId()));
            }
            if (message.getAttemptCount() == 0) {
                throw new AssertionError("Expected attemptCount > 0 after successful send");
            }
        }

        /** Verify message remained QUEUED after retryable error. */
        public static void assertQueuedWithRetry(
                OutboundMessageEntity message, String expectedErrorCode) {
            if (message.getStatus() != OutboundMessageStatus.QUEUED) {
                throw new AssertionError(
                        String.format("Expected status QUEUED but was %s", message.getStatus()));
            }
            if (!expectedErrorCode.equals(message.getErrorCode())) {
                throw new AssertionError(
                        String.format(
                                "Expected error code %s but was %s",
                                expectedErrorCode, message.getErrorCode()));
            }
            if (message.getAttemptCount() == 0) {
                throw new AssertionError("Expected attemptCount > 0 after retry");
            }
        }

        /** Verify message transitioned from QUEUED/SENDING to FAILED. */
        public static void assertFailed(OutboundMessageEntity message, String expectedErrorCode) {
            if (message.getStatus() != OutboundMessageStatus.FAILED) {
                throw new AssertionError(
                        String.format("Expected status FAILED but was %s", message.getStatus()));
            }
            if (!expectedErrorCode.equals(message.getErrorCode())) {
                throw new AssertionError(
                        String.format(
                                "Expected error code %s but was %s",
                                expectedErrorCode, message.getErrorCode()));
            }
        }

        /** Verify message transitioned from SENT to DELIVERED. */
        public static void assertSentToDelivered(OutboundMessageEntity message) {
            if (message.getStatus() != OutboundMessageStatus.DELIVERED) {
                throw new AssertionError(
                        String.format("Expected status DELIVERED but was %s", message.getStatus()));
            }
            if (message.getProviderMessageId() == null) {
                throw new AssertionError("Expected provider message ID for delivered message");
            }
        }

        /** Verify message exhausted retries. */
        public static void assertRetriesExhausted(OutboundMessageEntity message) {
            if (message.getAttemptCount() < message.getMaxAttempts()) {
                throw new AssertionError(
                        String.format(
                                "Expected attemptCount >= maxAttempts, but was %d/%d",
                                message.getAttemptCount(), message.getMaxAttempts()));
            }
            if (message.getStatus() != OutboundMessageStatus.FAILED) {
                throw new AssertionError(
                        String.format(
                                "Expected status FAILED after retries exhausted, but was %s",
                                message.getStatus()));
            }
        }

        /** Verify attempt was recorded correctly. */
        public static void assertAttemptRecorded(
                OutboundAttemptEntity attempt,
                OutboundAttemptStatus expectedStatus,
                Integer expectedAttemptNo) {
            if (attempt.getStatus() != expectedStatus) {
                throw new AssertionError(
                        String.format(
                                "Expected attempt status %s but was %s",
                                expectedStatus, attempt.getStatus()));
            }
            if (!expectedAttemptNo.equals(attempt.getAttemptNo())) {
                throw new AssertionError(
                        String.format(
                                "Expected attempt number %d but was %d",
                                expectedAttemptNo, attempt.getAttemptNo()));
            }
        }

        /** Verify session window is active. */
        public static void assertSessionWindowActive(WhatsAppSessionWindow window) {
            if (window == null) {
                throw new AssertionError("Expected session window to exist, but was null");
            }
            if (!window.isWithinWindow()) {
                throw new AssertionError(
                        String.format(
                                "Expected session window to be active, but expires at %s",
                                window.getWindowExpiresAt()));
            }
        }

        /** Verify session window is expired. */
        public static void assertSessionWindowExpired(WhatsAppSessionWindow window) {
            if (window == null) {
                return;
            }
            if (window.isWithinWindow()) {
                throw new AssertionError(
                        String.format(
                                "Expected session window to be expired, but is active until %s",
                                window.getWindowExpiresAt()));
            }
        }

        /** Verify session window is missing (null). */
        public static void assertSessionWindowMissing(WhatsAppSessionWindow window) {
            if (window != null) {
                throw new AssertionError(
                        String.format(
                                "Expected session window to be missing (null), but found window expiring at %s",
                                window.getWindowExpiresAt()));
            }
        }

        /** Verify rate limit backoff is applied correctly. */
        public static void assertRateLimitBackoff(
                LocalDateTime nextRetryAt, LocalDateTime now, int expectedMinSeconds) {
            if (nextRetryAt == null) {
                throw new AssertionError("Expected nextRetryAt to be set for rate limited message");
            }
            long secondsUntilRetry = java.time.Duration.between(now, nextRetryAt).getSeconds();
            if (secondsUntilRetry < expectedMinSeconds) {
                throw new AssertionError(
                        String.format(
                                "Expected backoff >= %d seconds, but was %d seconds",
                                expectedMinSeconds, secondsUntilRetry));
            }
        }
    }
}
