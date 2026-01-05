package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportingService {

    private final DossierRepository dossierRepository;
    private final AppointmentRepository appointmentRepository;
    private final MessageRepository messageRepository;

    public ReportingService(DossierRepository dossierRepository, 
                          AppointmentRepository appointmentRepository,
                          MessageRepository messageRepository) {
        this.dossierRepository = dossierRepository;
        this.appointmentRepository = appointmentRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional(readOnly = true)
    public KpiReportResponse generateKpiReport(LocalDateTime from, LocalDateTime to, String orgId) {
        KpiReportResponse response = new KpiReportResponse();
        
        response.setConversionRateBySource(calculateConversionRateBySource(from, to, orgId));
        response.setAverageResponseTimeHours(calculateAverageResponseTime(from, to, orgId));
        response.setAppointmentShowRate(calculateAppointmentShowRate(from, to, orgId));
        response.setPipelineVelocityDays(calculatePipelineVelocity(from, to, orgId));
        response.setDossierCreationTimeSeries(calculateDossierCreationTimeSeries(from, to, orgId));
        response.setConversionTimeSeries(calculateConversionTimeSeries(from, to, orgId));
        
        return response;
    }

    @Transactional(readOnly = true)
    public PipelineSummaryResponse generatePipelineSummary(String orgId) {
        PipelineSummaryResponse response = new PipelineSummaryResponse();
        
        List<Dossier> allDossiers = dossierRepository.findAll();
        long totalDossiers = allDossiers.size();
        
        Map<DossierStatus, Long> statusCounts = allDossiers.stream()
            .collect(Collectors.groupingBy(Dossier::getStatus, Collectors.counting()));
        
        List<PipelineStageMetricsDto> stageMetrics = new ArrayList<>();
        for (DossierStatus status : DossierStatus.values()) {
            Long count = statusCounts.getOrDefault(status, 0L);
            Double percentage = totalDossiers > 0 ? (count * 100.0 / totalDossiers) : 0.0;
            stageMetrics.add(new PipelineStageMetricsDto(status.name(), count, percentage));
        }
        
        response.setStageMetrics(stageMetrics);
        response.setTotalDossiers(totalDossiers);
        
        long wonCount = statusCounts.getOrDefault(DossierStatus.WON, 0L);
        Double overallConversionRate = totalDossiers > 0 ? (wonCount * 100.0 / totalDossiers) : 0.0;
        response.setOverallConversionRate(overallConversionRate);
        
        return response;
    }

    private List<ConversionRateBySourceDto> calculateConversionRateBySource(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<Dossier> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        List<Dossier> dossiers = dossierRepository.findAll(spec);
        
        Map<String, Map<String, Long>> sourceStats = dossiers.stream()
            .collect(Collectors.groupingBy(
                d -> d.getSource() != null ? d.getSource().name() : "UNKNOWN",
                Collectors.groupingBy(
                    d -> d.getStatus() == DossierStatus.WON ? "won" : "other",
                    Collectors.counting()
                )
            ));
        
        List<ConversionRateBySourceDto> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> entry : sourceStats.entrySet()) {
            String source = entry.getKey();
            Long wonCount = entry.getValue().getOrDefault("won", 0L);
            Long otherCount = entry.getValue().getOrDefault("other", 0L);
            Long totalCount = wonCount + otherCount;
            
            result.add(new ConversionRateBySourceDto(source, totalCount, wonCount));
        }
        
        return result;
    }

    private Double calculateAverageResponseTime(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<Dossier> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        List<Dossier> dossiers = dossierRepository.findAll(spec);
        
        List<Double> responseTimes = new ArrayList<>();
        
        for (Dossier dossier : dossiers) {
            LocalDateTime dossierCreatedAt = dossier.getCreatedAt();
            
            Specification<MessageEntity> messageSpec = (root, query, cb) -> {
                return cb.and(
                    cb.equal(root.get("dossier").get("id"), dossier.getId()),
                    cb.equal(root.get("direction"), MessageDirection.OUTBOUND)
                );
            };
            
            List<MessageEntity> outboundMessages = messageRepository.findAll(messageSpec);
            
            if (!outboundMessages.isEmpty()) {
                MessageEntity firstResponse = outboundMessages.stream()
                    .min(Comparator.comparing(MessageEntity::getTimestamp))
                    .orElse(null);
                
                if (firstResponse != null && firstResponse.getTimestamp().isAfter(dossierCreatedAt)) {
                    Duration duration = Duration.between(dossierCreatedAt, firstResponse.getTimestamp());
                    double hours = duration.toMinutes() / 60.0;
                    responseTimes.add(hours);
                }
            }
        }
        
        if (responseTimes.isEmpty()) {
            return 0.0;
        }
        
        return responseTimes.stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
    }

    private Double calculateAppointmentShowRate(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<AppointmentEntity> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startTime"), to));
            }
            
            predicates.add(root.get("status").in(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED));
            
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        List<AppointmentEntity> appointments = appointmentRepository.findAll(spec);
        
        if (appointments.isEmpty()) {
            return 0.0;
        }
        
        long completedCount = appointments.stream()
            .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
            .count();
        
        return (completedCount * 100.0) / appointments.size();
    }

    private Double calculatePipelineVelocity(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<Dossier> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            
            predicates.add(cb.equal(root.get("status"), DossierStatus.WON));
            
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        List<Dossier> wonDossiers = dossierRepository.findAll(spec);
        
        if (wonDossiers.isEmpty()) {
            return 0.0;
        }
        
        List<Double> velocities = new ArrayList<>();
        
        for (Dossier dossier : wonDossiers) {
            Duration duration = Duration.between(dossier.getCreatedAt(), dossier.getUpdatedAt());
            double days = duration.toDays();
            velocities.add(days);
        }
        
        return velocities.stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
    }

    private List<TimeSeriesDataPointDto> calculateDossierCreationTimeSeries(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<Dossier> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        List<Dossier> dossiers = dossierRepository.findAll(spec);
        
        Map<LocalDate, Long> dailyCounts = dossiers.stream()
            .collect(Collectors.groupingBy(
                d -> d.getCreatedAt().toLocalDate(),
                Collectors.counting()
            ));
        
        return dailyCounts.entrySet().stream()
            .map(e -> new TimeSeriesDataPointDto(e.getKey(), e.getValue()))
            .sorted(Comparator.comparing(TimeSeriesDataPointDto::getDate))
            .collect(Collectors.toList());
    }

    private List<TimeSeriesDataPointDto> calculateConversionTimeSeries(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<Dossier> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("updatedAt"), to));
            }
            
            predicates.add(cb.equal(root.get("status"), DossierStatus.WON));
            
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        List<Dossier> wonDossiers = dossierRepository.findAll(spec);
        
        Map<LocalDate, Long> dailyCounts = wonDossiers.stream()
            .collect(Collectors.groupingBy(
                d -> d.getUpdatedAt().toLocalDate(),
                Collectors.counting()
            ));
        
        return dailyCounts.entrySet().stream()
            .map(e -> new TimeSeriesDataPointDto(e.getKey(), e.getValue()))
            .sorted(Comparator.comparing(TimeSeriesDataPointDto::getDate))
            .collect(Collectors.toList());
    }
}
