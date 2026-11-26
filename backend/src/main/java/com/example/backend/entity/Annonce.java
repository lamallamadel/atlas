package com.example.backend.entity;

import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "annonce")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
// Les analyses IA (score, fraude, doublons) tournent en parallèle et sauvent chacune
// l'annonce : sans @DynamicUpdate, chaque sauvegarde réécrirait toutes les colonnes
// et effacerait le résultat des autres analyses.
@DynamicUpdate
public class Annonce extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50)
    private AnnonceType type;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "surface")
    private Double surface;

    @Column(name = "city", length = 255)
    private String city;

    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "currency", length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private AnnonceStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photos_json")
    private List<String> photos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rules_json")
    private Map<String, Object> rulesJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta_json")
    private Map<String, Object> meta = new HashMap<>();

    @Column(name = "ai_score")
    private Integer aiScore;

    @Column(name = "ai_score_details", columnDefinition = "TEXT")
    private String aiScoreDetails;

    @Column(name = "fraud_score")
    private Integer fraudScore;

    @Column(name = "fraud_statut", length = 20)
    private String fraudStatut;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fraud_alertes")
    private List<String> fraudAlertes;

    @Column(name = "duplicate_of_id")
    private Long duplicateOfId;

    @Column(name = "duplicate_similarity")
    private Double duplicateSimilarity;

    @Column(name = "duplicate_statut", length = 20)
    private String duplicateStatut;

    /** Profil issu de l'analyse des photos (pièces, équipements, état…) et description proposée. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_vision_result")
    private Map<String, Object> aiVisionResult;

    @Column(name = "ai_vision_updated_at")
    private LocalDateTime aiVisionUpdatedAt;

    @Column(name = "virtual_tour_url", length = 1000)
    private String virtualTourUrl;

    /** Bien diffusé (cas d'usage n°1) ; vide pour une annonce d'agence sans bien déclaré. */
    @Column(name = "property_id")
    private Long propertyId;

    /** Mandat sous lequel une agence publie le bien d'un propriétaire (lot B). */
    @Column(name = "mandate_id")
    private Long mandateId;

    /** {@code OWNER} (particulier) ou {@code AGENCY} ; vide = agence (annonces existantes). */
    @Column(name = "publisher_kind", length = 16)
    private String publisherKind;

    /** Modération a priori des particuliers : {@code MOD_PENDING}, {@code MOD_APPROVED}, … */
    @Column(name = "moderation_status", length = 20)
    private String moderationStatus;

    @Column(name = "moderation_note", length = 1000)
    private String moderationNote;

    @Column(name = "moderated_by", length = 255)
    private String moderatedBy;

    @Column(name = "moderated_at")
    private LocalDateTime moderatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public AnnonceType getType() {
        return type;
    }

    public void setType(AnnonceType type) {
        this.type = type;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getSurface() {
        return surface;
    }

    public void setSurface(Double surface) {
        this.surface = surface;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public AnnonceStatus getStatus() {
        return status;
    }

    /** Les anciens noms (ACTIVE, PAUSED) sont ramenés aux statuts actuels. */
    public void setStatus(AnnonceStatus status) {
        this.status = AnnonceStatus.normalize(status);
    }

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }

    public Map<String, Object> getRulesJson() {
        return rulesJson;
    }

    public void setRulesJson(Map<String, Object> rulesJson) {
        this.rulesJson = rulesJson;
    }

    public Integer getAiScore() {
        return aiScore;
    }

    public void setAiScore(Integer aiScore) {
        this.aiScore = aiScore;
    }

    public String getAiScoreDetails() {
        return aiScoreDetails;
    }

    public void setAiScoreDetails(String aiScoreDetails) {
        this.aiScoreDetails = aiScoreDetails;
    }

    public Integer getFraudScore() {
        return fraudScore;
    }

    public void setFraudScore(Integer fraudScore) {
        this.fraudScore = fraudScore;
    }

    public String getFraudStatut() {
        return fraudStatut;
    }

    public void setFraudStatut(String fraudStatut) {
        this.fraudStatut = fraudStatut;
    }

    public List<String> getFraudAlertes() {
        return fraudAlertes;
    }

    public void setFraudAlertes(List<String> fraudAlertes) {
        this.fraudAlertes = fraudAlertes;
    }

    public Long getDuplicateOfId() {
        return duplicateOfId;
    }

    public void setDuplicateOfId(Long duplicateOfId) {
        this.duplicateOfId = duplicateOfId;
    }

    public Double getDuplicateSimilarity() {
        return duplicateSimilarity;
    }

    public void setDuplicateSimilarity(Double duplicateSimilarity) {
        this.duplicateSimilarity = duplicateSimilarity;
    }

    public String getDuplicateStatut() {
        return duplicateStatut;
    }

    public void setDuplicateStatut(String duplicateStatut) {
        this.duplicateStatut = duplicateStatut;
    }

    public Map<String, Object> getAiVisionResult() {
        return aiVisionResult;
    }

    public void setAiVisionResult(Map<String, Object> aiVisionResult) {
        this.aiVisionResult = aiVisionResult;
    }

    public LocalDateTime getAiVisionUpdatedAt() {
        return aiVisionUpdatedAt;
    }

    public void setAiVisionUpdatedAt(LocalDateTime aiVisionUpdatedAt) {
        this.aiVisionUpdatedAt = aiVisionUpdatedAt;
    }

    public String getVirtualTourUrl() {
        return virtualTourUrl;
    }

    public void setVirtualTourUrl(String virtualTourUrl) {
        this.virtualTourUrl = virtualTourUrl;
    }

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public String getPublisherKind() {
        return publisherKind;
    }

    public void setPublisherKind(String publisherKind) {
        this.publisherKind = publisherKind;
    }

    public String getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(String moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public String getModerationNote() {
        return moderationNote;
    }

    public void setModerationNote(String moderationNote) {
        this.moderationNote = moderationNote;
    }

    public String getModeratedBy() {
        return moderatedBy;
    }

    public void setModeratedBy(String moderatedBy) {
        this.moderatedBy = moderatedBy;
    }

    public LocalDateTime getModeratedAt() {
        return moderatedAt;
    }

    public void setModeratedAt(LocalDateTime moderatedAt) {
        this.moderatedAt = moderatedAt;
    }

    public Long getMandateId() {
        return mandateId;
    }

    public void setMandateId(Long mandateId) {
        this.mandateId = mandateId;
    }
}
