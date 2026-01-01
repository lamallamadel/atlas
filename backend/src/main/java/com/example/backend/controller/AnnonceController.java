package com.example.backend.controller;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceService;
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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/annonces")
@Tag(name = "Annonces", description = "API for managing annonces")
public class AnnonceController {

    private final AnnonceService annonceService;

    public AnnonceController(AnnonceService annonceService) {
        this.annonceService = annonceService;
    }

    @PostMapping
    @Operation(summary = "Create a new annonce", description = "Creates a new annonce with the provided details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Annonce created successfully",
                    content = @Content(schema = @Schema(implementation = AnnonceResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content)
    })
    public ResponseEntity<AnnonceResponse> create(
            @Valid @RequestBody AnnonceCreateRequest request) {
        AnnonceResponse response = annonceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get annonce by ID", description = "Retrieves a single annonce by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Annonce found",
                    content = @Content(schema = @Schema(implementation = AnnonceResponse.class))),
            @ApiResponse(responseCode = "404", description = "Annonce not found",
                    content = @Content)
    })
    public ResponseEntity<AnnonceResponse> getById(
            @Parameter(description = "ID of the annonce to retrieve", required = true)
            @PathVariable Long id) {
        try {
            AnnonceResponse response = annonceService.getById(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an annonce", description = "Updates an existing annonce with the provided details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Annonce updated successfully",
                    content = @Content(schema = @Schema(implementation = AnnonceResponse.class))),
            @ApiResponse(responseCode = "404", description = "Annonce not found",
                    content = @Content),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content)
    })
    public ResponseEntity<AnnonceResponse> update(
            @Parameter(description = "ID of the annonce to update", required = true)
            @PathVariable Long id,
            @Valid @RequestBody AnnonceUpdateRequest request) {
        try {
            AnnonceResponse response = annonceService.update(id, request);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @Operation(summary = "List annonces", description = "Retrieves a paginated list of annonces with optional filtering")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Annonces retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    public ResponseEntity<Page<AnnonceResponse>> list(
            @Parameter(description = "Filter by annonce status")
            @RequestParam(required = false) AnnonceStatus status,
            @Parameter(description = "Search query to filter annonces by title, description, category, or city")
            @RequestParam(required = false) String q,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc). Default sort order is ascending. Multiple sort criteria are supported.")
            @RequestParam(defaultValue = "id,asc") String sort) {
        
        Pageable pageable = createPageable(page, size, sort);
        Page<AnnonceResponse> response = annonceService.list(status, q, pageable);
        return ResponseEntity.ok(response);
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
