package com.example.backend.controller;

import com.example.backend.dto.AuditEventResponse;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.AuditEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit-events")
@Tag(name = "Audit Events", description = "API for viewing audit events (read-only)")
public class AuditEventController {

    private final AuditEventService auditEventService;

    public AuditEventController(AuditEventService auditEventService) {
        this.auditEventService = auditEventService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
        summary = "List audit events",
        description = "Retrieves a paginated list of audit events. Filter by entity (type and ID) OR by dossier ID. Results are sorted by creation timestamp in descending order by default."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Audit events retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Page<AuditEventResponse>> list(
            @Parameter(description = "Filter by entity type (e.g., DOSSIER, ANNONCE)")
            @RequestParam(required = false) AuditEntityType entityType,
            @Parameter(description = "Filter by entity ID (must be used with entityType)")
            @RequestParam(required = false) Long entityId,
            @Parameter(description = "Filter by dossier ID")
            @RequestParam(required = false) Long dossierId,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc). Default sort order is descending.")
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        Pageable pageable = createPageable(page, size, sort);

        if (dossierId != null) {
            Page<AuditEventResponse> response = auditEventService.listByDossier(dossierId, pageable);
            return ResponseEntity.ok(response);
        } else if (entityType != null && entityId != null) {
            Page<AuditEventResponse> response = auditEventService.listByEntity(entityType, entityId, pageable);
            return ResponseEntity.ok(response);
        } else {
            throw new IllegalArgumentException("Either dossierId or both entityType and entityId must be provided");
        }
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String property = sortParams[0].trim();

        Sort.Direction direction =
                sortParams.length > 1 && sortParams[1].trim().equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;

        Sort primary = Sort.by(direction, property);

        // Deterministic ordering for tests and consistent pagination:
        // if two rows share same createdAt, order by id as tie-breaker.
        if (!"id".equalsIgnoreCase(property)) {
            primary = primary.and(Sort.by(direction, "id"));
        }

        return PageRequest.of(page, size, primary);
    }

}
