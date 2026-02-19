package com.example.backend.dto;

import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Schema(description = "Request body for creating a new message")
public class MessageCreateRequest {

    @Schema(description = "Dossier ID", example = "1", required = true)
    @NotNull(message = "Dossier ID is required")
    private Long dossierId;

    @Schema(description = "Message channel", example = "EMAIL", required = true)
    @NotNull(message = "Channel is required")
    private MessageChannel channel;

    @Schema(description = "Message direction", example = "INBOUND", required = true)
    @NotNull(message = "Direction is required")
    private MessageDirection direction;

    @Schema(
            description = "Message content",
            example = "Hello, I am interested in this property",
            required = true)
    @NotBlank(message = "Content is required and cannot be blank")
    private String content;

    @Schema(description = "Message timestamp", example = "2024-01-01T12:00:00", required = true)
    @NotNull(message = "Timestamp is required")
    private LocalDateTime timestamp;

    public MessageCreateRequest() {}

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
}
