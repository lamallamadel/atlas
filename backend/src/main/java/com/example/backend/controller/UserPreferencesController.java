package com.example.backend.controller;

import com.example.backend.dto.UserPreferencesDTO;
import com.example.backend.service.UserPreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/user-preferences")
@Tag(name = "User Preferences", description = "API for managing user preferences and dashboard customization")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get user preferences", 
               description = "Retrieves all preferences for a specific user including dashboard layout and widget settings")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class))),
            @ApiResponse(responseCode = "404", description = "User preferences not found")
    })
    public ResponseEntity<UserPreferencesDTO> getUserPreferences(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId) {
        UserPreferencesDTO preferences = userPreferencesService.getUserPreferences(userId);
        return ResponseEntity.ok(preferences);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update user preferences", 
               description = "Updates all preferences for a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences updated successfully",
                    content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
    })
    public ResponseEntity<UserPreferencesDTO> updateUserPreferences(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @RequestBody UserPreferencesDTO preferences) {
        UserPreferencesDTO updated = userPreferencesService.saveUserPreferences(userId, preferences);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{userId}/dashboard-layout")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update dashboard layout", 
               description = "Updates only the dashboard layout configuration for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard layout updated successfully",
                    content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
    })
    public ResponseEntity<UserPreferencesDTO> updateDashboardLayout(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @RequestBody Map<String, Object> layout) {
        UserPreferencesDTO updated = userPreferencesService.updateDashboardLayout(userId, layout);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{userId}/widget-settings")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update widget settings", 
               description = "Updates only the widget-specific settings for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Widget settings updated successfully",
                    content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
    })
    public ResponseEntity<UserPreferencesDTO> updateWidgetSettings(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @RequestBody Map<String, Object> settings) {
        UserPreferencesDTO updated = userPreferencesService.updateWidgetSettings(userId, settings);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{userId}/apply-template")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Apply role-based template", 
               description = "Applies a pre-configured dashboard template based on user role (agent, manager, admin)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Template applied successfully",
                    content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
    })
    public ResponseEntity<UserPreferencesDTO> applyRoleTemplate(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @Parameter(description = "Role template name (agent, manager, admin)", required = true)
            @RequestParam String template) {
        UserPreferencesDTO updated = userPreferencesService.applyRoleTemplate(userId, template);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Delete user preferences", 
               description = "Deletes all preferences for a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Preferences deleted successfully")
    })
    public ResponseEntity<Void> deleteUserPreferences(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId) {
        userPreferencesService.deleteUserPreferences(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Export dashboard configuration", 
               description = "Exports the current dashboard configuration as JSON for backup or sharing")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Configuration exported successfully")
    })
    public ResponseEntity<Map<String, Object>> exportConfiguration(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId) {
        UserPreferencesDTO preferences = userPreferencesService.getUserPreferences(userId);
        Map<String, Object> export = Map.of(
            "dashboardLayout", preferences.getDashboardLayout() != null ? preferences.getDashboardLayout() : Map.of(),
            "widgetSettings", preferences.getWidgetSettings() != null ? preferences.getWidgetSettings() : Map.of(),
            "roleTemplate", preferences.getRoleTemplate() != null ? preferences.getRoleTemplate() : "default"
        );
        return ResponseEntity.ok(export);
    }

    @PostMapping("/{userId}/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Import dashboard configuration", 
               description = "Imports a dashboard configuration from JSON backup")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Configuration imported successfully",
                    content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
    })
    public ResponseEntity<UserPreferencesDTO> importConfiguration(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
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

    @PutMapping("/{userId}/tour-progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update tour progress", 
               description = "Updates the guided tour progress and completion state for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tour progress updated successfully",
                    content = @Content(schema = @Schema(implementation = UserPreferencesDTO.class)))
    })
    public ResponseEntity<UserPreferencesDTO> updateTourProgress(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @RequestBody Map<String, Object> tourProgress) {
        UserPreferencesDTO updated = userPreferencesService.updateTourProgress(userId, tourProgress);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{userId}/tour-progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get tour progress", 
               description = "Retrieves the guided tour progress and completion state for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tour progress retrieved successfully")
    })
    public ResponseEntity<Map<String, Object>> getTourProgress(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId) {
        UserPreferencesDTO preferences = userPreferencesService.getUserPreferences(userId);
        Map<String, Object> tourProgress = preferences.getTourProgress() != null 
            ? preferences.getTourProgress() 
            : new java.util.HashMap<>();
        return ResponseEntity.ok(tourProgress);
    }

    @GetMapping("/{userId}/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get preferences by category", 
               description = "Retrieves user preferences for a specific category (ui, notifications, formats, shortcuts) with inheritance from organization and system defaults")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category preferences retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid category")
    })
    public ResponseEntity<UserPreferencesDTO.CategoryPreferencesResponse> getPreferencesByCategory(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @Parameter(description = "Category (ui, notifications, formats, shortcuts)", required = true)
            @PathVariable String category) {
        Map<String, Object> preferences = userPreferencesService.getPreferencesByCategory(userId, category);
        return ResponseEntity.ok(new UserPreferencesDTO.CategoryPreferencesResponse(category, preferences));
    }

    @PutMapping("/{userId}/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Set preferences by category", 
               description = "Sets user preferences for a specific category with JSON schema validation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category preferences updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid category or preferences schema validation failed")
    })
    public ResponseEntity<UserPreferencesDTO.CategoryPreferencesResponse> setPreferencesByCategory(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @Parameter(description = "Category (ui, notifications, formats, shortcuts)", required = true)
            @PathVariable String category,
            @Valid @RequestBody UserPreferencesDTO.CategoryPreferencesRequest request) {
        Map<String, Object> updated = userPreferencesService.setPreferencesByCategory(userId, category, request.getPreferences());
        return ResponseEntity.ok(new UserPreferencesDTO.CategoryPreferencesResponse(category, updated));
    }

    @DeleteMapping("/{userId}/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Reset preferences by category", 
               description = "Resets user preferences for a specific category to organization/system defaults")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category preferences reset successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid category")
    })
    public ResponseEntity<UserPreferencesDTO.CategoryPreferencesResponse> resetPreferencesByCategory(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId,
            @Parameter(description = "Category (ui, notifications, formats, shortcuts)", required = true)
            @PathVariable String category) {
        Map<String, Object> defaults = userPreferencesService.resetPreferencesByCategory(userId, category);
        return ResponseEntity.ok(new UserPreferencesDTO.CategoryPreferencesResponse(category, defaults));
    }

    @GetMapping("/{userId}/all-categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get all preferences by categories", 
               description = "Retrieves all user preferences organized by categories with inheritance applied")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All preferences retrieved successfully")
    })
    public ResponseEntity<Map<String, Object>> getAllPreferences(
            @Parameter(description = "User ID", required = true)
            @PathVariable String userId) {
        Map<String, Object> allPreferences = userPreferencesService.getAllPreferences(userId);
        return ResponseEntity.ok(allPreferences);
    }
}
