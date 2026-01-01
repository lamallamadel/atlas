package com.example.backend.dto;

import com.example.backend.entity.enums.DossierStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request body for updating dossier status")
public class DossierStatusPatchRequest {

    @Schema(description = "New status for the dossier", example = "QUALIFIED", required = true)
    @NotNull(message = "Status is required")
    private DossierStatus status;

    public DossierStatusPatchRequest() {
    }

    public DossierStatus getStatus() {
        return status;
    }

    public void setStatus(DossierStatus status) {
        this.status = status;
    }
}
