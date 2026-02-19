package com.example.backend.controller;

import com.example.backend.dto.ImportJobMapper;
import com.example.backend.dto.ImportJobResponse;
import com.example.backend.dto.LeadImportResponse;
import com.example.backend.entity.ImportJobEntity;
import com.example.backend.entity.enums.MergeStrategy;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.repository.ImportJobRepository;
import com.example.backend.service.LeadImportService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/leads")
@Tag(name = "Lead Import", description = "API for importing leads from CSV files")
public class LeadImportController {

    private final LeadImportService leadImportService;
    private final ImportJobRepository importJobRepository;
    private final ImportJobMapper importJobMapper;

    public LeadImportController(
            LeadImportService leadImportService,
            ImportJobRepository importJobRepository,
            ImportJobMapper importJobMapper) {
        this.leadImportService = leadImportService;
        this.importJobRepository = importJobRepository;
        this.importJobMapper = importJobMapper;
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Import leads from CSV",
            description =
                    "Uploads a CSV file to import leads with duplicate detection and merge strategy")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Import completed successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                LeadImportResponse.class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid file or data",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(
                        responseCode = "500",
                        description = "Import failed",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<LeadImportResponse> importLeads(
            @Parameter(description = "CSV file containing leads", required = true)
                    @RequestParam("file")
                    MultipartFile file,
            @Parameter(
                            description =
                                    "Merge strategy for duplicates: SKIP, OVERWRITE, or CREATE_NEW",
                            schema = @Schema(defaultValue = "SKIP"))
                    @RequestParam(value = "mergeStrategy", defaultValue = "SKIP")
                    MergeStrategy mergeStrategy) {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("File must be a CSV file");
        }

        LeadImportResponse response = leadImportService.importLeads(file, mergeStrategy);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/import/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get import history",
            description = "Retrieves the history of all import jobs for the current organization")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Import history retrieved successfully",
                        content =
                                @Content(
                                        schema = @Schema(implementation = ImportJobResponse.class)))
            })
    public ResponseEntity<List<ImportJobResponse>> getImportHistory() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        List<ImportJobEntity> jobs = importJobRepository.findByOrgIdOrderByCreatedAtDesc(orgId);
        List<ImportJobResponse> responses =
                jobs.stream().map(importJobMapper::toResponse).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/import/history/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get import job details",
            description = "Retrieves detailed information about a specific import job")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Import job found",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = ImportJobResponse.class))),
                @ApiResponse(
                        responseCode = "404",
                        description = "Import job not found",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ResponseEntity<ImportJobResponse> getImportJobById(
            @Parameter(description = "ID of the import job", required = true) @PathVariable
                    Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ImportJobEntity job =
                importJobRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Import job not found with id: " + id));

        if (!orgId.equals(job.getOrgId())) {
            throw new EntityNotFoundException("Import job not found with id: " + id);
        }

        return ResponseEntity.ok(importJobMapper.toResponse(job));
    }
}
