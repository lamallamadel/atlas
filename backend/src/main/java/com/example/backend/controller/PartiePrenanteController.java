package com.example.backend.controller;

import com.example.backend.dto.PartiePrenanteCreateRequest;
import com.example.backend.dto.PartiePrenanteResponse;
import com.example.backend.dto.PartiePrenanteUpdateRequest;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.PartiePrenanteService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/parties-prenantes")
@Tag(name = "Parties Prenantes", description = "API for managing parties prenantes")
public class PartiePrenanteController {

    private final PartiePrenanteService partiePrenanteService;

    public PartiePrenanteController(PartiePrenanteService partiePrenanteService) {
        this.partiePrenanteService = partiePrenanteService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Create a new partie prenante",
            description = "Creates a new partie prenante with the provided details")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Partie prenante created successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                PartiePrenanteResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Dossier not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<PartiePrenanteResponse> create(
            @Valid @RequestBody PartiePrenanteCreateRequest request) {
        PartiePrenanteResponse response = partiePrenanteService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get partie prenante by ID",
            description = "Retrieves a single partie prenante by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Partie prenante found",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                PartiePrenanteResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Partie prenante not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<PartiePrenanteResponse> getById(
            @Parameter(description = "ID of the partie prenante to retrieve", required = true)
                    @PathVariable
                    Long id) {
        try {
            PartiePrenanteResponse response = partiePrenanteService.getById(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Update partie prenante",
            description = "Updates an existing partie prenante with the provided details")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Partie prenante updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                PartiePrenanteResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Partie prenante not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<PartiePrenanteResponse> update(
            @Parameter(description = "ID of the partie prenante to update", required = true)
                    @PathVariable
                    Long id,
            @Valid @RequestBody PartiePrenanteUpdateRequest request) {
        try {
            PartiePrenanteResponse response = partiePrenanteService.update(id, request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete partie prenante",
            description = "Deletes an existing partie prenante by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "204",
                        description = "Partie prenante deleted successfully"),
                @ApiResponse(
                        responseCode = "404",
                        description = "Partie prenante not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID of the partie prenante to delete", required = true)
                    @PathVariable
                    Long id) {
        try {
            partiePrenanteService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List parties prenantes by dossier",
            description = "Retrieves a list of parties prenantes for a given dossier")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Parties prenantes retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                PartiePrenanteResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Dossier not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<List<PartiePrenanteResponse>> listByDossier(
            @Parameter(description = "ID of the dossier to filter by", required = true)
                    @RequestParam
                    Long dossierId) {
        List<PartiePrenanteResponse> response = partiePrenanteService.listByDossier(dossierId);
        return ResponseEntity.ok(response);
    }
}
