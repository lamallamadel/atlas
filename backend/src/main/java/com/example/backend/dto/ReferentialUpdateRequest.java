package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request body for updating a referential item with change tracking")
public class ReferentialUpdateRequest {

    @Schema(description = "Display label", example = "Prospect Achat", required = true)
    @NotBlank(message = "Label is required")
    @Size(max = 255, message = "Label must not exceed 255 characters")
    private String label;

    @Schema(description = "Description", example = "Lead for property purchase", nullable = true)
    private String description;

    @Schema(description = "Display order", example = "1", nullable = true)
    private Integer displayOrder;

    @Schema(description = "Is active", example = "true", nullable = true, defaultValue = "true")
    private Boolean isActive = true;

    @Schema(
            description = "Reason for this change (for audit trail)",
            example = "Updated to reflect new business process",
            nullable = true)
    private String changeReason;

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

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }
}
