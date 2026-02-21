package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.OrganizationSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/organization-settings")
@Tag(name = "Organization Settings", description = "API for managing organization-level tenant configuration")
public class OrganizationSettingsController {

    private final OrganizationSettingsService organizationSettingsService;

    public OrganizationSettingsController(OrganizationSettingsService organizationSettingsService) {
        this.organizationSettingsService = organizationSettingsService;
    }

    @GetMapping
    @Operation(summary = "Get current organization settings", description = "Retrieves settings for the current organization from tenant context")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found")
    })
    public ResponseEntity<OrganizationSettingsResponse> getCurrentSettings() {
        OrganizationSettingsResponse response = organizationSettingsService.getCurrentOrganizationSettings();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orgId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get organization settings by org ID", description = "Retrieves settings for a specific organization (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<OrganizationSettingsResponse> getSettings(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId) {
        OrganizationSettingsResponse response = organizationSettingsService.getSettings(orgId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orgId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create organization settings", description = "Creates settings for a new organization (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Settings created successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data or settings already exist"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<OrganizationSettingsResponse> createSettings(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId,
            @Valid @RequestBody OrganizationSettingsUpdateRequest request) {
        OrganizationSettingsResponse response = organizationSettingsService.createSettings(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{orgId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update organization settings", description = "Updates settings for an organization (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Settings updated successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "404", description = "Organization settings not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<OrganizationSettingsResponse> updateSettings(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId,
            @Valid @RequestBody OrganizationSettingsUpdateRequest request) {
        OrganizationSettingsResponse response = organizationSettingsService.updateSettings(orgId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{orgId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete organization settings", description = "Deletes settings for an organization (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Settings deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Organization settings not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<Void> deleteSettings(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId) {
        organizationSettingsService.deleteSettings(orgId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{orgId}/branding")
    @Operation(summary = "Get branding settings", description = "Retrieves branding settings for an organization")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Branding settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = BrandingSettingsDto.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found")
    })
    public ResponseEntity<BrandingSettingsDto> getBranding(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId) {
        BrandingSettingsDto branding = organizationSettingsService.getBranding(orgId);
        return ResponseEntity.ok(branding);
    }

    @PutMapping("/{orgId}/branding")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update branding settings", description = "Updates branding settings for an organization (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Branding settings updated successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<OrganizationSettingsResponse> updateBranding(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId,
            @Valid @RequestBody BrandingSettingsDto branding) {
        OrganizationSettingsResponse response = organizationSettingsService.updateBranding(orgId, branding);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orgId}/integrations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get integration settings", description = "Retrieves integration settings with decrypted credentials (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Integration settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = IntegrationSettingsDto.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<IntegrationSettingsDto> getIntegrations(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId) {
        IntegrationSettingsDto integrations = organizationSettingsService.getIntegrations(orgId);
        return ResponseEntity.ok(integrations);
    }

    @PutMapping("/{orgId}/integrations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update integration settings", description = "Updates integration settings and encrypts credentials (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Integration settings updated successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<OrganizationSettingsResponse> updateIntegrations(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId,
            @Valid @RequestBody IntegrationSettingsDto integrations) {
        OrganizationSettingsResponse response = organizationSettingsService.updateIntegrations(orgId, integrations);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orgId}/workflow")
    @Operation(summary = "Get workflow settings", description = "Retrieves workflow settings for an organization")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workflow settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = WorkflowSettingsDto.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found")
    })
    public ResponseEntity<WorkflowSettingsDto> getWorkflow(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId) {
        WorkflowSettingsDto workflow = organizationSettingsService.getWorkflow(orgId);
        return ResponseEntity.ok(workflow);
    }

    @PutMapping("/{orgId}/workflow")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update workflow settings", description = "Updates workflow settings for an organization (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workflow settings updated successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<OrganizationSettingsResponse> updateWorkflow(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId,
            @Valid @RequestBody WorkflowSettingsDto workflow) {
        OrganizationSettingsResponse response = organizationSettingsService.updateWorkflow(orgId, workflow);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orgId}/quotas")
    @Operation(summary = "Get quota settings", description = "Retrieves quota settings for an organization")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Quota settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = QuotaSettingsDto.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found")
    })
    public ResponseEntity<QuotaSettingsDto> getQuotas(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId) {
        QuotaSettingsDto quotas = organizationSettingsService.getQuotas(orgId);
        return ResponseEntity.ok(quotas);
    }

    @PutMapping("/{orgId}/quotas")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update quota settings", description = "Updates quota settings for an organization (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Quota settings updated successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<OrganizationSettingsResponse> updateQuotas(
            @Parameter(description = "Organization ID", required = true)
            @PathVariable String orgId,
            @Valid @RequestBody QuotaSettingsDto quotas) {
        OrganizationSettingsResponse response = organizationSettingsService.updateQuotas(orgId, quotas);
        return ResponseEntity.ok(response);
    }
}
