package com.example.backend.controller;

import com.example.backend.dto.AnalyticsResponse;
import com.example.backend.dto.MetabaseEmbedRequest;
import com.example.backend.dto.MetabaseEmbedResponse;
import com.example.backend.service.AdvancedAnalyticsService;
import com.example.backend.service.MetabaseDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "Advanced analytics and BI endpoints")
public class AnalyticsController {

    private final AdvancedAnalyticsService analyticsService;
    private final MetabaseDashboardService metabaseDashboardService;

    public AnalyticsController(
            AdvancedAnalyticsService analyticsService,
            MetabaseDashboardService metabaseDashboardService) {
        this.analyticsService = analyticsService;
        this.metabaseDashboardService = metabaseDashboardService;
    }

    @PostMapping("/metabase/embed")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Generate Metabase embed URL", description = "Generates a signed JWT URL for embedding Metabase dashboards")
    public ResponseEntity<MetabaseEmbedResponse> generateMetabaseEmbedUrl(
            @RequestBody MetabaseEmbedRequest request) {
        MetabaseEmbedResponse response = metabaseDashboardService.generateEmbedUrl(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/metabase/question/{questionId}/embed")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Generate Metabase question embed URL")
    public ResponseEntity<MetabaseEmbedResponse> generateQuestionEmbedUrl(
            @PathVariable String questionId,
            @RequestBody Map<String, Object> params) {
        MetabaseEmbedResponse response = metabaseDashboardService
            .generateQuestionEmbedUrl(questionId, params, 10L);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/metabase/sso-token")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get Metabase SSO token")
    public ResponseEntity<Map<String, String>> getMetabaseSSOToken(Authentication authentication) {
        String userId = authentication.getName();
        String email = authentication.getName();
        String orgId = "default";
        
        String token = metabaseDashboardService.authenticateWithSSO(userId, email, orgId);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/cohort-analysis")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get cohort analysis", description = "Returns cohort conversion analysis by acquisition month")
    public ResponseEntity<AnalyticsResponse> getCohortAnalysis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        String orgId = "default";
        AnalyticsResponse response = analyticsService.getCohortAnalysis(orgId, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/funnel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get funnel visualization", description = "Returns funnel visualization with drop-off rates")
    public ResponseEntity<AnalyticsResponse> getFunnelVisualization(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        String orgId = "default";
        AnalyticsResponse response = analyticsService.getFunnelVisualization(orgId, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/agent-performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get agent performance leaderboard", description = "Returns agent performance metrics and leaderboard")
    public ResponseEntity<AnalyticsResponse> getAgentPerformanceLeaderboard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        String orgId = "default";
        AnalyticsResponse response = analyticsService.getAgentPerformanceLeaderboard(orgId, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/market-trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get property market trends", description = "Returns market trends by location and property type")
    public ResponseEntity<AnalyticsResponse> getPropertyMarketTrends(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        String orgId = "default";
        AnalyticsResponse response = analyticsService.getPropertyMarketTrends(orgId, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/revenue-forecast")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get revenue forecast", description = "Returns revenue forecast using historical patterns")
    public ResponseEntity<AnalyticsResponse> getRevenueForecast(
            @RequestParam(defaultValue = "6") int forecastMonths,
            Authentication authentication) {
        String orgId = "default";
        AnalyticsResponse response = analyticsService.getRevenueForecast(orgId, forecastMonths);
        return ResponseEntity.ok(response);
    }
}
