package com.example.backend.controller;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.service.TeamDirectoryService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Membres de l'agence, pour choisir un agent (réassignation, filtres). */
@RestController
@Tag(name = "Team", description = "Membres de l'agence")
public class TeamController {

    private final TeamDirectoryService teamDirectory;

    public TeamController(TeamDirectoryService teamDirectory) {
        this.teamDirectory = teamDirectory;
    }

    @GetMapping("/api/v1/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO', 'MANAGER')")
    @Operation(
            summary = "Agency members",
            description =
                    "Utilisateurs Keycloak de l'agence ; à défaut, ceux déjà vus dans ses dossiers")
    public ResponseEntity<List<TeamMemberResponse>> members() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        return ResponseEntity.ok(teamDirectory.team(orgId).members());
    }
}
