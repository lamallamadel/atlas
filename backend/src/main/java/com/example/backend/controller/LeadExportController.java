package com.example.backend.controller;

import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.LeadExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/leads")
@Tag(name = "Lead Export", description = "API for exporting leads to CSV files")
public class LeadExportController {

    private final LeadExportService leadExportService;

    public LeadExportController(LeadExportService leadExportService) {
        this.leadExportService = leadExportService;
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Export leads to CSV",
            description =
                    "Exports leads to a CSV file with optional filters and configurable columns")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Export completed successfully"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid parameters",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                @ApiResponse(
                        responseCode = "500",
                        description = "Export failed",
                        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public void exportLeads(
            @Parameter(description = "Filter by status (e.g., NEW, QUALIFIED, WON, LOST)")
                    @RequestParam(value = "status", required = false)
                    DossierStatus status,
            @Parameter(description = "Filter by start date (ISO format: yyyy-MM-dd'T'HH:mm:ss)")
                    @RequestParam(value = "startDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    LocalDateTime startDate,
            @Parameter(description = "Filter by end date (ISO format: yyyy-MM-dd'T'HH:mm:ss)")
                    @RequestParam(value = "endDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    LocalDateTime endDate,
            @Parameter(description = "Filter by source (e.g., WEB, MOBILE, PHONE, EMAIL)")
                    @RequestParam(value = "source", required = false)
                    DossierSource source,
            @Parameter(
                            description =
                                    "Comma-separated list of columns to include (e.g., id,name,phone,email)")
                    @RequestParam(value = "columns", required = false)
                    String columns,
            HttpServletResponse response)
            throws IOException {

        List<String> columnList = null;
        if (columns != null && !columns.trim().isEmpty()) {
            columnList =
                    Arrays.stream(columns.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
        }

        String timestamp =
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "leads_export_" + timestamp + ".csv";

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        response.setCharacterEncoding("UTF-8");

        try (Writer writer =
                new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8)) {
            leadExportService.exportLeads(writer, status, startDate, endDate, source, columnList);
            writer.flush();
        }
    }
}
