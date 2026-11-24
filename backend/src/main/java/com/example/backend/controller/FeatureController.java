package com.example.backend.controller;

import com.example.backend.entitlement.EntitlementService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Modules de l'agence courante, pour que l'écran masque ce qui n'est pas inclus. */
@RestController
@RequestMapping("/api/v1/features")
@Tag(name = "Features", description = "Modules activés pour l'agence")
public class FeatureController {

    private final EntitlementService entitlements;

    public FeatureController(EntitlementService entitlements) {
        this.entitlements = entitlements;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Agency features",
            description =
                    "Catalogue des modules (spec 05) et leur état pour l'agence. Le serveur reste"
                            + " seul juge : un module désactivé répond 403 FEATURE_DISABLED")
    public ResponseEntity<List<EntitlementService.FeatureStatus>> list() {
        return ResponseEntity.ok(entitlements.list(TenantContext.getOrgId()));
    }
}
