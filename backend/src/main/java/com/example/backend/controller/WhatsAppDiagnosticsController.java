package com.example.backend.controller;

import com.example.backend.dto.v2.*;
import com.example.backend.entity.OrganizationSettings;
import com.example.backend.entity.OutboundAttemptEntity;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppSessionWindow;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.OrganizationSettingsRepository;
import com.example.backend.repository.OutboundAttemptRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.repository.WhatsAppSessionWindowRepository;
import com.example.backend.service.WhatsAppCostTrackingService;
import com.example.backend.service.WhatsAppRateLimitService;
import com.example.backend.service.WhatsAppSessionWindowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/whatsapp")
@PreAuthorize("hasRole('ADMIN')")
@Tag(
        name = "WhatsApp Admin",
        description =
                "Administrative endpoints for WhatsApp quota management and diagnostics (Admin only)")
public class WhatsAppDiagnosticsController {

    private static final Logger logger =
            LoggerFactory.getLogger(WhatsAppDiagnosticsController.class);

    private final WhatsAppSessionWindowRepository sessionWindowRepository;
    private final OutboundMessageRepository outboundMessageRepository;
    private final OutboundAttemptRepository outboundAttemptRepository;
    private final WhatsAppSessionWindowService sessionWindowService;
    private final WhatsAppRateLimitService rateLimitService;
    private final WhatsAppCostTrackingService costTrackingService;
    private final OrganizationSettingsRepository organizationSettingsRepository;

    public WhatsAppDiagnosticsController(
            WhatsAppSessionWindowRepository sessionWindowRepository,
            OutboundMessageRepository outboundMessageRepository,
            OutboundAttemptRepository outboundAttemptRepository,
            WhatsAppSessionWindowService sessionWindowService,
            WhatsAppRateLimitService rateLimitService,
            WhatsAppCostTrackingService costTrackingService,
            OrganizationSettingsRepository organizationSettingsRepository) {
        this.sessionWindowRepository = sessionWindowRepository;
        this.outboundMessageRepository = outboundMessageRepository;
        this.outboundAttemptRepository = outboundAttemptRepository;
        this.sessionWindowService = sessionWindowService;
        this.rateLimitService = rateLimitService;
        this.costTrackingService = costTrackingService;
        this.organizationSettingsRepository = organizationSettingsRepository;
    }

