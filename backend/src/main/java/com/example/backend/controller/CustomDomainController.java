package com.example.backend.controller;

import com.example.backend.entity.CustomDomainMappingEntity;
import com.example.backend.service.CustomDomainService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/custom-domains")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Custom Domains", description = "Custom domain and SSL certificate management")
public class CustomDomainController {

    private final CustomDomainService domainService;

    public CustomDomainController(CustomDomainService domainService) {
        this.domainService = domainService;
    }

    @GetMapping
    @Operation(summary = "Get all custom domains for current tenant")
    public ResponseEntity<List<CustomDomainMappingEntity>> getDomains() {
        String orgId = TenantContext.getOrgId();
        List<CustomDomainMappingEntity> domains = domainService.getOrgDomains(orgId);
        return ResponseEntity.ok(domains);
    }

    @PostMapping
    @Operation(summary = "Add custom domain")
    public ResponseEntity<CustomDomainMappingEntity> addDomain(
            @RequestBody Map<String, Object> request) {
        String orgId = TenantContext.getOrgId();
        String domain = (String) request.get("domain");
        Boolean isPrimary = (Boolean) request.getOrDefault("isPrimary", false);

        CustomDomainMappingEntity mapping = domainService.addCustomDomain(orgId, domain, isPrimary);
        return ResponseEntity.ok(mapping);
    }

    @PostMapping("/{domain}/verify")
    @Operation(summary = "Verify DNS configuration and provision SSL")
    public ResponseEntity<Map<String, Object>> verifyDomain(@PathVariable String domain) {
        boolean verified = domainService.verifyDnsConfiguration(domain);

        return ResponseEntity.ok(
                Map.of(
                        "domain", domain,
                        "verified", verified,
                        "message",
                                verified
                                        ? "DNS verified, SSL provisioning started"
                                        : "DNS verification pending"));
    }

    @DeleteMapping("/{domain}")
    @Operation(summary = "Remove custom domain")
    public ResponseEntity<Void> removeDomain(@PathVariable String domain) {
        domainService.removeDomain(domain);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{domain}")
    @Operation(summary = "Get domain mapping details")
    public ResponseEntity<CustomDomainMappingEntity> getDomain(@PathVariable String domain) {
        return domainService
                .getDomainMapping(domain)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
