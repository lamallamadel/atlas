package com.example.backend.service;

import com.example.backend.dto.AppointmentCreateRequest;
import com.example.backend.dto.AppointmentMapper;
import com.example.backend.dto.AppointmentResponse;
import com.example.backend.dto.AppointmentUpdateRequest;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.ReminderStrategy;
import com.example.backend.observability.MetricsService;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;
    private final MetricsService metricsService;
    private final ActivityService activityService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            AppointmentMapper appointmentMapper,
            MetricsService metricsService,
            ActivityService activityService) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentMapper = appointmentMapper;
        this.metricsService = metricsService;
        this.activityService = activityService;
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

        List<String> warnings =
                checkOverlappingAppointments(
                        appointment.getAssignedTo(),
                        appointment.getStartTime(),
                        appointment.getEndTime(),
                        null);

        AppointmentEntity saved = appointmentRepository.save(appointment);
        metricsService.incrementAppointmentsCreated();

        if (saved.getStatus() == AppointmentStatus.SCHEDULED) {
            logAppointmentScheduledActivity(saved);
        }

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

        AppointmentEntity appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Appointment not found with id: " + id));

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

        AppointmentEntity appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Appointment not found with id: " + id));

        if (!orgId.equals(appointment.getOrgId())) {
            throw new EntityNotFoundException("Appointment not found with id: " + id);
        }

        AppointmentStatus oldStatus = appointment.getStatus();

        appointmentMapper.updateEntity(appointment, request);

        LocalDateTime startTime = appointment.getStartTime();
        LocalDateTime endTime = appointment.getEndTime();
        String assignedTo = appointment.getAssignedTo();

        List<String> warnings = checkOverlappingAppointments(assignedTo, startTime, endTime, id);

        appointment.setUpdatedAt(LocalDateTime.now());
        AppointmentEntity updated = appointmentRepository.save(appointment);
        AppointmentResponse response = appointmentMapper.toResponse(updated);

        // Business metrics: completion & duration
        if (oldStatus != AppointmentStatus.COMPLETED
                && updated.getStatus() == AppointmentStatus.COMPLETED) {
            metricsService.incrementAppointmentsCompleted();
            metricsService.recordAppointmentDurationSeconds(
                    -updated.getStartTime().getSecond() + updated.getEndTime().getSecond());
            logAppointmentCompletedActivity(updated);
        } else if (oldStatus != AppointmentStatus.SCHEDULED
                && updated.getStatus() == AppointmentStatus.SCHEDULED) {
            logAppointmentScheduledActivity(updated);
        }

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

        AppointmentEntity appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Appointment not found with id: " + id));

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
            Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Specification<AppointmentEntity> spec =
                Specification.where((root, query, cb) -> cb.equal(root.get("orgId"), orgId));

        if (dossierId != null) {
            spec =
                    spec.and(
                            (root, query, cb) ->
                                    cb.equal(root.get("dossier").get("id"), dossierId));
        }

        if (fromDate != null) {
            spec =
                    spec.and(
                            (root, query, cb) ->
                                    cb.greaterThanOrEqualTo(root.get("startTime"), fromDate));
        }

        if (toDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("endTime"), toDate));
        }

        if (assignedTo != null && !assignedTo.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("assignedTo"), assignedTo));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        Page<AppointmentEntity> appointments = appointmentRepository.findAll(spec, pageable);
        return appointments.map(appointmentMapper::toResponse);
    }

    private List<String> checkOverlappingAppointments(
            String assignedTo, LocalDateTime startTime, LocalDateTime endTime, Long excludeId) {
        List<String> warnings = new ArrayList<>();

        if (assignedTo == null || assignedTo.trim().isEmpty()) {
            return warnings;
        }

        Long excludeIdToUse = excludeId != null ? excludeId : -1L;

        List<AppointmentEntity> overlapping =
                appointmentRepository.findOverlappingAppointments(
                        assignedTo, startTime, endTime, excludeIdToUse);

        if (!overlapping.isEmpty()) {
            warnings.add(
                    "This appointment overlaps with "
                            + overlapping.size()
                            + " existing appointment(s) for "
                            + assignedTo);
        }

        return warnings;
    }

    private void logAppointmentScheduledActivity(AppointmentEntity appointment) {
        if (activityService != null && appointment.getDossier() != null) {
            try {
                String description =
                        String.format("Appointment scheduled for %s", appointment.getStartTime());
                if (appointment.getLocation() != null
                        && !appointment.getLocation().trim().isEmpty()) {
                    description += " at " + appointment.getLocation();
                }

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("appointmentId", appointment.getId());
                metadata.put("status", appointment.getStatus().name());
                metadata.put("startTime", appointment.getStartTime().toString());
                metadata.put("endTime", appointment.getEndTime().toString());
                if (appointment.getLocation() != null) {
                    metadata.put("location", appointment.getLocation());
                }
                if (appointment.getAssignedTo() != null) {
                    metadata.put("assignedTo", appointment.getAssignedTo());
                }
                metadata.put("timestamp", LocalDateTime.now().toString());

                activityService.logActivity(
                        appointment.getDossier().getId(),
                        ActivityType.APPOINTMENT_SCHEDULED,
                        description,
                        metadata);
            } catch (Exception e) {
                logger.warn(
                        "Failed to log APPOINTMENT_SCHEDULED activity for appointment {}: {}",
                        appointment.getId(),
                        e.getMessage(),
                        e);
            }
        }
    }

    private void logAppointmentCompletedActivity(AppointmentEntity appointment) {
        if (activityService != null && appointment.getDossier() != null) {
            try {
                String description =
                        String.format(
                                "Appointment completed at %s",
                                appointment.getLocation() != null
                                        ? appointment.getLocation()
                                        : "location not specified");

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("appointmentId", appointment.getId());
                metadata.put("status", appointment.getStatus().name());
                metadata.put("startTime", appointment.getStartTime().toString());
                metadata.put("endTime", appointment.getEndTime().toString());
                if (appointment.getLocation() != null) {
                    metadata.put("location", appointment.getLocation());
                }
                if (appointment.getAssignedTo() != null) {
                    metadata.put("assignedTo", appointment.getAssignedTo());
                }
                if (appointment.getNotes() != null) {
                    metadata.put("notes", appointment.getNotes());
                }
                metadata.put("timestamp", LocalDateTime.now().toString());

                activityService.logActivity(
                        appointment.getDossier().getId(),
                        ActivityType.APPOINTMENT_COMPLETED,
                        description,
                        metadata);
            } catch (Exception e) {
                logger.warn(
                        "Failed to log APPOINTMENT_COMPLETED activity for appointment {}: {}",
                        appointment.getId(),
                        e.getMessage(),
                        e);
            }
        }
    }

    @Transactional
    public AppointmentResponse updateReminderStrategy(Long id, ReminderStrategy strategy) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        AppointmentEntity appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Appointment not found with id: " + id));

        if (!orgId.equals(appointment.getOrgId())) {
            throw new EntityNotFoundException("Appointment not found with id: " + id);
        }

        appointment.setReminderStrategy(strategy);
        appointment.setUpdatedAt(LocalDateTime.now());

        AppointmentEntity updated = appointmentRepository.save(appointment);

        logger.info(
                "Reminder strategy updated for appointment {} to {}",
                appointment.getId(),
                strategy);

        if (activityService != null && appointment.getDossier() != null) {
            try {
                String description =
                        String.format("Reminder strategy changed to %s", strategy.name());

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("appointmentId", appointment.getId());
                metadata.put("reminderStrategy", strategy.name());
                metadata.put("timestamp", LocalDateTime.now().toString());

                activityService.logActivity(
                        appointment.getDossier().getId(),
                        ActivityType.STATUS_CHANGE,
                        description,
                        metadata);
            } catch (Exception e) {
                logger.warn(
                        "Failed to log reminder strategy change activity for appointment {}: {}",
                        appointment.getId(),
                        e.getMessage(),
                        e);
            }
        }

        return appointmentMapper.toResponse(updated);
    }
}