    @GetMapping("/sessions")
    @Operation(
            summary = "Get active WhatsApp session windows",
            description =
                    "Returns all active session windows with expiry timestamps for monitoring customer conversation windows")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Session windows retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WhatsAppSessionsResponse.class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<WhatsAppSessionsResponse> getActiveSessions(
            @Parameter(description = "Filter by active status (default: all)")
                    @RequestParam(required = false)
                    Boolean active,
            @Parameter(description = "Maximum number of results (default: 100)")
                    @RequestParam(defaultValue = "100")
                    int limit) {

        logger.debug(
                "GET /api/v2/diagnostics/whatsapp/sessions - active={}, limit={}", active, limit);

        LocalDateTime now = LocalDateTime.now();
        List<WhatsAppSessionWindow> allSessions =
                sessionWindowRepository
                        .findAll(
                                PageRequest.of(
                                        0, limit, Sort.by(Sort.Direction.DESC, "windowExpiresAt")))
                        .getContent();

        List<WhatsAppSessionWindowDto> sessions =
                allSessions.stream()
                        .filter(session -> active == null || (active == session.isWithinWindow()))
                        .map(
                                session -> {
                                    WhatsAppSessionWindowDto dto = new WhatsAppSessionWindowDto();
                                    dto.setId(session.getId());
                                    dto.setPhoneNumber(session.getPhoneNumber());
                                    dto.setWindowOpensAt(session.getWindowOpensAt());
                                    dto.setWindowExpiresAt(session.getWindowExpiresAt());
                                    dto.setLastInboundMessageAt(session.getLastInboundMessageAt());
                                    dto.setLastOutboundMessageAt(
                                            session.getLastOutboundMessageAt());
                                    dto.setActive(session.isWithinWindow());
                                    dto.setOrgId(session.getOrgId());

                                    if (session.getWindowExpiresAt().isAfter(now)) {
                                        long secondsRemaining =
                                                java.time.Duration.between(
                                                                now, session.getWindowExpiresAt())
                                                        .getSeconds();
                                        dto.setSecondsRemaining(secondsRemaining);
                                    } else {
                                        dto.setSecondsRemaining(0L);
                                    }

                                    return dto;
                                })
                        .collect(Collectors.toList());

        WhatsAppSessionsResponse response = new WhatsAppSessionsResponse();
        response.setSessions(sessions);
        response.setTotalCount(sessions.size());
        response.setActiveCount(
                sessions.stream().filter(WhatsAppSessionWindowDto::isActive).count());
        response.setTimestamp(LocalDateTime.now());

        logger.info(
                "Retrieved {} session windows ({} active)",
                response.getTotalCount(),
                response.getActiveCount());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/retry-queue")
    @Operation(
            summary = "Get messages in retry queue",
            description =
                    "Returns all messages in QUEUED status with next retry times for monitoring message processing")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Retry queue retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WhatsAppRetryQueueResponse.class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<WhatsAppRetryQueueResponse> getRetryQueue(
            @Parameter(description = "Maximum number of results (default: 100)")
                    @RequestParam(defaultValue = "100")
                    int limit) {

        logger.debug("GET /api/v2/diagnostics/whatsapp/retry-queue - limit={}", limit);

        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "createdAt"));
        List<OutboundMessageEntity> queuedMessages =
                outboundMessageRepository.findPendingMessages(
                        OutboundMessageStatus.QUEUED, pageable);

        List<WhatsAppQueuedMessageDto> messages =
                queuedMessages.stream()
                        .filter(msg -> msg.getChannel() == MessageChannel.WHATSAPP)
                        .map(
                                msg -> {
                                    WhatsAppQueuedMessageDto dto = new WhatsAppQueuedMessageDto();
                                    dto.setMessageId(msg.getId());
                                    dto.setDossierId(msg.getDossierId());
                                    dto.setToPhone(msg.getTo());
                                    dto.setTemplateCode(msg.getTemplateCode());
                                    dto.setStatus(msg.getStatus().name());
                                    dto.setAttemptCount(msg.getAttemptCount());
                                    dto.setMaxAttempts(msg.getMaxAttempts());
                                    dto.setCreatedAt(msg.getCreatedAt());
                                    dto.setUpdatedAt(msg.getUpdatedAt());
                                    dto.setErrorCode(msg.getErrorCode());
                                    dto.setErrorMessage(msg.getErrorMessage());

                                    List<OutboundAttemptEntity> attempts =
                                            outboundAttemptRepository
                                                    .findByOutboundMessageIdOrderByAttemptNoAsc(
                                                            msg.getId());

                                    if (!attempts.isEmpty()) {
                                        OutboundAttemptEntity lastAttempt =
                                                attempts.get(attempts.size() - 1);
                                        dto.setNextRetryAt(lastAttempt.getNextRetryAt());
                                    }

                                    return dto;
                                })
                        .collect(Collectors.toList());

        WhatsAppRetryQueueResponse response = new WhatsAppRetryQueueResponse();
        response.setMessages(messages);
        response.setTotalCount(messages.size());
        response.setTimestamp(LocalDateTime.now());

