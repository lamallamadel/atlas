package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/system/config")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(
        name = "System Configuration",
        description = "API for managing global system configuration (Super Admin only)")
public class SystemConfigController {

    private static final Logger logger = LoggerFactory.getLogger(SystemConfigController.class);

    private final SystemConfigService systemConfigService;

    public SystemConfigController(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @GetMapping
    @Operation(
            summary = "Get all system configuration parameters",
            description =
                    "Retrieves all system configuration parameters with their values (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Configuration parameters retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SystemConfigResponse
                                                                        .ConfigListResponse
                                                                        .class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<SystemConfigResponse.ConfigListResponse> getAllSystemConfigs() {
        logger.debug("GET /api/v1/system/config - Getting all system configuration parameters");
        SystemConfigResponse.ConfigListResponse response =
                systemConfigService.getAllSystemConfigs();
        logger.info("Retrieved {} system configuration parameters", response.getTotalCount());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{key}")
    @Operation(
            summary = "Update specific system configuration parameter",
            description =
                    "Updates a specific system configuration parameter by key with validation (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Configuration parameter updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SystemConfigResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data or validation failed"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<SystemConfigResponse> updateSystemConfigByKey(
            @Parameter(description = "Configuration parameter key", required = true)
                    @PathVariable
                    @NotBlank
                    String key,
            @Parameter(description = "Configuration update request with new value", required = true)
                    @Valid
                    @RequestBody
                    SystemConfigUpdateRequest request) {
        logger.debug("PUT /api/v1/system/config/{} - Updating configuration parameter", key);

        String userId = extractUserId();
        logger.info("User {} attempting to update system config key: {}", userId, key);

        SystemConfigResponse response =
                systemConfigService.updateSystemConfigByKey(key, request.getValue());

        logger.info(
                "System configuration parameter '{}' updated successfully by user: {}",
                key,
                userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reload")
    @Operation(
            summary = "Reload configuration without restart",
            description =
                    "Reloads system configuration from database without requiring application restart (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Configuration reloaded successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SystemConfigResponse
                                                                        .ConfigReloadResponse
                                                                        .class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<SystemConfigResponse.ConfigReloadResponse> reloadConfiguration() {
        String userId = extractUserId();
        logger.info(
                "POST /api/v1/system/config/reload - User {} requesting configuration reload",
                userId);

        SystemConfigResponse.ConfigReloadResponse response =
                systemConfigService.reloadConfiguration();

        logger.info(
                "System configuration reloaded successfully by user {}: {} parameters",
                userId,
                response.getConfigsReloaded());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    @Operation(
            summary = "Check configuration health",
            description =
                    "Verifies the validity and health of current system configuration (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Configuration health check completed",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SystemConfigResponse
                                                                        .ConfigHealthResponse
                                                                        .class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<SystemConfigResponse.ConfigHealthResponse> checkConfigHealth() {
        String userId = extractUserId();
        logger.debug(
                "GET /api/v1/system/config/health - User {} checking configuration health", userId);

        SystemConfigResponse.ConfigHealthResponse response =
                systemConfigService.checkConfigHealth();

        logger.info(
                "Configuration health check completed by user {}: status={}, valid={}, errors={}",
                userId,
                response.getStatus(),
                response.isValid(),
                response.getErrors().size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/legacy")
    @Operation(
            summary = "Get legacy system configuration",
            description =
                    "Retrieves system configuration in legacy format for backward compatibility (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Configuration retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SystemConfigResponse.class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<SystemConfigResponse> getLegacySystemConfig() {
        logger.debug("GET /api/v1/system/config/legacy - Getting legacy system configuration");
        SystemConfigResponse response = systemConfigService.getSystemConfig();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/legacy")
    @Operation(
            summary = "Update legacy system configuration",
            description =
                    "Updates system configuration in legacy format for backward compatibility (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Configuration updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SystemConfigResponse.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request data"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<SystemConfigResponse> updateLegacySystemConfig(
            @Valid @RequestBody SystemConfigUpdateRequest request) {
        logger.debug("PUT /api/v1/system/config/legacy - Updating legacy system configuration");
        SystemConfigResponse response = systemConfigService.updateSystemConfig(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/network")
    @Operation(
            summary = "Get network settings",
            description = "Retrieves network configuration settings (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Network settings retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                NetworkSettingsDto.class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required")
            })
    public ResponseEntity<NetworkSettingsDto> getNetworkSettings() {
        logger.debug("GET /api/v1/system/config/network - Getting network settings");
        NetworkSettingsDto settings = systemConfigService.getNetworkSettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/network")
    @Operation(
            summary = "Update network settings",
            description = "Updates network configuration settings (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Network settings updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                NetworkSettingsDto.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request data"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required")
            })
    public ResponseEntity<NetworkSettingsDto> updateNetworkSettings(
            @Valid @RequestBody NetworkSettingsDto settings) {
        logger.debug("PUT /api/v1/system/config/network - Updating network settings");
        NetworkSettingsDto updated = systemConfigService.updateNetworkSettings(settings);
        logger.info("Network settings updated successfully");
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/security")
    @Operation(
            summary = "Get security settings",
            description = "Retrieves security configuration settings (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Security settings retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SecuritySettingsDto.class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required")
            })
    public ResponseEntity<SecuritySettingsDto> getSecuritySettings() {
        logger.debug("GET /api/v1/system/config/security - Getting security settings");
        SecuritySettingsDto settings = systemConfigService.getSecuritySettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/security")
    @Operation(
            summary = "Update security settings",
            description =
                    "Updates security configuration settings with encryption for sensitive values (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Security settings updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                SecuritySettingsDto.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request data"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required")
            })
    public ResponseEntity<SecuritySettingsDto> updateSecuritySettings(
            @Valid @RequestBody SecuritySettingsDto settings) {
        logger.debug("PUT /api/v1/system/config/security - Updating security settings");
        SecuritySettingsDto updated = systemConfigService.updateSecuritySettings(settings);
        logger.info("Security settings updated successfully");
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/performance")
    @Operation(
            summary = "Get performance settings",
            description = "Retrieves performance configuration settings (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Performance settings retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                PerformanceSettingsDto.class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required")
            })
    public ResponseEntity<PerformanceSettingsDto> getPerformanceSettings() {
        logger.debug("GET /api/v1/system/config/performance - Getting performance settings");
        PerformanceSettingsDto settings = systemConfigService.getPerformanceSettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/performance")
    @Operation(
            summary = "Update performance settings",
            description = "Updates performance configuration settings (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Performance settings updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                PerformanceSettingsDto.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request data"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required")
            })
    public ResponseEntity<PerformanceSettingsDto> updatePerformanceSettings(
            @Valid @RequestBody PerformanceSettingsDto settings) {
        logger.debug("PUT /api/v1/system/config/performance - Updating performance settings");
        PerformanceSettingsDto updated = systemConfigService.updatePerformanceSettings(settings);
        logger.info("Performance settings updated successfully");
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/reset")
    @Operation(
            summary = "Reset to default configuration",
            description =
                    "Resets all system configuration settings to their default values (Super Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "204",
                        description = "Configuration reset to defaults successfully"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Super Admin role required")
            })
    public ResponseEntity<Void> resetToDefaults() {
        logger.info(
                "POST /api/v1/system/config/reset - Resetting system configuration to defaults");
        systemConfigService.resetToDefaults();
        logger.info("System configuration reset to defaults successfully");
        return ResponseEntity.noContent().build();
    }

    private String extractUserId() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
                String sub = jwt.getSubject();
                if (sub != null) return sub;
            }
            return authentication.getName();
        }
        return "anonymous";
    }
}
