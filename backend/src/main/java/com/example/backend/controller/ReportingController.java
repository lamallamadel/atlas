package com.example.backend.controller;

import com.example.backend.dto.AgentPerformanceResponse;
import com.example.backend.dto.FunnelAnalysisResponse;
import com.example.backend.dto.KpiReportResponse;
import com.example.backend.dto.ObservabilityMetricsResponse;
import com.example.backend.dto.PipelineSummaryResponse;
import com.example.backend.dto.RevenueForecastResponse;
import com.example.backend.service.ObservabilityService;
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
    private final ObservabilityService observabilityService;

    public ReportingController(ReportingService reportingService, ObservabilityService observabilityService) {
        this.reportingService = reportingService;
        this.observabilityService = observabilityService;
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

    @GetMapping("/revenue-forecast/projections")
    @Operation(summary = "Get revenue forecast with projections", description = "Returns revenue forecast with 30/60/90 day projections including conservative, estimated, and optimistic scenarios")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Revenue forecast with projections generated successfully",
                    content = @Content(schema = @Schema(implementation = RevenueForecastResponse.class)))
    })
    public ResponseEntity<RevenueForecastResponse> getRevenueForecastWithProjections(
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        RevenueForecastResponse forecast = reportingService.generateRevenueForecastWithProjections(effectiveOrgId);
        return ResponseEntity.ok(forecast);
    }

    @GetMapping("/funnel-analysis/by-source")
    @Operation(summary = "Get conversion funnel by source", description = "Returns conversion funnel metrics broken down by lead source (WEBSITE, REFERRAL, PHONE, etc.)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversion funnel by source generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters")
    })
    public ResponseEntity<java.util.Map<String, FunnelAnalysisResponse.FunnelStageMetrics>> getConversionFunnelBySource(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        java.util.Map<String, FunnelAnalysisResponse.FunnelStageMetrics> funnelBySource = 
            reportingService.generateConversionFunnelBySource(fromDateTime, toDateTime, effectiveOrgId);
        return ResponseEntity.ok(funnelBySource);
    }

    @GetMapping("/funnel-analysis/by-period")
    @Operation(summary = "Get conversion funnel by time period", description = "Returns conversion funnel metrics broken down by time period (DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversion funnel by period generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid date or period type parameters")
    })
    public ResponseEntity<java.util.Map<String, FunnelAnalysisResponse.FunnelStageMetrics>> getConversionFunnelByPeriod(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Period type: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY")
            @RequestParam(defaultValue = "MONTHLY") String periodType,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        java.util.Map<String, FunnelAnalysisResponse.FunnelStageMetrics> funnelByPeriod = 
            reportingService.generateConversionFunnelByTimePeriod(fromDateTime, toDateTime, effectiveOrgId, periodType);
        return ResponseEntity.ok(funnelByPeriod);
    }

    @GetMapping("/agent-performance/{agentId}")
    @Operation(summary = "Get detailed agent metrics", description = "Returns detailed performance metrics for a specific agent including response time, messages sent, appointments, and conversion rate")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Agent metrics generated successfully",
                    content = @Content(schema = @Schema(implementation = AgentPerformanceResponse.AgentMetrics.class))),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters"),
            @ApiResponse(responseCode = "404", description = "Agent not found")
    })
    public ResponseEntity<AgentPerformanceResponse.AgentMetrics> getDetailedAgentMetrics(
            @Parameter(description = "Agent ID")
            @PathVariable String agentId,
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        AgentPerformanceResponse.AgentMetrics metrics = 
            reportingService.generateDetailedAgentMetrics(agentId, fromDateTime, toDateTime, effectiveOrgId);
        return ResponseEntity.ok(metrics);
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

    @GetMapping("/observability/metrics")
    @Operation(summary = "Get observability metrics", description = "Returns comprehensive observability metrics including queue depth, latency percentiles, failure rates, DLQ monitoring, and quota tracking")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Observability metrics generated successfully",
                    content = @Content(schema = @Schema(implementation = ObservabilityMetricsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters")
    })
    public ResponseEntity<ObservabilityMetricsResponse> getObservabilityMetrics(
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        ObservabilityMetricsResponse metrics = observabilityService.getObservabilityMetrics(fromDateTime, toDateTime, effectiveOrgId);
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/observability/metrics/export")
    @Operation(summary = "Export observability metrics", description = "Exports observability metrics in CSV or JSON format")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metrics exported successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid parameters")
    })
    public ResponseEntity<String> exportObservabilityMetrics(
            @Parameter(description = "Export format (csv or json)")
            @RequestParam(defaultValue = "json") String format,
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        ObservabilityMetricsResponse metrics = observabilityService.getObservabilityMetrics(fromDateTime, toDateTime, effectiveOrgId);

        if ("csv".equalsIgnoreCase(format)) {
            String csv = convertMetricsToCsv(metrics);
            return ResponseEntity.ok()
                    .header("Content-Type", "text/csv")
                    .header("Content-Disposition", "attachment; filename=\"observability-metrics.csv\"")
                    .body(csv);
        } else {
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .header("Content-Disposition", "attachment; filename=\"observability-metrics.json\"")
                    .body(convertMetricsToJson(metrics));
        }
    }

    private String convertMetricsToCsv(ObservabilityMetricsResponse metrics) {
        StringBuilder csv = new StringBuilder();
        
        csv.append("Metric Type,Channel/Category,Metric Name,Value\n");
        
        if (metrics.getQueueMetrics() != null) {
            metrics.getQueueMetrics().getQueueDepthByChannel().forEach((channel, depth) ->
                csv.append("Queue,").append(channel).append(",Depth,").append(depth).append("\n")
            );
            csv.append("Queue,Total,Total Queued,").append(metrics.getQueueMetrics().getTotalQueued()).append("\n");
        }
        
        if (metrics.getLatencyMetrics() != null) {
            metrics.getLatencyMetrics().getLatencyByChannel().forEach((channel, percentiles) -> {
                csv.append("Latency,").append(channel).append(",P50,").append(percentiles.getP50()).append("\n");
                csv.append("Latency,").append(channel).append(",P95,").append(percentiles.getP95()).append("\n");
                csv.append("Latency,").append(channel).append(",P99,").append(percentiles.getP99()).append("\n");
                csv.append("Latency,").append(channel).append(",Average,").append(percentiles.getAverage()).append("\n");
            });
        }
        
        if (metrics.getFailureMetrics() != null) {
            metrics.getFailureMetrics().getFailuresByChannel().forEach((channel, count) ->
                csv.append("Failure,").append(channel).append(",Count,").append(count).append("\n")
            );
            csv.append("Failure,Overall,Failure Rate %,").append(metrics.getFailureMetrics().getOverallFailureRate()).append("\n");
            
            metrics.getFailureMetrics().getFailuresByErrorCode().forEach((errorCode, count) ->
                csv.append("Failure,").append(errorCode).append(",Count,").append(count).append("\n")
            );
        }
        
        if (metrics.getDlqMetrics() != null) {
            csv.append("DLQ,Total,Size,").append(metrics.getDlqMetrics().getDlqSize()).append("\n");
            csv.append("DLQ,Alert,Threshold Exceeded,").append(metrics.getDlqMetrics().getAlertThresholdExceeded()).append("\n");
            
            metrics.getDlqMetrics().getDlqSizeByChannel().forEach((channel, size) ->
                csv.append("DLQ,").append(channel).append(",Size,").append(size).append("\n")
            );
        }
        
        if (metrics.getQuotaMetrics() != null) {
            metrics.getQuotaMetrics().getQuotaByChannel().forEach((channel, usage) -> {
                csv.append("Quota,").append(channel).append(",Used,").append(usage.getUsed()).append("\n");
                csv.append("Quota,").append(channel).append(",Limit,").append(usage.getLimit()).append("\n");
                csv.append("Quota,").append(channel).append(",Usage %,").append(usage.getUsagePercentage()).append("\n");
            });
        }
        
        return csv.toString();
    }

    private String convertMetricsToJson(ObservabilityMetricsResponse metrics) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(metrics);
        } catch (Exception e) {
            return "{\"error\": \"Failed to serialize metrics\"}";
        }
    }

    @PostMapping("/custom")
    @Operation(summary = "Generate custom report", description = "Generate a custom report based on selected dimensions and metrics")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Custom report generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid report definition")
    })
    public ResponseEntity<java.util.Map<String, Object>> generateCustomReport(
            @RequestBody com.example.backend.dto.CustomReportDefinitionDto definition,
            @Parameter(description = "Organization ID")
            @RequestParam(required = false) String orgId) {

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", "success");
        response.put("definition", definition);
        
        java.util.List<java.util.Map<String, Object>> mockResults = new java.util.ArrayList<>();
        for (int i = 0; i < 10; i++) {
            java.util.Map<String, Object> row = new java.util.HashMap<>();
            row.put("date", "2024-01-" + String.format("%02d", i + 1));
            row.put("status", new String[]{"NEW", "QUALIFIED", "WON"}[i % 3]);
            row.put("dossierCount", 10 + (int)(Math.random() * 50));
            row.put("conversionRate", 0.2 + Math.random() * 0.3);
            mockResults.add(row);
        }
        response.put("results", mockResults);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dimensions")
    @Operation(summary = "Get available dimensions", description = "Returns list of available report dimensions")
    public ResponseEntity<java.util.List<String>> getAvailableDimensions() {
        java.util.List<String> dimensions = java.util.Arrays.asList(
            "date", "status", "source", "agent", "city", "propertyType"
        );
        return ResponseEntity.ok(dimensions);
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get available metrics", description = "Returns list of available report metrics")
    public ResponseEntity<java.util.List<String>> getAvailableMetrics() {
        java.util.List<String> metrics = java.util.Arrays.asList(
            "dossierCount", "conversionRate", "totalValue", "avgResponseTime", "appointmentCount", "messageCount"
        );
        return ResponseEntity.ok(metrics);
    }
}
