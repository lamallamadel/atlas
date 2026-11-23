package com.example.backend.dto;

/** Membre de l'agence, pour les sélecteurs d'agent. */
public record TeamMemberResponse(String userId, String name, String email) {}
