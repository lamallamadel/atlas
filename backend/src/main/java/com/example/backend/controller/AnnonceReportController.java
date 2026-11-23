package com.example.backend.controller;

import com.example.backend.dto.AnnonceReportResponse;
import com.example.backend.service.AnnonceReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Signalements des annonces de l'agence : consultation et traitement (étape 5 du backlog). */
@RestController
@Tag(name = "Annonce reports", description = "Signalements du portail, traités par l'agence")
public class AnnonceReportController {

    /** Corps de {@code POST /api/v1/annonce-reports/{id}/close}. */
    public record CloseReportRequest(
            @NotBlank String resolution, @Size(max = 1000) String comment) {}

    private final AnnonceReportService reportService;

    public AnnonceReportController(AnnonceReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/api/v1/annonces/{id}/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Reports of an annonce", description = "Plus récents d'abord")
    public ResponseEntity<List<AnnonceReportResponse>> listForAnnonce(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reportService.listForAnnonce(id));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/api/v1/annonce-reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Agency report queue",
            description = "Signalements de l'agence ; status=OPEN (défaut), CLOSED ou ALL")
    public ResponseEntity<List<AnnonceReportResponse>> listForOrg(
            @RequestParam(defaultValue = "OPEN") String status) {
        return ResponseEntity.ok(
                reportService.listForOrg("ALL".equalsIgnoreCase(status) ? null : status));
    }

    @PostMapping("/api/v1/annonce-reports/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Close a report",
            description =
                    "resolution=DISMISSED (l'annonce reste en ligne) ou ANNONCE_SUSPENDED"
                            + " (l'annonce est suspendue et ses signalements ouverts sont clos)")
    public ResponseEntity<AnnonceReportResponse> close(
            @PathVariable Long id, @Valid @RequestBody CloseReportRequest request) {
        try {
            return ResponseEntity.ok(
                    reportService.close(id, request.resolution(), request.comment()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
