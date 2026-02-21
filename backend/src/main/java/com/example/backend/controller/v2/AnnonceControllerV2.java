package com.example.backend.controller.v2;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.dto.v2.AnnonceMapperV2;
import com.example.backend.dto.v2.AnnonceResponseV2;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/v2/annonces")
@Tag(
        name = "Annonces V2",
        description = "API v2 for managing annonces with enhanced response format")
public class AnnonceControllerV2 {

    private final AnnonceService annonceService;
    private final AnnonceMapperV2 annonceMapperV2;

    public AnnonceControllerV2(AnnonceService annonceService, AnnonceMapperV2 annonceMapperV2) {
        this.annonceService = annonceService;
        this.annonceMapperV2 = annonceMapperV2;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Create a new annonce",
            description = "Creates a new annonce with the provided details")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Annonce created successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = AnnonceResponseV2.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request data")
            })
    public ResponseEntity<AnnonceResponseV2> create(
            @Valid @RequestBody AnnonceCreateRequest request) {
        var annonceResponse = annonceService.create(request);
        Annonce annonce = annonceService.findEntityById(annonceResponse.getId());
        AnnonceResponseV2 response = annonceMapperV2.toResponse(annonce);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get annonce by ID",
            description = "Retrieves a single annonce by its ID with structured response")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Annonce found",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = AnnonceResponseV2.class))),
                @ApiResponse(responseCode = "404", description = "Annonce not found")
            })
    public ResponseEntity<AnnonceResponseV2> getById(
            @Parameter(description = "ID of the annonce to retrieve", required = true) @PathVariable
                    Long id) {
        Annonce annonce = annonceService.findEntityById(id);
        AnnonceResponseV2 response = annonceMapperV2.toResponse(annonce);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Update an annonce",
            description = "Updates an existing annonce with the provided details")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Annonce updated successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = AnnonceResponseV2.class))),
                @ApiResponse(responseCode = "404", description = "Annonce not found"),
                @ApiResponse(responseCode = "400", description = "Invalid request data")
            })
    public ResponseEntity<AnnonceResponseV2> update(
            @Parameter(description = "ID of the annonce to update", required = true) @PathVariable
                    Long id,
            @Valid @RequestBody AnnonceUpdateRequest request) {
        annonceService.update(id, request);
        Annonce annonce = annonceService.findEntityById(id);
        AnnonceResponseV2 response = annonceMapperV2.toResponse(annonce);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List annonces",
            description =
                    "Retrieves a paginated list of annonces with optional filtering and structured response")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Annonces retrieved successfully")
            })
    public ResponseEntity<Page<AnnonceResponseV2>> list(
            @Parameter(description = "Filter by annonce status") @RequestParam(required = false)
                    AnnonceStatus status,
            @Parameter(description = "Search query to filter annonces")
                    @RequestParam(required = false)
                    String q,
            @Parameter(description = "Filter by city") @RequestParam(required = false) String city,
            @Parameter(description = "Filter by type") @RequestParam(required = false) String type,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0")
                    int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc)")
                    @RequestParam(defaultValue = "id,asc")
                    String sort) {

        Pageable pageable = createPageable(page, size, sort);
        Page<Annonce> annonces = annonceService.findAll(status, q, city, type, pageable);
        Page<AnnonceResponseV2> response = annonces.map(annonceMapperV2::toResponse);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cities")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get distinct cities",
            description = "Retrieves a list of distinct cities from all annonces")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Cities retrieved successfully")
            })
    public ResponseEntity<List<String>> getDistinctCities() {
        List<String> cities = annonceService.getDistinctCities();
        return ResponseEntity.ok(cities);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete an annonce",
            description = "Deletes an annonce by its ID (Admin only)")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Annonce deleted successfully"),
                @ApiResponse(responseCode = "404", description = "Annonce not found"),
                @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required")
            })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID of the annonce to delete", required = true) @PathVariable
                    Long id) {
        annonceService.delete(id);
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
