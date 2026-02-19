package com.example.backend.controller;

import com.example.backend.dto.CoopProjectRequest;
import com.example.backend.dto.CoopProjectResponse;
import com.example.backend.entity.enums.ProjectStatus;
import com.example.backend.service.CoopProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/coop/projects")
@Tag(name = "Coop Projects", description = "API for managing cooperative housing projects")
public class CoopProjectController {

    private final CoopProjectService coopProjectService;

    public CoopProjectController(CoopProjectService coopProjectService) {
        this.coopProjectService = coopProjectService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new cooperative project")
    public ResponseEntity<CoopProjectResponse> create(
            @Valid @RequestBody CoopProjectRequest request) {
        CoopProjectResponse response = coopProjectService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get cooperative project by ID")
    public ResponseEntity<CoopProjectResponse> getById(@PathVariable Long id) {
        CoopProjectResponse response = coopProjectService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List cooperative projects")
    public ResponseEntity<Page<CoopProjectResponse>> list(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,asc") String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CoopProjectResponse> response = coopProjectService.list(groupId, status, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update cooperative project")
    public ResponseEntity<CoopProjectResponse> update(
            @PathVariable Long id, @Valid @RequestBody CoopProjectRequest request) {
        CoopProjectResponse response = coopProjectService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete cooperative project")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        coopProjectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String property = sortParams[0];
        Sort.Direction direction =
                sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}
