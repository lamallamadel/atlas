package com.example.backend.controller;

import com.example.backend.dto.BuyerMatchResponse;
import com.example.backend.dto.PitchDraftResponse;
import com.example.backend.dto.PitchSendRequest;
import com.example.backend.dto.PitchSendResponse;
import com.example.backend.dto.VisitPlanRequest;
import com.example.backend.dto.VisitPlanResponse;
import com.example.backend.service.PitchReplyService;
import com.example.backend.service.PropertyPitchService;
import com.example.backend.service.ReverseMatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Acheteurs potentiels d'une annonce (matching inverse). */
@RestController
@RequestMapping("/api/v1/annonces/{annonceId}/buyer-matches")
@Tag(name = "Buyer matches", description = "Acheteurs dont les critères correspondent à l'annonce")
public class AnnonceBuyerMatchController {

    private final ReverseMatchingService service;
    private final PropertyPitchService pitchService;
    private final PitchReplyService replyService;

    public AnnonceBuyerMatchController(
            ReverseMatchingService service,
            PropertyPitchService pitchService,
            PitchReplyService replyService) {
        this.service = service;
        this.pitchService = pitchService;
        this.replyService = replyService;
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

    @PostMapping("/{matchId}/pitch/draft")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Brouillon de message proposant le bien à l'acheteur (rien n'est envoyé)")
    public PitchDraftResponse draftPitch(
            @PathVariable Long annonceId,
            @PathVariable Long matchId,
            @RequestParam(name = "language", defaultValue = "fr") String language,
            @RequestParam(name = "channel", defaultValue = "WHATSAPP") String channel) {
        return pitchService.draft(annonceId, matchId, language, channel);
    }

    @PostMapping("/{matchId}/pitch/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Envoyer au client le message validé par l'agent")
    public PitchSendResponse sendPitch(
            @PathVariable Long annonceId,
            @PathVariable Long matchId,
            @Valid @RequestBody PitchSendRequest request) {
        return pitchService.send(annonceId, matchId, request);
    }

    @PostMapping("/{matchId}/visit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Planifier la visite demandée par l'acheteur (rendez-vous)")
    public VisitPlanResponse planVisit(
            @PathVariable Long annonceId,
            @PathVariable Long matchId,
            @Valid @RequestBody VisitPlanRequest request) {
        return replyService.planVisit(annonceId, matchId, request);
    }
}
