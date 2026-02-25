package com.example.backend.controller;

import com.example.backend.dto.AppointmentReminderMetricsResponse;
import com.example.backend.entity.AppointmentReminderMetricsEntity;
import com.example.backend.service.AppointmentReminderMetricsService;
import com.example.backend.util.TenantContext;
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
@RequestMapping("/api/v1/reports/appointment-reminders")
@Tag(
        name = "Appointment Reminder Reports",
        description =
                "API for appointment reminder analytics and metrics including delivery rates, read rates, and no-show correlation")
public class AppointmentReminderReportController {

    private final AppointmentReminderMetricsService metricsService;

    public AppointmentReminderReportController(AppointmentReminderMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping
    @Operation(
            summary = "Get appointment reminder metrics",
            description =
                    "Returns comprehensive appointment reminder metrics including time-series data, "
                            + "aggregated metrics by channel/template/agent, delivery rates, read rates, and no-show correlation. "
                            + "Supports pagination and filtering by channel, template, agent, and date range.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Metrics retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                AppointmentReminderMetricsResponse
                                                                        .class))),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid date parameters or filter values"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public ResponseEntity<AppointmentReminderMetricsResponse> getAppointmentReminderMetrics(
            @Parameter(
                            description =
                                    "Start date for metrics period (ISO format: yyyy-MM-dd). Defaults to 30 days ago if not specified.")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @Parameter(
                            description =
                                    "End date for metrics period (ISO format: yyyy-MM-dd). Defaults to current date if not specified.")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @Parameter(description = "Organization ID. Uses tenant context if not specified.")
                    @RequestParam(required = false)
                    String orgId) {

        LocalDateTime fromDateTime =
                from != null ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : LocalDateTime.now();

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        AppointmentReminderMetricsResponse metrics =
                metricsService.getAggregatedMetrics(effectiveOrgId, fromDateTime, toDateTime);

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/details")
    @Operation(
            summary = "Get detailed appointment reminder metrics with pagination",
            description =
                    "Returns paginated list of individual appointment reminder metrics with support for filtering by channel, "
                            + "template code, agent, and date range. Useful for detailed analysis and drill-down into specific reminders.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Detailed metrics retrieved successfully"),
                @ApiResponse(
                        responseCode = "400",
                        description = "Invalid pagination or filter parameters"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public ResponseEntity<Page<AppointmentReminderMetricsEntity>> getDetailedMetrics(
            @Parameter(description = "Filter by channel (e.g., WHATSAPP, SMS, EMAIL)")
                    @RequestParam(required = false)
                    String channel,
            @Parameter(description = "Filter by template code")
                    @RequestParam(required = false)
                    String templateCode,
            @Parameter(description = "Filter by agent ID") @RequestParam(required = false)
                    String agentId,
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
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
                                    "Sort field (default: sentAt). Available fields: sentAt, channel, status, templateCode, agentId")
                    @RequestParam(defaultValue = "sentAt")
                    String sort,
            @Parameter(description = "Sort direction (ASC or DESC, default: DESC)")
                    @RequestParam(defaultValue = "DESC")
                    String direction,
            @Parameter(description = "Organization ID") @RequestParam(required = false)
                    String orgId) {

        LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : null;

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        int validatedSize = Math.min(size, 100);

        Sort.Direction sortDirection =
                "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, validatedSize, Sort.by(sortDirection, sort));

        Page<AppointmentReminderMetricsEntity> metrics =
                metricsService.getMetrics(
                        effectiveOrgId,
                        channel,
                        templateCode,
                        agentId,
                        fromDateTime,
                        toDateTime,
                        pageable);

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/delivery-rate")
    @Operation(
            summary = "Get delivery rate for a specific channel",
            description =
                    "Calculates and returns the delivery rate percentage for appointment reminders sent through a specific channel "
                            + "within the specified date range. Delivery rate = (delivered messages / sent messages) * 100")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Delivery rate calculated successfully"),
                @ApiResponse(responseCode = "400", description = "Invalid channel or date range"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public ResponseEntity<Double> getDeliveryRate(
            @Parameter(description = "Channel (e.g., WHATSAPP, SMS, EMAIL)", required = true)
                    @RequestParam
                    String channel,
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @Parameter(description = "Organization ID") @RequestParam(required = false)
                    String orgId) {

        LocalDateTime fromDateTime =
                from != null ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : LocalDateTime.now();

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        Double deliveryRate =
                metricsService.computeDeliveryRate(
                        effectiveOrgId, channel, fromDateTime, toDateTime);

        return ResponseEntity.ok(deliveryRate);
    }

    @GetMapping("/read-rate")
    @Operation(
            summary = "Get read rate for a specific channel",
            description =
                    "Calculates and returns the read rate percentage for appointment reminders sent through a specific channel "
                            + "within the specified date range. Read rate = (read messages / sent messages) * 100")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Read rate calculated successfully"),
                @ApiResponse(responseCode = "400", description = "Invalid channel or date range"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public ResponseEntity<Double> getReadRate(
            @Parameter(description = "Channel (e.g., WHATSAPP, SMS, EMAIL)", required = true)
                    @RequestParam
                    String channel,
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @Parameter(description = "Organization ID") @RequestParam(required = false)
                    String orgId) {

        LocalDateTime fromDateTime =
                from != null ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : LocalDateTime.now();

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        Double readRate =
                metricsService.computeReadRate(effectiveOrgId, channel, fromDateTime, toDateTime);

        return ResponseEntity.ok(readRate);
    }

    @GetMapping("/no-show-correlation")
    @Operation(
            summary = "Get no-show correlation for a specific channel",
            description =
                    "Calculates and returns the no-show rate percentage for appointment reminders sent through a specific channel "
                            + "within the specified date range. No-show rate = (no-show appointments / sent reminders) * 100. "
                            + "This metric helps correlate reminder effectiveness with appointment attendance.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "No-show correlation calculated successfully"),
                @ApiResponse(responseCode = "400", description = "Invalid channel or date range"),
                @ApiResponse(responseCode = "401", description = "Unauthorized"),
                @ApiResponse(responseCode = "403", description = "Forbidden")
            })
    public ResponseEntity<Double> getNoShowCorrelation(
            @Parameter(description = "Channel (e.g., WHATSAPP, SMS, EMAIL)", required = true)
                    @RequestParam
                    String channel,
            @Parameter(description = "Start date (ISO format: yyyy-MM-dd)")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @Parameter(description = "End date (ISO format: yyyy-MM-dd)")
                    @RequestParam(required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @Parameter(description = "Organization ID") @RequestParam(required = false)
                    String orgId) {

        LocalDateTime fromDateTime =
                from != null ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDateTime = to != null ? to.atTime(23, 59, 59) : LocalDateTime.now();

        String effectiveOrgId = orgId != null ? orgId : TenantContext.getTenantId();

        Double noShowCorrelation =
                metricsService.computeNoShowCorrelation(
                        effectiveOrgId, channel, fromDateTime, toDateTime);

        return ResponseEntity.ok(noShowCorrelation);
    }
}
