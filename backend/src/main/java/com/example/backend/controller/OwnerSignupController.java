package com.example.backend.controller;

import com.example.backend.owner.OwnerSignupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Inscription publique d'un propriétaire (cas d'usage n°1, UC-P1). Sous {@code /api/v1/portal/} :
 * sans organisation, l'organisation personnelle est créée par le serveur.
 */
@RestController
@RequestMapping("/api/v1/portal/owner/signup")
@Tag(name = "Owner signup", description = "Inscription propriétaire par code à usage unique")
public class OwnerSignupController {

    private final OwnerSignupService signupService;

    public OwnerSignupController(OwnerSignupService signupService) {
        this.signupService = signupService;
    }

    @PostMapping("/start")
    @Operation(summary = "Envoie un code au téléphone du futur propriétaire")
    public ResponseEntity<Map<String, String>> start(
            @RequestBody OwnerSignupService.StartRequest request, HttpServletRequest http) {
        String channel = signupService.start(request, clientIp(http));
        return ResponseEntity.accepted().body(Map.of("status", "CODE_SENT", "channel", channel));
    }

    @PostMapping("/complete")
    @Operation(summary = "Vérifie le code et crée le compte propriétaire")
    public ResponseEntity<Map<String, String>> complete(
            @RequestBody OwnerSignupService.CompleteRequest request) {
        OwnerSignupService.SignupResult result = signupService.complete(request);
        // L'identifiant de connexion est le numéro ; l'organisation n'est pas renvoyée.
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("status", "CREATED", "username", result.username()));
    }

    private static String clientIp(HttpServletRequest http) {
        String cf = http.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) {
            return cf.trim();
        }
        return http.getRemoteAddr();
    }
}
