package com.example.backend.entity;

import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "consentement_event")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class ConsentEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "org_id", nullable = false, updatable = false)
    private String orgId;

    @Column(name = "dossier_id", nullable = false, updatable = false)
    private Long dossierId;

    @Column(name = "consentement_id", nullable = false, updatable = false)
    private Long consentementId;

    @Column(name = "event_type", nullable = false, length = 50, updatable = false)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 50, updatable = false)
    private ConsentementChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 50, updatable = false)
    private ConsentementType consentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 50, updatable = false)
    private ConsentementStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 50, updatable = false)
    private ConsentementStatus newStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", updatable = false)
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 255, updatable = false)
    private String createdBy;

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

    public Long getConsentementId() {
        return consentementId;
    }

    public void setConsentementId(Long consentementId) {
        this.consentementId = consentementId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public ConsentementChannel getChannel() {
        return channel;
    }

    public void setChannel(ConsentementChannel channel) {
        this.channel = channel;
    }

    public ConsentementType getConsentType() {
        return consentType;
    }

    public void setConsentType(ConsentementType consentType) {
        this.consentType = consentType;
    }

    public ConsentementStatus getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(ConsentementStatus oldStatus) {
        this.oldStatus = oldStatus;
    }

    public ConsentementStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(ConsentementStatus newStatus) {
        this.newStatus = newStatus;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
