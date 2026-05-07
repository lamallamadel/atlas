package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CreateReservationRequest {

    @NotNull(message = "Dossier ID is required")
    private Long dossierId;

    private BigDecimal depositAmount;

    // Getters and Setters

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }
}
