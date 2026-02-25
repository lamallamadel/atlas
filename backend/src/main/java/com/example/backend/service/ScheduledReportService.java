package com.example.backend.service;

import com.example.backend.dto.ScheduledReportRequest;
import com.example.backend.dto.ScheduledReportResponse;
import com.example.backend.entity.ScheduledReportEntity;
import com.example.backend.repository.ScheduledReportRepository;
import jakarta.mail.internet.MimeMessage;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduledReportService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledReportService.class);

    private final ScheduledReportRepository scheduledReportRepository;
    private final JavaMailSender mailSender;

    public ScheduledReportService(
            ScheduledReportRepository scheduledReportRepository, JavaMailSender mailSender) {
        this.scheduledReportRepository = scheduledReportRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public ScheduledReportResponse createScheduledReport(
            String orgId, ScheduledReportRequest request) {
        logger.info("Creating scheduled report for org: {}", orgId);

        ScheduledReportEntity entity = new ScheduledReportEntity();
        entity.setOrgId(orgId);
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setReportType(request.getReportType());
        entity.setFrequency(request.getFrequency());
        entity.setFormat(request.getFormat());
        entity.setRecipients(request.getRecipients());
        entity.setParameters(request.getParameters());
        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setDayOfMonth(request.getDayOfMonth());
        entity.setHour(request.getHour() != null ? request.getHour() : 8);
        entity.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);

        LocalDateTime nextRun = calculateNextRunTime(entity);
        entity.setNextRunAt(nextRun);

        entity = scheduledReportRepository.save(entity);

        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<ScheduledReportResponse> getScheduledReports(String orgId, Pageable pageable) {
        return scheduledReportRepository.findByOrgId(orgId, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ScheduledReportResponse getScheduledReport(Long id, String orgId) {
        ScheduledReportEntity entity =
                scheduledReportRepository
                        .findById(id)
                        .orElseThrow(() -> new RuntimeException("Scheduled report not found"));

        if (!entity.getOrgId().equals(orgId)) {
            throw new RuntimeException("Access denied");
        }

        return mapToResponse(entity);
    }

    @Transactional
    public ScheduledReportResponse updateScheduledReport(
            Long id, String orgId, ScheduledReportRequest request) {
        ScheduledReportEntity entity =
                scheduledReportRepository
                        .findById(id)
                        .orElseThrow(() -> new RuntimeException("Scheduled report not found"));

        if (!entity.getOrgId().equals(orgId)) {
            throw new RuntimeException("Access denied");
        }

        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setReportType(request.getReportType());
        entity.setFrequency(request.getFrequency());
        entity.setFormat(request.getFormat());
        entity.setRecipients(request.getRecipients());
        entity.setParameters(request.getParameters());
        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setDayOfMonth(request.getDayOfMonth());
        entity.setHour(request.getHour());
        entity.setEnabled(request.getEnabled());

        LocalDateTime nextRun = calculateNextRunTime(entity);
        entity.setNextRunAt(nextRun);

        entity = scheduledReportRepository.save(entity);

        return mapToResponse(entity);
    }

    @Transactional
    public void deleteScheduledReport(Long id, String orgId) {
        ScheduledReportEntity entity =
                scheduledReportRepository
                        .findById(id)
                        .orElseThrow(() -> new RuntimeException("Scheduled report not found"));

        if (!entity.getOrgId().equals(orgId)) {
            throw new RuntimeException("Access denied");
        }

        scheduledReportRepository.delete(entity);
    }

    @Transactional
    public void executeDueReports() {
        logger.info("Executing due scheduled reports");

        List<ScheduledReportEntity> dueReports =
                scheduledReportRepository.findDueReports(LocalDateTime.now());

        for (ScheduledReportEntity report : dueReports) {
            try {
                executeReport(report);

                report.setLastRunAt(LocalDateTime.now());
                report.setLastStatus("SUCCESS");
                report.setLastError(null);
                report.setRunCount(report.getRunCount() + 1);
                report.setNextRunAt(calculateNextRunTime(report));

                scheduledReportRepository.save(report);

            } catch (Exception e) {
                logger.error("Failed to execute scheduled report: {}", report.getId(), e);

                report.setLastRunAt(LocalDateTime.now());
                report.setLastStatus("FAILED");
                report.setLastError(e.getMessage());
                report.setNextRunAt(calculateNextRunTime(report));

                scheduledReportRepository.save(report);
            }
        }
    }

    private void executeReport(ScheduledReportEntity report) throws Exception {
        logger.info("Executing report: {} ({})", report.getName(), report.getId());

        byte[] reportData = generateReportData(report);

        sendReportEmail(report, reportData);
    }

    private byte[] generateReportData(ScheduledReportEntity report) {
        return new byte[0];
    }

    private void sendReportEmail(ScheduledReportEntity report, byte[] reportData) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(report.getRecipients().toArray(new String[0]));
        helper.setSubject("Scheduled Report: " + report.getName());
        helper.setText("Please find attached your scheduled report: " + report.getName());

        String filename =
                String.format(
                        "%s_%s.%s",
                        report.getName().replaceAll("\\s+", "_"),
                        LocalDateTime.now().toString(),
                        report.getFormat().name().toLowerCase());

        helper.addAttachment(filename, () -> new java.io.ByteArrayInputStream(reportData));

        mailSender.send(message);

        logger.info("Report email sent to {} recipients", report.getRecipients().size());
    }

    private LocalDateTime calculateNextRunTime(ScheduledReportEntity report) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next = now.withMinute(0).withSecond(0).withNano(0);

        int hour = report.getHour() != null ? report.getHour() : 8;
        next = next.withHour(hour);

        switch (report.getFrequency()) {
            case DAILY:
                if (next.isBefore(now)) {
                    next = next.plusDays(1);
                }
                break;

            case WEEKLY:
                DayOfWeek targetDay =
                        report.getDayOfWeek() != null ? report.getDayOfWeek() : DayOfWeek.MONDAY;
                next = next.with(TemporalAdjusters.next(targetDay));
                break;

            case MONTHLY:
                int dayOfMonth = report.getDayOfMonth() != null ? report.getDayOfMonth() : 1;
                next =
                        next.withDayOfMonth(
                                Math.min(dayOfMonth, next.toLocalDate().lengthOfMonth()));
                if (next.isBefore(now)) {
                    next = next.plusMonths(1);
                    next =
                            next.withDayOfMonth(
                                    Math.min(dayOfMonth, next.toLocalDate().lengthOfMonth()));
                }
                break;

            case QUARTERLY:
                next = next.plusMonths(3);
                break;
        }

        return next;
    }

    private ScheduledReportResponse mapToResponse(ScheduledReportEntity entity) {
        ScheduledReportResponse response = new ScheduledReportResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        response.setReportType(entity.getReportType());
        response.setFrequency(entity.getFrequency());
        response.setFormat(entity.getFormat());
        response.setRecipients(entity.getRecipients());
        response.setParameters(entity.getParameters());
        response.setDayOfWeek(entity.getDayOfWeek());
        response.setDayOfMonth(entity.getDayOfMonth());
        response.setHour(entity.getHour());
        response.setEnabled(entity.getEnabled());
        response.setLastRunAt(entity.getLastRunAt());
        response.setNextRunAt(entity.getNextRunAt());
        response.setLastStatus(entity.getLastStatus());
        response.setRunCount(entity.getRunCount());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
