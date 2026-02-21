package com.example.backend.dto;

public class LeadPriorityResponse {
    private DossierResponse dossier;
    private LeadScoreResponse score;
    private String urgencyLevel;

    public DossierResponse getDossier() {
        return dossier;
    }

    public void setDossier(DossierResponse dossier) {
        this.dossier = dossier;
    }

    public LeadScoreResponse getScore() {
        return score;
    }

    public void setScore(LeadScoreResponse score) {
        this.score = score;
    }

    public String getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(String urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }
}
