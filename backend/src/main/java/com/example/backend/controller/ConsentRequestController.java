package com.example.backend.controller;

import com.example.backend.dto.ConsentLinkRequest;
import com.example.backend.dto.ConsentLinkResponse;
import com.example.backend.dto.PublicConsentAnswer;
import com.example.backend.dto.PublicConsentView;
import com.example.backend.service.ConsentRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Lien de confirmation du consentement : création par l'agent, réponse par le client. */
@RestController
@Tag(name = "Consentement — confirmation client", description = "Double opt-in par lien")
public class ConsentRequestController {

    private final ConsentRequestService service;

    public ConsentRequestController(ConsentRequestService service) {
        this.service = service;
    }

    @PostMapping("/api/v1/dossiers/{dossierId}/consent-links")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Générer un lien de confirmation à envoyer au client")
    public ConsentLinkResponse create(
            @PathVariable Long dossierId, @RequestBody(required = false) ConsentLinkRequest body) {
        return service.createLink(
                dossierId,
                body == null ? null : body.channel(),
                body == null ? null : body.consentType());
    }

    @GetMapping("/api/v1/public/consent/{token}")
    @Operation(summary = "Page publique : état de la demande")
    public PublicConsentView view(@PathVariable String token) {
        return service.view(token);
    }

    @PostMapping("/api/v1/public/consent/{token}")
    @Operation(summary = "Page publique : le client accepte ou refuse")
    public PublicConsentView answer(
            @PathVariable String token,
            @RequestBody PublicConsentAnswer body,
            HttpServletRequest request) {
        return service.answer(
                token,
                body == null ? null : body.decision(),
                clientIp(request),
                request.getHeader("User-Agent"));
    }

    static String clientIp(HttpServletRequest request) {
        String cf = request.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) {
            return cf.trim();
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
