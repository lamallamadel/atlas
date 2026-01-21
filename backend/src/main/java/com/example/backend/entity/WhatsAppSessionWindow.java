package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;

@Entity
@Table(name = "whatsapp_session_window", 
    indexes = {
        @Index(name = "idx_session_org_phone", columnList = "org_id,phone_number"),
        @Index(name = "idx_session_window_expires", columnList = "window_expires_at")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_session_org_phone", columnNames = {"org_id", "phone_number"})
    }
)
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class WhatsAppSessionWindow extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "phone_number", nullable = false, length = 50)
    private String phoneNumber;

    @Column(name = "window_opens_at", nullable = false)
    private LocalDateTime windowOpensAt;

    @Column(name = "window_expires_at", nullable = false)
    private LocalDateTime windowExpiresAt;

    @Column(name = "last_inbound_message_at", nullable = false)
    private LocalDateTime lastInboundMessageAt;

    @Column(name = "last_outbound_message_at")
    private LocalDateTime lastOutboundMessageAt;

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

    public boolean isWithinWindow() {
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(windowOpensAt) && now.isBefore(windowExpiresAt);
    }
}
