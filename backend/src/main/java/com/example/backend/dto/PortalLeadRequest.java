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

    @Schema(description = "Demande de démo (vitrine) : profil de l'agence, facultatif")
    @jakarta.validation.Valid
    private DemoDetails demo;

    /** Profil saisi dans le formulaire de démo de la vitrine. */
    public record DemoDetails(
            @Size(max = 100) String city,
            @Size(max = 50) String actorType,
            @Size(max = 50) String teamSize,
            @Size(max = 50) String listingVolume,
            @Size(max = 50) String desiredPlan,
            @Size(max = 10) java.util.List<@Size(max = 50) String> needs) {

        /** Champs renseignés seulement, pour {@code dossier.lead_details}. */
        public java.util.Map<String, Object> toMap() {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            put(map, "city", city);
            put(map, "actorType", actorType);
            put(map, "teamSize", teamSize);
            put(map, "listingVolume", listingVolume);
            put(map, "desiredPlan", desiredPlan);
            if (needs != null) {
                java.util.List<String> kept =
                        needs.stream()
                                .filter(n -> n != null && !n.isBlank())
                                .map(String::trim)
                                .toList();
                if (!kept.isEmpty()) {
                    map.put("needs", kept);
                }
            }
            return map;
        }

        private static void put(java.util.Map<String, Object> map, String key, String value) {
            if (value != null && !value.isBlank()) {
                map.put(key, value.trim());
            }
        }
    }

    public DemoDetails getDemo() {
        return demo;
    }

    public void setDemo(DemoDetails demo) {
        this.demo = demo;
    }

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
