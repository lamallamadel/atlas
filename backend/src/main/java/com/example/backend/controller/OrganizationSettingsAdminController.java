package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.exception.UnauthorizedAccessException;
import com.example.backend.service.OrganizationSettingsService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/organization/settings")
@Tag(name = "Organization Settings Admin", description = "Admin API for managing organization settings")
public class OrganizationSettingsAdminController {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationSettingsAdminController.class);

    private final OrganizationSettingsService organizationSettingsService;

    public OrganizationSettingsAdminController(OrganizationSettingsService organizationSettingsService) {
        this.organizationSettingsService = organizationSettingsService;
    }

    @GetMapping
    @Operation(summary = "Get current organization settings", 
               description = "Retrieves settings for the current organization from tenant context")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found"),
            @ApiResponse(responseCode = "400", description = "Tenant context not available")
    })
    public ResponseEntity<OrganizationSettingsResponse> getCurrentSettings() {
        String orgId = TenantContext.getOrgId();
        
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in tenant context");
        }

        logger.debug("Getting settings for current organization: {}", orgId);
        OrganizationSettingsResponse response = organizationSettingsService.getSettings(orgId);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update current organization settings", 
               description = "Updates settings for the current organization (Admin only). Validates that orgId matches tenant context.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Settings updated successfully",
                    content = @Content(schema = @Schema(implementation = OrganizationSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data or tenant context mismatch"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required"),
            @ApiResponse(responseCode = "404", description = "Organization settings not found")
    })
    public ResponseEntity<OrganizationSettingsResponse> updateCurrentSettings(
            @Valid @RequestBody OrganizationSettingsUpdateRequest request) {
        
        String orgId = TenantContext.getOrgId();
        
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in tenant context");
        }

        logger.debug("Updating settings for current organization: {}", orgId);
        OrganizationSettingsResponse response = organizationSettingsService.updateSettings(orgId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/branding")
    @Operation(summary = "Get public branding settings", 
               description = "Retrieves branding settings for the current organization for theming purposes. Publicly accessible.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Branding settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = BrandingSettingsDto.class))),
            @ApiResponse(responseCode = "404", description = "Organization settings not found"),
            @ApiResponse(responseCode = "400", description = "Tenant context not available")
    })
    public ResponseEntity<BrandingSettingsDto> getBrandingSettings() {
        String orgId = TenantContext.getOrgId();
        
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in tenant context");
        }

        logger.debug("Getting branding settings for organization: {}", orgId);
        BrandingSettingsDto branding = organizationSettingsService.getBranding(orgId);
        return ResponseEntity.ok(branding);
    }

    @PostMapping("/integrations/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Test integration provider connection", 
               description = "Tests connection to an integration provider before saving configuration (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Connection test completed",
                    content = @Content(schema = @Schema(implementation = IntegrationTestResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<IntegrationTestResponse> testIntegrationConnection(
            @Valid @RequestBody IntegrationTestRequest request) {
        
        String orgId = TenantContext.getOrgId();
        
        if (orgId == null || orgId.isBlank()) {
            logger.warn("Integration test attempted without valid tenant context");
            throw new IllegalStateException("Organization ID not found in tenant context");
        }

        logger.info("Testing integration connection for organization: {}, provider: {}", 
                    orgId, request.getProviderType());
        
        IntegrationTestResponse response = organizationSettingsService.testIntegrationConnection(request);
        return ResponseEntity.ok(response);
    }
}
