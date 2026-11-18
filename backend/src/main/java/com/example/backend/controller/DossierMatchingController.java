package com.example.backend.controller;

import com.example.backend.dto.DossierSearchCriteria;
import com.example.backend.service.DossierMatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Critères de recherche d'un acheteur / locataire et biens correspondants. */
@RestController
@RequestMapping("/api/v1/dossiers/{dossierId}")
@Tag(name = "Dossier matching", description = "Critères de recherche et biens correspondants")
public class DossierMatchingController {

    private final DossierMatchingService matchingService;

    public DossierMatchingController(DossierMatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @GetMapping("/search-criteria")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Critères de recherche du dossier (204 si aucun)")
    public ResponseEntity<DossierSearchCriteria> getCriteria(@PathVariable Long dossierId) {
        return matchingService
                .getCriteria(dossierId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/search-criteria")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Enregistrer les critères de recherche du dossier")
    public DossierSearchCriteria saveCriteria(
            @PathVariable Long dossierId, @Valid @RequestBody DossierSearchCriteria criteria) {
        return matchingService.saveCriteria(dossierId, criteria);
    }

    @GetMapping("/matches")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Biens correspondant aux critères",
            description =
                    "scope=ALL (actifs, publiés, brouillons) ou OFF_MARKET (brouillons). Score sur"
                            + " 100 avec les raisons et les alertes.")
    public ResponseEntity<?> matches(
            @PathVariable Long dossierId,
            @RequestParam(name = "scope", defaultValue = "ALL") DossierMatchingService.Scope scope,
            @RequestParam(name = "limit", defaultValue = "20") int limit) {
        return matchingService
                .findMatches(dossierId, scope, limit)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(
                        () ->
                                ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                                        .body(
                                                Map.of(
                                                        "message",
                                                        "Le service de matching est"
                                                                + " momentanément indisponible")));
    }
}
