package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Response containing queued messages awaiting retry")
public class WhatsAppRetryQueueResponse {

    @Schema(description = "List of queued messages")
    private List<WhatsAppQueuedMessageDto> messages;

    @Schema(description = "Total number of queued messages", example = "15")
    private int totalCount;

    @Schema(description = "Response timestamp")
    private LocalDateTime timestamp;

    public List<WhatsAppQueuedMessageDto> getMessages() {
        return messages;
    }

    public void setMessages(List<WhatsAppQueuedMessageDto> messages) {
        this.messages = messages;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
