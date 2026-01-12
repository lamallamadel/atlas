package com.example.backend.service;

import com.example.backend.dto.AppointmentCreateRequest;
import com.example.backend.dto.AppointmentMapper;
import com.example.backend.dto.AppointmentResponse;
import com.example.backend.dto.AppointmentUpdateRequest;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;

    public AppointmentService(AppointmentRepository appointmentRepository, AppointmentMapper appointmentMapper) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentMapper = appointmentMapper;
    }

    @Transactional
    public AppointmentResponse create(AppointmentCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        AppointmentEntity appointment = appointmentMapper.toEntity(request);
        
        LocalDateTime now = LocalDateTime.now();
        appointment.setCreatedAt(now);
        appointment.setUpdatedAt(now);
        
        List<String> warnings = checkOverlappingAppointments(
                appointment.getAssignedTo(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                null
        );

        AppointmentEntity saved = appointmentRepository.save(appointment);
        AppointmentResponse response = appointmentMapper.toResponse(saved);
        
        if (!warnings.isEmpty()) {
            response.setWarnings(warnings);
        }
        
        return response;
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with id: " + id));
        
        if (!orgId.equals(appointment.getOrgId())) {
            throw new EntityNotFoundException("Appointment not found with id: " + id);
        }
        
        return appointmentMapper.toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse update(Long id, AppointmentUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with id: " + id));
        
        if (!orgId.equals(appointment.getOrgId())) {
            throw new EntityNotFoundException("Appointment not found with id: " + id);
        }

        appointmentMapper.updateEntity(appointment, request);

        LocalDateTime startTime = appointment.getStartTime();
        LocalDateTime endTime = appointment.getEndTime();
        String assignedTo = appointment.getAssignedTo();

        List<String> warnings = checkOverlappingAppointments(assignedTo, startTime, endTime, id);

        appointment.setUpdatedAt(LocalDateTime.now());
        AppointmentEntity updated = appointmentRepository.save(appointment);
        AppointmentResponse response = appointmentMapper.toResponse(updated);
        
        if (!warnings.isEmpty()) {
            response.setWarnings(warnings);
        }
        
        return response;
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with id: " + id));
        
        if (!orgId.equals(appointment.getOrgId())) {
            throw new EntityNotFoundException("Appointment not found with id: " + id);
        }
        
        appointmentRepository.delete(appointment);
    }

   @Transactional(readOnly = true)
public Page<AppointmentResponse> listByDossier(
        Long dossierId,
        LocalDateTime fromDate,
        LocalDateTime toDate,
        String assignedTo,
        AppointmentStatus status,
        Pageable pageable
) {
    String orgId = TenantContext.getOrgId();
    if (orgId == null) {
        throw new IllegalStateException("Organization ID not found in context");
    }

    Specification<AppointmentEntity> spec = Specification.where(
            (root, query, cb) -> cb.equal(root.get("orgId"), orgId)
    );

    if (dossierId != null) {
        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("dossier").get("id"), dossierId));
    }

    if (fromDate != null) {
        spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("startTime"), fromDate));
    }

    if (toDate != null) {
        spec = spec.and((root, query, cb) ->
                cb.lessThanOrEqualTo(root.get("endTime"), toDate));
    }

    if (assignedTo != null && !assignedTo.trim().isEmpty()) {
        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("assignedTo"), assignedTo));
    }

    if (status != null) {
        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("status"), status));
    }

    Page<AppointmentEntity> appointments = appointmentRepository.findAll(spec, pageable);
    return appointments.map(appointmentMapper::toResponse);
}


    private List<String> checkOverlappingAppointments(
            String assignedTo,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Long excludeId
    ) {
        List<String> warnings = new ArrayList<>();
        
        if (assignedTo == null || assignedTo.trim().isEmpty()) {
            return warnings;
        }

        Long excludeIdToUse = excludeId != null ? excludeId : -1L;
        
        List<AppointmentEntity> overlapping = appointmentRepository.findOverlappingAppointments(
                assignedTo,
                startTime,
                endTime,
                excludeIdToUse
        );

        if (!overlapping.isEmpty()) {
            warnings.add("This appointment overlaps with " + overlapping.size() + 
                    " existing appointment(s) for " + assignedTo);
        }

        return warnings;
    }
}
