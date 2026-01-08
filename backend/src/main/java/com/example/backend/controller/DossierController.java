package com.example.backend.controller;

import com.example.backend.dto.BulkOperationResponse;
import com.example.backend.dto.DossierBulkAssignRequest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierLeadPatchRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusHistoryResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.DossierService;
import com.example.backend.service.DossierStatusHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dossiers")
@Tag(name = "Dossiers", description = "API for managing dossiers")
public class DossierController {

    private final DossierService dossierService;
    private final DossierStatusHistoryService statusHistoryService;

    public DossierController(DossierService dossierService, DossierStatusHistoryService statusHistoryService) {
        this.dossierService = dossierService;
        this.statusHistoryService = statusHistoryService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Create a new dossier", description = "Creates a new dossier with the provided details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Dossier created successfully",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Related resource not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DossierResponse> create(@Valid @RequestBody DossierCreateRequest request) {
        Long existingOpenDossierId = null;
       if (request.getInitialParty() != null && request.getInitialParty().getPhone() != null) {
            var duplicates = dossierService.checkForDuplicates(request.getInitialParty().getPhone());
            if (!duplicates.isEmpty()) {
                existingOpenDossierId = duplicates.get(0).getId();
            }
        }

        // Let GlobalExceptionHandler standardize all error responses as RFC 7807 ProblemDetail.
        DossierResponse response = dossierService.create(request);
        response.setExistingOpenDossierId(existingOpenDossierId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get dossier by ID", description = "Retrieves a single dossier by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dossier found",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DossierResponse> getById(
            @Parameter(description = "ID of the dossier to retrieve", required = true)
            @PathVariable Long id) {
        DossierResponse response = dossierService.getById(id);
        return ResponseEntity.ok(response);
    }

    // 2) NOUVEL ENDPOINT: /api/v1/dossiers/check-duplicates?leadPhone=...
    // Sans nouveau DTO: on renvoie directement une List<DossierResponse>
    @GetMapping("/check-duplicates")
    public ResponseEntity<List<DossierResponse>> checkDuplicates(@RequestParam("leadPhone") String leadPhone) {
        var duplicates = dossierService.checkForDuplicates(leadPhone);
        if (duplicates == null || duplicates.isEmpty()) {
            return ResponseEntity.noContent().build(); // 204
        }
        return ResponseEntity.ok(duplicates); // 200
    }



    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List dossiers", description = "Retrieves a paginated list of dossiers with optional filtering")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dossiers retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    public ResponseEntity<Page<DossierResponse>> list(
            @Parameter(description = "Filter by dossier status")
            @RequestParam(required = false) DossierStatus status,
            @Parameter(description = "Filter by lead phone number")
            @RequestParam(required = false) String leadPhone,
            @Parameter(description = "Filter by annonce ID")
            @RequestParam(required = false) Long annonceId,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.")
            @RequestParam(defaultValue = "id,asc") String sort) {

        Pageable pageable = createPageable(page, size, sort);
        Page<DossierResponse> response = dossierService.list(status, leadPhone, annonceId, pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update dossier status", description = "Updates the status of an existing dossier")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dossier status updated successfully",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DossierResponse> patchStatus(
            @Parameter(description = "ID of the dossier to update", required = true)
            @PathVariable Long id,
            @Valid @RequestBody DossierStatusPatchRequest request) {
        DossierResponse response = dossierService.patchStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/lead")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Update dossier lead information", description = "Updates the lead name and phone of an existing dossier")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dossier lead information updated successfully",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DossierResponse> patchLead(
            @Parameter(description = "ID of the dossier to update", required = true)
            @PathVariable Long id,
            @Valid @RequestBody DossierLeadPatchRequest request) {
        DossierResponse response = dossierService.patchLead(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/status-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get dossier status history", description = "Retrieves the status transition history for a specific dossier")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status history retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Page<DossierStatusHistoryResponse>> getStatusHistory(
            @Parameter(description = "ID of the dossier", required = true)
            @PathVariable Long id,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc). Default sort order is descending by transitionedAt.")
            @RequestParam(defaultValue = "transitionedAt,desc") String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<DossierStatusHistoryResponse> history = statusHistoryService.getStatusHistory(id, pageable);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/bulk-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Bulk assign dossier status", description = "Updates the status of multiple dossiers with validation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Bulk assign completed",
                    content = @Content(schema = @Schema(implementation = BulkOperationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<BulkOperationResponse> bulkAssign(
            @Valid @RequestBody DossierBulkAssignRequest request) {
        BulkOperationResponse response = dossierService.bulkAssign(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a dossier", description = "Deletes a dossier by its ID (Admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Dossier deleted successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required",
                    content = @Content)
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID of the dossier to delete", required = true)
            @PathVariable Long id) {
        dossierService.delete(id);
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
