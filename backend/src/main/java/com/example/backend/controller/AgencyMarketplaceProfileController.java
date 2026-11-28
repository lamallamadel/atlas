package com.example.backend.controller;

import com.example.backend.entitlement.Feature;
import com.example.backend.entitlement.RequiresFeature;
import com.example.backend.mandate.AgencyDirectoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Profil public et zones d'intervention de l'agence, vus par les propriétaires (lot B). */
@RestController
@RequestMapping("/api/v1/agency/marketplace-profile")
@PreAuthorize("hasAnyRole('ADMIN','PRO')")
@RequiresFeature(Feature.MODULE_MANDATE_MARKETPLACE)
@Tag(name = "Agency marketplace profile", description = "Profil et zones de l'agence")
public class AgencyMarketplaceProfileController {

    private final AgencyDirectoryService directory;
    private final com.example.backend.mandate.AgencyVerificationService verification;

    public AgencyMarketplaceProfileController(
            AgencyDirectoryService directory,
            com.example.backend.mandate.AgencyVerificationService verification) {
        this.directory = directory;
        this.verification = verification;
    }

    /** Où en est la vérification de l'agence, et ce qu'il manque pour la demander. */
    @GetMapping("/verification")
    public com.example.backend.mandate.AgencyVerificationService.Verification verification() {
        return verification.mine();
    }

    @PostMapping("/verification")
    public com.example.backend.mandate.AgencyVerificationService.Verification requestVerification(
            @RequestBody
                    com.example.backend.mandate.AgencyVerificationService.VerificationRequest
                            body) {
        return verification.request(body);
    }

    @GetMapping
    public AgencyDirectoryService.AgencySettings get() {
        return directory.mySettings();
    }

    @PutMapping
    public AgencyDirectoryService.AgencySettings save(
            @RequestBody AgencyDirectoryService.ProfileRequest body) {
        return directory.saveProfile(body);
    }

    @PutMapping("/zones")
    public AgencyDirectoryService.AgencySettings zones(
            @RequestBody List<AgencyDirectoryService.Zone> body) {
        return directory.saveZones(body);
    }
}
