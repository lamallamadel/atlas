package com.example.backend.dto;

import com.example.backend.entity.enums.DossierStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request body for updating dossier status")
public class DossierStatusPatchRequest {

    @Schema(description = "New status for the dossier", example = "QUALIFIED", required = true)
    @NotNull(message = "Status is required")
    private DossierStatus status;

    @Schema(description = "User ID performing the status change", example = "user123")
    private String userId;

    @Schema(description = "Reason for the status change", example = "Client qualified after initial call")
    private String reason;

    public DossierStatusPatchRequest() {
    }

    public DossierStatus getStatus() {
        return status;
    }

    public void setStatus(DossierStatus status) {
        this.status = status;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
