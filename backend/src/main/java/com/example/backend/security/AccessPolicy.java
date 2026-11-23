package com.example.backend.security;

import com.example.backend.util.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Règles fines d'accès d'une agence (étape 6). Les {@code @PreAuthorize} restent le premier filtre
 * (« membre de l'agence », « admin ») ; les services posent ici les questions qui dépendent du rôle
 * précis. Le front lit les mêmes règles pour masquer des boutons, mais c'est le serveur qui décide.
 *
 * <p>{@code SUPER_ADMIN} (plateforme) a les droits d'un administrateur d'agence.
 */
public final class AccessPolicy {

    private AccessPolicy() {}

    /** Rôle d'agence de l'utilisateur courant, ou {@code null} (anonyme, client…). */
    public static AgencyRole currentRole() {
        if (CurrentUser.hasAnyRole("ADMIN", "SUPER_ADMIN")) {
            return AgencyRole.ADMIN;
        }
        if (CurrentUser.hasAnyRole("MANAGER")) {
            return AgencyRole.MANAGER;
        }
        if (CurrentUser.hasAnyRole("AGENT", "PRO")) {
            return AgencyRole.AGENT;
        }
        return null;
    }

    public static boolean isAdmin() {
        return currentRole() == AgencyRole.ADMIN;
    }

    public static boolean isManagerOrAdmin() {
        AgencyRole role = currentRole();
        return role == AgencyRole.ADMIN || role == AgencyRole.MANAGER;
    }

    /** Réassigner un dossier à un autre agent (ou le remettre à attribuer). */
    public static boolean canAssign() {
        return isManagerOrAdmin();
    }

    /** Publier une annonce malgré un doublon certain ou une fraude signalés. */
    public static boolean canOverrideTrust() {
        return isManagerOrAdmin();
    }

    /** L'admin invite tous les rôles ; le manager invite des agents ; l'agent n'invite personne. */
    public static boolean canInvite(AgencyRole target) {
        AgencyRole role = currentRole();
        if (role == AgencyRole.ADMIN) {
            return target != null;
        }
        return role == AgencyRole.MANAGER && target == AgencyRole.AGENT;
    }

    /** Changer le rôle d'un membre, désactiver ou réactiver un compte. */
    public static boolean canManageTeam() {
        return isAdmin();
    }

    public static void requireCanAssign() {
        if (!canAssign()) {
            throw forbidden("MANAGER_REQUIRED: seul un manager ou un admin peut réassigner.");
        }
    }

    public static void requireCanOverrideTrust() {
        if (!canOverrideTrust()) {
            throw forbidden("MANAGER_REQUIRED: seul un manager peut déroger.");
        }
    }

    public static void requireCanInvite(AgencyRole target) {
        if (!canInvite(target)) {
            throw forbidden(
                    currentRole() == AgencyRole.MANAGER
                            ? "INVITE_FORBIDDEN: un manager ne peut inviter que des agents."
                            : "INVITE_FORBIDDEN: seuls un manager ou un admin peuvent inviter.");
        }
    }

    public static void requireCanManageTeam() {
        if (!canManageTeam()) {
            throw forbidden("ADMIN_REQUIRED: seul l'administrateur gère l'équipe.");
        }
    }

    private static ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }
}
