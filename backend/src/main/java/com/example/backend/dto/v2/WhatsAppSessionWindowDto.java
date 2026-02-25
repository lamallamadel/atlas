package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "WhatsApp session window details")
public class WhatsAppSessionWindowDto {

    @Schema(description = "Session window ID", example = "1")
    private Long id;

    @Schema(description = "Phone number", example = "+14155551234")
    private String phoneNumber;

    @Schema(description = "Organization ID", example = "org_123")
    private String orgId;

    @Schema(description = "When the session window opened")
    private LocalDateTime windowOpensAt;

    @Schema(description = "When the session window expires")
    private LocalDateTime windowExpiresAt;

    @Schema(description = "Last inbound message timestamp")
    private LocalDateTime lastInboundMessageAt;

    @Schema(description = "Last outbound message timestamp")
    private LocalDateTime lastOutboundMessageAt;

    @Schema(description = "Whether the session is currently active", example = "true")
    private boolean active;

    @Schema(description = "Seconds remaining until expiry", example = "3600")
    private Long secondsRemaining;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public LocalDateTime getWindowOpensAt() {
        return windowOpensAt;
    }

    public void setWindowOpensAt(LocalDateTime windowOpensAt) {
        this.windowOpensAt = windowOpensAt;
    }

    public LocalDateTime getWindowExpiresAt() {
        return windowExpiresAt;
    }

    public void setWindowExpiresAt(LocalDateTime windowExpiresAt) {
        this.windowExpiresAt = windowExpiresAt;
    }

    public LocalDateTime getLastInboundMessageAt() {
        return lastInboundMessageAt;
    }

    public void setLastInboundMessageAt(LocalDateTime lastInboundMessageAt) {
        this.lastInboundMessageAt = lastInboundMessageAt;
    }

    public LocalDateTime getLastOutboundMessageAt() {
        return lastOutboundMessageAt;
    }

    public void setLastOutboundMessageAt(LocalDateTime lastOutboundMessageAt) {
        this.lastOutboundMessageAt = lastOutboundMessageAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Long getSecondsRemaining() {
        return secondsRemaining;
    }

    public void setSecondsRemaining(Long secondsRemaining) {
        this.secondsRemaining = secondsRemaining;
    }
}
