package com.example.backend.entity;

import com.example.backend.security.DossierScope;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Conversation entre l'annonceur et le prospect d'un contact (cas d'usage n°1, UC-P4). Les messages
 * eux-mêmes sont des {@link MessageEntity} du dossier, canal {@code IN_APP}.
 */
@Entity
@Table(name = "lead_conversation")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@Filter(
        name = DossierScope.FILTER,
        condition = DossierScope.CHILD_CONDITION,
        deduceAliasInjectionPoints = false)
@EntityListeners(AuditingEntityListener.class)
public class LeadConversationEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false, updatable = false)
    private Long dossierId;

    @Column(name = "owner_last_read_at")
    private LocalDateTime ownerLastReadAt;

    @Column(name = "prospect_last_read_at")
    private LocalDateTime prospectLastReadAt;

    @Column(name = "owner_alerted_at")
    private LocalDateTime ownerAlertedAt;

    @Column(name = "prospect_alerted_at")
    private LocalDateTime prospectAlertedAt;

    public Long getId() {
        return id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public LocalDateTime getOwnerLastReadAt() {
        return ownerLastReadAt;
    }

    public void setOwnerLastReadAt(LocalDateTime ownerLastReadAt) {
        this.ownerLastReadAt = ownerLastReadAt;
    }

    public LocalDateTime getProspectLastReadAt() {
        return prospectLastReadAt;
    }

    public void setProspectLastReadAt(LocalDateTime prospectLastReadAt) {
        this.prospectLastReadAt = prospectLastReadAt;
    }

    public LocalDateTime getOwnerAlertedAt() {
        return ownerAlertedAt;
    }

    public void setOwnerAlertedAt(LocalDateTime ownerAlertedAt) {
        this.ownerAlertedAt = ownerAlertedAt;
    }

    public LocalDateTime getProspectAlertedAt() {
        return prospectAlertedAt;
    }

    public void setProspectAlertedAt(LocalDateTime prospectAlertedAt) {
        this.prospectAlertedAt = prospectAlertedAt;
    }
}
