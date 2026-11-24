package com.example.backend.dto;

import java.util.List;

/**
 * Statut courant d'un dossier et transitions possibles depuis celui-ci (ADR 0004). {@code stage}
 * vaut {@code OPEN}, {@code WON} ou {@code LOST} ; {@code requires} liste ce qu'il faut fournir
 * (ex. {@code lossReason}) ou préparer ({@code appointment}) avant la transition.
 */
public record DossierTransitionsResponse(
        String caseType,
        String statusCode,
        String statusLabel,
        String stage,
        List<Option> transitions) {

    /**
     * Une transition possible. {@code reasons} : valeurs acceptées pour la raison exigée ({@code
     * lossReason}), vide sinon.
     */
    public record Option(
            String statusCode,
            String label,
            String stage,
            List<String> requires,
            List<Reason> reasons) {}

    public record Reason(String code, String label) {}
}
