package com.example.backend.controller;

import com.example.backend.dto.AgentPerformanceResponse;
import com.example.backend.dto.FunnelAnalysisResponse;
import com.example.backend.dto.KpiReportResponse;
import com.example.backend.dto.PipelineSummaryResponse;
import com.example.backend.dto.RevenueForecastResponse;
import com.example.backend.service.ReportingService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "API for generating KPI and reporting analytics")
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/kpi")
    @Operation(summary = "Get KPI report", description = "Returns comprehensive KPI metrics including conversion rates, response times, appointment show rates, and pipeline velocity")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "KPI report generated successfully",
                    content = @Content(schema = @Schema(implementation = KpiReportResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters")
    })
    public ResponseEntity<KpiReportResponse> getKpiReport(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        KpiReportResponse report = reportingService.generateKpiReport(fromDateTime, toDateTime, effectiveOrgId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/pipeline-summary")
    @Operation(summary = "Get pipeline summary", description = "Returns summary of dossiers across all pipeline stages with counts and percentages")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pipeline summary generated successfully",
                    content = @Content(schema = @Schema(implementation = PipelineSummaryResponse.class)))
    })
    public ResponseEntity<PipelineSummaryResponse> getPipelineSummary(
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        PipelineSummaryResponse summary = reportingService.generatePipelineSummary(effectiveOrgId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/funnel-analysis")
    @Operation(summary = "Get funnel analysis", description = "Returns conversion funnel analysis with NEW→WON rates by source and stage-by-stage conversion metrics")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Funnel analysis generated successfully",
                    content = @Content(schema = @Schema(implementation = FunnelAnalysisResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters")
    })
    public ResponseEntity<FunnelAnalysisResponse> getFunnelAnalysis(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        FunnelAnalysisResponse analysis = reportingService.generateFunnelAnalysis(fromDateTime, toDateTime, effectiveOrgId);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/agent-performance")
    @Operation(summary = "Get agent performance metrics", description = "Returns detailed agent performance metrics including response time, messages sent, appointments scheduled, and win rates")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Agent performance metrics generated successfully",
                    content = @Content(schema = @Schema(implementation = AgentPerformanceResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters")
    })
    public ResponseEntity<AgentPerformanceResponse> getAgentPerformance(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        AgentPerformanceResponse performance = reportingService.generateAgentPerformance(fromDateTime, toDateTime, effectiveOrgId);
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/revenue-forecast")
    @Operation(summary = "Get revenue forecast", description = "Returns revenue forecast based on pipeline value and historical conversion rates, with breakdown by stage and source")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Revenue forecast generated successfully",
                    content = @Content(schema = @Schema(implementation = RevenueForecastResponse.class)))
    })
    public ResponseEntity<RevenueForecastResponse> getRevenueForecast(
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        RevenueForecastResponse forecast = reportingService.generateRevenueForecast(effectiveOrgId);
        return ResponseEntity.ok(forecast);
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get analytics data", description = "Returns comprehensive analytics including agent performance, revenue forecast, lead sources, and conversion funnel")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Analytics data generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters")
    })
    public ResponseEntity<java.util.Map<String, Object>> getAnalyticsData(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        java.util.Map<String, Object> analyticsData = reportingService.generateAnalyticsData(fromDateTime, toDateTime, effectiveOrgId);
        return ResponseEntity.ok(analyticsData);
    }
}
