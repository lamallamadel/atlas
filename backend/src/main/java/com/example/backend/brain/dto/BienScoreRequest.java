package com.example.backend.brain.dto;

import com.example.backend.entity.Annonce;
import com.fasterxml.jackson.annotation.JsonProperty;

public class BienScoreRequest {

    @JsonProperty("titre")
    private String titre;

    @JsonProperty("prix")
    private double prix;

    @JsonProperty("surface")
    private double surface;

    @JsonProperty("etage")
    private int etage;

    @JsonProperty("ville")
    private String ville;

    @JsonProperty("type_bien")
    private String typeBien;

    @JsonProperty("annee_construction")
    private Integer anneeConstruction;

    @JsonProperty("proximite_mer")
    private boolean proximiteMer;

    public static BienScoreRequest from(Annonce annonce) {
        BienScoreRequest req = new BienScoreRequest();
        req.titre = annonce.getTitle();
        req.prix = annonce.getPrice().doubleValue();
        req.surface = annonce.getSurface();
        req.etage = 0;
        req.ville = annonce.getCity();
        req.typeBien = annonce.getType() != null ? annonce.getType().name() : null;
        req.proximiteMer = false;
        return req;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public double getPrix() {
        return prix;
    }

    public void setPrix(double prix) {
        this.prix = prix;
    }

    public double getSurface() {
        return surface;
    }

    public void setSurface(double surface) {
        this.surface = surface;
    }

    public int getEtage() {
        return etage;
    }

    public void setEtage(int etage) {
        this.etage = etage;
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

    public Integer getAnneeConstruction() {
        return anneeConstruction;
    }

    public void setAnneeConstruction(Integer anneeConstruction) {
        this.anneeConstruction = anneeConstruction;
    }

    public boolean isProximiteMer() {
        return proximiteMer;
    }

    public void setProximiteMer(boolean proximiteMer) {
        this.proximiteMer = proximiteMer;
    }
}
