package com.example.backend.controller;

import com.example.backend.dto.ConsentAuditReportResponse;
import com.example.backend.dto.ConsentEventMapper;
import com.example.backend.dto.ConsentEventResponse;
import com.example.backend.entity.ConsentEventEntity;
import com.example.backend.service.ConsentAuditReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports/consent-audit")
@Tag(
        name = "Consent Audit Reports",
        description =
                "GDPR-compliant consent audit reports with complete consent history and immutable event sourcing")
public class ConsentAuditReportController {

    private final ConsentAuditReportService consentAuditReportService;
    private final ConsentEventMapper consentEventMapper;

    public ConsentAuditReportController(
            ConsentAuditReportService consentAuditReportService,
            ConsentEventMapper consentEventMapper) {
        this.consentAuditReportService = consentAuditReportService;
        this.consentEventMapper = consentEventMapper;
    }

    @GetMapping
    @Operation(
            summary = "Get consent audit report",
            description =
                    "Generates a GDPR-compliant consent audit report showing complete consent history. "
                            + "Supports filtering by dossier ID and date range with pagination. "
                            + "The report includes detailed event timeline, summary statistics, and is based on immutable event sourcing.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Consent audit report retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ConsentEventResponse.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden"),
                @ApiResponse(responseCode = "404", description = "Dossier not found")
            })
    public ResponseEntity<Page<ConsentEventResponse>> getConsentAuditReport(
            @Parameter(description = "Filter by dossier ID (optional)")
                    @RequestParam(required = false)
                    Long dossierId,
            @Parameter(
                            description =
                                    "Start date for audit period (ISO format: yyyy-MM-dd). Defaults to 90 days ago if not specified.")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @Parameter(
                            description =
                                    "End date for audit period (ISO format: yyyy-MM-dd). Defaults to current date if not specified.")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @Parameter(description = "Page number (0-based, default: 0)")
                    @RequestParam(defaultValue = "0")
                    int page,
            @Parameter(description = "Page size (default: 20, max: 100)")
                    @RequestParam(defaultValue = "20")
                    int size,
            @Parameter(
                            description =
                                    "Sort field (default: createdAt). Available fields: createdAt, eventType, channel, consentType")
                    @RequestParam(defaultValue = "createdAt")
                    String sort,
            @Parameter(description = "Sort direction (ASC or DESC, default: DESC)")
                    @RequestParam(defaultValue = "DESC")
                    String direction) {

        LocalDateTime fromDateTime =
                from != null ? from.atStartOfDay() : LocalDateTime.now().minusDays(90);
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : LocalDateTime.now();

        int validatedSize = Math.min(size, 100);

        Sort.Direction sortDirection =
                "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, validatedSize, Sort.by(sortDirection, sort));

        Page<ConsentEventEntity> events =
                consentAuditReportService.getConsentAuditEvents(
                        dossierId, fromDateTime, toDateTime, pageable);

        Page<ConsentEventResponse> response = events.map(consentEventMapper::toResponse);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dossier/{dossierId}")
    @Operation(
            summary = "Get complete consent audit report for a specific dossier",
            description =
                    "Generates a comprehensive GDPR-compliant consent audit report for a specific dossier. "
                            + "Includes complete consent history timeline, summary statistics (granted, revoked, expired, renewed counts), "
                            + "and client information. Based on immutable event sourcing for full auditability.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Dossier consent audit report retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                ConsentAuditReportResponse.class))),
                @ApiResponse(responseCode = "400", description = "Invalid dossier ID"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden"),
                @ApiResponse(responseCode = "404", description = "Dossier not found")
            })
    public ResponseEntity<ConsentAuditReportResponse> getDossierConsentAuditReport(
            @Parameter(description = "Dossier ID", required = true) @PathVariable Long dossierId) {

        ConsentAuditReportResponse report =
                consentAuditReportService.generateDossierConsentAuditReport(dossierId);

        return ResponseEntity.ok(report);
    }
}
