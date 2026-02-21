package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class WhatsAppCloudApiProvider implements OutboundMessageProvider {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppCloudApiProvider.class);
    private static final String WHATSAPP_CHANNEL = "WHATSAPP";

    private final WhatsAppProviderConfigRepository providerConfigRepository;
    private final WhatsAppSessionWindowService sessionWindowService;
    private final WhatsAppRateLimitService rateLimitService;
    private final WhatsAppErrorMapper errorMapper;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${whatsapp.cloud.api.base-url:https://graph.facebook.com/v18.0}")
    private String baseUrl;

    public WhatsAppCloudApiProvider(
            WhatsAppProviderConfigRepository providerConfigRepository,
            WhatsAppSessionWindowService sessionWindowService,
            WhatsAppRateLimitService rateLimitService,
            WhatsAppErrorMapper errorMapper,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.sessionWindowService = sessionWindowService;
        this.rateLimitService = rateLimitService;
        this.errorMapper = errorMapper;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public ProviderSendResult send(OutboundMessageEntity message) {
        try {
            WhatsAppProviderConfig config =
                    providerConfigRepository
                            .findByOrgId(message.getOrgId())
                            .orElseThrow(
                                    () ->
                                            new IllegalStateException(
                                                    "WhatsApp provider config not found for org: "
                                                            + message.getOrgId()));

            if (!config.isEnabled()) {
                return ProviderSendResult.failure(
                        "PROVIDER_DISABLED",
                        "WhatsApp provider is disabled for this organization",
                        false,
                        null);
            }

            if (!rateLimitService.checkAndConsumeQuota(message.getOrgId())) {
                return ProviderSendResult.failure(
                        "QUOTA_EXCEEDED", "WhatsApp quota exceeded or rate limited", true, null);
            }

            boolean withinSessionWindow =
                    sessionWindowService.isWithinSessionWindow(message.getOrgId(), message.getTo());
            boolean hasTemplate =
                    message.getTemplateCode() != null && !message.getTemplateCode().isEmpty();

            if (!withinSessionWindow && !hasTemplate) {
                logger.warn(
                        "Message outside 24h window without template: messageId={}, to={}",
                        message.getId(),
                        message.getTo());
                return ProviderSendResult.failure(
                        "SESSION_EXPIRED",
                        "Cannot send freeform message outside 24-hour session window. Use a template message instead.",
                        false,
                        null);
            }

            String url = String.format("%s/%s/messages", baseUrl, config.getPhoneNumberId());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(config.getApiKeyEncrypted());

            Map<String, Object> payload = buildPayload(message, config, withinSessionWindow);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            logger.info(
                    "Sending WhatsApp message: orgId={}, messageId={}, to={}, template={}, withinWindow={}",
                    message.getOrgId(),
                    message.getId(),
                    message.getTo(),
                    message.getTemplateCode(),
                    withinSessionWindow);

            ResponseEntity<Map> response =
                    restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String providerMessageId = extractProviderMessageId(responseBody);

                sessionWindowService.recordOutboundMessage(message.getOrgId(), message.getTo());

                logger.info(
                        "WhatsApp message sent successfully: messageId={}, providerMessageId={}",
                        message.getId(),
                        providerMessageId);

                return ProviderSendResult.success(providerMessageId, responseBody);
            } else {
                logger.warn("WhatsApp API returned non-2xx status: {}", response.getStatusCode());
                return ProviderSendResult.failure(
                        "HTTP_ERROR", "HTTP " + response.getStatusCode(), true, null);
            }

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            return handleHttpError(e, message);
        } catch (RestClientException e) {
            logger.error(
                    "Error calling WhatsApp Cloud API for messageId={}: {}",
                    message.getId(),
                    e.getMessage(),
                    e);

            String errorCode = extractErrorCodeFromException(e);
            String errorMessage = sanitizeErrorMessage(e.getMessage());
            boolean retryable = errorMapper.isRetryable(errorCode);

            return ProviderSendResult.failure(
                    errorCode != null ? errorCode : "PROVIDER_ERROR",
                    errorMessage,
                    retryable,
                    null);

        } catch (Exception e) {
            logger.error(
                    "Unexpected error sending WhatsApp message: messageId={}", message.getId(), e);
            return ProviderSendResult.failure(
                    "UNEXPECTED_ERROR", sanitizeErrorMessage(e.getMessage()), true, null);
        }
    }

    @Override
    public boolean supports(String channel) {
        return WHATSAPP_CHANNEL.equalsIgnoreCase(channel);
    }

    @Override
    public boolean isRetryableError(String errorCode) {
        return errorMapper.isRetryable(errorCode);
    }

    private Map<String, Object> buildPayload(
            OutboundMessageEntity message,
            WhatsAppProviderConfig config,
            boolean withinSessionWindow) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type", "individual");
        payload.put("to", normalizePhoneNumber(message.getTo()));

        boolean useTemplate =
                message.getTemplateCode() != null && !message.getTemplateCode().isEmpty();

        if (!withinSessionWindow && !useTemplate) {
            logger.warn(
                    "Forcing template usage for message outside session window: messageId={}",
                    message.getId());
            useTemplate = true;
        }

        if (useTemplate) {
            buildTemplatePayload(payload, message);
        } else {
            buildFreeformPayload(payload, message);
        }

        return payload;
    }

    private void buildTemplatePayload(Map<String, Object> payload, OutboundMessageEntity message) {
        Map<String, Object> template = new HashMap<>();
        template.put("name", message.getTemplateCode());

        Map<String, Object> payloadJson = message.getPayloadJson();
        if (payloadJson != null) {
            String language = (String) payloadJson.getOrDefault("language", "en");
            template.put("language", Map.of("code", language));

            Object components = payloadJson.get("components");
            if (components != null) {
                template.put("components", components);
            }
        } else {
            template.put("language", Map.of("code", "en"));
        }

        payload.put("type", "template");
        payload.put("template", template);
    }

    private void buildFreeformPayload(Map<String, Object> payload, OutboundMessageEntity message) {
        Map<String, Object> text = new HashMap<>();

        if (message.getPayloadJson() != null && message.getPayloadJson().containsKey("body")) {
            text.put("body", message.getPayloadJson().get("body"));
        } else {
            text.put("body", message.getSubject() != null ? message.getSubject() : "");
        }

        payload.put("type", "text");
        payload.put("text", text);
    }

    private ProviderSendResult handleHttpError(
            HttpStatusCodeException e, OutboundMessageEntity message) {
        String responseBody = e.getResponseBodyAsString();
        logger.error(
                "WhatsApp API error response for messageId={}: status={}, body={}",
                message.getId(),
                e.getStatusCode(),
                responseBody);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> errorResponse = objectMapper.readValue(responseBody, Map.class);

            String errorCode = extractErrorCodeFromResponse(errorResponse);
            String errorMessage = extractErrorMessageFromResponse(errorResponse);
            Integer retryAfter = extractRetryAfterFromResponse(errorResponse);

            if (errorCode != null) {
                WhatsAppErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(errorCode);

                if (errorInfo.isRateLimitError()) {
                    rateLimitService.handleRateLimitError(message.getOrgId(), retryAfter);
                }

                if ("132016".equals(errorCode) || "132015".equals(errorCode)) {
                    errorMessage = "Out of session window - template message required";
                }

                logger.warn(
                        "WhatsApp error for messageId={}: code={}, message={}, retryable={}",
                        message.getId(),
                        errorCode,
                        errorMessage,
                        errorInfo.isRetryable());

                return ProviderSendResult.failure(
                        errorCode,
                        errorMessage != null ? errorMessage : errorInfo.getMessage(),
                        errorInfo.isRetryable(),
                        null);
            }

            return ProviderSendResult.failure(
                    "HTTP_" + e.getStatusCode().value(),
                    errorMessage != null ? errorMessage : e.getMessage(),
                    e.getStatusCode().is5xxServerError(),
                    null);

        } catch (Exception parseEx) {
            logger.error(
                    "Failed to parse error response for messageId={}", message.getId(), parseEx);
            return ProviderSendResult.failure(
                    "HTTP_" + e.getStatusCode().value(),
                    sanitizeErrorMessage(e.getMessage()),
                    e.getStatusCode().is5xxServerError(),
                    null);
        }
    }

    private String extractProviderMessageId(Map<String, Object> responseBody) {
        try {
            if (responseBody.containsKey("messages")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> messages =
                        (List<Map<String, Object>>) responseBody.get("messages");
                if (!messages.isEmpty()) {
                    return (String) messages.get(0).get("id");
                }
            }
        } catch (Exception e) {
            logger.debug("Could not extract provider message ID from response", e);
        }
        return null;
    }

    private String extractErrorCodeFromResponse(Map<String, Object> errorResponse) {
        try {
            if (errorResponse.containsKey("error")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> error = (Map<String, Object>) errorResponse.get("error");

                if (error.containsKey("error_data")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> errorData = (Map<String, Object>) error.get("error_data");
                    Object details = errorData.get("details");
                    if (details != null) {
                        return String.valueOf(details);
                    }
                }

                if (error.containsKey("code")) {
                    return String.valueOf(error.get("code"));
                }

                if (error.containsKey("error_subcode")) {
                    return String.valueOf(error.get("error_subcode"));
                }
            }
        } catch (Exception e) {
            logger.debug("Could not extract error code from response", e);
        }
        return null;
    }

    private String extractErrorMessageFromResponse(Map<String, Object> errorResponse) {
        try {
            if (errorResponse.containsKey("error")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> error = (Map<String, Object>) errorResponse.get("error");

                if (error.containsKey("message")) {
                    return (String) error.get("message");
                }

                if (error.containsKey("error_user_msg")) {
                    return (String) error.get("error_user_msg");
                }
            }
        } catch (Exception e) {
            logger.debug("Could not extract error message from response", e);
        }
        return null;
    }

    private Integer extractRetryAfterFromResponse(Map<String, Object> errorResponse) {
        try {
            if (errorResponse.containsKey("error")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> error = (Map<String, Object>) errorResponse.get("error");

                if (error.containsKey("error_data")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> errorData = (Map<String, Object>) error.get("error_data");
                    if (errorData.containsKey("retry_after")) {
                        Object retryAfter = errorData.get("retry_after");
                        if (retryAfter instanceof Number) {
                            return ((Number) retryAfter).intValue();
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("Could not extract retry_after from response", e);
        }
        return null;
    }

    private String extractErrorCodeFromException(Exception e) {
        try {
            String message = e.getMessage();
            if (message != null && message.contains("error_code")) {
                int codeStart = message.indexOf("\"error_code\":");
                if (codeStart != -1) {
                    int codeValueStart = message.indexOf(":", codeStart) + 1;
                    int codeValueEnd = message.indexOf(",", codeValueStart);
                    if (codeValueEnd == -1) {
                        codeValueEnd = message.indexOf("}", codeValueStart);
                    }
                    if (codeValueStart > 0 && codeValueEnd > codeValueStart) {
                        return message.substring(codeValueStart, codeValueEnd)
                                .trim()
                                .replaceAll("[^0-9]", "");
                    }
                }
            }
        } catch (Exception ex) {
            logger.debug("Could not extract error code from exception", ex);
        }
        return null;
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }

        String normalized = phoneNumber.replaceAll("[^0-9+]", "");

        if (!normalized.startsWith("+")) {
            normalized = "+" + normalized;
        }

        return normalized;
    }

    private String sanitizeErrorMessage(String message) {
        if (message == null) {
            return "Unknown error";
        }

        if (message.length() > 500) {
            message = message.substring(0, 500) + "...";
        }

        message =
                message.replaceAll(
                        "(?i)(api[_-]?key|secret|token|password|bearer)\\s*[:=]\\s*[^\\s,}]+",
                        "$1=***");

        return message;
    }
}
