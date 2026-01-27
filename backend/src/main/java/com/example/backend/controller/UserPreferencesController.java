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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    @Operation(summary = "Get all user preferences", 
               description = "Retrieves all preferences for the authenticated user organized by categories (ui, notifications, formats, shortcuts) with inheritance from organization and system defaults")
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
    @Operation(summary = "Get preferences by category", 
               description = "Retrieves user preferences for a specific category (ui, notifications, formats, shortcuts) with inheritance from organization and system defaults")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category preferences retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid category"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<UserPreferencesDTO.CategoryPreferencesResponse> getPreferencesByCategory(
            @Parameter(description = "Category (ui, notifications, formats, shortcuts)", required = true)
            @PathVariable String category) {
        String userId = TenantContext.getUserId();
        Map<String, Object> preferences = userPreferencesService.getPreferencesByCategory(userId, category);
        return ResponseEntity.ok(new UserPreferencesDTO.CategoryPreferencesResponse(category, preferences));
    }

    @PutMapping("/{category}")
    @PreAuthorize("hasAnyRole('USER', 'PRO', 'ADMIN')")
    @Operation(summary = "Update preferences by category", 
               description = "Updates user preferences for a specific category with JSON schema validation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Category preferences updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid category or preferences schema validation failed"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<UserPreferencesDTO.CategoryPreferencesResponse> updatePreferencesByCategory(
            @Parameter(description = "Category (ui, notifications, formats, shortcuts)", required = true)
            @PathVariable String category,
            @Valid @RequestBody UserPreferencesDTO.CategoryPreferencesRequest request) {
        String userId = TenantContext.getUserId();
        Map<String, Object> updated = userPreferencesService.setPreferencesByCategory(userId, category, request.getPreferences());
        return ResponseEntity.ok(new UserPreferencesDTO.CategoryPreferencesResponse(category, updated));
    }

    @PostMapping("/reset")
    @PreAuthorize("hasAnyRole('USER', 'PRO', 'ADMIN')")
    @Operation(summary = "Reset all preferences to defaults", 
               description = "Resets all user preferences to organization and system defaults, removing all user customizations")
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
    @Operation(summary = "Get JSON schemas for validation", 
               description = "Returns JSON schema definitions for all preference categories to enable client-side validation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Schemas retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Map<String, Map<String, Object>>> getSchemas() {
        Map<String, Map<String, Object>> schemas = userPreferencesService.getAllSchemas();
        return ResponseEntity.ok(schemas);
    }
}
