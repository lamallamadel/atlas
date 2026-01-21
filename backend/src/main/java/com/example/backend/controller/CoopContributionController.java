package com.example.backend.controller;

import com.example.backend.dto.CoopContributionRequest;
import com.example.backend.dto.CoopContributionResponse;
import com.example.backend.entity.enums.ContributionStatus;
import com.example.backend.entity.enums.ContributionType;
import com.example.backend.service.CoopContributionService;
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
@RequestMapping("/api/v1/coop/contributions")
@Tag(name = "Coop Contributions", description = "API for managing cooperative contributions")
public class CoopContributionController {

    private final CoopContributionService coopContributionService;

    public CoopContributionController(CoopContributionService coopContributionService) {
        this.coopContributionService = coopContributionService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new contribution")
    public ResponseEntity<CoopContributionResponse> create(@Valid @RequestBody CoopContributionRequest request) {
        CoopContributionResponse response = coopContributionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get contribution by ID")
    public ResponseEntity<CoopContributionResponse> getById(@PathVariable Long id) {
        CoopContributionResponse response = coopContributionService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List contributions")
    public ResponseEntity<Page<CoopContributionResponse>> list(
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) ContributionStatus status,
            @RequestParam(required = false) ContributionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,asc") String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CoopContributionResponse> response = coopContributionService.list(memberId, projectId, status, type, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update contribution")
    public ResponseEntity<CoopContributionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CoopContributionRequest request) {
        CoopContributionResponse response = coopContributionService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete contribution")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        coopContributionService.delete(id);
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
