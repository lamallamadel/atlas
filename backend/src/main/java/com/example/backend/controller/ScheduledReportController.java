package com.example.backend.controller;

import com.example.backend.dto.ScheduledReportRequest;
import com.example.backend.dto.ScheduledReportResponse;
import com.example.backend.service.ScheduledReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/scheduled-reports")
@Tag(name = "Scheduled Reports", description = "Automated report scheduling and delivery")
public class ScheduledReportController {

    private final ScheduledReportService scheduledReportService;

    public ScheduledReportController(ScheduledReportService scheduledReportService) {
        this.scheduledReportService = scheduledReportService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Create scheduled report",
            description = "Creates a new scheduled report configuration")
    public ResponseEntity<ScheduledReportResponse> createScheduledReport(
            @Valid @RequestBody ScheduledReportRequest request, Authentication authentication) {
        String orgId = "default";
        ScheduledReportResponse response =
                scheduledReportService.createScheduledReport(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List scheduled reports",
            description = "Returns a paginated list of scheduled reports")
    public ResponseEntity<Page<ScheduledReportResponse>> getScheduledReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        String orgId = "default";
        Pageable pageable = PageRequest.of(page, size);
        Page<ScheduledReportResponse> response =
                scheduledReportService.getScheduledReports(orgId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get scheduled report",
            description = "Returns a single scheduled report by ID")
    public ResponseEntity<ScheduledReportResponse> getScheduledReport(
            @PathVariable Long id, Authentication authentication) {
        String orgId = "default";
        ScheduledReportResponse response = scheduledReportService.getScheduledReport(id, orgId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Update scheduled report",
            description = "Updates an existing scheduled report")
    public ResponseEntity<ScheduledReportResponse> updateScheduledReport(
            @PathVariable Long id,
            @Valid @RequestBody ScheduledReportRequest request,
            Authentication authentication) {
        String orgId = "default";
        ScheduledReportResponse response =
                scheduledReportService.updateScheduledReport(id, orgId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Delete scheduled report", description = "Deletes a scheduled report")
    public ResponseEntity<Void> deleteScheduledReport(
            @PathVariable Long id, Authentication authentication) {
        String orgId = "default";
        scheduledReportService.deleteScheduledReport(id, orgId);
        return ResponseEntity.noContent().build();
    }
}
