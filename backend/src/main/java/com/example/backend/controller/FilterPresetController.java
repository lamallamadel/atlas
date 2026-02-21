package com.example.backend.controller;

import com.example.backend.dto.FilterPresetRequest;
import com.example.backend.dto.FilterPresetResponse;
import com.example.backend.service.FilterPresetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/filter-presets")
@Tag(name = "Filter Presets", description = "API for managing filter presets")
public class FilterPresetController {

    private final FilterPresetService filterPresetService;

    public FilterPresetController(FilterPresetService filterPresetService) {
        this.filterPresetService = filterPresetService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Create a filter preset", description = "Creates a new filter preset")
    public ResponseEntity<FilterPresetResponse> create(
            @Valid @RequestBody FilterPresetRequest request) {
        FilterPresetResponse response = filterPresetService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get filter preset by ID",
            description = "Retrieves a filter preset by its ID")
    public ResponseEntity<FilterPresetResponse> getById(
            @Parameter(description = "ID of the filter preset", required = true) @PathVariable
                    Long id) {
        FilterPresetResponse response = filterPresetService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List accessible filter presets",
            description = "Retrieves all accessible filter presets for a given type")
    public ResponseEntity<List<FilterPresetResponse>> list(
            @Parameter(description = "Filter type (e.g., DOSSIER, ANNONCE)") @RequestParam
                    String filterType) {
        List<FilterPresetResponse> presets = filterPresetService.getAccessiblePresets(filterType);
        return ResponseEntity.ok(presets);
    }

    @GetMapping("/predefined")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List predefined filter presets",
            description = "Retrieves predefined filter presets for quick access")
    public ResponseEntity<List<FilterPresetResponse>> listPredefined(
            @Parameter(description = "Filter type (e.g., DOSSIER, ANNONCE)") @RequestParam
                    String filterType) {
        List<FilterPresetResponse> presets = filterPresetService.getPredefinedPresets(filterType);
        return ResponseEntity.ok(presets);
    }

    @GetMapping("/user")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List user's filter presets",
            description = "Retrieves filter presets created by the current user")
    public ResponseEntity<List<FilterPresetResponse>> listUserPresets(
            @Parameter(description = "Filter type (e.g., DOSSIER, ANNONCE)") @RequestParam
                    String filterType) {
        List<FilterPresetResponse> presets = filterPresetService.getUserPresets(filterType);
        return ResponseEntity.ok(presets);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update filter preset", description = "Updates an existing filter preset")
    public ResponseEntity<FilterPresetResponse> update(
            @Parameter(description = "ID of the filter preset", required = true) @PathVariable
                    Long id,
            @Valid @RequestBody FilterPresetRequest request) {
        FilterPresetResponse response = filterPresetService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Delete filter preset", description = "Deletes a filter preset")
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID of the filter preset", required = true) @PathVariable
                    Long id) {
        filterPresetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
