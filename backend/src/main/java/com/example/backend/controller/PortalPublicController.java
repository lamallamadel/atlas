package com.example.backend.controller;

import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.dto.PublicAnnonceResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceService;
import com.example.backend.service.PublicLeadService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal")
@Tag(
        name = "Public Portals",
        description = "Unauthenticated B2C and B2B portal endpoints (Portail/Vitrine)")
public class PortalPublicController {

    private final AnnonceService annonceService;
    private final PublicLeadService publicLeadService;

    public PortalPublicController(
            AnnonceService annonceService, PublicLeadService publicLeadService) {
        this.annonceService = annonceService;
        this.publicLeadService = publicLeadService;
    }

    @GetMapping("/annonces")
    @Operation(
            summary = "Search public annonces",
            description = "Search and list published annonces for the Atlasia Portail")
    public ResponseEntity<Page<PublicAnnonceResponse>> searchAnnonces(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {

        // Portail inter-agences : aucun filtre d'organisation sur /api/v1/portal/**
        // (HibernateFilterInterceptor), la recherche couvre toutes les agences.
        try {
            String[] sortParams = sort.split(",");
            Sort.Direction direction =
                    sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                            ? Sort.Direction.DESC
                            : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

            // Use a global search (cross-tenant) for the public portal
            Page<Annonce> results =
                    annonceService.findAll(AnnonceStatus.PUBLISHED, q, city, type, pageable);
            return ResponseEntity.ok(results.map(PublicAnnonceResponse::from));
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/annonces/{id}")
    @Operation(
            summary = "Public annonce detail",
            description = "Annonce visible publiquement, toutes agences ; 404 sinon")
    public ResponseEntity<PublicAnnonceResponse> getAnnonce(@PathVariable Long id) {
        return publicLeadService
                .findPublicAnnonce(id)
                .map(PublicAnnonceResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/leads")
    @Operation(
            summary = "Submit a public lead",
            description =
                    "Demande depuis une fiche annonce (dossier créé dans l'agence de l'annonce)"
                            + " ou depuis la vitrine (organisation de la plateforme). La case de"
                            + " consentement est obligatoire.")
    public ResponseEntity<Map<String, String>> submitLead(
            @Valid @RequestBody PortalLeadRequest request, HttpServletRequest http) {
        publicLeadService.submit(request, clientIp(http), http.getHeader("User-Agent"));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "RECEIVED"));
    }

    /** IP du visiteur derrière Cloudflare et Nginx. */
    static String clientIp(HttpServletRequest http) {
        String cf = http.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) {
            return cf.trim();
        }
        String xff = http.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }
}
