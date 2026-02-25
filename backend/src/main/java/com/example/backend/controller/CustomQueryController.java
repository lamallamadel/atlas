package com.example.backend.controller;

import com.example.backend.entity.CustomQueryEntity;
import com.example.backend.service.CustomQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/custom-queries")
@Tag(name = "Custom Queries", description = "Custom SQL query builder and executor")
public class CustomQueryController {

    private final CustomQueryService customQueryService;

    public CustomQueryController(CustomQueryService customQueryService) {
        this.customQueryService = customQueryService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Create custom query", description = "Creates a new custom SQL query")
    public ResponseEntity<CustomQueryEntity> createCustomQuery(
            @RequestBody CustomQueryEntity query, Authentication authentication) {
        String orgId = "default";
        CustomQueryEntity created = customQueryService.createCustomQuery(orgId, query);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List custom queries",
            description = "Returns a paginated list of custom queries")
    public ResponseEntity<Page<CustomQueryEntity>> getCustomQueries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        String orgId = "default";
        Pageable pageable = PageRequest.of(page, size);
        Page<CustomQueryEntity> queries = customQueryService.getCustomQueries(orgId, pageable);
        return ResponseEntity.ok(queries);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get custom query", description = "Returns a single custom query by ID")
    public ResponseEntity<CustomQueryEntity> getCustomQuery(
            @PathVariable Long id, Authentication authentication) {
        String orgId = "default";
        CustomQueryEntity query = customQueryService.getCustomQuery(id, orgId);
        return ResponseEntity.ok(query);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update custom query", description = "Updates an existing custom query")
    public ResponseEntity<CustomQueryEntity> updateCustomQuery(
            @PathVariable Long id,
            @RequestBody CustomQueryEntity query,
            Authentication authentication) {
        String orgId = "default";
        CustomQueryEntity updated = customQueryService.updateCustomQuery(id, orgId, query);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Delete custom query", description = "Deletes a custom query")
    public ResponseEntity<Void> deleteCustomQuery(
            @PathVariable Long id, Authentication authentication) {
        String orgId = "default";
        customQueryService.deleteCustomQuery(id, orgId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Execute custom query", description = "Executes an approved custom query")
    public ResponseEntity<List<Map<String, Object>>> executeCustomQuery(
            @PathVariable Long id,
            @RequestBody Map<String, Object> params,
            Authentication authentication) {
        String orgId = "default";
        List<Map<String, Object>> results =
                customQueryService.executeCustomQuery(id, orgId, params);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve custom query", description = "Approves a query for execution")
    public ResponseEntity<CustomQueryEntity> approveQuery(
            @PathVariable Long id, Authentication authentication) {
        String userId = authentication.getName();
        CustomQueryEntity approved = customQueryService.approveQuery(id, userId);
        return ResponseEntity.ok(approved);
    }

    @GetMapping("/public")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List public queries", description = "Returns all public queries")
    public ResponseEntity<List<CustomQueryEntity>> getPublicQueries(Authentication authentication) {
        String orgId = "default";
        List<CustomQueryEntity> queries = customQueryService.getPublicQueries(orgId);
        return ResponseEntity.ok(queries);
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List queries by category",
            description = "Returns queries in a specific category")
    public ResponseEntity<List<CustomQueryEntity>> getQueriesByCategory(
            @PathVariable String category, Authentication authentication) {
        String orgId = "default";
        List<CustomQueryEntity> queries = customQueryService.getQueriesByCategory(orgId, category);
        return ResponseEntity.ok(queries);
    }
}
