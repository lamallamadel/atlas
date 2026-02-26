package com.example.backend.service;

import com.example.backend.dto.ConsentAuditReportResponse;
import com.example.backend.dto.ConsentAuditReportResponse.ConsentAuditEntry;
import com.example.backend.dto.ConsentAuditReportResponse.ConsentAuditSummary;
import com.example.backend.entity.ConsentEventEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.repository.ConsentEventRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentAuditReportService {

    private final ConsentEventRepository consentEventRepository;
    private final DossierRepository dossierRepository;

    public ConsentAuditReportService(
            ConsentEventRepository consentEventRepository, DossierRepository dossierRepository) {
        this.consentEventRepository = consentEventRepository;
        this.dossierRepository = dossierRepository;
    }

    @Transactional(readOnly = true)
    public ConsentAuditReportResponse generateDossierConsentAuditReport(Long dossierId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        List<ConsentEventEntity> events =
                consentEventRepository.findByDossierIdOrderByCreatedAtDesc(dossierId);

        ConsentAuditReportResponse report = new ConsentAuditReportResponse();
        report.setDossierId(dossierId);
        report.setLeadName(dossier.getLeadName());
        report.setLeadEmail(dossier.getLeadEmail());
        report.setLeadPhone(dossier.getLeadPhone());
        report.setReportGeneratedAt(LocalDateTime.now());

        List<ConsentAuditEntry> auditEntries = new ArrayList<>();
        long grantedCount = 0;
        long revokedCount = 0;
        long expiredCount = 0;
        long renewedCount = 0;
        LocalDateTime firstConsentDate = null;
        LocalDateTime lastModifiedDate = null;

        for (ConsentEventEntity event : events) {
            ConsentAuditEntry entry = new ConsentAuditEntry();
            entry.setEventId(event.getId());
            entry.setConsentementId(event.getConsentementId());
            entry.setEventType(event.getEventType());
            entry.setChannel(event.getChannel() != null ? event.getChannel().name() : null);
            entry.setConsentType(
                    event.getConsentType() != null ? event.getConsentType().name() : null);
            entry.setOldStatus(event.getOldStatus() != null ? event.getOldStatus().name() : null);
            entry.setNewStatus(event.getNewStatus() != null ? event.getNewStatus().name() : null);
            entry.setTimestamp(event.getCreatedAt());
            entry.setPerformedBy(event.getCreatedBy());
            entry.setDescription(buildEventDescription(event));

            auditEntries.add(entry);

            if ("GRANTED".equals(event.getEventType())) {
                grantedCount++;
            } else if ("REVOKED".equals(event.getEventType())) {
                revokedCount++;
            } else if ("EXPIRED".equals(event.getEventType())) {
                expiredCount++;
            } else if ("RENEWED".equals(event.getEventType())) {
                renewedCount++;
            }

            if (lastModifiedDate == null || event.getCreatedAt().isAfter(lastModifiedDate)) {
                lastModifiedDate = event.getCreatedAt();
            }
            if (firstConsentDate == null || event.getCreatedAt().isBefore(firstConsentDate)) {
                firstConsentDate = event.getCreatedAt();
            }
        }

        ConsentAuditSummary summary = new ConsentAuditSummary();
        summary.setTotalEvents(events.size());
        summary.setGrantedCount(grantedCount);
        summary.setRevokedCount(revokedCount);
        summary.setExpiredCount(expiredCount);
        summary.setRenewedCount(renewedCount);
        summary.setFirstConsentDate(firstConsentDate);
        summary.setLastModifiedDate(lastModifiedDate);

        report.setConsentHistory(auditEntries);
        report.setSummary(summary);

        return report;
    }

    @Transactional(readOnly = true)
    public Page<ConsentEventEntity> getConsentAuditEvents(
            Long dossierId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        if (dossierId != null) {
            Dossier dossier =
                    dossierRepository
                            .findById(dossierId)
                            .orElseThrow(
                                    () ->
                                            new EntityNotFoundException(
                                                    "Dossier not found with id: " + dossierId));

            if (!orgId.equals(dossier.getOrgId())) {
                throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
            }

            return consentEventRepository.findByOrgIdAndDossierIdWithDateRange(
                    orgId, dossierId, startDate, endDate, pageable);
        } else {
            return consentEventRepository.findByOrgIdWithDateRange(
                    orgId, startDate, endDate, pageable);
        }
    }

    private String buildEventDescription(ConsentEventEntity event) {
        String eventType = event.getEventType();
        String channel = event.getChannel() != null ? event.getChannel().name() : "UNKNOWN";
        String consentType =
                event.getConsentType() != null ? event.getConsentType().name() : "UNKNOWN";
        String newStatus = event.getNewStatus() != null ? event.getNewStatus().name() : "UNKNOWN";

        return switch (eventType) {
            case "GRANTED" -> String.format("Consent granted for %s via %s", consentType, channel);
            case "REVOKED" -> String.format("Consent revoked for %s via %s", consentType, channel);
            case "EXPIRED" -> String.format("Consent expired for %s via %s", consentType, channel);
            case "RENEWED" -> String.format("Consent renewed for %s via %s", consentType, channel);
            case "DENIED" -> String.format("Consent denied for %s via %s", consentType, channel);
            case "PENDING" -> String.format("Consent pending for %s via %s", consentType, channel);
            default ->
                    String.format(
                            "Consent status changed to %s for %s via %s",
                            newStatus, consentType, channel);
        };
    }
}
