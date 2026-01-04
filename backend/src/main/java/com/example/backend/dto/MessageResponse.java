package com.example.backend.dto;

import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Message response representation")
public class MessageResponse {

    @Schema(description = "Unique identifier of the message", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Dossier ID", example = "1")
    private Long dossierId;

    @Schema(description = "Message channel", example = "EMAIL")
    private MessageChannel channel;

    @Schema(description = "Message direction", example = "INBOUND")
    private MessageDirection direction;

    @Schema(description = "Message content", example = "Hello, I am interested in this property")
    private String content;

    @Schema(description = "Message timestamp", example = "2024-01-01T12:00:00")
    private LocalDateTime timestamp;

    @Schema(description = "Timestamp when the message was created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    public MessageResponse() {
    }

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

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public MessageChannel getChannel() {
        return channel;
    }

    public void setChannel(MessageChannel channel) {
        this.channel = channel;
    }

    public MessageDirection getDirection() {
        return direction;
    }

    public void setDirection(MessageDirection direction) {
        this.direction = direction;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
