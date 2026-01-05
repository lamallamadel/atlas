package com.example.backend.dto;

import com.example.backend.entity.enums.DossierStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Response object for dossier status history")
public class DossierStatusHistoryResponse {

    @Schema(description = "Status history entry ID", example = "1")
    private Long id;

    @Schema(description = "Dossier ID", example = "123")
    private Long dossierId;

    @Schema(description = "Previous status", example = "NEW")
    private DossierStatus fromStatus;

    @Schema(description = "New status", example = "QUALIFYING")
    private DossierStatus toStatus;

    @Schema(description = "User ID who performed the transition", example = "user123")
    private String userId;

    @Schema(description = "Reason for the transition", example = "Client qualified after initial call")
    private String reason;

    @Schema(description = "Timestamp when the transition occurred", example = "2024-01-15T10:30:00")
    private LocalDateTime transitionedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public DossierStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(DossierStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public DossierStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(DossierStatus toStatus) {
        this.toStatus = toStatus;
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

    public LocalDateTime getTransitionedAt() {
        return transitionedAt;
    }

    public void setTransitionedAt(LocalDateTime transitionedAt) {
        this.transitionedAt = transitionedAt;
    }
}
