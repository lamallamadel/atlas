package com.example.backend.controller;

import com.example.backend.dto.BuyerMatchResponse;
import com.example.backend.service.ReverseMatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Acheteurs potentiels d'une annonce (matching inverse). */
@RestController
@RequestMapping("/api/v1/annonces/{annonceId}/buyer-matches")
@Tag(name = "Buyer matches", description = "Acheteurs dont les critères correspondent à l'annonce")
public class AnnonceBuyerMatchController {

    private final ReverseMatchingService service;

    public AnnonceBuyerMatchController(ReverseMatchingService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Acheteurs correspondants (les nouveaux passent en « vus »)")
    public List<BuyerMatchResponse> list(
            @PathVariable Long annonceId,
            @RequestParam(name = "markSeen", defaultValue = "true") boolean markSeen) {
        return service.list(annonceId, markSeen);
    }

    @PostMapping("/refresh")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Recalculer les acheteurs correspondants")
    public ResponseEntity<?> refresh(@PathVariable Long annonceId) {
        if (!service.refresh(annonceId)) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(
                            Map.of(
                                    "message",
                                    "Le service de matching est momentanément indisponible"));
        }
        return ResponseEntity.ok(service.list(annonceId, false));
    }

    @PostMapping("/{matchId}/dismiss")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Écarter cet acheteur pour cette annonce")
    public ResponseEntity<Void> dismiss(@PathVariable Long annonceId, @PathVariable Long matchId) {
        service.setDismissed(annonceId, matchId, true);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{matchId}/dismiss")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Annuler l'écartement")
    public ResponseEntity<Void> undismiss(
            @PathVariable Long annonceId, @PathVariable Long matchId) {
        service.setDismissed(annonceId, matchId, false);
        return ResponseEntity.noContent().build();
    }
}
