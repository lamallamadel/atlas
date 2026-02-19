package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DoublonResultDto {

    @JsonProperty("annonce_1")
    private Long annonce1;

    @JsonProperty("annonce_2")
    private Long annonce2;

    @JsonProperty("similarite")
    private double similarite;

    @JsonProperty("statut")
    private String statut;

    public Long getAnnonce1() {
        return annonce1;
    }

    public void setAnnonce1(Long annonce1) {
        this.annonce1 = annonce1;
    }

    public Long getAnnonce2() {
        return annonce2;
    }

    public void setAnnonce2(Long annonce2) {
        this.annonce2 = annonce2;
    }

    public double getSimilarite() {
        return similarite;
    }

    public void setSimilarite(double similarite) {
        this.similarite = similarite;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }
}
