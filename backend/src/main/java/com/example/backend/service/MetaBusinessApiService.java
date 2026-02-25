package com.example.backend.service;

import com.example.backend.entity.WhatsAppTemplate;
import com.example.backend.entity.enums.TemplateStatus;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MetaBusinessApiService {

    private static final Logger logger = LoggerFactory.getLogger(MetaBusinessApiService.class);

    @Value("${whatsapp.business.api.url:https://graph.facebook.com/v18.0}")
    private String apiUrl;

    @Value("${whatsapp.business.api.access-token:}")
    private String accessToken;

    @Value("${whatsapp.business.api.waba-id:}")
    private String wabaId;

    private final RestTemplate restTemplate;

    public MetaBusinessApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String submitTemplateForApproval(WhatsAppTemplate template) {
        return submitTemplate(
                template.getName(),
                template.getLanguage(),
                template.getCategory().getValue(),
                template.getComponents());
    }

    public String submitTemplate(
            String name, String language, String category, List<Map<String, Object>> components) {
        if (accessToken.isEmpty() || wabaId.isEmpty()) {
            logger.warn(
                    "Meta Business API credentials not configured. Skipping actual submission.");
            return "MOCK_SUBMISSION_" + System.currentTimeMillis();
        }

        try {
            String url = String.format("%s/%s/message_templates", apiUrl, wabaId);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("name", name);
            requestBody.put("language", language);
            requestBody.put("category", category);
            requestBody.put("components", components);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response =
                    restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String submissionId = (String) response.getBody().get("id");
                logger.info("Template submitted to Meta Business API with ID: {}", submissionId);
                return submissionId;
            } else {
                throw new RuntimeException("Failed to submit template to Meta Business API");
            }
        } catch (Exception e) {
            logger.error("Error submitting template to Meta Business API", e);
            throw new RuntimeException(
                    "Failed to submit template to Meta Business API: " + e.getMessage(), e);
        }
    }

    public TemplateApprovalStatus pollApprovalStatus(String submissionId) {
        if (accessToken.isEmpty() || wabaId.isEmpty()) {
            logger.warn("Meta Business API credentials not configured. Returning mock status.");
            return new TemplateApprovalStatus(TemplateStatus.APPROVED, null, submissionId);
        }

        try {
            String url = String.format("%s/%s", apiUrl, submissionId);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response =
                    restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String status = (String) body.get("status");
                String whatsappTemplateId = (String) body.get("id");

                TemplateStatus templateStatus = mapMetaStatusToTemplateStatus(status);
                String rejectionReason =
                        templateStatus == TemplateStatus.REJECTED
                                ? (String) body.get("rejected_reason")
                                : null;

                return new TemplateApprovalStatus(
                        templateStatus, rejectionReason, whatsappTemplateId);
            } else {
                throw new RuntimeException("Failed to poll approval status from Meta Business API");
            }
        } catch (Exception e) {
            logger.error("Error polling approval status from Meta Business API", e);
            throw new RuntimeException("Failed to poll approval status: " + e.getMessage(), e);
        }
    }

    private TemplateStatus mapMetaStatusToTemplateStatus(String metaStatus) {
        return switch (metaStatus.toUpperCase()) {
            case "APPROVED" -> TemplateStatus.APPROVED;
            case "PENDING" -> TemplateStatus.PENDING;
            case "REJECTED" -> TemplateStatus.REJECTED;
            case "PAUSED" -> TemplateStatus.PAUSED;
            default -> TemplateStatus.PENDING;
        };
    }

    public static class TemplateApprovalStatus {
        private final TemplateStatus status;
        private final String rejectionReason;
        private final String whatsappTemplateId;

        public TemplateApprovalStatus(
                TemplateStatus status, String rejectionReason, String whatsappTemplateId) {
            this.status = status;
            this.rejectionReason = rejectionReason;
            this.whatsappTemplateId = whatsappTemplateId;
        }

        public TemplateStatus getStatus() {
            return status;
        }

        public String getRejectionReason() {
            return rejectionReason;
        }

        public String getWhatsappTemplateId() {
            return whatsappTemplateId;
        }
    }
}
