package com.example.backend.dto;

import java.util.Map;

/**
 * Critères suggérés à partir des notes et messages du client, à valider par l'agent.
 *
 * @param suggestion seuls les champs justifiés par une citation sont renseignés
 * @param evidence citation du client pour chaque champ suggéré (clé = nom du champ)
 * @param engine openai, ollama ou regles (sans IA)
 */
public record CriteriaSuggestionResponse(
        DossierSearchCriteria suggestion,
        Map<String, String> evidence,
        String engine,
        int notesUsed,
        int messagesUsed) {}
