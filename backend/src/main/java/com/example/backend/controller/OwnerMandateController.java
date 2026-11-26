package com.example.backend.controller;

import com.example.backend.mandate.AgencyDirectoryService;
import com.example.backend.mandate.MandateLifecycleService;
import com.example.backend.mandate.MandateMarketplaceService;
import com.example.backend.mandate.MarketplaceViews;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Cas d'usage n°1, lot B, côté propriétaire : annuaire des agences, demandes d'accompagnement,
 * comparaison des propositions, échanges, acceptation par code, mandats.
 */
@RestController
@RequestMapping("/api/v1/owner")
@PreAuthorize("hasRole('OWNER')")
@Tag(name = "Owner mandates", description = "Bourse aux mandats, côté propriétaire")
public class OwnerMandateController {

    private final AgencyDirectoryService directory;
    private final MandateMarketplaceService marketplace;
    private final MandateLifecycleService lifecycle;

    public OwnerMandateController(
            AgencyDirectoryService directory,
            MandateMarketplaceService marketplace,
            MandateLifecycleService lifecycle) {
        this.directory = directory;
        this.marketplace = marketplace;
        this.lifecycle = lifecycle;
    }

    public record MessageBody(String body) {}

    public record CodeBody(String code) {}

    /** Agences vérifiées qui couvrent la ville (demande directe). */
    @GetMapping("/agencies")
    public List<AgencyDirectoryService.AgencyCard> agencies(
            @RequestParam String city, @RequestParam(required = false) String transaction) {
        return directory.directory(city, transaction);
    }

    @GetMapping("/mandate-requests")
    public List<MarketplaceViews.OwnerRequest> requests() {
        return marketplace.myRequests();
    }

    @PostMapping("/mandate-requests")
    public MarketplaceViews.OwnerRequest create(@RequestBody MarketplaceViews.RequestCreate body) {
        return marketplace.createRequest(body);
    }

    @GetMapping("/mandate-requests/{id}")
    public MarketplaceViews.OwnerRequest request(@PathVariable Long id) {
        return marketplace.myRequest(id);
    }

    @PostMapping("/mandate-requests/{id}/cancel")
    public MarketplaceViews.OwnerRequest cancel(@PathVariable Long id) {
        return marketplace.cancel(id);
    }

    @PostMapping("/mandate-requests/{id}/open-to-market")
    public MarketplaceViews.OwnerRequest openToMarket(@PathVariable Long id) {
        return marketplace.openToMarket(id);
    }

    @PostMapping("/proposals/{id}/shortlist")
    public MarketplaceViews.OwnerRequest shortlist(@PathVariable Long id) {
        return marketplace.shortlist(id);
    }

    @PostMapping("/proposals/{id}/decline")
    public MarketplaceViews.OwnerRequest decline(@PathVariable Long id) {
        return marketplace.decline(id);
    }

    @GetMapping("/proposals/{id}/messages")
    public MarketplaceViews.Thread thread(@PathVariable Long id) {
        return marketplace.ownerThread(id);
    }

    @PostMapping("/proposals/{id}/messages")
    public MarketplaceViews.Thread send(@PathVariable Long id, @RequestBody MessageBody body) {
        return marketplace.ownerSend(id, body == null ? null : body.body());
    }

    /** Étape 1 de l'acceptation : un code est envoyé au téléphone du propriétaire. */
    @PostMapping("/proposals/{id}/accept/start")
    public Map<String, String> startAccept(@PathVariable Long id, HttpServletRequest http) {
        return Map.of("channel", lifecycle.startAcceptance(id, clientIp(http)));
    }

    /** Étape 2 : le code confirme l'acceptation ; le mandat et le dossier de l'agence naissent. */
    @PostMapping("/proposals/{id}/accept")
    public MarketplaceViews.Mandate accept(@PathVariable Long id, @RequestBody CodeBody body) {
        return lifecycle.accept(id, body == null ? null : body.code());
    }

    @GetMapping("/mandates")
    public List<MarketplaceViews.Mandate> mandates() {
        return lifecycle.ownerMandates();
    }

    private static String clientIp(HttpServletRequest http) {
        String cf = http.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) {
            return cf.trim();
        }
        return http.getRemoteAddr();
    }
}