        logger.info("Retrieved {} queued messages for retry", response.getTotalCount());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dry-run-send")
    @Operation(
            summary = "Validate message send without sending",
            description =
                    "Validates session window and message configuration without actually sending the message")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Validation completed",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WhatsAppDryRunResponse.class))),
                @ApiResponse(responseCode = "400", description = "Invalid request"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<WhatsAppDryRunResponse> dryRunSend(
            @Parameter(
                            description = "Dry run request with phone number and template",
                            required = true)
                    @Valid
                    @RequestBody
                    WhatsAppDryRunRequest request) {

        logger.debug(
                "POST /api/v2/diagnostics/whatsapp/dry-run-send - phone={}, template={}",
                request.getPhoneNumber(),
                request.getTemplateCode());

        WhatsAppDryRunResponse response = new WhatsAppDryRunResponse();
        response.setPhoneNumber(request.getPhoneNumber());
        response.setTemplateCode(request.getTemplateCode());
        response.setTimestamp(LocalDateTime.now());

        String orgId = extractOrgId();
        boolean withinWindow =
                sessionWindowService.isWithinSessionWindow(orgId, request.getPhoneNumber());
        response.setSessionWindowActive(withinWindow);

        if (withinWindow) {
            sessionWindowService
                    .getSessionWindowExpiry(orgId, request.getPhoneNumber())
                    .ifPresent(response::setSessionWindowExpiresAt);
            response.setCanSend(true);
            response.setValidationMessage("Session window is active. Message can be sent.");
        } else {
            response.setCanSend(false);
            response.setValidationMessage(
                    "No active session window. Cannot send free-form message. Use approved template instead.");
        }

        OutboundMessageEntity existingMessage = null;
        if (request.getTemplateCode() != null) {
            List<OutboundMessageEntity> recentMessages =
                    outboundMessageRepository.findByDossierId(
                            request.getDossierId() != null ? request.getDossierId() : -1L);

            existingMessage =
                    recentMessages.stream()
                            .filter(msg -> request.getTemplateCode().equals(msg.getTemplateCode()))
                            .filter(msg -> request.getPhoneNumber().equals(msg.getTo()))
                            .filter(
                                    msg ->
                                            msg.getCreatedAt()
                                                    .isAfter(LocalDateTime.now().minusMinutes(5)))
                            .findFirst()
                            .orElse(null);
        }

        if (existingMessage != null) {
            response.setDuplicateDetected(true);
            response.setValidationMessage(
                    response.getValidationMessage()
                            + " WARNING: Similar message sent in last 5 minutes.");
        } else {
            response.setDuplicateDetected(false);
        }

        response.setValid(response.isCanSend() && !response.isDuplicateDetected());

        logger.info(
                "Dry run validation: canSend={}, valid={}, withinWindow={}",
                response.isCanSend(),
                response.isValid(),
                response.isSessionWindowActive());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/error-patterns")
    @Operation(
            summary = "Get error patterns",
            description =
                    "Aggregates error codes by frequency over the last 24 hours for pattern analysis")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Error patterns retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WhatsAppErrorPatternsResponse
                                                                        .class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<WhatsAppErrorPatternsResponse> getErrorPatterns(
            @Parameter(description = "Hours to look back (default: 24)")
                    @RequestParam(defaultValue = "24")
                    int hours) {

        logger.debug("GET /api/v2/diagnostics/whatsapp/error-patterns - hours={}", hours);

        LocalDateTime afterTime = LocalDateTime.now().minusHours(hours);

        List<Object[]> errorCounts = outboundMessageRepository.countFailuresByErrorCode(afterTime);

        List<WhatsAppErrorPatternDto> patterns =
                errorCounts.stream()
                        .map(
                                row -> {
                                    WhatsAppErrorPatternDto dto = new WhatsAppErrorPatternDto();
                                    dto.setErrorCode((String) row[0]);
                                    dto.setCount(((Number) row[1]).longValue());
                                    dto.setErrorMessage(mapErrorCodeToMessage((String) row[0]));
                                    return dto;
                                })
                        .collect(Collectors.toList());

        long totalFailures = patterns.stream().mapToLong(WhatsAppErrorPatternDto::getCount).sum();

        long totalMessages =
                outboundMessageRepository.countByChannelAndCreatedAtAfter(
                        MessageChannel.WHATSAPP, afterTime);

        double failureRate = totalMessages > 0 ? (double) totalFailures / totalMessages * 100 : 0.0;

        WhatsAppErrorPatternsResponse response = new WhatsAppErrorPatternsResponse();
        response.setErrorPatterns(patterns);
        response.setTotalErrors(totalFailures);
        response.setHoursAnalyzed(hours);
        response.setTimestamp(LocalDateTime.now());
        response.setAnalysisPeriodStart(afterTime);
        response.setAnalysisPeriodEnd(LocalDateTime.now());
        response.setTotalMessagesInPeriod(totalMessages);
        response.setFailureRate(failureRate);

        logger.info(
                "Retrieved {} error patterns over last {} hours (total failures: {}, failure rate: {:.2f}%)",
                patterns.size(), hours, totalFailures, failureRate);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/quota-usage")
    @Operation(
            summary = "Get WhatsApp quota usage and cost projections",
            description =
                    "Returns real-time quota usage, utilization, and projected costs per organization")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Quota usage retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                WhatsAppQuotaUsageResponse.class))),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<WhatsAppQuotaUsageResponse> getQuotaUsage(
            @Parameter(description = "Filter by specific organization ID (optional)")
                    @RequestParam(required = false)
                    String orgId) {

        logger.debug("GET /api/v2/diagnostics/whatsapp/quota-usage - orgId={}", orgId);

        List<WhatsAppQuotaUsageResponse.OrganizationQuotaUsage> usageList =
                new java.util.ArrayList<>();

        List<OrganizationSettings> organizations;
        if (orgId != null) {
            organizations =
                    organizationSettingsRepository
                            .findByOrgId(orgId)
                            .map(java.util.List::of)
                            .orElse(java.util.Collections.emptyList());
        } else {
            organizations = organizationSettingsRepository.findAll();
        }

        LocalDateTime startOfDay =
                LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startOfMonth =
                LocalDateTime.now()
                        .withDayOfMonth(1)
                        .withHour(0)
                        .withMinute(0)
                        .withSecond(0)
                        .withNano(0);

        for (OrganizationSettings org : organizations) {
            WhatsAppRateLimitService.QuotaStatus quotaStatus =
                    rateLimitService.getQuotaStatus(org.getOrgId());

            WhatsAppQuotaUsageResponse.OrganizationQuotaUsage usage =
                    new WhatsAppQuotaUsageResponse.OrganizationQuotaUsage();
            usage.setOrgId(org.getOrgId());
            usage.setQuotaTier(org.getWhatsappQuotaTier());
            usage.setQuotaLimit(quotaStatus.getQuotaLimit());
            usage.setMessagesSent(quotaStatus.getMessagesSent());
            usage.setRemainingQuota(quotaStatus.getRemainingQuota());
            usage.setThrottled(quotaStatus.isThrottled());
            usage.setResetAt(quotaStatus.getResetAt());

            if (quotaStatus.getQuotaLimit() > 0) {
                usage.setUtilizationPercentage(
                        (double) quotaStatus.getMessagesSent()
                                / quotaStatus.getQuotaLimit()
                                * 100.0);
            } else {
                usage.setUtilizationPercentage(0.0);
            }

            WhatsAppQuotaUsageResponse.CostProjection costProjection =
                    new WhatsAppQuotaUsageResponse.CostProjection();

            java.math.BigDecimal costToday =
                    costTrackingService.calculateProjectedCostForPeriod(org.getOrgId(), startOfDay);
            java.math.BigDecimal costThisMonth =
                    costTrackingService.calculateProjectedCostForPeriod(
                            org.getOrgId(), startOfMonth);
            Long conversationsToday =
                    costTrackingService.countConversationsForPeriod(org.getOrgId(), startOfDay);
            Long conversationsThisMonth =
                    costTrackingService.countConversationsForPeriod(org.getOrgId(), startOfMonth);

            costProjection.setTotalCostToday(costToday);
            costProjection.setTotalCostThisMonth(costThisMonth);
            costProjection.setConversationCountToday(conversationsToday);
            costProjection.setConversationCountThisMonth(conversationsThisMonth);

            int dayOfMonth = LocalDateTime.now().getDayOfMonth();
            if (dayOfMonth > 0 && conversationsThisMonth > 0) {
                double avgCostPerDay = costThisMonth.doubleValue() / dayOfMonth;
                int daysInMonth = LocalDateTime.now().toLocalDate().lengthOfMonth();
                java.math.BigDecimal projectedCost =
                        java.math.BigDecimal.valueOf(avgCostPerDay * daysInMonth);
                costProjection.setProjectedMonthlyCost(projectedCost);
            } else {
                costProjection.setProjectedMonthlyCost(costThisMonth);
            }

            java.util.Map<String, WhatsAppCostTrackingService.CostBreakdown> breakdown =
                    costTrackingService.getCostBreakdownByType(org.getOrgId(), startOfMonth);

            java.util.Map<String, WhatsAppQuotaUsageResponse.CostByType> costByTypeMap =
                    new java.util.HashMap<>();
            breakdown.forEach(
                    (type, bd) -> {
                        costByTypeMap.put(
                                type,
                                new WhatsAppQuotaUsageResponse.CostByType(
                                        bd.getConversationType(),
                                        bd.getConversationCount(),
                                        bd.getTotalCost()));
                    });
            costProjection.setCostBreakdown(costByTypeMap);

            usage.setCostProjection(costProjection);
            usageList.add(usage);
        }

        WhatsAppQuotaUsageResponse response = new WhatsAppQuotaUsageResponse();
        response.setOrganizations(usageList);
        response.setTimestamp(LocalDateTime.now());

        logger.info("Retrieved quota usage for {} organizations", usageList.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/quota-tier")
    @Operation(
            summary = "Update WhatsApp quota tier for an organization",
            description =
                    "Updates the tier for an organization (1: 1000/day, 2: 10000/day, 3: 100000/day, 4: unlimited)")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Quota tier updated successfully"),
                @ApiResponse(responseCode = "400", description = "Invalid tier value"),
                @ApiResponse(
                        responseCode = "403",
                        description = "Access denied - Admin role required"),
                @ApiResponse(responseCode = "401", description = "User is not authenticated")
            })
    public ResponseEntity<Map<String, Object>> updateQuotaTier(
            @Parameter(description = "Organization ID", required = true) @RequestParam String orgId,
            @Parameter(description = "Quota tier (1-4)", required = true) @RequestParam
                    Integer tier) {

        logger.debug("POST /api/v1/admin/whatsapp/quota-tier - orgId={}, tier={}", orgId, tier);

        try {
            rateLimitService.updateOrganizationTier(orgId, tier);

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("orgId", orgId);
            response.put("tier", tier);
            response.put("quotaLimit", rateLimitService.getTierQuotaLimit(tier));
            response.put(
                    "message",
                    String.format("Quota tier updated to %d for organization %s", tier, orgId));

            logger.info("Updated quota tier for orgId={} to tier {}", orgId, tier);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private String mapErrorCodeToMessage(String errorCode) {
        if (errorCode == null) {
            return "Unknown error";
        }

        return switch (errorCode) {
            case "131026" -> "Message undeliverable - User number is part of an experiment";
            case "131047" -> "Re-engagement message - Requires user to restart conversation";
            case "131051" -> "Unsupported message type";
            case "133016" -> "Message failed to send - Possible spam or policy violation";
            case "130472" -> "User's phone number is not a WhatsApp user";
            case "131031" -> "Template does not exist or not approved";
            case "132000" -> "Generic template error";
            case "133015" -> "Too many messages sent to this user";
            case "131053" -> "Service temporarily unavailable";
            default -> "Error code: " + errorCode;
        };
    }

    private String extractOrgId() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();

            if (principal instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
                String orgId = jwt.getClaimAsString("org_id");
                if (orgId != null) return orgId;

                String sub = jwt.getSubject();
                if (sub != null && sub.contains("|")) {
                    String[] parts = sub.split("\\|");
                    if (parts.length > 1) {
                        return parts[0];
                    }
                }
            }
        }

        return "default";
    }
}
