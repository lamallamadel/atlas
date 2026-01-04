package com.example.backend.dto;

import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class ConsentementCreateRequest {

    @NotNull(message = "Dossier ID is required")
    private Long dossierId;

    @NotNull(message = "Channel is required")
    private ConsentementChannel channel;

    @NotNull(message = "Status is required")
    private ConsentementStatus status;

    private Map<String, Object> meta;

    public ConsentementCreateRequest() {
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public ConsentementChannel getChannel() {
        return channel;
    }

    public void setChannel(ConsentementChannel channel) {
        this.channel = channel;
    }

    public ConsentementStatus getStatus() {
        return status;
    }

    public void setStatus(ConsentementStatus status) {
        this.status = status;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }
}
