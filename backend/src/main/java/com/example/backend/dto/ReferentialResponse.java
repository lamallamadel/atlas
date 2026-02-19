package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Referential item response")
public class ReferentialResponse {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Referential category", example = "CASE_TYPE")
    private String category;

    @Schema(description = "Unique code within category", example = "CRM_LEAD_BUY")
    private String code;

    @Schema(description = "Display label", example = "Prospect Achat")
    private String label;

    @Schema(description = "Description", example = "Lead for property purchase", nullable = true)
    private String description;

    @Schema(description = "Display order", example = "1", nullable = true)
    private Integer displayOrder;

    @Schema(description = "Is active", example = "true")
    private Boolean isActive;

    @Schema(description = "Is system-defined (cannot be deleted)", example = "false")
    private Boolean isSystem;

    @Schema(description = "Timestamp when created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when last updated", example = "2024-01-01T12:00:00")
    private LocalDateTime updatedAt;

    @Schema(description = "User who created the item", nullable = true)
    private String createdBy;

    @Schema(description = "User who last updated the item", nullable = true)
    private String updatedBy;

    @Schema(description = "Version number", example = "1")
    private Long version;

    @Schema(description = "Last change type", example = "UPDATED")
    private String lastChangeType;

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getLastChangeType() {
        return lastChangeType;
    }

    public void setLastChangeType(String lastChangeType) {
        this.lastChangeType = lastChangeType;
    }
}
