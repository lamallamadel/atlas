package com.example.backend.controller;

import com.example.backend.dto.RateLimitStatsDto;
import com.example.backend.dto.RateLimitTierDto;
import com.example.backend.service.RateLimitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/rate-limits")
@Tag(name = "Rate Limit Management", description = "Admin API for managing rate limits per organization and IP addresses")
@SecurityRequirement(name = "bearerAuth")
public class RateLimitController {

    private final RateLimitService rateLimitService;

    public RateLimitController(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all rate limits", description = "Retrieve all configured rate limits for organizations")
    public ResponseEntity<List<RateLimitTierDto>> getAllRateLimits() {
        List<RateLimitTierDto> rateLimits = rateLimitService.getAllRateLimits();
        return ResponseEntity.ok(rateLimits);
    }

    @GetMapping("/{orgId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get rate limit by organization", description = "Retrieve rate limit configuration for a specific organization")
    public ResponseEntity<RateLimitTierDto> getRateLimitByOrgId(@PathVariable String orgId) {
        return rateLimitService.getRateLimitByOrgId(orgId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create rate limit", description = "Create a new rate limit configuration for an organization")
    public ResponseEntity<RateLimitTierDto> createRateLimit(@Valid @RequestBody RateLimitTierDto dto) {
        RateLimitTierDto created = rateLimitService.createRateLimit(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{orgId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update rate limit", description = "Update rate limit configuration for an organization")
    public ResponseEntity<RateLimitTierDto> updateRateLimit(
            @PathVariable String orgId,
            @Valid @RequestBody RateLimitTierDto dto) {
        RateLimitTierDto updated = rateLimitService.updateRateLimit(orgId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{orgId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete rate limit", description = "Delete rate limit configuration for an organization")
    public ResponseEntity<Void> deleteRateLimit(@PathVariable String orgId) {
        rateLimitService.deleteRateLimit(orgId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/org/{orgId}/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Reset rate limit bucket for organization",
            description = "Clear the rate limit bucket for an organization, allowing immediate new requests"
    )
    public ResponseEntity<Map<String, String>> resetRateLimitBucketForOrg(
            @Parameter(description = "Organization ID to reset") @PathVariable String orgId) {
        rateLimitService.clearBucket(orgId);
        return ResponseEntity.ok(Map.of(
                "message", "Rate limit bucket cleared successfully",
                "orgId", orgId
        ));
    }

    @PostMapping("/ip/{ipAddress}/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Reset rate limit bucket for IP address",
            description = "Clear the rate limit bucket for a specific IP address, allowing immediate new requests"
    )
    public ResponseEntity<Map<String, String>> resetRateLimitBucketForIp(
            @Parameter(description = "IP address to reset (e.g., 192.168.1.1)") @PathVariable String ipAddress) {
        rateLimitService.clearBucketForIp(ipAddress);
        return ResponseEntity.ok(Map.of(
                "message", "Rate limit bucket cleared successfully",
                "ipAddress", ipAddress
        ));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get rate limit statistics",
            description = "Retrieve comprehensive statistics about rate limiting including hits, rejections, and rates"
    )
    public ResponseEntity<RateLimitStatsDto> getRateLimitStatistics() {
        RateLimitStatsDto stats = rateLimitService.getStatistics();
        return ResponseEntity.ok(stats);
    }
}
