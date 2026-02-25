package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.SignatureRequestEntity;
import com.example.backend.service.ContractTemplateService;
import com.example.backend.service.ESignatureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/esignature")
@Tag(name = "E-Signature", description = "Electronic signature management API")
public class ESignatureController {

    private final ESignatureService eSignatureService;
    private final ContractTemplateService contractTemplateService;
    private final SignatureRequestMapper signatureRequestMapper;
    private final ContractTemplateMapper contractTemplateMapper;

    public ESignatureController(
            ESignatureService eSignatureService,
            ContractTemplateService contractTemplateService,
            SignatureRequestMapper signatureRequestMapper,
            ContractTemplateMapper contractTemplateMapper) {
        this.eSignatureService = eSignatureService;
        this.contractTemplateService = contractTemplateService;
        this.signatureRequestMapper = signatureRequestMapper;
        this.contractTemplateMapper = contractTemplateMapper;
    }

    @PostMapping("/signature-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Create a signature request",
            description = "Creates a new signature request for a dossier")
    public ResponseEntity<SignatureRequestResponse> createSignatureRequest(
            @Valid @RequestBody SignatureRequestRequest request,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            SignatureRequestEntity entity =
                    eSignatureService.createSignatureRequest(request, orgId, userId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(signatureRequestMapper.toResponse(entity));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create signature request: " + e.getMessage(), e);
        }
    }

    @PostMapping("/signature-requests/{id}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Send signature request",
            description = "Sends the signature request to DocuSign")
    public ResponseEntity<SignatureRequestResponse> sendSignatureRequest(
            @PathVariable Long id, @RequestHeader("X-Org-Id") String orgId) {
        try {
            SignatureRequestEntity entity = eSignatureService.sendForSignature(id, orgId);
            return ResponseEntity.ok(signatureRequestMapper.toResponse(entity));
        } catch (Exception e) {
            throw new RuntimeException("Failed to send signature request: " + e.getMessage(), e);
        }
    }

    @GetMapping("/signature-requests/dossier/{dossierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get signature requests by dossier",
            description = "Retrieves all signature requests for a dossier")
    public ResponseEntity<List<SignatureRequestResponse>> getSignatureRequestsByDossier(
            @PathVariable Long dossierId, @RequestHeader("X-Org-Id") String orgId) {
        List<SignatureRequestEntity> entities =
                eSignatureService.getSignatureRequestsByDossier(dossierId, orgId);
        List<SignatureRequestResponse> responses =
                entities.stream()
                        .map(signatureRequestMapper::toResponse)
                        .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/signature-requests/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get signature request by ID",
            description = "Retrieves a signature request by its ID")
    public ResponseEntity<SignatureRequestResponse> getSignatureRequest(
            @PathVariable Long id, @RequestHeader("X-Org-Id") String orgId) {
        SignatureRequestEntity entity = eSignatureService.getSignatureRequest(id, orgId);
        return ResponseEntity.ok(signatureRequestMapper.toResponse(entity));
    }

    @PostMapping("/webhook")
    @Operation(
            summary = "DocuSign webhook callback",
            description = "Receives webhook events from DocuSign")
    public ResponseEntity<Map<String, String>> handleDocuSignWebhook(@RequestBody String payload) {
        try {
            Map<String, Object> webhookData =
                    new com.fasterxml.jackson.databind.ObjectMapper().readValue(payload, Map.class);

            String envelopeId = (String) webhookData.get("envelopeId");
            String eventType = (String) webhookData.get("event");
            String orgId = (String) webhookData.getOrDefault("orgId", "default");

            eSignatureService.handleWebhookEvent(envelopeId, eventType, orgId, payload);

            return ResponseEntity.ok(Map.of("status", "processed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/templates", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Upload contract template",
            description = "Uploads a PDF contract template")
    public ResponseEntity<ContractTemplateResponse> uploadTemplate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("templateName") String templateName,
            @RequestParam("templateType") String templateType,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "signatureFields", required = false) String signatureFields,
            @RequestHeader("X-Org-Id") String orgId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            ContractTemplateRequest request = new ContractTemplateRequest();
            request.setTemplateName(templateName);
            request.setTemplateType(templateType);
            request.setDescription(description);
            request.setSignatureFields(signatureFields);

            var entity = contractTemplateService.uploadTemplate(request, file, orgId, userId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(contractTemplateMapper.toResponse(entity));
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload template: " + e.getMessage(), e);
        }
    }

    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get active templates",
            description = "Retrieves all active contract templates")
    public ResponseEntity<List<ContractTemplateResponse>> getActiveTemplates(
            @RequestHeader("X-Org-Id") String orgId) {
        List<ContractTemplateResponse> responses =
                contractTemplateService.getActiveTemplates(orgId).stream()
                        .map(contractTemplateMapper::toResponse)
                        .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get template by ID",
            description = "Retrieves a contract template by its ID")
    public ResponseEntity<ContractTemplateResponse> getTemplate(
            @PathVariable Long id, @RequestHeader("X-Org-Id") String orgId) {
        var entity = contractTemplateService.getTemplate(id, orgId);
        return ResponseEntity.ok(contractTemplateMapper.toResponse(entity));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update template", description = "Updates a contract template")
    public ResponseEntity<ContractTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ContractTemplateRequest request,
            @RequestHeader("X-Org-Id") String orgId) {
        var entity = contractTemplateService.updateTemplate(id, request, orgId);
        return ResponseEntity.ok(contractTemplateMapper.toResponse(entity));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete template", description = "Soft deletes a contract template")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable Long id, @RequestHeader("X-Org-Id") String orgId) {
        contractTemplateService.deleteTemplate(id, orgId);
        return ResponseEntity.noContent().build();
    }
}
