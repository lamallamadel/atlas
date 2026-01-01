package com.example.backend.dto;

import com.example.backend.entity.enums.DossierStatus;
import jakarta.validation.constraints.NotNull;

public class DossierStatusPatchRequest {

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
