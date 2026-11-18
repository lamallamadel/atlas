package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

/** Requête vers /api/match/calculer du brain (noms de champs en snake_case côté brain). */
public class MatchRequest {

    @JsonProperty("client_id")
    private Long clientId;

    /** Critères en snake_case (transaction_types, budget_max, ...). */
    @JsonProperty("criteres")
    private Map<String, Object> criteres;

    @JsonProperty("biens")
    private List<Map<String, Object>> biens;

    @JsonProperty("limit")
    private Integer limit;

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public Map<String, Object> getCriteres() {
        return criteres;
    }

    public void setCriteres(Map<String, Object> criteres) {
        this.criteres = criteres;
    }

    public List<Map<String, Object>> getBiens() {
        return biens;
    }

    public void setBiens(List<Map<String, Object>> biens) {
        this.biens = biens;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }
}
