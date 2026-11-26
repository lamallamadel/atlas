package com.example.backend.controller;

import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.dto.PublicAnnonceResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceReportService;
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
    private final AnnonceReportService annonceReportService;
    private final com.example.backend.service.AnnonceMediaService annonceMediaService;
    private final com.example.backend.mandate.PropertyListingService propertyListings;

    public PortalPublicController(
            AnnonceService annonceService,
            PublicLeadService publicLeadService,
            AnnonceReportService annonceReportService,
            com.example.backend.service.AnnonceMediaService annonceMediaService,
            com.example.backend.mandate.PropertyListingService propertyListings) {
        this.propertyListings = propertyListings;
        this.annonceService = annonceService;
        this.publicLeadService = publicLeadService;
        this.annonceReportService = annonceReportService;
        this.annonceMediaService = annonceMediaService;
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
                    annonceService.findAll(AnnonceStatus.PUBLISHED, q, city, type, pageable, true);
            java.util.Map<Long, java.util.List<Long>> photos =
                    annonceMediaService.uploadedPhotoIds(
                            results.getContent().stream().map(Annonce::getId).toList());
            return ResponseEntity.ok(
                    results.map(
                            a ->
                                    PublicAnnonceResponse.from(
                                            a,
                                            photos.getOrDefault(a.getId(), java.util.List.of()))));
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping("/annonces/{id}")
    @Operation(
            summary = "Public annonce detail",
            description = "Annonce visible publiquement, toutes agences ; 404 sinon")
    public ResponseEntity<PublicAnnonceResponse> getAnnonce(@PathVariable Long id) {
        java.util.Optional<Annonce> visible = publicLeadService.findPublicAnnonce(id);
        if (visible.isEmpty()) {
            // Annonce d'un propriétaire suspendue par un mandat exclusif : redirection vers
            // l'annonce de l'agence mandatée (R-PROP-05, PB-5).
            return propertyListings
                    .exclusiveReplacement(id)
                    .<ResponseEntity<PublicAnnonceResponse>>map(
                            target ->
                                    ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY)
                                            .location(
                                                    java.net.URI.create(
                                                            "/api/v1/portal/annonces/" + target))
                                            .build())
                    .orElse(ResponseEntity.notFound().build());
        }
        Annonce a = visible.get();
        return ResponseEntity.ok(
                PublicAnnonceResponse.from(
                                a,
                                annonceMediaService
                                        .uploadedPhotoIds(java.util.List.of(a.getId()))
                                        .get(a.getId()))
                        .withPublishers(propertyListings.publishers(a))
                        .withPropertyVerified(propertyListings.propertyVerified(a)));
    }

    @GetMapping("/annonces/{id}/media/{mediaId}")
    @Operation(
            summary = "Public annonce photo",
            description = "Photo importée d'une annonce publiée ; 404 sinon")
    public ResponseEntity<org.springframework.core.io.InputStreamResource> annoncePhoto(
            @PathVariable Long id, @PathVariable Long mediaId) {
        try {
            com.example.backend.service.AnnonceMediaService.MediaContent content =
                    annonceMediaService.openPublicContent(id, mediaId);
            String type = content.contentType() == null ? "image/jpeg" : content.contentType();
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(type))
                    .header("Cache-Control", "public, max-age=3600")
                    .body(new org.springframework.core.io.InputStreamResource(content.stream()));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
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

    /** Corps de {@code POST /annonces/{id}/reports}. */
    public record PortalReportRequest(
            @jakarta.validation.constraints.NotBlank String reasonCode,
            @jakarta.validation.constraints.Size(max = 1000) String comment,
            @jakarta.validation.constraints.Email @jakarta.validation.constraints.Size(max = 255)
                    String email) {}

    @PostMapping("/annonces/{id}/reports")
    @Operation(
            summary = "Report a public annonce",
            description =
                    "Motif REPORT_FRAUD, REPORT_INCORRECT_INFO, REPORT_DUPLICATE, REPORT_SPAM ou"
                            + " REPORT_OTHER. Transmis à l'agence de l'annonce")
    public ResponseEntity<Map<String, String>> reportAnnonce(
            @PathVariable Long id,
            @Valid @RequestBody PortalReportRequest request,
            HttpServletRequest http) {
        annonceReportService.submitPublic(
                id,
                request.reasonCode(),
                request.comment(),
                request.email(),
                clientIp(http),
                http.getHeader("User-Agent"));
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
