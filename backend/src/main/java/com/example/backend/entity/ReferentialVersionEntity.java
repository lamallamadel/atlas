package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(
        name = "referential_version",
        indexes = {
            @Index(name = "idx_ref_version_ref_id", columnList = "referential_id"),
            @Index(name = "idx_ref_version_org_id", columnList = "org_id"),
            @Index(name = "idx_ref_version_created_at", columnList = "created_at")
        })
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class ReferentialVersionEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "referential_id", nullable = false)
    private Long referentialId;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @Column(name = "label", nullable = false, length = 255)
    private String label;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "is_system", nullable = false)
    private Boolean isSystem;

    @Column(name = "change_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ReferentialChangeType changeType;

    @Column(name = "change_reason", columnDefinition = "TEXT")
    private String changeReason;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getReferentialId() {
        return referentialId;
    }

    public void setReferentialId(Long referentialId) {
        this.referentialId = referentialId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsSystem() {
        return isSystem;
    }

    public void setIsSystem(Boolean isSystem) {
        this.isSystem = isSystem;
    }

    public ReferentialChangeType getChangeType() {
        return changeType;
    }

    public void setChangeType(ReferentialChangeType changeType) {
        this.changeType = changeType;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }

    public enum ReferentialChangeType {
        CREATED,
        UPDATED,
        DELETED,
        ACTIVATED,
        DEACTIVATED
    }
}
