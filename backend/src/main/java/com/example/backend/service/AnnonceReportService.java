package com.example.backend.service;

import com.example.backend.dto.AnnonceReportResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceReport;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceReportRepository;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Signalements d'annonces (étape 5 du backlog) : envoyés par les visiteurs du portail, traités par
 * l'agence propriétaire de l'annonce, qui les écarte ou suspend l'annonce.
 */
@Service
public class AnnonceReportService {

    private static final Logger log = LoggerFactory.getLogger(AnnonceReportService.class);

    /** Raisons de signalement (nomenclature {@code REPORT_REASON}). */
    public static final Set<String> REASONS =
            Set.of(
                    "REPORT_FRAUD",
                    "REPORT_INCORRECT_INFO",
                    "REPORT_DUPLICATE",
                    "REPORT_SPAM",
                    "REPORT_OTHER");

    /** Raison de suspension de l'annonce selon la raison du signalement. */
    static final Map<String, String> SUSPEND_REASON_BY_REPORT =
            Map.of(
                    "REPORT_FRAUD", "MOD_SUSPECT_FRAUD",
                    "REPORT_DUPLICATE", "MOD_DUPLICATE_LISTING",
                    "REPORT_SPAM", "MOD_ILLEGAL_CONTENT");

    /** Un même visiteur ne peut ouvrir qu'un signalement par annonce et par 24 h. */
    static final int DEDUP_HOURS = 24;

    private final AnnonceReportRepository reportRepository;
    private final PublicLeadService publicLeadService;
    private final AnnonceService annonceService;

    public AnnonceReportService(
            AnnonceReportRepository reportRepository,
            PublicLeadService publicLeadService,
            AnnonceService annonceService) {
        this.reportRepository = reportRepository;
        this.publicLeadService = publicLeadService;
        this.annonceService = annonceService;
    }

    /** Signalement envoyé depuis le portail (visiteur anonyme). */
    @Transactional
    public void submitPublic(
            Long annonceId,
            String reasonCode,
            String comment,
            String reporterEmail,
            String ipAddress,
            String userAgent) {
        if (reasonCode == null || !REASONS.contains(reasonCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "REASON_INVALID: choisissez un motif de signalement.");
        }
        Annonce annonce =
                publicLeadService
                        .findPublicAnnonce(annonceId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "ANNONCE_NOT_FOUND: cette annonce n'est plus"
                                                        + " disponible."));

        if (ipAddress != null
                && reportRepository.existsByAnnonceIdAndIpAddressAndStatusAndCreatedAtAfter(
                        annonce.getId(),
                        ipAddress,
                        AnnonceReport.STATUS_OPEN,
                        LocalDateTime.now().minusHours(DEDUP_HOURS))) {
            // Déjà signalée par ce visiteur : on ne crée pas de doublon, réponse identique.
            return;
        }

        AnnonceReport report = new AnnonceReport();
        report.setOrgId(annonce.getOrgId());
        report.setAnnonceId(annonce.getId());
        report.setReasonCode(reasonCode);
        report.setComment(truncate(comment, 1000));
        report.setReporterEmail(truncate(blankToNull(reporterEmail), 255));
        report.setIpAddress(truncate(ipAddress, 64));
        report.setUserAgent(truncate(userAgent, 500));
        report.setStatus(AnnonceReport.STATUS_OPEN);
        report.setCreatedAt(LocalDateTime.now());
        reportRepository.save(report);
        log.info(
                "Annonce report received: annonceId={}, orgId={}, reason={}",
                annonce.getId(),
                annonce.getOrgId(),
                reasonCode);
    }

    /** Signalements d'une annonce de l'agence courante, les plus récents d'abord. */
    @Transactional(readOnly = true)
    public List<AnnonceReportResponse> listForAnnonce(Long annonceId) {
        String orgId = requireOrg();
        annonceService.findEntityById(annonceId); // 404 si l'annonce n'est pas de l'agence
        return reportRepository
                .findByOrgIdAndAnnonceIdOrderByCreatedAtDesc(orgId, annonceId)
                .stream()
                .map(AnnonceReportResponse::from)
                .toList();
    }

    /** File de l'agence : ouverts par défaut, ou tous ({@code status = null}). */
    @Transactional(readOnly = true)
    public List<AnnonceReportResponse> listForOrg(String status) {
        String orgId = requireOrg();
        List<AnnonceReport> reports =
                status == null || status.isBlank()
                        ? reportRepository.findByOrgIdOrderByCreatedAtDesc(orgId)
                        : reportRepository.findByOrgIdAndStatusOrderByCreatedAtDesc(
                                orgId, status.toUpperCase());
        return reports.stream().map(AnnonceReportResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long countOpen(String orgId, Long annonceId) {
        return reportRepository.countByOrgIdAndAnnonceIdAndStatus(
                orgId, annonceId, AnnonceReport.STATUS_OPEN);
    }

    /**
     * Clôt un signalement. {@link AnnonceReport#RESOLUTION_DISMISSED} : l'annonce reste en ligne.
     * {@link AnnonceReport#RESOLUTION_ANNONCE_SUSPENDED} : l'annonce est suspendue (si elle est en
     * ligne) et tous ses signalements ouverts sont clos avec cette décision.
     */
    @Transactional
    public AnnonceReportResponse close(Long reportId, String resolution, String comment) {
        String orgId = requireOrg();
        AnnonceReport report =
                reportRepository
                        .findByIdAndOrgId(reportId, orgId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "REPORT_NOT_FOUND: signalement introuvable."));
        if (AnnonceReport.STATUS_CLOSED.equals(report.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "REPORT_ALREADY_CLOSED: ce signalement est déjà clos.");
        }

        if (AnnonceReport.RESOLUTION_DISMISSED.equals(resolution)) {
            closeOne(report, resolution, comment);
            return AnnonceReportResponse.from(report);
        }
        if (!AnnonceReport.RESOLUTION_ANNONCE_SUSPENDED.equals(resolution)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "RESOLUTION_INVALID: DISMISSED ou ANNONCE_SUSPENDED attendu.");
        }

        Annonce annonce = annonceService.findEntityById(report.getAnnonceId());
        if (annonce.getStatus() == AnnonceStatus.PUBLISHED) {
            annonceService.applyTransition(
                    annonce.getId(),
                    AnnoncePublicationService.T_SUSPEND,
                    SUSPEND_REASON_BY_REPORT.getOrDefault(report.getReasonCode(), "MOD_OTHER"),
                    comment != null && !comment.isBlank() ? comment : "Signalement n°" + reportId);
        }
        for (AnnonceReport open :
                reportRepository.findByOrgIdAndAnnonceIdAndStatus(
                        orgId, report.getAnnonceId(), AnnonceReport.STATUS_OPEN)) {
            closeOne(open, resolution, comment);
        }
        return AnnonceReportResponse.from(report);
    }

    private void closeOne(AnnonceReport report, String resolution, String comment) {
        report.setStatus(AnnonceReport.STATUS_CLOSED);
        report.setResolution(resolution);
        report.setResolutionComment(truncate(blankToNull(comment), 1000));
        report.setClosedAt(LocalDateTime.now());
        report.setClosedBy(currentUser());
        reportRepository.save(report);
    }

    private static String requireOrg() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        return orgId;
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }
}
