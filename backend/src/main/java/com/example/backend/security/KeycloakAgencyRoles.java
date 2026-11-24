package com.example.backend.security;

import jakarta.ws.rs.NotFoundException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleMappingResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

/** Lecture et écriture des rôles d'agence dans Keycloak (rôles de realm). */
public final class KeycloakAgencyRoles {

    private static final int MAX_MEMBERS = 2000;

    private KeycloakAgencyRoles() {}

    /**
     * Rôle d'agence de chaque utilisateur du realm, lu par appartenance aux rôles (quatre appels au
     * lieu d'un par utilisateur).
     */
    public static Map<String, AgencyRole> rolesByUser(RealmResource realm) {
        Map<String, Set<String>> byUser = new HashMap<>();
        for (String roleName : AgencyRole.KEYCLOAK_ROLES) {
            try {
                for (UserRepresentation u :
                        realm.roles().get(roleName).getUserMembers(0, MAX_MEMBERS)) {
                    byUser.computeIfAbsent(u.getId(), k -> new HashSet<>()).add(roleName);
                }
            } catch (NotFoundException e) {
                // Rôle absent du realm (ex. AGENT avant le lot B) : personne ne l'a.
            }
        }
        Map<String, AgencyRole> result = new HashMap<>();
        byUser.forEach((id, roles) -> result.put(id, AgencyRole.highest(roles)));
        return result;
    }

    /**
     * Donne à l'utilisateur ce seul rôle d'agence : retire les autres (dont l'ancien {@code PRO})
     * et crée le rôle dans le realm s'il n'existe pas encore.
     */
    public static void setRole(RealmResource realm, String userId, AgencyRole role) {
        RoleMappingResource mappings = realm.users().get(userId).roles();
        List<RoleRepresentation> toRemove =
                mappings.realmLevel().listAll().stream()
                        .filter(r -> AgencyRole.KEYCLOAK_ROLES.contains(r.getName()))
                        .filter(r -> !r.getName().equals(role.name()))
                        .toList();
        if (!toRemove.isEmpty()) {
            mappings.realmLevel().remove(toRemove);
        }
        boolean already =
                mappings.realmLevel().listAll().stream()
                        .anyMatch(r -> r.getName().equals(role.name()));
        if (!already) {
            mappings.realmLevel().add(List.of(ensureRole(realm, role.name())));
        }
    }

    static RoleRepresentation ensureRole(RealmResource realm, String name) {
        try {
            return realm.roles().get(name).toRepresentation();
        } catch (NotFoundException e) {
            RoleRepresentation created = new RoleRepresentation();
            created.setName(name);
            realm.roles().create(created);
            return realm.roles().get(name).toRepresentation();
        }
    }
}
