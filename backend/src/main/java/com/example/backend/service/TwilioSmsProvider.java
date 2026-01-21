package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.SmsProviderConfig;
import com.example.backend.repository.SmsProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TwilioSmsProvider implements OutboundMessageProvider {
    
    private static final Logger logger = LoggerFactory.getLogger(TwilioSmsProvider.class);
    private static final String SMS_CHANNEL = "SMS";
    private static final int MAX_SMS_LENGTH = 1600;
    
    private final SmsProviderConfigRepository providerConfigRepository;
    private final SmsRateLimitService rateLimitService;
    private final SmsErrorMapper errorMapper;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${twilio.api.base-url:https://api.twilio.com/2010-04-01}")
    private String baseUrl;
    
    public TwilioSmsProvider(
            SmsProviderConfigRepository providerConfigRepository,
            SmsRateLimitService rateLimitService,
            SmsErrorMapper errorMapper,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.rateLimitService = rateLimitService;
        this.errorMapper = errorMapper;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    @Override
    public ProviderSendResult send(OutboundMessageEntity message) {
        try {
            SmsProviderConfig config = providerConfigRepository.findByOrgId(message.getOrgId())
                .orElseThrow(() -> new IllegalStateException("SMS provider config not found for org: " + message.getOrgId()));
            
            if (!config.isEnabled()) {
                return ProviderSendResult.failure("PROVIDER_DISABLED", "SMS provider is disabled for this organization", false, null);
            }
            
            if (!"TWILIO".equalsIgnoreCase(config.getProviderType())) {
                return ProviderSendResult.failure("INVALID_PROVIDER", "Provider type is not TWILIO", false, null);
            }
            
            if (!rateLimitService.checkAndConsumeQuota(message.getOrgId())) {
                return ProviderSendResult.failure("QUOTA_EXCEEDED", "SMS quota exceeded or rate limited", true, null);
            }
            
            validateSmsMessage(message);
            
            String url = String.format("%s/Accounts/%s/Messages.json", baseUrl, config.getTwilioAccountSid());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(config.getTwilioAccountSid(), config.getTwilioAuthTokenEncrypted());
            headers.set("X-Idempotency-Key", message.getIdempotencyKey());
            
            MultiValueMap<String, String> payload = buildPayload(message, config);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(payload, headers);
            
            logger.info("Sending SMS via Twilio: orgId={}, messageId={}, to={}", 
                message.getOrgId(), message.getId(), message.getTo());
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String providerMessageId = (String) responseBody.get("sid");
                
                logger.info("SMS sent via Twilio successfully: messageId={}, providerMessageId={}", 
                    message.getId(), providerMessageId);
                
                return ProviderSendResult.success(providerMessageId, responseBody);
            } else {
                logger.warn("Twilio API returned non-2xx status: {}", response.getStatusCode());
                return ProviderSendResult.failure("HTTP_ERROR", "HTTP " + response.getStatusCode(), true, null);
            }
            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            return handleHttpError(e, message);
        } catch (RestClientException e) {
            logger.error("Error calling Twilio API for messageId={}: {}", message.getId(), e.getMessage(), e);
            
            String errorCode = extractErrorCodeFromException(e);
            String errorMessage = sanitizeErrorMessage(e.getMessage());
            boolean retryable = errorMapper.isRetryable(errorCode);
            
            return ProviderSendResult.failure(errorCode != null ? errorCode : "PROVIDER_ERROR", errorMessage, retryable, null);
            
        } catch (Exception e) {
            logger.error("Unexpected error sending SMS: messageId={}", message.getId(), e);
            return ProviderSendResult.failure("UNEXPECTED_ERROR", sanitizeErrorMessage(e.getMessage()), true, null);
        }
    }
    
    @Override
    public boolean supports(String channel) {
        return SMS_CHANNEL.equalsIgnoreCase(channel);
    }
    
    @Override
    public boolean isRetryableError(String errorCode) {
        return errorMapper.isRetryable(errorCode);
    }
    
    private MultiValueMap<String, String> buildPayload(OutboundMessageEntity message, SmsProviderConfig config) {
        MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
        
        payload.add("To", normalizePhoneNumber(message.getTo()));
        payload.add("From", config.getTwilioFromNumber());
        
        String messageBody = extractMessageBody(message);
        payload.add("Body", messageBody);
        
        Map<String, Object> payloadJson = message.getPayloadJson();
        if (payloadJson != null) {
            if (payloadJson.containsKey("statusCallback")) {
                payload.add("StatusCallback", (String) payloadJson.get("statusCallback"));
            }
            
            if (payloadJson.containsKey("validityPeriod")) {
                payload.add("ValidityPeriod", String.valueOf(payloadJson.get("validityPeriod")));
            }
        }
        
        return payload;
    }
    
    private void validateSmsMessage(OutboundMessageEntity message) {
        if (message.getTo() == null || message.getTo().isEmpty()) {
            throw new IllegalArgumentException("Recipient phone number is required");
        }
        
        String messageBody = extractMessageBody(message);
        if (messageBody == null || messageBody.isEmpty()) {
            throw new IllegalArgumentException("Message body is required");
        }
        
        if (messageBody.length() > MAX_SMS_LENGTH) {
            throw new IllegalArgumentException("Message exceeds maximum length of " + MAX_SMS_LENGTH + " characters");
        }
    }
    
    private String extractMessageBody(OutboundMessageEntity message) {
        if (message.getPayloadJson() != null && message.getPayloadJson().containsKey("body")) {
            return (String) message.getPayloadJson().get("body");
        }
        return message.getSubject();
    }
    
    private ProviderSendResult handleHttpError(HttpStatusCodeException e, OutboundMessageEntity message) {
        String responseBody = e.getResponseBodyAsString();
        logger.error("Twilio API error response for messageId={}: status={}, body={}", 
            message.getId(), e.getStatusCode(), responseBody);
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> errorResponse = objectMapper.readValue(responseBody, Map.class);
            
            Integer errorCode = (Integer) errorResponse.get("code");
            String errorMessage = (String) errorResponse.get("message");
            
            String errorCodeStr = errorCode != null ? "TWILIO_" + errorCode : null;
            
            if (errorCodeStr != null) {
                SmsErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(errorCodeStr);
                
                if (errorInfo.isRateLimitError()) {
                    rateLimitService.handleRateLimitError(message.getOrgId(), null);
                }
                
                logger.warn("Twilio error for messageId={}: code={}, message={}, retryable={}", 
                    message.getId(), errorCodeStr, errorMessage, errorInfo.isRetryable());
                
                return ProviderSendResult.failure(
                    errorCodeStr, 
                    errorMessage != null ? errorMessage : errorInfo.getMessage(), 
                    errorInfo.isRetryable(), 
                    null
                );
            }
            
            return ProviderSendResult.failure(
                "HTTP_" + e.getStatusCode().value(), 
                errorMessage != null ? errorMessage : e.getMessage(), 
                e.getStatusCode().is5xxServerError(), 
                null
            );
            
        } catch (Exception parseEx) {
            logger.error("Failed to parse Twilio error response for messageId={}", message.getId(), parseEx);
            return ProviderSendResult.failure(
                "HTTP_" + e.getStatusCode().value(), 
                sanitizeErrorMessage(e.getMessage()), 
                e.getStatusCode().is5xxServerError(), 
                null
            );
        }
    }
    
    private String extractErrorCodeFromException(Exception e) {
        try {
            String message = e.getMessage();
            if (message != null && message.contains("\"code\"")) {
                int codeStart = message.indexOf("\"code\":");
                if (codeStart != -1) {
                    int codeValueStart = message.indexOf(":", codeStart) + 1;
                    int codeValueEnd = message.indexOf(",", codeValueStart);
                    if (codeValueEnd == -1) {
                        codeValueEnd = message.indexOf("}", codeValueStart);
                    }
                    if (codeValueStart > 0 && codeValueEnd > codeValueStart) {
                        String code = message.substring(codeValueStart, codeValueEnd).trim().replaceAll("[^0-9]", "");
                        return "TWILIO_" + code;
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
        
        message = message.replaceAll("(?i)(token|secret|password|auth)\\s*[:=]\\s*[^\\s,}]+", "$1=***");
        
        return message;
    }
}
