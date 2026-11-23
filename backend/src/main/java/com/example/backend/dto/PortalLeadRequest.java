package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Demande envoyée depuis le portail (fiche annonce) ou la vitrine (démo, contact).
 *
 * <p>Contrat public volontairement réduit : l'agence, le type de dossier, la source et le statut
 * sont décidés par le serveur, jamais par le client.
 */
@Schema(description = "Public lead submitted from the portal or the corporate site")
public class PortalLeadRequest {

    @Schema(description = "Annonce concernée (portail) ; absente pour la vitrine", example = "42")
    private Long annonceId;

    @Schema(description = "VISIT, INFO (portail) ou DEMO, CONTACT (vitrine)", example = "VISIT")
    @Size(max = 20)
    private String requestType;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 255)
    private String name;

    @Size(max = 50)
    private String phone;

    @Email(message = "Adresse e-mail invalide")
    @Size(max = 255)
    private String email;

    @Size(max = 4000)
    private String message;

    @Schema(description = "Accord pour être recontacté (case cochée). Obligatoire.")
    private Boolean consent;

    public Long getAnnonceId() {
        return annonceId;
    }

    public void setAnnonceId(Long annonceId) {
        this.annonceId = annonceId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getConsent() {
        return consent;
    }

    public void setConsent(Boolean consent) {
        this.consent = consent;
    }
}
