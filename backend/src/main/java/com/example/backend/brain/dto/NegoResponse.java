package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NegoResponse {
    @JsonProperty("probabilite_acceptation")
    private Integer probabiliteAcceptation;

    private String conseil;

    @JsonProperty("contre_proposition_optimale")
    private Double contrePropositionOptimale;

    public Integer getProbabiliteAcceptation() {
        return probabiliteAcceptation;
    }

    public void setProbabiliteAcceptation(Integer probabiliteAcceptation) {
        this.probabiliteAcceptation = probabiliteAcceptation;
    }

    public String getConseil() {
        return conseil;
    }

    public void setConseil(String conseil) {
        this.conseil = conseil;
    }

    public Double getContrePropositionOptimale() {
        return contrePropositionOptimale;
    }

    public void setContrePropositionOptimale(Double contrePropositionOptimale) {
        this.contrePropositionOptimale = contrePropositionOptimale;
    }
}
