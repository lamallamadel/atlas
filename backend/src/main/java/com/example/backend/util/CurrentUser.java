package com.example.backend.util;

import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Utilisateur à l'origine de la requête : identifiant Keycloak ({@code sub} du jeton) et nom
 * lisible. Vide pour un visiteur anonyme ou un traitement du système (portail, WhatsApp, tâches
 * planifiées).
 */
public final class CurrentUser {

    private CurrentUser() {}

    /** Identifiant de l'utilisateur connecté, s'il y en a un. */
    public static Optional<String> id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof Jwt jwt
                && jwt.getSubject() != null
                && !jwt.getSubject().isBlank()) {
            return Optional.of(jwt.getSubject());
        }
        String name = auth.getName();
        if (name == null || name.isBlank() || "anonymousUser".equals(name)) {
            return Optional.empty();
        }
        return Optional.of(name);
    }

    /** Nom affichable : nom complet, sinon identifiant de connexion, sinon e-mail. */
    public static Optional<String> displayName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken token) {
            Jwt jwt = token.getToken();
            for (String claim : new String[] {"name", "preferred_username", "email"}) {
                String v = jwt.getClaimAsString(claim);
                if (v != null && !v.isBlank()) {
                    return Optional.of(v);
                }
            }
            String given = jwt.getClaimAsString("given_name");
            String family = jwt.getClaimAsString("family_name");
            String full =
                    ((given == null ? "" : given) + " " + (family == null ? "" : family)).trim();
            if (!full.isEmpty()) {
                return Optional.of(full);
            }
        }
        return id();
    }

    /** Vrai si l'utilisateur a l'un de ces rôles ({@code ADMIN}, {@code MANAGER}…). */
    public static boolean hasAnyRole(String... roles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        for (GrantedAuthority a : auth.getAuthorities()) {
            for (String role : roles) {
                if (a.getAuthority().equals("ROLE_" + role)) {
                    return true;
                }
            }
        }
        return false;
    }

    /** Manager ou administrateur (d'agence ou de la plateforme). */
    public static boolean isManagerOrAdmin() {
        return hasAnyRole("ADMIN", "MANAGER", "SUPER_ADMIN");
    }
}
