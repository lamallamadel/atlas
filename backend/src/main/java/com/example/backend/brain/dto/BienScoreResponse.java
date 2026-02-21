package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class BienScoreResponse {

    @JsonProperty("titre")
    private String titre;

    @JsonProperty("score")
    private int score;

    @JsonProperty("prix_m2")
    private double prixM2;

    @JsonProperty("details")
    private Map<String, String> details;

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public double getPrixM2() {
        return prixM2;
    }

    public void setPrixM2(double prixM2) {
        this.prixM2 = prixM2;
    }

    public Map<String, String> getDetails() {
        return details;
    }

    public void setDetails(Map<String, String> details) {
        this.details = details;
    }
}
