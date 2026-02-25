package com.example.backend.controller;

import com.example.backend.dto.DossierResponse;
import com.example.backend.service.DossierService;
import com.example.backend.service.WebhookService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/v1")
@Tag(name = "Public API v1", description = "Public API endpoints for third-party integrations")
@SecurityRequirement(name = "apiKey")
public class PublicApiV1Controller {

    private final DossierService dossierService;
    private final WebhookService webhookService;

    public PublicApiV1Controller(DossierService dossierService, WebhookService webhookService) {
        this.dossierService = dossierService;
        this.webhookService = webhookService;
    }

    @GetMapping("/dossiers")
    @Operation(summary = "List dossiers", description = "Retrieve a paginated list of dossiers")
    public ResponseEntity<Page<DossierResponse>> listDossiers(
            @RequestAttribute("orgId") String orgId, Pageable pageable) {
        // Set orgId in tenant context for service layer
        TenantContext.setOrgId(orgId);
        try {
            Page<DossierResponse> dossiers = dossierService.list(null, null, null, pageable);
            return ResponseEntity.ok(dossiers);
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/dossiers/{id}")
    @Operation(summary = "Get dossier", description = "Retrieve a specific dossier by ID")
    public ResponseEntity<DossierResponse> getDossier(
            @RequestAttribute("orgId") String orgId, @PathVariable Long id) {
        // Set orgId in tenant context for service layer
        TenantContext.setOrgId(orgId);
        try {
            DossierResponse dossier = dossierService.getById(id);
            return ResponseEntity.ok(dossier);
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping("/webhooks/test")
    @Operation(summary = "Test webhook", description = "Send a test webhook event")
    public ResponseEntity<Map<String, String>> testWebhook(
            @RequestAttribute("orgId") String orgId, @RequestBody Map<String, Object> payload) {
        webhookService.triggerWebhook("test.event", payload);
        return ResponseEntity.ok(Map.of("message", "Test webhook triggered"));
    }
}
