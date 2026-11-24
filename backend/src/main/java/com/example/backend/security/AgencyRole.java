package com.example.backend.security;

import java.util.Collection;
import java.util.Locale;

/**
 * Rôles d'une agence, portés par les rôles de realm Keycloak du même nom. L'ancien rôle {@code PRO}
 * est lu comme {@link #AGENT}.
 */
public enum AgencyRole {
    ADMIN("Administrateur"),
    MANAGER("Manager"),
    AGENT("Agent");

    /** Rôles Keycloak qu'un changement de rôle d'agence remplace. */
    public static final java.util.List<String> KEYCLOAK_ROLES =
            java.util.List.of("ADMIN", "MANAGER", "AGENT", "PRO");

    private final String label;

    AgencyRole(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** {@code null} si la valeur n'est pas un rôle d'agence. */
    public static AgencyRole parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return switch (value.trim().toUpperCase(Locale.ROOT)) {
            case "ADMIN", "ADMIN_ORG" -> ADMIN;
            case "MANAGER" -> MANAGER;
            case "AGENT", "PRO" -> AGENT;
            default -> null;
        };
    }

    /** Le plus élevé des rôles d'agence présents, ou {@code null}. */
    public static AgencyRole highest(Collection<String> roles) {
        AgencyRole best = null;
        if (roles == null) {
            return null;
        }
        for (String r : roles) {
            AgencyRole role = parse(r);
            if (role != null && (best == null || role.ordinal() < best.ordinal())) {
                best = role;
            }
        }
        return best;
    }
}
