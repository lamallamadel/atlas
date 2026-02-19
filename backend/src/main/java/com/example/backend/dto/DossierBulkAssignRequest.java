package com.example.backend.dto;

import com.example.backend.entity.enums.DossierStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class DossierBulkAssignRequest {

    @NotEmpty(message = "IDs list cannot be empty")
    private List<Long> ids;

    @NotNull(message = "Status is required")
    private DossierStatus status;

    private String reason;
    private String userId;

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }

    public DossierStatus getStatus() {
        return status;
    }

    public void setStatus(DossierStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
