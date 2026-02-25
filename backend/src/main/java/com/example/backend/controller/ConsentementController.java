package com.example.backend.controller;

import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.ConsentementResponse;
import com.example.backend.dto.ConsentementUpdateRequest;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.ConsentementService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/consentements")
@Tag(name = "Consentements", description = "API for managing consent records")
public class ConsentementController {

    private final ConsentementService consentementService;

    public ConsentementController(ConsentementService consentementService) {
        this.consentementService = consentementService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Create or update consent",
            description = "Creates a new consent record or updates an existing one for a dossier")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Consent created successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ConsentementResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Dossier not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<ConsentementResponse> create(
            @Valid @RequestBody ConsentementCreateRequest request) {
        ConsentementResponse response = consentementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get consent by ID",
            description = "Retrieves a single consent record by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Consent found",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ConsentementResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Consent not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<ConsentementResponse> getById(
            @Parameter(description = "ID of the consent to retrieve", required = true) @PathVariable
                    Long id) {
        try {
            ConsentementResponse response = consentementService.getById(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Update consent",
            description =
                    "Updates an existing consent record. Stores previousStatus, changedBy, and changedAt in meta JSONB field.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Consent updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ConsentementResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Consent not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<ConsentementResponse> update(
            @Parameter(description = "ID of the consent to update", required = true) @PathVariable
                    Long id,
            @Valid @RequestBody ConsentementUpdateRequest request) {
        try {
            ConsentementResponse response = consentementService.update(id, request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List consents",
            description =
                    "Retrieves a list of consent records filtered by dossier ID and optionally by channel. Results are sorted by updatedAt in descending order (most recent first). Supports pagination via page and size query parameters.")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Consents retrieved successfully")
            })
    public ResponseEntity<?> list(
            @Parameter(description = "Filter by dossier ID", required = true) @RequestParam
                    Long dossierId,
            @Parameter(description = "Filter by consent channel (optional)")
                    @RequestParam(required = false)
                    ConsentementChannel channel,
            @Parameter(description = "Page number (0-indexed, optional)")
                    @RequestParam(required = false)
                    Integer page,
            @Parameter(description = "Page size (optional)") @RequestParam(required = false)
                    Integer size) {
        if (page != null || size != null) {
            int pageNumber = page != null ? page : 0;
            int pageSize = size != null ? size : 20;
            Page<ConsentementResponse> response =
                    consentementService.listByDossierAndChannelPaginated(
                            dossierId, channel, pageNumber, pageSize);
            return ResponseEntity.ok(response);
        } else {
            List<ConsentementResponse> response =
                    consentementService.listByDossierAndChannel(dossierId, channel);
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/{id:\\d+}/renew")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Renew consent",
            description =
                    "Renews a consent by updating its expiration date (expires_at) to 1 year from now. Logs a CONSENT_RENEWED activity event with previous and new expiration timestamps.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Consent renewed successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ConsentementResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Consent not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<ConsentementResponse> renew(
            @Parameter(description = "ID of the consent to renew", required = true) @PathVariable
                    Long id) {
        try {
            ConsentementResponse response = consentementService.renew(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
