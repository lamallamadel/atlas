package com.example.backend.controller;

import com.example.backend.aspect.Auditable;
import com.example.backend.dto.*;
import com.example.backend.entity.WhatsAppTemplate;
import com.example.backend.entity.enums.TemplateStatus;
import com.example.backend.service.WhatsAppTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/whatsapp/templates")
@Tag(name = "WhatsApp Templates", description = "WhatsApp template management for admins")
public class WhatsAppTemplateController {

    private final WhatsAppTemplateService templateService;

    public WhatsAppTemplateController(WhatsAppTemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all templates", description = "Returns all WhatsApp templates for the organization")
    public ResponseEntity<List<WhatsAppTemplateResponse>> getAllTemplates(
            @Parameter(description = "Filter by status")
            @RequestParam(required = false) TemplateStatus status) {
        
        List<WhatsAppTemplate> templates = status != null
                ? templateService.getTemplatesByStatus(status)
                : templateService.getAllTemplates();
        
        List<WhatsAppTemplateResponse> responses = WhatsAppTemplateMapper.toResponseList(templates);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/active")
    @Operation(summary = "Get active templates", description = "Returns all active WhatsApp templates")
    public ResponseEntity<List<WhatsAppTemplateResponse>> getActiveTemplates() {
        List<WhatsAppTemplate> templates = templateService.getActiveTemplates();
        List<WhatsAppTemplateResponse> responses = WhatsAppTemplateMapper.toResponseList(templates);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get template by ID", description = "Returns a single WhatsApp template by its ID")
    public ResponseEntity<WhatsAppTemplateResponse> getTemplateById(
            @Parameter(description = "Template ID") @PathVariable Long id) {
        
        WhatsAppTemplate template = templateService.getTemplateById(id);
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(template));
    }

    @GetMapping("/by-name")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get template by name and language", description = "Returns a template by its name and language code")
    public ResponseEntity<WhatsAppTemplateResponse> getTemplateByNameAndLanguage(
            @Parameter(description = "Template name") @RequestParam String name,
            @Parameter(description = "Language code") @RequestParam String language) {
        
        WhatsAppTemplate template = templateService.getTemplateByNameAndLanguage(name, language);
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(template));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "CREATE", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Create template", description = "Creates a new WhatsApp template")
    public ResponseEntity<WhatsAppTemplateResponse> createTemplate(
            @Parameter(description = "Template data") @Valid @RequestBody WhatsAppTemplateRequest request) {
        
        WhatsAppTemplate template = WhatsAppTemplateMapper.toEntity(request);
        WhatsAppTemplate created = templateService.createTemplate(template);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(WhatsAppTemplateMapper.toResponse(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "UPDATE", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Update template", description = "Updates an existing WhatsApp template")
    public ResponseEntity<WhatsAppTemplateResponse> updateTemplate(
            @Parameter(description = "Template ID") @PathVariable Long id,
            @Parameter(description = "Updated template data") @Valid @RequestBody WhatsAppTemplateRequest request) {
        
        WhatsAppTemplate template = WhatsAppTemplateMapper.toEntity(request);
        WhatsAppTemplate updated = templateService.updateTemplate(id, template);
        
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(updated));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "ACTIVATE", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Activate template", description = "Activates a WhatsApp template")
    public ResponseEntity<WhatsAppTemplateResponse> activateTemplate(
            @Parameter(description = "Template ID") @PathVariable Long id) {
        
        WhatsAppTemplate template = templateService.activateTemplate(id);
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(template));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "DEACTIVATE", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Deactivate template", description = "Deactivates a WhatsApp template")
    public ResponseEntity<WhatsAppTemplateResponse> deactivateTemplate(
            @Parameter(description = "Template ID") @PathVariable Long id) {
        
        WhatsAppTemplate template = templateService.deactivateTemplate(id);
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(template));
    }

    @PostMapping("/{id}/submit-for-approval")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "SUBMIT_FOR_APPROVAL", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Submit template for approval", description = "Submits a template for WhatsApp Business API approval")
    public ResponseEntity<WhatsAppTemplateResponse> submitForApproval(
            @Parameter(description = "Template ID") @PathVariable Long id) {
        
        WhatsAppTemplate template = templateService.submitForApproval(id);
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(template));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "APPROVE", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Approve template", description = "Approves a template after WhatsApp Business API approval")
    public ResponseEntity<WhatsAppTemplateResponse> approveTemplate(
            @Parameter(description = "Template ID") @PathVariable Long id,
            @Parameter(description = "Approval data") @Valid @RequestBody TemplateApprovalRequest request) {
        
        WhatsAppTemplate template = templateService.approveTemplate(id, request.getWhatsAppTemplateId());
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(template));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "REJECT", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Reject template", description = "Rejects a template with a reason")
    public ResponseEntity<WhatsAppTemplateResponse> rejectTemplate(
            @Parameter(description = "Template ID") @PathVariable Long id,
            @Parameter(description = "Rejection data") @Valid @RequestBody TemplateRejectionRequest request) {
        
        WhatsAppTemplate template = templateService.rejectTemplate(id, request.getRejectionReason());
        return ResponseEntity.ok(WhatsAppTemplateMapper.toResponse(template));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Auditable(action = "DELETE", entityType = "WHATSAPP_TEMPLATE")
    @Operation(summary = "Delete template", description = "Deletes a WhatsApp template (cannot delete active templates)")
    public ResponseEntity<Void> deleteTemplate(
            @Parameter(description = "Template ID") @PathVariable Long id) {
        
        templateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/variables")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get template variables", description = "Returns all variables for a template")
    public ResponseEntity<List<TemplateVariableResponse>> getTemplateVariables(
            @Parameter(description = "Template ID") @PathVariable Long id) {
        
        List<TemplateVariableResponse> variables = templateService.getTemplateVariables(id).stream()
                .map(WhatsAppTemplateMapper::toVariableResponse)
                .toList();
        
        return ResponseEntity.ok(variables);
    }
}
