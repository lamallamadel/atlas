package com.example.backend.service;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.security.AccessPolicy;
import com.example.backend.security.AgencyRole;
import com.example.backend.security.KeycloakAgencyRoles;
import com.example.backend.util.CurrentUser;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Gestion de l'équipe par l'administrateur d'agence : changement de rôle, désactivation et
 * réactivation. Toujours limitée aux comptes de l'agence courante ; on ne peut ni se modifier
 * soi-même, ni retirer le dernier administrateur actif.
 */
@Service
public class TeamAdminService {

    private static final Logger log = LoggerFactory.getLogger(TeamAdminService.class);

    private final ObjectProvider<Keycloak> keycloak;
    private final String realm;

    public TeamAdminService(
            ObjectProvider<Keycloak> keycloak,
            @Value("${keycloak.admin.realm:${keycloak.realm:myrealm}}") String realm) {
        this.keycloak = keycloak;
        this.realm = realm;
    }

    public TeamMemberResponse changeRole(String orgId, String userId, AgencyRole role) {
        AccessPolicy.requireCanManageTeam();
        return withDirectory(() -> doChangeRole(orgId, userId, role));
    }

    public TeamMemberResponse setEnabled(String orgId, String userId, boolean enabled) {
        AccessPolicy.requireCanManageTeam();
        return withDirectory(() -> doSetEnabled(orgId, userId, enabled));
    }

    private TeamMemberResponse doChangeRole(String orgId, String userId, AgencyRole role) {
        if (role == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "INVALID_ROLE: rôle attendu ADMIN, MANAGER ou AGENT.");
        }
        refuseSelf(userId, "SELF_ROLE_CHANGE: vous ne pouvez pas changer votre propre rôle.");
        RealmResource realmResource = realmResource();
        UserRepresentation user = memberOf(realmResource, orgId, userId);
        Map<String, AgencyRole> roles = KeycloakAgencyRoles.rolesByUser(realmResource);
        if (roles.get(userId) == AgencyRole.ADMIN && role != AgencyRole.ADMIN) {
            refuseLastAdmin(realmResource, orgId, roles, userId);
        }
        KeycloakAgencyRoles.setRole(realmResource, userId, role);
        log.info(
                "Team role changed: org={} user={} role={} by={}",
                orgId,
                userId,
                role,
                CurrentUser.id().orElse("?"));
        return TeamDirectoryService.toMember(user, role);
    }

    private TeamMemberResponse doSetEnabled(String orgId, String userId, boolean enabled) {
        refuseSelf(userId, "SELF_DISABLE: vous ne pouvez pas désactiver votre propre compte.");
        RealmResource realmResource = realmResource();
        UserRepresentation user = memberOf(realmResource, orgId, userId);
        Map<String, AgencyRole> roles = KeycloakAgencyRoles.rolesByUser(realmResource);
        if (!enabled && roles.get(userId) == AgencyRole.ADMIN) {
            refuseLastAdmin(realmResource, orgId, roles, userId);
        }
        user.setEnabled(enabled);
        realmResource.users().get(userId).update(user);
        log.info(
                "Team member {}: org={} user={} by={}",
                enabled ? "enabled" : "disabled",
                orgId,
                userId,
                CurrentUser.id().orElse("?"));
        return TeamDirectoryService.toMember(user, roles.get(userId));
    }

    /** Keycloak injoignable ou en erreur : 503, sans exposer le détail technique. */
    private static <T> T withDirectory(Supplier<T> action) {
        try {
            return action.get();
        } catch (ProcessingException | WebApplicationException e) {
            log.warn("Keycloak error during team administration: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "DIRECTORY_UNAVAILABLE: l'annuaire Keycloak est indisponible.");
        }
    }

    private RealmResource realmResource() {
        Keycloak client = keycloak.getIfAvailable();
        if (client == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "DIRECTORY_UNAVAILABLE: l'annuaire Keycloak est indisponible.");
        }
        return client.realm(realm);
    }

    /** Le compte doit appartenir à l'agence ; sinon 404, comme entre agences. */
    static UserRepresentation memberOf(RealmResource realmResource, String orgId, String userId) {
        try {
            UserResource resource = realmResource.users().get(userId);
            UserRepresentation user = resource.toRepresentation();
            if (user != null && belongsTo(user, orgId)) {
                return user;
            }
        } catch (NotFoundException e) {
            // traité ci-dessous
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "USER_NOT_IN_AGENCY: utilisateur introuvable dans l'agence.");
    }

    static boolean belongsTo(UserRepresentation user, String orgId) {
        Map<String, List<String>> attributes = user.getAttributes();
        if (attributes == null) {
            return false;
        }
        List<String> values = attributes.get("orgId");
        return values != null && values.contains(orgId);
    }

    private void refuseLastAdmin(
            RealmResource realmResource,
            String orgId,
            Map<String, AgencyRole> roles,
            String userId) {
        long otherActiveAdmins =
                realmResource.users().searchByAttributes("orgId:" + orgId).stream()
                        .filter(u -> !u.getId().equals(userId))
                        .filter(u -> !Boolean.FALSE.equals(u.isEnabled()))
                        .filter(u -> roles.get(u.getId()) == AgencyRole.ADMIN)
                        .count();
        if (otherActiveAdmins == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "LAST_ADMIN: l'agence doit garder au moins un administrateur actif.");
        }
    }

    private static void refuseSelf(String userId, String message) {
        if (CurrentUser.id().filter(userId::equals).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }
}
