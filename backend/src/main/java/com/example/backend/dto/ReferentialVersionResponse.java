package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Referential version history response")
public class ReferentialVersionResponse {

    @Schema(description = "Version ID", example = "1")
    private Long id;

    @Schema(description = "Referential ID", example = "123")
    private Long referentialId;

    @Schema(description = "Category", example = "CASE_TYPE")
    private String category;

    @Schema(description = "Code", example = "CRM_LEAD_BUY")
    private String code;

    @Schema(description = "Label", example = "Prospect Achat")
    private String label;

    @Schema(description = "Description", example = "Lead for property purchase")
    private String description;

    @Schema(description = "Display order", example = "1")
    private Integer displayOrder;

    @Schema(description = "Is active", example = "true")
    private Boolean isActive;

    @Schema(description = "Is system", example = "false")
    private Boolean isSystem;

    @Schema(description = "Change type", example = "UPDATED")
    private String changeType;

    @Schema(description = "Change reason", example = "Updated to reflect new business process")
    private String changeReason;

    @Schema(description = "Created at", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "Created by", example = "admin@example.com")
    private String createdBy;

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

    public String getChangeType() {
        return changeType;
    }

    public void setChangeType(String changeType) {
        this.changeType = changeType;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
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
