package com.example.backend.controller;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.security.AgencyRole;
import com.example.backend.service.TeamAdminService;
import com.example.backend.service.TeamDirectoryService;
import com.example.backend.service.TeamSettingsService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Membres de l'agence : sélecteurs d'agent et écran « Équipe ». */
@RestController
@RequestMapping("/api/v1/team")
@Tag(name = "Team", description = "Membres de l'agence")
public class TeamController {

    public record RoleChangeRequest(@NotBlank String role) {}

    public record EnabledRequest(@NotNull Boolean enabled) {}

    /** Champs absents : réglage inchangé. */
    public record TeamSettingsRequest(
            Boolean restrictAgentsToOwnDossiers,
            com.example.backend.service.LeadRoutingService.Mode leadRouting) {}

    private final TeamDirectoryService teamDirectory;
    private final TeamAdminService teamAdmin;
    private final TeamSettingsService teamSettings;

    public TeamController(
            TeamDirectoryService teamDirectory,
            TeamAdminService teamAdmin,
            TeamSettingsService teamSettings) {
        this.teamDirectory = teamDirectory;
        this.teamAdmin = teamAdmin;
        this.teamSettings = teamSettings;
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO', 'MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Team settings",
            description =
                    "restrictAgentsToOwnDossiers : les agents ne voient que leurs dossiers et ceux"
                            + " à attribuer ; leadRouting : SHARED_QUEUE, LISTING_AGENT ou"
                            + " ROUND_ROBIN")
    public ResponseEntity<TeamSettingsService.TeamSettings> settings() {
        return ResponseEntity.ok(teamSettings.get(orgId()));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update team settings (admin)")
    public ResponseEntity<TeamSettingsService.TeamSettings> updateSettings(
            @Valid @RequestBody TeamSettingsRequest request) {
        return ResponseEntity.ok(
                teamSettings.update(
                        orgId(), request.restrictAgentsToOwnDossiers(), request.leadRouting()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO', 'MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Agency members",
            description =
                    "Utilisateurs Keycloak de l'agence avec leur rôle ; à défaut, ceux déjà vus"
                            + " dans ses dossiers. includeDisabled montre aussi les comptes"
                            + " désactivés")
    public ResponseEntity<List<TeamMemberResponse>> members(
            @RequestParam(defaultValue = "false") boolean includeDisabled) {
        return ResponseEntity.ok(teamDirectory.team(orgId(), includeDisabled).members());
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Change a member's agency role (admin)")
    public ResponseEntity<TeamMemberResponse> changeRole(
            @PathVariable String userId, @Valid @RequestBody RoleChangeRequest request) {
        return ResponseEntity.ok(
                teamAdmin.changeRole(orgId(), userId, AgencyRole.parse(request.role())));
    }

    @PutMapping("/{userId}/enabled")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Disable or re-enable a member (admin)")
    public ResponseEntity<TeamMemberResponse> setEnabled(
            @PathVariable String userId, @Valid @RequestBody EnabledRequest request) {
        return ResponseEntity.ok(teamAdmin.setEnabled(orgId(), userId, request.enabled()));
    }

    private static String orgId() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        return orgId;
    }
}
