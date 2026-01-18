package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
public class WhatsAppCloudApiProvider implements OutboundMessageProvider {
    
    private static final Logger logger = LoggerFactory.getLogger(WhatsAppCloudApiProvider.class);
    private static final String WHATSAPP_CHANNEL = "WHATSAPP";
    private static final Set<String> NON_RETRYABLE_ERROR_CODES = Set.of(
        "131047", // Invalid parameter
        "131051", // Unsupported message type
        "131052", // Media download error (recipient side)
        "131053", // Media upload error
        "133000", // Invalid phone number
        "133004", // Template not found
        "133005", // Template paused
        "133006", // Template disabled
        "133008", // Template parameter mismatch
        "470", // Message expired
        "131031" // Recipient blocked
    );
    
    private final WhatsAppProviderConfigRepository providerConfigRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${whatsapp.cloud.api.base-url:https://graph.facebook.com/v18.0}")
    private String baseUrl;
    
    public WhatsAppCloudApiProvider(
            WhatsAppProviderConfigRepository providerConfigRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    @Override
    public ProviderSendResult send(OutboundMessageEntity message) {
        try {
            WhatsAppProviderConfig config = providerConfigRepository.findByOrgId(message.getOrgId())
                .orElseThrow(() -> new IllegalStateException("WhatsApp provider config not found for org: " + message.getOrgId()));
            
            if (!config.isEnabled()) {
                return ProviderSendResult.failure("PROVIDER_DISABLED", "WhatsApp provider is disabled for this organization", false, null);
            }
            
            String url = String.format("%s/%s/messages", baseUrl, config.getPhoneNumberId());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(config.getApiKeyEncrypted());
            
            Map<String, Object> payload = buildPayload(message, config);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            logger.info("Sending WhatsApp message: orgId={}, messageId={}, to={}, template={}", 
                message.getOrgId(), message.getId(), message.getTo(), message.getTemplateCode());
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Map<String, Object> messages = (Map<String, Object>) responseBody.get("messages");
                String providerMessageId = null;
                
                if (messages != null && !messages.isEmpty()) {
                    providerMessageId = (String) ((Map<String, Object>) ((java.util.List<?>) messages.get(0)).get(0)).get("id");
                }
                
                logger.info("WhatsApp message sent successfully: messageId={}, providerMessageId={}", 
                    message.getId(), providerMessageId);
                
                return ProviderSendResult.success(providerMessageId, responseBody);
            } else {
                logger.warn("WhatsApp API returned non-2xx status: {}", response.getStatusCode());
                return ProviderSendResult.failure("HTTP_ERROR", "HTTP " + response.getStatusCode(), true, null);
            }
            
        } catch (RestClientException e) {
            logger.error("Error calling WhatsApp Cloud API for messageId={}: {}", message.getId(), e.getMessage(), e);
            
            String errorCode = extractErrorCode(e);
            String errorMessage = sanitizeErrorMessage(e.getMessage());
            boolean retryable = !isRetryableError(errorCode);
            
            return ProviderSendResult.failure(errorCode != null ? errorCode : "PROVIDER_ERROR", errorMessage, retryable, null);
            
        } catch (Exception e) {
            logger.error("Unexpected error sending WhatsApp message: messageId={}", message.getId(), e);
            return ProviderSendResult.failure("UNEXPECTED_ERROR", sanitizeErrorMessage(e.getMessage()), true, null);
        }
    }
    
    @Override
    public boolean supports(String channel) {
        return WHATSAPP_CHANNEL.equalsIgnoreCase(channel);
    }
    
    @Override
    public boolean isRetryableError(String errorCode) {
        if (errorCode == null) {
            return true;
        }
        return !NON_RETRYABLE_ERROR_CODES.contains(errorCode);
    }
    
    private Map<String, Object> buildPayload(OutboundMessageEntity message, WhatsAppProviderConfig config) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type", "individual");
        payload.put("to", normalizePhoneNumber(message.getTo()));
        
        if (message.getTemplateCode() != null && !message.getTemplateCode().isEmpty()) {
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
        } else {
            Map<String, Object> text = new HashMap<>();
            
            if (message.getPayloadJson() != null && message.getPayloadJson().containsKey("body")) {
                text.put("body", message.getPayloadJson().get("body"));
            } else {
                text.put("body", message.getSubject() != null ? message.getSubject() : "");
            }
            
            payload.put("type", "text");
            payload.put("text", text);
        }
        
        return payload;
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
    
    private String extractErrorCode(Exception e) {
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
                        return message.substring(codeValueStart, codeValueEnd).trim().replaceAll("[^0-9]", "");
                    }
                }
            }
        } catch (Exception ex) {
            logger.debug("Could not extract error code from exception", ex);
        }
        return null;
    }
    
    private String sanitizeErrorMessage(String message) {
        if (message == null) {
            return "Unknown error";
        }
        
        if (message.length() > 500) {
            message = message.substring(0, 500) + "...";
        }
        
        message = message.replaceAll("(?i)(api[_-]?key|secret|token|password)\\s*[:=]\\s*[^\\s,}]+", "$1=***");
        
        return message;
    }
}
