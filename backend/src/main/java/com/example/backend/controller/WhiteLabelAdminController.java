package com.example.backend.controller;

import com.example.backend.entity.*;
import com.example.backend.repository.FeatureFlagRepository;
import com.example.backend.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/white-label")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "White-Label Admin", description = "Super-admin APIs for managing tenant branding and configuration")
public class WhiteLabelAdminController {

    private final WhiteLabelService whiteLabelService;
    private final DynamicThemeService themeService;
    private final FeatureFlagRepository featureFlagRepository;

    public WhiteLabelAdminController(
            WhiteLabelService whiteLabelService,
            DynamicThemeService themeService,
            FeatureFlagRepository featureFlagRepository) {
        this.whiteLabelService = whiteLabelService;
        this.themeService = themeService;
        this.featureFlagRepository = featureFlagRepository;
    }

    @GetMapping("/{orgId}")
    @Operation(summary = "Get white-label configuration for tenant")
    public ResponseEntity<WhiteLabelConfigEntity> getConfig(@PathVariable String orgId) {
        WhiteLabelConfigEntity config = whiteLabelService.getConfig(orgId);
        return ResponseEntity.ok(config);
    }

    @PutMapping("/{orgId}")
    @Operation(summary = "Update white-label configuration")
    public ResponseEntity<WhiteLabelConfigEntity> updateConfig(
            @PathVariable String orgId,
            @Valid @RequestBody WhiteLabelConfigEntity config) {
        WhiteLabelConfigEntity updated = whiteLabelService.createOrUpdate(orgId, config);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{orgId}/theme")
    @Operation(summary = "Get tenant theme CSS properties")
    public ResponseEntity<Map<String, String>> getTheme(@PathVariable String orgId) {
        Map<String, String> theme = themeService.getTenantTheme(orgId);
        return ResponseEntity.ok(theme);
    }

    @GetMapping("/{orgId}/theme/css")
    @Operation(summary = "Get tenant theme as CSS")
    public ResponseEntity<String> getThemeCss(@PathVariable String orgId) {
        Map<String, String> theme = themeService.getTenantTheme(orgId);
        String css = themeService.generateCssProperties(theme);
        return ResponseEntity.ok()
                .header("Content-Type", "text/css")
                .body(css);
    }

    @GetMapping("/{orgId}/features")
    @Operation(summary = "Get all feature flags for tenant")
    public ResponseEntity<List<FeatureFlagEntity>> getFeatures(@PathVariable String orgId) {
        List<FeatureFlagEntity> features = featureFlagRepository.findByOrgId(orgId);
        return ResponseEntity.ok(features);
    }

    @PutMapping("/{orgId}/features/{featureKey}")
    @Operation(summary = "Toggle feature flag")
    public ResponseEntity<FeatureFlagEntity> toggleFeature(
            @PathVariable String orgId,
            @PathVariable String featureKey,
            @RequestParam boolean enabled) {
        
        FeatureFlagEntity feature = featureFlagRepository.findByOrgIdAndFeatureKey(orgId, featureKey)
                .orElseThrow(() -> new IllegalArgumentException("Feature not found: " + featureKey));
        
        feature.setEnabled(enabled);
        FeatureFlagEntity updated = featureFlagRepository.save(feature);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{orgId}/ssl")
    @Operation(summary = "Update SSL certificate status")
    public ResponseEntity<Void> updateSslStatus(
            @PathVariable String orgId,
            @RequestBody Map<String, Object> sslInfo) {
        whiteLabelService.updateSslCertificate(
            orgId,
            (String) sslInfo.get("status"),
            null,
            null
        );
        return ResponseEntity.ok().build();
    }
}
