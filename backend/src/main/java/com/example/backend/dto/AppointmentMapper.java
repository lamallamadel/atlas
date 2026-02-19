package com.example.backend.dto;

import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {

    private final DossierRepository dossierRepository;

    public AppointmentMapper(DossierRepository dossierRepository) {
        this.dossierRepository = dossierRepository;
    }

    public AppointmentEntity toEntity(AppointmentCreateRequest request) {
        AppointmentEntity appointment = new AppointmentEntity();

        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        appointment.setOrgId(orgId);

        Dossier dossier =
                dossierRepository
                        .findById(request.getDossierId())
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: "
                                                        + request.getDossierId()));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException(
                    "Dossier not found with id: " + request.getDossierId());
        }

        appointment.setDossier(dossier);
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setLocation(request.getLocation());
        appointment.setAssignedTo(request.getAssignedTo());
        appointment.setNotes(request.getNotes());
        appointment.setStatus(
                request.getStatus() != null ? request.getStatus() : AppointmentStatus.SCHEDULED);

        return appointment;
    }

    public void updateEntity(AppointmentEntity appointment, AppointmentUpdateRequest request) {
        if (request.getStartTime() != null) {
            appointment.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            appointment.setEndTime(request.getEndTime());
        }
        if (request.getLocation() != null) {
            appointment.setLocation(request.getLocation());
        }
        if (request.getAssignedTo() != null) {
            appointment.setAssignedTo(request.getAssignedTo());
        }
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }
        if (request.getStatus() != null) {
            appointment.setStatus(request.getStatus());
        }
    }

    public AppointmentResponse toResponse(AppointmentEntity appointment) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(appointment.getId());
        response.setOrgId(appointment.getOrgId());
        response.setDossierId(
                appointment.getDossier() != null ? appointment.getDossier().getId() : null);
        response.setStartTime(appointment.getStartTime());
        response.setEndTime(appointment.getEndTime());
        response.setLocation(appointment.getLocation());
        response.setAssignedTo(appointment.getAssignedTo());
        response.setNotes(appointment.getNotes());
        response.setStatus(appointment.getStatus());
        response.setCreatedAt(appointment.getCreatedAt());
        response.setUpdatedAt(appointment.getUpdatedAt());
        response.setCreatedBy(appointment.getCreatedBy());
        response.setUpdatedBy(appointment.getUpdatedBy());
        return response;
    }
}
