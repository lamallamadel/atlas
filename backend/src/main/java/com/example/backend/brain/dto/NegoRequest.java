package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NegoRequest {
    @JsonProperty("prix_demande")
    private Double prixDemande;

    @JsonProperty("prix_offre")
    private Double prixOffre;

    @JsonProperty("duree_sur_marche_jours")
    private Integer dureeSurMarcheJours;

    public Double getPrixDemande() {
        return prixDemande;
    }

    public void setPrixDemande(Double prixDemande) {
        this.prixDemande = prixDemande;
    }

    public Double getPrixOffre() {
        return prixOffre;
    }

    public void setPrixOffre(Double prixOffre) {
        this.prixOffre = prixOffre;
    }

    public Integer getDureeSurMarcheJours() {
        return dureeSurMarcheJours;
    }

    public void setDureeSurMarcheJours(Integer dureeSurMarcheJours) {
        this.dureeSurMarcheJours = dureeSurMarcheJours;
    }
}
