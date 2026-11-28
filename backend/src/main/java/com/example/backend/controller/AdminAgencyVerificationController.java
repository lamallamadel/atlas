package com.example.backend.controller;

import com.example.backend.mandate.AgencyDirectoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Vérifications de la plateforme : agences (accès à la bourse aux mandats), propriétaires (pièce
 * d'identité) et biens (titre foncier) — badges du cas d'usage n°1.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Admin agencies", description = "Vérification des agences")
public class AdminAgencyVerificationController {

    private final AgencyDirectoryService directory;
    private final com.example.backend.mandate.VerificationService verification;
    private final com.example.backend.mandate.AgencyVerificationService agencyVerification;
    private final com.example.backend.mandate.MarketplaceLiquidityService liquidity;

    public AdminAgencyVerificationController(
            AgencyDirectoryService directory,
            com.example.backend.mandate.VerificationService verification,
            com.example.backend.mandate.AgencyVerificationService agencyVerification,
            com.example.backend.mandate.MarketplaceLiquidityService liquidity) {
        this.liquidity = liquidity;
        this.directory = directory;
        this.verification = verification;
        this.agencyVerification = agencyVerification;
    }

    public record VerificationBody(boolean verified, String note) {}

    /** Liquidité de la bourse par ville : critère d'ouverture et signaux de tenue de promesse. */
    @GetMapping("/marketplace/liquidity")
    public com.example.backend.mandate.MarketplaceLiquidityService.Liquidity liquidity() {
        return liquidity.liquidity();
    }

    /** Demandes de vérification d'agences en attente, les plus anciennes d'abord. */
    @GetMapping("/verifications/agencies")
    public java.util.List<com.example.backend.mandate.AgencyVerificationService.PendingAgency>
            pendingAgencies() {
        return agencyVerification.pending();
    }

    /** Valide l'agence ou refuse sa demande ({@code note} obligatoire, montrée à l'agence). */
    @PutMapping("/agencies/{orgId}/verification")
    public ResponseEntity<Map<String, Object>> verify(
            @PathVariable String orgId, @RequestBody VerificationBody body) {
        agencyVerification.decide(
                orgId, body != null && body.verified(), body == null ? null : body.note());
        return ResponseEntity.ok(Map.of("orgId", orgId, "verified", directory.isVerified(orgId)));
    }

    @PutMapping("/owners/{orgId}/verification")
    public ResponseEntity<Map<String, Object>> verifyOwner(
            @PathVariable String orgId, @RequestBody VerificationBody body) {
        boolean v = body != null && body.verified();
        verification.setOwnerVerified(orgId, v);
        return ResponseEntity.ok(Map.of("orgId", orgId, "verified", v));
    }

    @GetMapping("/verifications/properties")
    public java.util.List<com.example.backend.mandate.VerificationService.PendingProperty>
            pendingProperties() {
        return verification.pendingProperties();
    }

    @PutMapping("/properties/{id}/verification")
    public ResponseEntity<Map<String, Object>> verifyProperty(
            @PathVariable Long id, @RequestBody VerificationBody body) {
        boolean v = body != null && body.verified();
        verification.decideProperty(id, v);
        return ResponseEntity.ok(Map.of("propertyId", id, "verified", v));
    }
}
