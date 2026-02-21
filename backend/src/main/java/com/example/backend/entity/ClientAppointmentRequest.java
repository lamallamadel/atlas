package com.example.backend.entity;

import com.example.backend.entity.enums.AppointmentRequestStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "client_appointment_request")
public class ClientAppointmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "org_id", nullable = false, length = 255)
    private String orgId;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "proposed_start_time", nullable = false)
    private LocalDateTime proposedStartTime;

    @Column(name = "proposed_end_time", nullable = false)
    private LocalDateTime proposedEndTime;

    @Column(name = "preferred_location", length = 500)
    private String preferredLocation;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private AppointmentRequestStatus status;

    @Column(name = "agent_response", columnDefinition = "TEXT")
    private String agentResponse;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "responded_by", length = 255)
    private String respondedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = AppointmentRequestStatus.PENDING;
        }
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

    public LocalDateTime getProposedStartTime() {
        return proposedStartTime;
    }

    public void setProposedStartTime(LocalDateTime proposedStartTime) {
        this.proposedStartTime = proposedStartTime;
    }

    public LocalDateTime getProposedEndTime() {
        return proposedEndTime;
    }

    public void setProposedEndTime(LocalDateTime proposedEndTime) {
        this.proposedEndTime = proposedEndTime;
    }

    public String getPreferredLocation() {
        return preferredLocation;
    }

    public void setPreferredLocation(String preferredLocation) {
        this.preferredLocation = preferredLocation;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public AppointmentRequestStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentRequestStatus status) {
        this.status = status;
    }

    public String getAgentResponse() {
        return agentResponse;
    }

    public void setAgentResponse(String agentResponse) {
        this.agentResponse = agentResponse;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }

    public String getRespondedBy() {
        return respondedBy;
    }

    public void setRespondedBy(String respondedBy) {
        this.respondedBy = respondedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
