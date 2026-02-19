package com.example.backend.brain.dto;

import com.example.backend.entity.Annonce;
import com.fasterxml.jackson.annotation.JsonProperty;

public class FraudRequest {

    private String titre;
    private Double prix;
    private Double surface;
    private String ville;

    @JsonProperty("type_bien")
    private String typeBien;

    @JsonProperty("vendeur_nouveau")
    private Boolean vendeurNouveau = false;

    public static FraudRequest from(Annonce annonce) {
        FraudRequest req = new FraudRequest();
        req.titre = annonce.getTitle();
        req.prix = annonce.getPrice() != null ? annonce.getPrice().doubleValue() : null;
        req.surface = annonce.getSurface();
        req.ville = annonce.getCity();
        req.typeBien = annonce.getType() != null ? annonce.getType().name() : null;
        req.vendeurNouveau = false;
        return req;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public Double getPrix() {
        return prix;
    }

    public void setPrix(Double prix) {
        this.prix = prix;
    }

    public Double getSurface() {
        return surface;
    }

    public void setSurface(Double surface) {
        this.surface = surface;
    }

    public String getVille() {
        return ville;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public String getTypeBien() {
        return typeBien;
    }

    public void setTypeBien(String typeBien) {
        this.typeBien = typeBien;
    }

    public Boolean getVendeurNouveau() {
        return vendeurNouveau;
    }

    public void setVendeurNouveau(Boolean vendeurNouveau) {
        this.vendeurNouveau = vendeurNouveau;
    }
}
