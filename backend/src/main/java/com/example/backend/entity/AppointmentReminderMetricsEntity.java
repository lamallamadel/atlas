package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(
        name = "appointment_reminder_metrics",
        indexes = {
            @Index(
                    name = "idx_appointment_reminder_metrics_org_id",
                    columnList = "org_id"),
            @Index(
                    name = "idx_appointment_reminder_metrics_appointment_id",
                    columnList = "appointment_id"),
            @Index(
                    name = "idx_appointment_reminder_metrics_channel",
                    columnList = "channel"),
            @Index(
                    name = "idx_appointment_reminder_metrics_status",
                    columnList = "status"),
            @Index(
                    name = "idx_appointment_reminder_metrics_template_code",
                    columnList = "template_code"),
            @Index(
                    name = "idx_appointment_reminder_metrics_agent_id",
                    columnList = "agent_id"),
            @Index(
                    name = "idx_appointment_reminder_metrics_sent_at",
                    columnList = "sent_at"),
            @Index(
                    name = "idx_appointment_reminder_metrics_org_sent_at",
                    columnList = "org_id, sent_at"),
            @Index(
                    name = "idx_appointment_reminder_metrics_channel_status",
                    columnList = "channel, status")
        })
@EntityListeners(AuditingEntityListener.class)
public class AppointmentReminderMetricsEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private AppointmentEntity appointment;

    @Column(name = "channel", nullable = false, length = 50)
    private String channel;

    @Column(name = "template_code", length = 255)
    private String templateCode;

    @Column(name = "agent_id", length = 255)
    private String agentId;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "failed_reason", columnDefinition = "text")
    private String failedReason;

    @Column(name = "no_show_occurred", nullable = false)
    private Boolean noShowOccurred = false;

    @Column(name = "reminder_strategy", length = 50)
    private String reminderStrategy;

    @Column(name = "no_show_probability")
    private Double noShowProbability;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AppointmentEntity getAppointment() {
        return appointment;
    }

    public void setAppointment(AppointmentEntity appointment) {
        this.appointment = appointment;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public String getFailedReason() {
        return failedReason;
    }

    public void setFailedReason(String failedReason) {
        this.failedReason = failedReason;
    }

    public Boolean getNoShowOccurred() {
        return noShowOccurred;
    }

    public void setNoShowOccurred(Boolean noShowOccurred) {
        this.noShowOccurred = noShowOccurred;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getReminderStrategy() {
        return reminderStrategy;
    }

    public void setReminderStrategy(String reminderStrategy) {
        this.reminderStrategy = reminderStrategy;
    }

    public Double getNoShowProbability() {
        return noShowProbability;
    }

    public void setNoShowProbability(Double noShowProbability) {
        this.noShowProbability = noShowProbability;
    }
}
