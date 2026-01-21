package com.example.backend.controller;

import com.example.backend.dto.CoopGroupRequest;
import com.example.backend.dto.CoopGroupResponse;
import com.example.backend.service.CoopGroupService;
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
@RequestMapping("/api/v1/coop/groups")
@Tag(name = "Coop Groups", description = "API for managing cooperative housing groups")
public class CoopGroupController {

    private final CoopGroupService coopGroupService;

    public CoopGroupController(CoopGroupService coopGroupService) {
        this.coopGroupService = coopGroupService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new cooperative group")
    public ResponseEntity<CoopGroupResponse> create(@Valid @RequestBody CoopGroupRequest request) {
        CoopGroupResponse response = coopGroupService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get cooperative group by ID")
    public ResponseEntity<CoopGroupResponse> getById(@PathVariable Long id) {
        CoopGroupResponse response = coopGroupService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List cooperative groups")
    public ResponseEntity<Page<CoopGroupResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,asc") String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CoopGroupResponse> response = coopGroupService.list(pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update cooperative group")
    public ResponseEntity<CoopGroupResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CoopGroupRequest request) {
        CoopGroupResponse response = coopGroupService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete cooperative group")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        coopGroupService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String property = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}
