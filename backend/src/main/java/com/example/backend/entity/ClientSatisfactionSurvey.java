package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "client_satisfaction_survey")
public class ClientSatisfactionSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 255)
    private String orgId;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "trigger_type", length = 100)
    private String triggerType;

    @Column(name = "trigger_entity_id")
    private Long triggerEntityId;

    @Column(name = "overall_rating")
    private Integer overallRating;

    @Column(name = "communication_rating")
    private Integer communicationRating;

    @Column(name = "responsiveness_rating")
    private Integer responsivenessRating;

    @Column(name = "professionalism_rating")
    private Integer professionalismRating;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "additional_data", columnDefinition = "jsonb")
    private Map<String, Object> additionalData;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public void setTriggerType(String triggerType) {
        this.triggerType = triggerType;
    }

    public Long getTriggerEntityId() {
        return triggerEntityId;
    }

    public void setTriggerEntityId(Long triggerEntityId) {
        this.triggerEntityId = triggerEntityId;
    }

    public Integer getOverallRating() {
        return overallRating;
    }

    public void setOverallRating(Integer overallRating) {
        this.overallRating = overallRating;
    }

    public Integer getCommunicationRating() {
        return communicationRating;
    }

    public void setCommunicationRating(Integer communicationRating) {
        this.communicationRating = communicationRating;
    }

    public Integer getResponsivenessRating() {
        return responsivenessRating;
    }

    public void setResponsivenessRating(Integer responsivenessRating) {
        this.responsivenessRating = responsivenessRating;
    }

    public Integer getProfessionalismRating() {
        return professionalismRating;
    }

    public void setProfessionalismRating(Integer professionalismRating) {
        this.professionalismRating = professionalismRating;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Map<String, Object> getAdditionalData() {
        return additionalData;
    }

    public void setAdditionalData(Map<String, Object> additionalData) {
        this.additionalData = additionalData;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
