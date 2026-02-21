package com.example.backend.controller;

import com.example.backend.dto.UserPreferencesDTO;
import com.example.backend.service.UserPreferencesService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user/preferences")
@Tag(name = "User Preferences", description = "API for managing authenticated user preferences with category-based organization")
public class UserPreferencesController {

        private final UserPreferencesService userPreferencesService;

        public UserPreferencesController(UserPreferencesService userPreferencesService) {
                this.userPreferencesService = userPreferencesService;
        }

        @GetMapping
        @PreAuthorize("hasAnyRole('USER', 'PRO', 'ADMIN')")
        @Operation(summary = "Get all user preferences", description = "Retrieves all preferences for the authenticated user organized by categories (ui, notifications, formats, shortcuts) with inheritance from organization and system defaults")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Preferences retrieved successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        public ResponseEntity<Map<String, Object>> getAllPreferences() {
                String userId = TenantContext.getUserId();
                Map<String, Object> preferences = userPreferencesService.getAllPreferences(userId);
                return ResponseEntity.ok(preferences);
        }

        @GetMapping("/{category}")
        @PreAuthorize("hasAnyRole('USER', 'PRO', 'ADMIN')")
        @Operation(summary = "Get preferences by category", description = "Retrieves user preferences for a specific category (ui, notifications, formats, shortcuts) with inheritance from organization and system defaults")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Category preferences retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid category"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        public ResponseEntity<UserPreferencesDTO.CategoryPreferencesResponse> getPreferencesByCategory(
                        @Parameter(description = "Category (ui, notifications, formats, shortcuts)", required = true) @PathVariable String category) {
                String userId = TenantContext.getUserId();
                Map<String, Object> preferences = userPreferencesService.getPreferencesByCategory(userId, category);
                return ResponseEntity.ok(new UserPreferencesDTO.CategoryPreferencesResponse(category, preferences));
        }

        @PutMapping("/{category}")
        @PreAuthorize("hasAnyRole('USER', 'PRO', 'ADMIN')")
        @Operation(summary = "Update preferences by category", description = "Updates user preferences for a specific category with JSON schema validation")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Category preferences updated successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid category or preferences schema validation failed"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        public ResponseEntity<UserPreferencesDTO.CategoryPreferencesResponse> updatePreferencesByCategory(
                        @Parameter(description = "Category (ui, notifications, formats, shortcuts)", required = true) @PathVariable String category,
                        @Valid @RequestBody UserPreferencesDTO.CategoryPreferencesRequest request) {
                String userId = TenantContext.getUserId();
                Map<String, Object> updated = userPreferencesService.setPreferencesByCategory(userId, category,
                                request.getPreferences());
                return ResponseEntity.ok(new UserPreferencesDTO.CategoryPreferencesResponse(category, updated));
        }

        @PostMapping("/reset")
        @PreAuthorize("hasAnyRole('USER', 'PRO', 'ADMIN')")
        @Operation(summary = "Reset all preferences to defaults", description = "Resets all user preferences to organization and system defaults, removing all user customizations")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "All preferences reset successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        public ResponseEntity<Map<String, Object>> resetAllPreferences() {
                String userId = TenantContext.getUserId();
                Map<String, Object> defaults = userPreferencesService.resetAllPreferences(userId);
                return ResponseEntity.ok(defaults);
        }

        @GetMapping("/schema")
        @PreAuthorize("hasAnyRole('USER', 'PRO', 'ADMIN')")
        @Operation(summary = "Get JSON schemas for validation", description = "Returns JSON schema definitions for all preference categories to enable client-side validation")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Schemas retrieved successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        public ResponseEntity<Map<String, Map<String, Object>>> getSchemas() {
                Map<String, Map<String, Object>> schemas = userPreferencesService.getAllSchemas();
                return ResponseEntity.ok(schemas);
        }

        @GetMapping("/{userId}")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Get user preferences", description = "Retrieves all preferences for a specific user including dashboard layout and widget settings")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Preferences retrieved successfully", content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class))),
                        @ApiResponse(responseCode = "404", description = "User preferences not found")
        })
        public ResponseEntity<UserPreferencesDTO> getUserPreferences(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId) {
                UserPreferencesDTO preferences = userPreferencesService.getUserPreferences(userId);
                return ResponseEntity.ok(preferences);
        }

        @PutMapping("/{userId}")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Update user preferences", description = "Updates all preferences for a specific user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Preferences updated successfully", content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
        })
        public ResponseEntity<UserPreferencesDTO> updateUserPreferences(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId,
                        @RequestBody UserPreferencesDTO preferences) {
                UserPreferencesDTO updated = userPreferencesService.saveUserPreferences(userId, preferences);
                return ResponseEntity.ok(updated);
        }

        @PutMapping("/{userId}/dashboard-layout")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Update dashboard layout", description = "Updates only the dashboard layout configuration for a user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Dashboard layout updated successfully", content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
        })
        public ResponseEntity<UserPreferencesDTO> updateDashboardLayout(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId,
                        @RequestBody Map<String, Object> layout) {
                UserPreferencesDTO updated = userPreferencesService.updateDashboardLayout(userId, layout);
                return ResponseEntity.ok(updated);
        }

        @PutMapping("/{userId}/widget-settings")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Update widget settings", description = "Updates only the widget-specific settings for a user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Widget settings updated successfully", content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
        })
        public ResponseEntity<UserPreferencesDTO> updateWidgetSettings(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId,
                        @RequestBody Map<String, Object> settings) {
                UserPreferencesDTO updated = userPreferencesService.updateWidgetSettings(userId, settings);
                return ResponseEntity.ok(updated);
        }

        @PostMapping("/{userId}/apply-template")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Apply role-based template", description = "Applies a pre-configured dashboard template based on user role (agent, manager, admin)")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Template applied successfully", content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
        })
        public ResponseEntity<UserPreferencesDTO> applyRoleTemplate(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId,
                        @Parameter(description = "Role template name (agent, manager, admin)", required = true) @RequestParam String template) {
                UserPreferencesDTO updated = userPreferencesService.applyRoleTemplate(userId, template);
                return ResponseEntity.ok(updated);
        }

        @DeleteMapping("/{userId}")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Delete user preferences", description = "Deletes all preferences for a specific user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "204", description = "Preferences deleted successfully")
        })
        public ResponseEntity<Void> deleteUserPreferences(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId) {
                userPreferencesService.deleteUserPreferences(userId);
                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{userId}/export")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Export dashboard configuration", description = "Exports the current dashboard configuration as JSON for backup or sharing")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Configuration exported successfully")
        })
        public ResponseEntity<Map<String, Object>> exportConfiguration(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId) {
                UserPreferencesDTO preferences = userPreferencesService.getUserPreferences(userId);
                Map<String, Object> export = Map.of(
                                "dashboardLayout",
                                preferences.getDashboardLayout() != null
                                                ? preferences.getDashboardLayout()
                                                : Map.of(),
                                "widgetSettings",
                                preferences.getWidgetSettings() != null
                                                ? preferences.getWidgetSettings()
                                                : Map.of(),
                                "roleTemplate",
                                preferences.getRoleTemplate() != null
                                                ? preferences.getRoleTemplate()
                                                : "default");
                return ResponseEntity.ok(export);
        }

        @PostMapping("/{userId}/import")
        @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
        @Operation(summary = "Import dashboard configuration", description = "Imports a dashboard configuration from JSON backup")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Configuration imported successfully", content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
        })
        public ResponseEntity<UserPreferencesDTO> importConfiguration(
                        @Parameter(description = "User ID", required = true) @PathVariable String userId,
                        @RequestBody Map<String, Object> configuration) {

                UserPreferencesDTO dto = new UserPreferencesDTO();
                dto.setUserId(userId);

                if (configuration.containsKey("dashboardLayout")) {
                        dto.setDashboardLayout((Map<String, Object>) configuration.get("dashboardLayout"));
                }
                if (configuration.containsKey("widgetSettings")) {
                        dto.setWidgetSettings((Map<String, Object>) configuration.get("widgetSettings"));
                }
                if (configuration.containsKey("roleTemplate")) {
                        dto.setRoleTemplate((String) configuration.get("roleTemplate"));
                }

                UserPreferencesDTO updated = userPreferencesService.saveUserPreferences(userId, dto);
                return ResponseEntity.ok(updated);

        }
}
