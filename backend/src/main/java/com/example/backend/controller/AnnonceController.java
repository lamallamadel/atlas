package com.example.backend.controller;

import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.BrainScoringService;
import com.example.backend.brain.dto.DoublonResultDto;
import com.example.backend.brain.dto.DupliAnnonceDto;
import com.example.backend.config.Deprecated;
import com.example.backend.dto.AnnonceBulkUpdateRequest;
import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.dto.BulkOperationResponse;
import com.example.backend.dto.CursorPageRequest;
import com.example.backend.dto.CursorPageResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceService;
import com.example.backend.service.CursorPaginationService;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/annonces")
@Tag(name = "Annonces", description = "API for managing annonces (deprecated, use v2)")
@Deprecated(
        sunsetDate = "2025-12-31",
        deprecationMessage =
                "API v1 is deprecated. Please migrate to /api/v2/annonces which provides structured responses with nested location, pricing, and audit information.")
public class AnnonceController {

    private final AnnonceService annonceService;
    private final CursorPaginationService cursorPaginationService;
    @Nullable private final BrainScoringService brainScoringService;
    @Nullable private final BrainClientService brainClientService;

    public AnnonceController(
            AnnonceService annonceService,
            CursorPaginationService cursorPaginationService,
            @Autowired(required = false) @Nullable BrainScoringService brainScoringService,
            @Autowired(required = false) @Nullable BrainClientService brainClientService) {
        this.annonceService = annonceService;
        this.cursorPaginationService = cursorPaginationService;
        this.brainScoringService = brainScoringService;
        this.brainClientService = brainClientService;
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
                                @Content(schema = @Schema(implementation = AnnonceResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data",
                        content = @Content)
            })
    public ResponseEntity<AnnonceResponse> create(
            @Valid @RequestBody AnnonceCreateRequest request) {
        AnnonceResponse response = annonceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get annonce by ID", description = "Retrieves a single annonce by its ID")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Annonce found",
                        content =
                                @Content(schema = @Schema(implementation = AnnonceResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Annonce not found",
                        content = @Content)
            })
    public ResponseEntity<AnnonceResponse> getById(
            @Parameter(description = "ID of the annonce to retrieve", required = true) @PathVariable
                    Long id) {
        try {
            AnnonceResponse response = annonceService.getById(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
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
                                @Content(schema = @Schema(implementation = AnnonceResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Annonce not found",
                        content = @Content),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data",
                        content = @Content)
            })
    public ResponseEntity<AnnonceResponse> update(
            @Parameter(description = "ID of the annonce to update", required = true) @PathVariable
                    Long id,
            @Valid @RequestBody AnnonceUpdateRequest request) {
        try {
            AnnonceResponse response = annonceService.update(id, request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List annonces",
            description = "Retrieves a paginated list of annonces with optional filtering")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Annonces retrieved successfully",
                        content = @Content(schema = @Schema(implementation = Page.class)))
            })
    public ResponseEntity<Page<AnnonceResponse>> list(
            @Parameter(description = "Filter by annonce status") @RequestParam(required = false)
                    AnnonceStatus status,
            @Parameter(
                            description =
                                    "Search query to filter annonces by title, description, category, or city")
                    @RequestParam(required = false)
                    String q,
            @Parameter(description = "Filter by city") @RequestParam(required = false) String city,
            @Parameter(description = "Filter by type") @RequestParam(required = false) String type,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0")
                    int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(
                            description =
                                    "Sort criteria in format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.")
                    @RequestParam(defaultValue = "id,asc")
                    String sort) {

        Pageable pageable = createPageable(page, size, sort);
        Page<AnnonceResponse> response = annonceService.list(status, q, city, type, pageable);
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
                @ApiResponse(
                        responseCode = "204",
                        description = "Annonce deleted successfully",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Annonce not found",
                        content = @Content),
                @ApiResponse(
                        responseCode = "403",
                        description = "Forbidden - Admin role required",
                        content = @Content)
            })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID of the annonce to delete", required = true) @PathVariable
                    Long id) {
        try {
            annonceService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/bulk-update")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Bulk update annonces",
            description = "Updates multiple annonces with the provided changes")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Bulk update completed",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                BulkOperationResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid request data",
                        content = @Content)
            })
    public ResponseEntity<BulkOperationResponse> bulkUpdate(
            @Valid @RequestBody AnnonceBulkUpdateRequest request) {
        BulkOperationResponse response = annonceService.bulkUpdate(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cursor")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List annonces with cursor pagination",
            description =
                    "Retrieves annonces using cursor-based pagination for better performance on large datasets")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Annonces retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = CursorPageResponse.class)))
            })
    public ResponseEntity<CursorPageResponse<Annonce>> listWithCursor(
            @Parameter(description = "Cursor from previous page") @RequestParam(required = false)
                    String cursor,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "20")
                    Integer limit,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC")
                    Sort.Direction direction,
            @Parameter(description = "Field to sort by") @RequestParam(defaultValue = "id")
                    String sortField) {

        CursorPageRequest pageRequest = new CursorPageRequest(cursor, limit, direction, sortField);
        CursorPageResponse<Annonce> response =
                cursorPaginationService.findWithCursor(Annonce.class, pageRequest, null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/score")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Trigger AI scoring",
            description = "Triggers asynchronous AI quality scoring for an annonce")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "202",
                        description = "Scoring triggered (asynchronous)",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Annonce not found",
                        content = @Content)
            })
    public ResponseEntity<Void> triggerScore(@PathVariable Long id) {
        try {
            annonceService.getById(id);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
        if (brainScoringService != null) {
            brainScoringService.triggerScoringAsync(id);
        }
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/duplicates")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Detect duplicates",
            description = "Detects duplicate annonces using semantic similarity (TF-IDF + cosine)")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Duplicate detection results")
            })
    public ResponseEntity<List<DoublonResultDto>> detectDuplicates(
            @RequestBody List<Long> annonceIds) {
        if (annonceIds == null || annonceIds.size() < 2) {
            return ResponseEntity.badRequest().build();
        }
        List<DupliAnnonceDto> dtos = annonceService.getDupliDtos(annonceIds);
        if (dtos.size() < 2) {
            return ResponseEntity.ok(List.of());
        }
        List<DoublonResultDto> results =
                brainClientService != null ? brainClientService.detectDuplicates(dtos) : List.of();
        return ResponseEntity.ok(results);
    }

    @PostMapping("/{id}/fraud")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Trigger fraud analysis",
            description = "Triggers asynchronous fraud detection for an annonce")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "202",
                        description = "Fraud analysis triggered (asynchronous)",
                        content = @Content),
                @ApiResponse(
                        responseCode = "404",
                        description = "Annonce not found",
                        content = @Content)
            })
    public ResponseEntity<Void> triggerFraud(@PathVariable Long id) {
        try {
            annonceService.getById(id);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
        if (brainScoringService != null) {
            brainScoringService.triggerFraudAsync(id);
        }
        return ResponseEntity.accepted().build();
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
