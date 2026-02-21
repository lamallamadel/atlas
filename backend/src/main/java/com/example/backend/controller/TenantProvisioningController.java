package com.example.backend.controller;

import com.example.backend.entity.TenantProvisioningEntity;
import com.example.backend.service.TenantProvisioningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/provisioning")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Tenant Provisioning", description = "APIs for tenant provisioning and setup")
public class TenantProvisioningController {

    private final TenantProvisioningService provisioningService;

    public TenantProvisioningController(TenantProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @PostMapping("/initiate")
    @Operation(summary = "Initiate tenant provisioning")
    public ResponseEntity<TenantProvisioningEntity> initiateProvisioning(
            @RequestBody Map<String, Object> request) {
        
        String orgId = (String) request.get("orgId");
        String companyName = (String) request.get("companyName");
        String adminUserEmail = (String) request.get("adminUserEmail");
        String adminUserName = (String) request.getOrDefault("adminUserName", "");
        String planTier = (String) request.getOrDefault("planTier", "starter");
        Boolean includeSampleData = (Boolean) request.getOrDefault("includeSampleData", true);

        TenantProvisioningEntity provisioning = provisioningService.initiateTenantProvisioning(
            orgId, companyName, adminUserEmail, adminUserName, planTier, includeSampleData
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(provisioning);
    }

    @PostMapping("/{orgId}/provision")
    @Operation(summary = "Execute tenant provisioning")
    public ResponseEntity<Map<String, String>> provisionTenant(@PathVariable String orgId) {
        provisioningService.provisionTenant(orgId);
        return ResponseEntity.ok(Map.of("message", "Provisioning started", "orgId", orgId));
    }

    @GetMapping("/{orgId}/status")
    @Operation(summary = "Get provisioning status")
    public ResponseEntity<TenantProvisioningEntity> getProvisioningStatus(@PathVariable String orgId) {
        Optional<TenantProvisioningEntity> provisioning = provisioningService.getProvisioningStatus(orgId);
        return provisioning.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
