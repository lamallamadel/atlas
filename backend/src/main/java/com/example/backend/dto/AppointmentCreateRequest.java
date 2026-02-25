package com.example.backend.dto;

import com.example.backend.entity.enums.AppointmentStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public class AppointmentCreateRequest {

    @NotNull(message = "Dossier ID is required")
    private Long dossierId;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @Size(max = 500, message = "Location must not exceed 500 characters")
    private String location;

    @Size(max = 255, message = "Assigned to must not exceed 255 characters")
    private String assignedTo;

    @Size(max = 10000, message = "Notes must not exceed 10000 characters")
    private String notes;

    private AppointmentStatus status;

    private List<String> reminderChannels;

    @Size(max = 255, message = "Template code must not exceed 255 characters")
    private String templateCode;

    public AppointmentCreateRequest() {}

    @AssertTrue(message = "Start time must be before end time")
    public boolean isValidTimeRange() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return startTime.isBefore(endTime);
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public List<String> getReminderChannels() {
        return reminderChannels;
    }

    public void setReminderChannels(List<String> reminderChannels) {
        this.reminderChannels = reminderChannels;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }
}
