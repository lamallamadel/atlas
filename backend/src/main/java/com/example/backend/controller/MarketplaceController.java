package com.example.backend.controller;

import com.example.backend.entitlement.Feature;
import com.example.backend.entitlement.RequiresFeature;
import com.example.backend.mandate.MandateLifecycleService;
import com.example.backend.mandate.MandateMarketplaceService;
import com.example.backend.mandate.MarketplaceViews;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Cas d'usage n°1, lot B, côté agence : bourse aux mandats de ses zones, demandes directes,
 * propositions, échanges avec le propriétaire, mandats obtenus. Réservé aux agences vérifiées.
 */
@RestController
@RequestMapping("/api/v1/marketplace")
@PreAuthorize("hasAnyRole('ADMIN','PRO')")
@RequiresFeature(Feature.MODULE_MANDATE_MARKETPLACE)
@Tag(name = "Mandate marketplace", description = "Bourse aux mandats, côté agence")
public class MarketplaceController {

    private final MandateMarketplaceService marketplace;
    private final MandateLifecycleService lifecycle;

    public MarketplaceController(
            MandateMarketplaceService marketplace, MandateLifecycleService lifecycle) {
        this.marketplace = marketplace;
        this.lifecycle = lifecycle;
    }

    public record MessageBody(String body) {}

    @GetMapping("/requests")
    public List<MarketplaceViews.AgencyRequest> market() {
        return marketplace.market();
    }

    @GetMapping("/direct-requests")
    public List<MarketplaceViews.AgencyRequest> direct() {
        return marketplace.directRequests();
    }

    @GetMapping("/requests/{id}")
    public MarketplaceViews.AgencyRequest request(@PathVariable Long id) {
        return marketplace.agencyRequest(id);
    }

    @PostMapping("/requests/{id}/proposals")
    public MarketplaceViews.AgencyRequest propose(
            @PathVariable Long id, @RequestBody MarketplaceViews.ProposalCreate body) {
        return marketplace.propose(id, body);
    }

    @PostMapping("/requests/{id}/decline")
    public MarketplaceViews.AgencyRequest declineDirect(@PathVariable Long id) {
        return marketplace.declineDirect(id);
    }

    @GetMapping("/proposals")
    public List<MarketplaceViews.AgencyProposal> proposals() {
        return marketplace.myProposals();
    }

    @GetMapping("/proposals/{id}")
    public MarketplaceViews.AgencyProposal proposal(@PathVariable Long id) {
        return marketplace.myProposal(id);
    }

    @PostMapping("/proposals/{id}/withdraw")
    public MarketplaceViews.AgencyProposal withdraw(@PathVariable Long id) {
        return marketplace.withdraw(id);
    }

    @GetMapping("/proposals/{id}/messages")
    public MarketplaceViews.Thread thread(@PathVariable Long id) {
        return marketplace.agencyThread(id);
    }

    @PostMapping("/proposals/{id}/messages")
    public MarketplaceViews.Thread send(@PathVariable Long id, @RequestBody MessageBody body) {
        return marketplace.agencySend(id, body == null ? null : body.body());
    }

    @GetMapping("/mandates")
    public List<MarketplaceViews.Mandate> mandates() {
        return lifecycle.agencyMandates();
    }

    @GetMapping("/mandates/{id}")
    public MarketplaceViews.Mandate mandate(@PathVariable Long id) {
        return lifecycle.agencyMandate(id);
    }

    /**
     * Signature du mandat déclarée par l'agence (papier) : mandat actif, dossier « Mandat signé ».
     */
    @PostMapping("/mandates/{id}/signed")
    public MarketplaceViews.Mandate signed(@PathVariable Long id) {
        return lifecycle.markSigned(id);
    }

    /** Crée (ou retrouve) le brouillon d'annonce de l'agence lié au bien. */
    @PostMapping("/mandates/{id}/annonce")
    public Map<String, Long> annonce(@PathVariable Long id) {
        return lifecycle.createAgencyAnnonce(id);
    }
}
