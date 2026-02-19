package com.example.backend.controller.v2;

import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.dto.v2.DossierMapperV2;
import com.example.backend.dto.v2.DossierResponseV2;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.service.DossierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
@RequestMapping("/api/v2/dossiers")
@Tag(
        name = "Dossiers V2",
        description = "API v2 for managing dossiers with enhanced response format")
public class DossierControllerV2 {

    private final DossierService dossierService;
    private final DossierMapperV2 dossierMapperV2;
    private final com.example.backend.service.DossierStatusCodeValidationService
            statusCodeValidationService;

    public DossierControllerV2(
            DossierService dossierService,
            DossierMapperV2 dossierMapperV2,
            com.example.backend.service.DossierStatusCodeValidationService
                    statusCodeValidationService) {
        this.dossierService = dossierService;
        this.dossierMapperV2 = dossierMapperV2;
        this.statusCodeValidationService = statusCodeValidationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Create a new dossier",
            description = "Creates a new dossier with the provided details")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Dossier created successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = DossierResponseV2.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request data")
            })
    public ResponseEntity<DossierResponseV2> create(
            @Valid @RequestBody DossierCreateRequest request) {
        var dossierResponse = dossierService.create(request);

        Dossier dossier = dossierService.findEntityById(dossierResponse.getId());
        DossierResponseV2 response = dossierMapperV2.toResponse(dossier);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get dossier by ID",
            description = "Retrieves a single dossier by its ID with structured response")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Dossier found",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = DossierResponseV2.class))),
                @ApiResponse(responseCode = "404", description = "Dossier not found")
            })
    public ResponseEntity<DossierResponseV2> getById(
            @Parameter(description = "ID of the dossier to retrieve", required = true) @PathVariable
                    Long id) {
        Dossier dossier = dossierService.findEntityById(id);
        DossierResponseV2 response = dossierMapperV2.toResponse(dossier);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List dossiers",
            description =
                    "Retrieves a paginated list of dossiers with optional filtering and structured response format")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Dossiers retrieved successfully")
            })
    public ResponseEntity<Page<DossierResponseV2>> list(
            @Parameter(description = "Filter by dossier status") @RequestParam(required = false)
                    DossierStatus status,
            @Parameter(description = "Filter by lead phone number") @RequestParam(required = false)
                    String leadPhone,
            @Parameter(description = "Filter by annonce ID") @RequestParam(required = false)
                    Long annonceId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0")
                    int page,
            @Parameter(description = "Page size (min=1, default=20)")
                    @RequestParam(defaultValue = "20")
                    int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc)")
                    @RequestParam(defaultValue = "id,asc")
                    String sort) {

        if (page < 0) {
            throw new IllegalArgumentException("Page number must be at least 0");
        }
        if (size < 1) {
            throw new IllegalArgumentException("Page size must be at least 1");
        }

        Pageable pageable = createPageable(page, size, sort);
        Page<Dossier> dossiers = dossierService.findAll(status, leadPhone, annonceId, pageable);
        Page<DossierResponseV2> response = dossiers.map(dossierMapperV2::toResponse);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Update dossier status",
            description = "Updates the status of an existing dossier")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Dossier status updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = DossierResponseV2.class))),
                @ApiResponse(responseCode = "404", description = "Dossier not found"),
                @ApiResponse(responseCode = "400", description = "Invalid request data")
            })
    public ResponseEntity<DossierResponseV2> patchStatus(
            @Parameter(description = "ID of the dossier to update", required = true) @PathVariable
                    Long id,
            @Valid @RequestBody DossierStatusPatchRequest request) {
        dossierService.patchStatus(id, request);
        Dossier dossier = dossierService.findEntityById(id);
        DossierResponseV2 response = dossierMapperV2.toResponse(dossier);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete a dossier",
            description = "Deletes a dossier by its ID (Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Dossier deleted successfully"),
                @ApiResponse(responseCode = "404", description = "Dossier not found"),
                @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required")
            })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID of the dossier to delete", required = true) @PathVariable
                    Long id) {
        dossierService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/allowed-status-codes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get allowed status codes for a case type",
            description =
                    "Retrieves the list of valid status codes for a specific case type based on workflow definitions")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Status codes retrieved successfully",
                        content = @Content(schema = @Schema(implementation = java.util.List.class)))
            })
    public ResponseEntity<java.util.List<String>> getAllowedStatusCodes(
            @Parameter(
                            description =
                                    "Case type code (optional, returns all active status codes if not specified)")
                    @RequestParam(required = false)
                    String caseType) {
        java.util.List<String> allowedStatusCodes =
                statusCodeValidationService.getAllowedStatusCodesForCaseType(caseType);
        return ResponseEntity.ok(allowedStatusCodes);
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
