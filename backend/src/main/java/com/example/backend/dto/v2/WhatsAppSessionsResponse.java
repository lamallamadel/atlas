package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Response containing active WhatsApp session windows")
public class WhatsAppSessionsResponse {

    @Schema(description = "List of session windows")
    private List<WhatsAppSessionWindowDto> sessions;

    @Schema(description = "Total number of sessions returned", example = "25")
    private int totalCount;

    @Schema(description = "Number of active sessions", example = "18")
    private long activeCount;

    @Schema(description = "Response timestamp")
    private LocalDateTime timestamp;

    public List<WhatsAppSessionWindowDto> getSessions() {
        return sessions;
    }

    public void setSessions(List<WhatsAppSessionWindowDto> sessions) {
        this.sessions = sessions;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public long getActiveCount() {
        return activeCount;
    }

    public void setActiveCount(long activeCount) {
        this.activeCount = activeCount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
