package com.example.backend.controller;

import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.KpiCardDto;
import com.example.backend.dto.TrendData;
import com.example.backend.service.DashboardKpiService;
import com.example.backend.service.DashboardService;
import com.example.backend.service.OutboundMessageAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "API for dashboard KPIs and statistics")
public class DashboardController {

    private final DashboardService dashboardService;
    private final DashboardKpiService dashboardKpiService;
    private final OutboundMessageAlertService outboundMessageAlertService;

    public DashboardController(
            DashboardService dashboardService,
            DashboardKpiService dashboardKpiService,
            OutboundMessageAlertService outboundMessageAlertService) {
        this.dashboardService = dashboardService;
        this.dashboardKpiService = dashboardKpiService;
        this.outboundMessageAlertService = outboundMessageAlertService;
    }

    @GetMapping("/kpis/annonces-actives")
    @Operation(
            summary = "Get count of active annonces",
            description = "Returns the count of annonces with ACTIVE status and trend comparison")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "KPI data retrieved successfully",
                        content = @Content(schema = @Schema(implementation = KpiCardDto.class)))
            })
    public ResponseEntity<KpiCardDto> getActiveAnnoncesCount(
            @RequestParam(required = false) String period) {
        KpiCardDto kpi = dashboardService.getActiveAnnoncesCount(period);
        return ResponseEntity.ok(kpi);
    }

    @GetMapping("/kpis/dossiers-a-traiter")
    @Operation(
            summary = "Get count of dossiers to process",
            description =
                    "Returns the count of dossiers with NEW or QUALIFIED status and trend comparison")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "KPI data retrieved successfully",
                        content = @Content(schema = @Schema(implementation = KpiCardDto.class)))
            })
    public ResponseEntity<KpiCardDto> getDossiersATraiterCount(
            @RequestParam(required = false) String period) {
        KpiCardDto kpi = dashboardService.getDossiersATraiterCount(period);
        return ResponseEntity.ok(kpi);
    }

    @GetMapping("/dossiers/recent")
    @Operation(
            summary = "Get recent dossiers",
            description =
                    "Returns the 5 most recently created dossiers ordered by created_at descending")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Recent dossiers retrieved successfully",
                        content = @Content(schema = @Schema(implementation = List.class)))
            })
    public ResponseEntity<List<DossierResponse>> getRecentDossiers() {
        List<DossierResponse> recentDossiers = dashboardService.getRecentDossiers();
        return ResponseEntity.ok(recentDossiers);
    }

    @GetMapping("/kpis/trends")
    @Operation(
            summary = "Get KPI trends",
            description =
                    "Returns trend data for all KPIs with current value, previous value, and percentage change")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Trend data retrieved successfully",
                        content = @Content(schema = @Schema(implementation = Map.class)))
            })
    public ResponseEntity<Map<String, TrendData>> getTrends(
            @RequestParam(required = false) String period) {
        Map<String, TrendData> trends = dashboardKpiService.getTrends(period);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/outbound/health")
    @Operation(
            summary = "Get outbound message health metrics",
            description =
                    "Returns real-time health metrics for outbound message processing including queue depths, DLQ size, and per-channel statistics")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Health metrics retrieved successfully")
            })
    public ResponseEntity<OutboundMessageAlertService.OutboundHealthMetrics> getOutboundHealth() {
        OutboundMessageAlertService.OutboundHealthMetrics metrics =
                outboundMessageAlertService.getHealthMetrics();
        return ResponseEntity.ok(metrics);
    }
}
