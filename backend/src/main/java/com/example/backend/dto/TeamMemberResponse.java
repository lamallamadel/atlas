package com.example.backend.dto;

/**
 * Membre de l'agence. {@code role} vaut {@code ADMIN}, {@code MANAGER}, {@code AGENT} ou {@code
 * null} si inconnu (annuaire de repli) ; {@code enabled} est faux pour un compte désactivé.
 */
public record TeamMemberResponse(
        String userId, String name, String email, String role, boolean enabled) {

    public TeamMemberResponse(String userId, String name, String email) {
        this(userId, name, email, null, true);
    }
}
