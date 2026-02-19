package com.example.backend.controller;

import com.example.backend.aspect.Auditable;
import com.example.backend.dto.*;
import com.example.backend.entity.ReferentialEntity;
import com.example.backend.entity.ReferentialVersionEntity;
import com.example.backend.service.ReferentialSeedingService;
import com.example.backend.service.ReferentialService;
import com.example.backend.service.ReferentialTemplateService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflow-admin/referentials")
@Tag(
        name = "Workflow Admin - Referentials",
        description =
                "Admin operations for managing referential data with versioning and templates")
public class WorkflowAdminController {

    private final ReferentialService referentialService;
    private final ReferentialSeedingService seedingService;
    private final ReferentialTemplateService templateService;

    public WorkflowAdminController(
            ReferentialService referentialService,
            ReferentialSeedingService seedingService,
            ReferentialTemplateService templateService) {
        this.referentialService = referentialService;
        this.seedingService = seedingService;
        this.templateService = templateService;
    }

    @GetMapping
    @Operation(
            summary = "Get all referentials by category",
            description = "Returns all referential items for a given category with admin view")
    public ResponseEntity<List<ReferentialResponse>> getAllByCategory(
            @Parameter(description = "Referential category") @RequestParam String category,
            @Parameter(description = "Filter only active items")
                    @RequestParam(required = false, defaultValue = "false")
                    boolean activeOnly) {

        List<ReferentialEntity> entities =
                activeOnly
                        ? referentialService.getActiveByCategory(category)
                        : referentialService.getAllByCategory(category);

        List<ReferentialResponse> responses =
                entities.stream().map(this::toResponse).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get referential by ID",
            description = "Returns a single referential item by its ID")
    public ResponseEntity<ReferentialResponse> getById(
            @Parameter(description = "Referential ID") @PathVariable Long id) {

        ReferentialEntity entity = referentialService.getById(id);
        return ResponseEntity.ok(toResponse(entity));
    }

    @PostMapping
    @Auditable(action = "CREATE", entityType = "REFERENTIAL")
    @Operation(summary = "Create referential", description = "Creates a new referential item")
    public ResponseEntity<ReferentialResponse> create(
            @Parameter(description = "Referential data") @Valid @RequestBody
                    ReferentialRequest request) {

        ReferentialEntity entity = ReferentialMapper.toEntity(request);
        ReferentialEntity created = referentialService.create(entity);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }

    @PutMapping("/{id}")
    @Auditable(action = "UPDATE", entityType = "REFERENTIAL")
    @Operation(
            summary = "Update referential with versioning",
            description = "Updates an existing referential item with change tracking")
    public ResponseEntity<ReferentialResponse> update(
            @Parameter(description = "Referential ID") @PathVariable Long id,
            @Parameter(description = "Updated referential data") @Valid @RequestBody
                    ReferentialUpdateRequest request) {

        ReferentialEntity entity = new ReferentialEntity();
        entity.setLabel(request.getLabel());
        entity.setDescription(request.getDescription());
        entity.setDisplayOrder(request.getDisplayOrder());
        entity.setIsActive(request.getIsActive());

        ReferentialEntity updated =
                referentialService.update(id, entity, request.getChangeReason());

        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Auditable(action = "DELETE", entityType = "REFERENTIAL")
    @Operation(
            summary = "Delete referential",
            description = "Deletes a referential item (system items cannot be deleted)")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Referential ID") @PathVariable Long id,
            @Parameter(description = "Reason for deletion") @RequestParam(required = false)
                    String reason) {

        referentialService.delete(id, reason);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/versions")
    @Operation(
            summary = "Get version history",
            description = "Returns the version history for a referential item")
    public ResponseEntity<List<ReferentialVersionResponse>> getVersionHistory(
            @Parameter(description = "Referential ID") @PathVariable Long id) {

        List<ReferentialVersionEntity> versions = referentialService.getVersionHistory(id);
        List<ReferentialVersionResponse> responses =
                versions.stream().map(this::toVersionResponse).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/categories/{category}/versions")
    @Operation(
            summary = "Get category version history",
            description = "Returns all version history for a category")
    public ResponseEntity<List<ReferentialVersionResponse>> getCategoryVersionHistory(
            @Parameter(description = "Referential category") @PathVariable String category) {

        List<ReferentialVersionEntity> versions =
                referentialService.getCategoryVersionHistory(category);
        List<ReferentialVersionResponse> responses =
                versions.stream().map(this::toVersionResponse).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/seed")
    @Auditable(action = "SEED", entityType = "REFERENTIAL")
    @Operation(
            summary = "Seed default referentials",
            description = "Seeds default referential values for the current organization")
    public ResponseEntity<Map<String, Object>> seedReferentials() {
        String orgId = TenantContext.getOrgId();
        seedingService.seedDefaultReferentialsForOrg(orgId);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Default referentials seeded successfully");
        response.put("orgId", orgId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/export")
    @Operation(
            summary = "Export referentials as template",
            description = "Exports referential values as a JSON template")
    public ResponseEntity<ReferentialTemplateDto> exportTemplate(
            @Parameter(description = "Categories to export (comma-separated)")
                    @RequestParam(required = false)
                    List<String> categories) {

        ReferentialTemplateDto template =
                categories != null && !categories.isEmpty()
                        ? templateService.exportTemplate(categories)
                        : templateService.exportAllCategories();

        return ResponseEntity.ok(template);
    }

    @PostMapping("/import")
    @Auditable(action = "IMPORT", entityType = "REFERENTIAL")
    @Operation(
            summary = "Import referentials from template",
            description = "Imports referential values from a JSON template")
    public ResponseEntity<Map<String, Object>> importTemplate(
            @Parameter(description = "Template data") @Valid @RequestBody
                    ReferentialTemplateDto template,
            @Parameter(description = "Overwrite existing items")
                    @RequestParam(defaultValue = "false")
                    boolean overwrite) {

        int importedCount = templateService.importTemplate(template, overwrite);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Template imported successfully");
        response.put("importedCount", importedCount);
        response.put("overwrite", overwrite);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories")
    @Operation(
            summary = "Get available categories",
            description = "Returns list of available referential categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories =
                List.of("CASE_TYPE", "CASE_STATUS", "LEAD_SOURCE", "LOSS_REASON", "WON_REASON");
        return ResponseEntity.ok(categories);
    }

    private ReferentialResponse toResponse(ReferentialEntity entity) {
        ReferentialResponse response = ReferentialMapper.toResponse(entity);
        response.setVersion(entity.getVersion());
        response.setLastChangeType(entity.getLastChangeType());
        return response;
    }

    private ReferentialVersionResponse toVersionResponse(ReferentialVersionEntity version) {
        ReferentialVersionResponse response = new ReferentialVersionResponse();
        response.setId(version.getId());
        response.setReferentialId(version.getReferentialId());
        response.setCategory(version.getCategory());
        response.setCode(version.getCode());
        response.setLabel(version.getLabel());
        response.setDescription(version.getDescription());
        response.setDisplayOrder(version.getDisplayOrder());
        response.setIsActive(version.getIsActive());
        response.setIsSystem(version.getIsSystem());
        response.setChangeType(version.getChangeType().name());
        response.setChangeReason(version.getChangeReason());
        response.setCreatedAt(version.getCreatedAt());
        response.setCreatedBy(version.getCreatedBy());
        return response;
    }
}
