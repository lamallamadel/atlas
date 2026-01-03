package com.example.backend.controller;

import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierLeadPatchRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.service.DossierService;
import com.example.backend.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
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
@RequestMapping("/api/v1/dossiers")
@Tag(name = "Dossiers", description = "API for managing dossiers")
public class DossierController {

    private final DossierService dossierService;

    public DossierController(DossierService dossierService) {
        this.dossierService = dossierService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Create a new dossier", description = "Creates a new dossier with the provided details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Dossier created successfully",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DossierResponse> create(
            @Valid @RequestBody DossierCreateRequest request) {
        Long existingOpenDossierId = null;
        if (request.getInitialParty() != null && request.getInitialParty().getPhone() != null) {
            var duplicates = dossierService.checkForDuplicates(request.getInitialParty().getPhone());
            if (!duplicates.isEmpty()) {
                existingOpenDossierId = duplicates.get(0).getId();
            }
        }

        DossierResponse response = dossierService.create(request);
        response.setExistingOpenDossierId(existingOpenDossierId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
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
        try {
            DossierResponse response = dossierService.getById(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
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
        try {
            DossierResponse response = dossierService.patchStatus(id, request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
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
        try {
            DossierResponse response = dossierService.patchLead(id, request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
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
