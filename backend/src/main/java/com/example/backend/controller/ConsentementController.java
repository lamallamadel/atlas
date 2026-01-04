package com.example.backend.controller;

import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.ConsentementResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    @Operation(summary = "Create or update consent", description = "Creates a new consent record or updates an existing one for a dossier")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Consent created successfully",
                    content = @Content(schema = @Schema(implementation = ConsentementResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ConsentementResponse> create(@Valid @RequestBody ConsentementCreateRequest request) {
        ConsentementResponse response = consentementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get consent by ID", description = "Retrieves a single consent record by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Consent found",
                    content = @Content(schema = @Schema(implementation = ConsentementResponse.class))),
            @ApiResponse(responseCode = "404", description = "Consent not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ConsentementResponse> getById(
            @Parameter(description = "ID of the consent to retrieve", required = true)
            @PathVariable Long id) {
        try {
            ConsentementResponse response = consentementService.getById(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List consents", description = "Retrieves a list of consent records filtered by dossier ID and optionally by channel. Results are sorted by updatedAt in descending order (most recent first).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Consents retrieved successfully",
                    content = @Content(schema = @Schema(implementation = List.class)))
    })
    public ResponseEntity<List<ConsentementResponse>> list(
            @Parameter(description = "Filter by dossier ID", required = true)
            @RequestParam Long dossierId,
            @Parameter(description = "Filter by consent channel (optional)")
            @RequestParam(required = false) ConsentementChannel channel) {
        List<ConsentementResponse> response = consentementService.listByDossierAndChannel(dossierId, channel);
        return ResponseEntity.ok(response);
    }
}
