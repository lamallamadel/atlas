package com.example.backend.controller;

import com.example.backend.mandate.AgencyDirectoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Vérification d'une agence par l'équipe Atlas : condition d'accès à la bourse aux mandats. */
@RestController
@RequestMapping("/api/v1/admin/agencies")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Admin agencies", description = "Vérification des agences")
public class AdminAgencyVerificationController {

    private final AgencyDirectoryService directory;

    public AdminAgencyVerificationController(AgencyDirectoryService directory) {
        this.directory = directory;
    }

    public record VerificationBody(boolean verified) {}

    @PutMapping("/{orgId}/verification")
    public ResponseEntity<Map<String, Object>> verify(
            @PathVariable String orgId, @RequestBody VerificationBody body) {
        directory.setVerified(orgId, body != null && body.verified());
        return ResponseEntity.ok(Map.of("orgId", orgId, "verified", directory.isVerified(orgId)));
    }
}
