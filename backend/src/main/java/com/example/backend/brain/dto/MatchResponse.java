package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

/**
 * Réponse du brain : {@code matches} (bien_id, score_match, raisons, alertes, details), nombre de
 * biens exclus par raison, et nombre de biens examinés.
 */
public class MatchResponse {

    private List<Map<String, Object>> matches;

    @JsonProperty("exclus")
    private Map<String, Integer> exclus;

    @JsonProperty("total_biens")
    private Integer totalBiens;

    public List<Map<String, Object>> getMatches() {
        return matches;
    }

    public void setMatches(List<Map<String, Object>> matches) {
        this.matches = matches;
    }

    public Map<String, Integer> getExclus() {
        return exclus;
    }

    public void setExclus(Map<String, Integer> exclus) {
        this.exclus = exclus;
    }

    public Integer getTotalBiens() {
        return totalBiens;
    }

    public void setTotalBiens(Integer totalBiens) {
        this.totalBiens = totalBiens;
    }
}
