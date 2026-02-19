package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class FraudResponse {

    private String titre;
    private String statut; // SAIN | SUSPECT | FRAUDULEUX

    @JsonProperty("score_fraude")
    private Integer scoreFraude;

    private List<String> alertes;
    private Map<String, Object> details;

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public Integer getScoreFraude() {
        return scoreFraude;
    }

    public void setScoreFraude(Integer scoreFraude) {
        this.scoreFraude = scoreFraude;
    }

    public List<String> getAlertes() {
        return alertes;
    }

    public void setAlertes(List<String> alertes) {
        this.alertes = alertes;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
