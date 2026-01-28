package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.SystemConfigService;
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
@RequestMapping("/api/v1/admin/system-config")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "System Configuration", description = "API for managing global system configuration (Super Admin only)")
public class SystemConfigController {

    private static final Logger logger = LoggerFactory.getLogger(SystemConfigController.class);

    private final SystemConfigService systemConfigService;

    public SystemConfigController(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @GetMapping
    @Operation(summary = "Get system configuration", 
               description = "Retrieves all system configuration settings (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Configuration retrieved successfully",
                    content = @Content(schema = @Schema(implementation = SystemConfigResponse.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required"),
            @ApiResponse(responseCode = "401", description = "User is not authenticated")
    })
    public ResponseEntity<SystemConfigResponse> getSystemConfig() {
        logger.debug("Getting system configuration");
        SystemConfigResponse response = systemConfigService.getSystemConfig();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Update system configuration", 
               description = "Updates system configuration settings (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Configuration updated successfully",
                    content = @Content(schema = @Schema(implementation = SystemConfigResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required"),
            @ApiResponse(responseCode = "401", description = "User is not authenticated")
    })
    public ResponseEntity<SystemConfigResponse> updateSystemConfig(
            @Valid @RequestBody SystemConfigUpdateRequest request) {
        logger.debug("Updating system configuration");
        SystemConfigResponse response = systemConfigService.updateSystemConfig(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/network")
    @Operation(summary = "Get network settings", 
               description = "Retrieves network configuration settings (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Network settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = NetworkSettingsDto.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required")
    })
    public ResponseEntity<NetworkSettingsDto> getNetworkSettings() {
        logger.debug("Getting network settings");
        NetworkSettingsDto settings = systemConfigService.getNetworkSettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/network")
    @Operation(summary = "Update network settings", 
               description = "Updates network configuration settings (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Network settings updated successfully",
                    content = @Content(schema = @Schema(implementation = NetworkSettingsDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required")
    })
    public ResponseEntity<NetworkSettingsDto> updateNetworkSettings(
            @Valid @RequestBody NetworkSettingsDto settings) {
        logger.debug("Updating network settings");
        NetworkSettingsDto updated = systemConfigService.updateNetworkSettings(settings);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/security")
    @Operation(summary = "Get security settings", 
               description = "Retrieves security configuration settings (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Security settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = SecuritySettingsDto.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required")
    })
    public ResponseEntity<SecuritySettingsDto> getSecuritySettings() {
        logger.debug("Getting security settings");
        SecuritySettingsDto settings = systemConfigService.getSecuritySettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/security")
    @Operation(summary = "Update security settings", 
               description = "Updates security configuration settings with encryption for sensitive values (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Security settings updated successfully",
                    content = @Content(schema = @Schema(implementation = SecuritySettingsDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required")
    })
    public ResponseEntity<SecuritySettingsDto> updateSecuritySettings(
            @Valid @RequestBody SecuritySettingsDto settings) {
        logger.debug("Updating security settings");
        SecuritySettingsDto updated = systemConfigService.updateSecuritySettings(settings);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/performance")
    @Operation(summary = "Get performance settings", 
               description = "Retrieves performance configuration settings (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Performance settings retrieved successfully",
                    content = @Content(schema = @Schema(implementation = PerformanceSettingsDto.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required")
    })
    public ResponseEntity<PerformanceSettingsDto> getPerformanceSettings() {
        logger.debug("Getting performance settings");
        PerformanceSettingsDto settings = systemConfigService.getPerformanceSettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/performance")
    @Operation(summary = "Update performance settings", 
               description = "Updates performance configuration settings (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Performance settings updated successfully",
                    content = @Content(schema = @Schema(implementation = PerformanceSettingsDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required")
    })
    public ResponseEntity<PerformanceSettingsDto> updatePerformanceSettings(
            @Valid @RequestBody PerformanceSettingsDto settings) {
        logger.debug("Updating performance settings");
        PerformanceSettingsDto updated = systemConfigService.updatePerformanceSettings(settings);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset to default configuration", 
               description = "Resets all system configuration settings to their default values (Super Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Configuration reset to defaults successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied - Super Admin role required")
    })
    public ResponseEntity<Void> resetToDefaults() {
        logger.info("Resetting system configuration to defaults");
        systemConfigService.resetToDefaults();
        return ResponseEntity.noContent().build();
    }
}
