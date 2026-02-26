package com.example.backend.entity;

import com.example.backend.entity.enums.WhatsAppConversationType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.Filter;

@Entity
@Table(
        name = "whatsapp_cost_tracking",
        indexes = {
            @Index(name = "idx_cost_tracking_org_id", columnList = "org_id"),
            @Index(name = "idx_cost_tracking_org_created", columnList = "org_id, created_at"),
            @Index(name = "idx_cost_tracking_message_id", columnList = "message_id"),
            @Index(name = "idx_cost_tracking_conversation_opened", columnList = "conversation_opened_at")
        })
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class WhatsAppCostTracking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "message_id")
    private Long messageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "conversation_type", nullable = false, length = 50)
    private WhatsAppConversationType conversationType;

    @Column(name = "cost_per_conversation", nullable = false, precision = 10, scale = 5)
    private BigDecimal costPerConversation;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "conversation_opened_at", nullable = false)
    private LocalDateTime conversationOpenedAt;

    @Column(name = "conversation_closed_at")
    private LocalDateTime conversationClosedAt;

    @Column(name = "message_count", nullable = false)
    private Integer messageCount = 1;

    @Column(name = "total_cost", nullable = false, precision = 10, scale = 5)
    private BigDecimal totalCost;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public WhatsAppConversationType getConversationType() {
        return conversationType;
    }

    public void setConversationType(WhatsAppConversationType conversationType) {
        this.conversationType = conversationType;
    }

    public BigDecimal getCostPerConversation() {
        return costPerConversation;
    }

    public void setCostPerConversation(BigDecimal costPerConversation) {
        this.costPerConversation = costPerConversation;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public LocalDateTime getConversationOpenedAt() {
        return conversationOpenedAt;
    }

    public void setConversationOpenedAt(LocalDateTime conversationOpenedAt) {
        this.conversationOpenedAt = conversationOpenedAt;
    }

    public LocalDateTime getConversationClosedAt() {
        return conversationClosedAt;
    }

    public void setConversationClosedAt(LocalDateTime conversationClosedAt) {
        this.conversationClosedAt = conversationClosedAt;
    }

    public Integer getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(Integer messageCount) {
        this.messageCount = messageCount;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }
}
