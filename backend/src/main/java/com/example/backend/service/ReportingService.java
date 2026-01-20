package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.AnnonceAnalyticsRepository;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final AnnonceAnalyticsRepository annonceAnalyticsRepository;

    public ReportingService(DossierRepository dossierRepository,
                          AppointmentRepository appointmentRepository,
                          MessageRepository messageRepository,
                          AnnonceAnalyticsRepository annonceAnalyticsRepository) {
        this.dossierRepository = dossierRepository;
        this.appointmentRepository = appointmentRepository;
        this.messageRepository = messageRepository;
        this.annonceAnalyticsRepository = annonceAnalyticsRepository;
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

    @Cacheable(value = "funnelAnalysis", key = "#orgId + '_' + #from + '_' + #to")
    @Transactional(readOnly = true)
    public FunnelAnalysisResponse generateFunnelAnalysis(LocalDateTime from, LocalDateTime to, String orgId) {
        FunnelAnalysisResponse response = new FunnelAnalysisResponse();

        response.setConversionRateBySource(calculateConversionRateBySource(from, to, orgId));

        FunnelAnalysisResponse.FunnelStageMetrics funnelMetrics = calculateFunnelStageMetrics(from, to, orgId);
        response.setOverallFunnelMetrics(funnelMetrics);

        return response;
    }

    @Cacheable(value = "agentPerformance", key = "#orgId + '_' + #from + '_' + #to")
    @Transactional(readOnly = true)
    public AgentPerformanceResponse generateAgentPerformance(LocalDateTime from, LocalDateTime to, String orgId) {
        AgentPerformanceResponse response = new AgentPerformanceResponse();

        Specification<Dossier> spec = buildDateRangeSpec(from, to);
        List<Dossier> dossiers = dossierRepository.findAll(spec);

        Map<String, List<Dossier>> dossiersByAgent = dossiers.stream()
            .filter(d -> d.getCreatedBy() != null && !d.getCreatedBy().isEmpty())
            .collect(Collectors.groupingBy(Dossier::getCreatedBy));

        List<AgentPerformanceResponse.AgentMetrics> agentMetrics = new ArrayList<>();

        for (Map.Entry<String, List<Dossier>> entry : dossiersByAgent.entrySet()) {
            String agentId = entry.getKey();
            List<Dossier> agentDossiers = entry.getValue();

            Double avgResponseTime = calculateAgentAverageResponseTime(agentDossiers);
            Long messagesSent = countAgentMessagesSent(agentDossiers);
            Long appointmentsScheduled = countAgentAppointmentsScheduled(agentDossiers);
            Long dossiersAssigned = (long) agentDossiers.size();
            Long dossiersWon = agentDossiers.stream()
                .filter(d -> d.getStatus() == DossierStatus.WON)
                .count();

            agentMetrics.add(new AgentPerformanceResponse.AgentMetrics(
                agentId, avgResponseTime, messagesSent, appointmentsScheduled,
                dossiersAssigned, dossiersWon
            ));
        }

        response.setAgentMetrics(agentMetrics);

        AgentPerformanceResponse.AggregateMetrics aggregateMetrics = calculateAggregateMetrics(agentMetrics);
        response.setAggregateMetrics(aggregateMetrics);

        return response;
    }

    @Cacheable(value = "revenueForecast", key = "#orgId")
    @Transactional(readOnly = true)
    public RevenueForecastResponse generateRevenueForecast(String orgId) {
        RevenueForecastResponse response = new RevenueForecastResponse();

        BigDecimal totalPipelineValue = annonceAnalyticsRepository.getTotalPipelineValue(orgId);
        response.setTotalPipelineValue(totalPipelineValue != null ? totalPipelineValue : BigDecimal.ZERO);

        Long activeOpportunities = annonceAnalyticsRepository.getActiveOpportunitiesCount(orgId);
        response.setTotalOpportunities(activeOpportunities != null ? activeOpportunities.intValue() : 0);

        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        List<Object[]> conversionData = annonceAnalyticsRepository.getConversionRatesBySource(orgId, sixMonthsAgo);
        
        Map<String, Double> conversionRatesBySource = new HashMap<>();
        double totalWon = 0;
        double totalDossiers = 0;
        
        for (Object[] row : conversionData) {
            String source = row[0] != null ? row[0].toString() : "UNKNOWN";
            Long total = ((Number) row[1]).longValue();
            Long won = ((Number) row[2]).longValue();
            double rate = total > 0 ? (won * 100.0 / total) : 0.0;
            conversionRatesBySource.put(source, rate);
            totalWon += won;
            totalDossiers += total;
        }

        double avgConversionRate = totalDossiers > 0 ? (totalWon * 100.0 / totalDossiers) : 0.0;
        response.setAverageConversionRate(avgConversionRate);

        List<Object[]> pipelineData = annonceAnalyticsRepository.getPipelineMetricsByStage(orgId);
        List<RevenueForecastResponse.PipelineStageValue> pipelineByStage = new ArrayList<>();

        BigDecimal totalWeightedValue = BigDecimal.ZERO;

        for (Object[] row : pipelineData) {
            String status = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            BigDecimal totalValue = (BigDecimal) row[2];

            Double weight = getStageWeight(status);
            RevenueForecastResponse.PipelineStageValue stageValue = 
                new RevenueForecastResponse.PipelineStageValue(status, count, totalValue, weight);
            pipelineByStage.add(stageValue);
            totalWeightedValue = totalWeightedValue.add(stageValue.getWeightedValue());
        }

        response.setPipelineByStage(pipelineByStage);

        List<Object[]> sourceData = annonceAnalyticsRepository.getPipelineValueBySource(orgId);
        List<RevenueForecastResponse.SourceForecast> forecastBySource = new ArrayList<>();

        for (Object[] row : sourceData) {
            String source = row[0] != null ? row[0].toString() : "UNKNOWN";
            BigDecimal totalValue = (BigDecimal) row[1];
            Long count = ((Number) row[2]).longValue();

            Double historicalRate = conversionRatesBySource.getOrDefault(source, avgConversionRate);

            forecastBySource.add(new RevenueForecastResponse.SourceForecast(
                source, count, totalValue, historicalRate
            ));
        }

        response.setForecastBySource(forecastBySource);

        response.setForecastedRevenue(totalWeightedValue.setScale(2, RoundingMode.HALF_UP));

        return response;
    }

    private FunnelAnalysisResponse.FunnelStageMetrics calculateFunnelStageMetrics(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<Dossier> spec = buildDateRangeSpec(from, to);
        List<Dossier> dossiers = dossierRepository.findAll(spec);

        Map<DossierStatus, Long> statusCounts = dossiers.stream()
            .collect(Collectors.groupingBy(Dossier::getStatus, Collectors.counting()));

        FunnelAnalysisResponse.FunnelStageMetrics metrics = new FunnelAnalysisResponse.FunnelStageMetrics();

        Long newCount = statusCounts.getOrDefault(DossierStatus.NEW, 0L);
        Long qualifyingCount = statusCounts.getOrDefault(DossierStatus.QUALIFYING, 0L);
        Long qualifiedCount = statusCounts.getOrDefault(DossierStatus.QUALIFIED, 0L);
        Long appointmentCount = statusCounts.getOrDefault(DossierStatus.APPOINTMENT, 0L);
        Long wonCount = statusCounts.getOrDefault(DossierStatus.WON, 0L);
        Long lostCount = statusCounts.getOrDefault(DossierStatus.LOST, 0L);

        metrics.setNewCount(newCount);
        metrics.setQualifyingCount(qualifyingCount);
        metrics.setQualifiedCount(qualifiedCount);
        metrics.setAppointmentCount(appointmentCount);
        metrics.setWonCount(wonCount);
        metrics.setLostCount(lostCount);

        metrics.setNewToQualifyingRate(newCount > 0 ? (qualifyingCount * 100.0 / newCount) : 0.0);
        metrics.setQualifyingToQualifiedRate(qualifyingCount > 0 ? (qualifiedCount * 100.0 / qualifyingCount) : 0.0);
        metrics.setQualifiedToAppointmentRate(qualifiedCount > 0 ? (appointmentCount * 100.0 / qualifiedCount) : 0.0);
        metrics.setAppointmentToWonRate(appointmentCount > 0 ? (wonCount * 100.0 / appointmentCount) : 0.0);

        Long totalDossiers = dossiers.size();
        metrics.setOverallConversionRate(totalDossiers > 0 ? (wonCount * 100.0 / totalDossiers) : 0.0);

        return metrics;
    }

    private Double calculateAgentAverageResponseTime(List<Dossier> dossiers) {
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

    private Long countAgentMessagesSent(List<Dossier> dossiers) {
        List<Long> dossierIds = dossiers.stream()
            .map(Dossier::getId)
            .collect(Collectors.toList());

        if (dossierIds.isEmpty()) {
            return 0L;
        }

        Specification<MessageEntity> spec = (root, query, cb) -> {
            return cb.and(
                root.get("dossier").get("id").in(dossierIds),
                cb.equal(root.get("direction"), MessageDirection.OUTBOUND)
            );
        };

        return messageRepository.count(spec);
    }

    private Long countAgentAppointmentsScheduled(List<Dossier> dossiers) {
        List<Long> dossierIds = dossiers.stream()
            .map(Dossier::getId)
            .collect(Collectors.toList());

        if (dossierIds.isEmpty()) {
            return 0L;
        }

        Specification<AppointmentEntity> spec = (root, query, cb) -> {
            return root.get("dossier").get("id").in(dossierIds);
        };

        return appointmentRepository.count(spec);
    }

    private AgentPerformanceResponse.AggregateMetrics calculateAggregateMetrics(
            List<AgentPerformanceResponse.AgentMetrics> agentMetrics) {
        
        AgentPerformanceResponse.AggregateMetrics aggregate = new AgentPerformanceResponse.AggregateMetrics();

        if (agentMetrics.isEmpty()) {
            aggregate.setAverageResponseTimeHours(0.0);
            aggregate.setTotalMessagesSent(0L);
            aggregate.setTotalAppointmentsScheduled(0L);
            aggregate.setTotalDossiersAssigned(0L);
            aggregate.setTotalDossiersWon(0L);
            aggregate.setOverallWinRate(0.0);
            return aggregate;
        }

        double avgResponseTime = agentMetrics.stream()
            .mapToDouble(AgentPerformanceResponse.AgentMetrics::getAverageResponseTimeHours)
            .average()
            .orElse(0.0);

        Long totalMessages = agentMetrics.stream()
            .mapToLong(AgentPerformanceResponse.AgentMetrics::getMessagesSent)
            .sum();

        Long totalAppointments = agentMetrics.stream()
            .mapToLong(AgentPerformanceResponse.AgentMetrics::getAppointmentsScheduled)
            .sum();

        Long totalAssigned = agentMetrics.stream()
            .mapToLong(AgentPerformanceResponse.AgentMetrics::getDossiersAssigned)
            .sum();

        Long totalWon = agentMetrics.stream()
            .mapToLong(AgentPerformanceResponse.AgentMetrics::getDossiersWon)
            .sum();

        Double overallWinRate = totalAssigned > 0 ? (totalWon * 100.0 / totalAssigned) : 0.0;

        aggregate.setAverageResponseTimeHours(avgResponseTime);
        aggregate.setTotalMessagesSent(totalMessages);
        aggregate.setTotalAppointmentsScheduled(totalAppointments);
        aggregate.setTotalDossiersAssigned(totalAssigned);
        aggregate.setTotalDossiersWon(totalWon);
        aggregate.setOverallWinRate(overallWinRate);

        return aggregate;
    }

    private Double getStageWeight(String status) {
        return switch (status) {
            case "NEW" -> 10.0;
            case "QUALIFYING" -> 25.0;
            case "QUALIFIED" -> 50.0;
            case "APPOINTMENT" -> 75.0;
            case "WON" -> 100.0;
            default -> 0.0;
        };
    }

    private Specification<Dossier> buildDateRangeSpec(LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private List<ConversionRateBySourceDto> calculateConversionRateBySource(LocalDateTime from, LocalDateTime to, String orgId) {
        Specification<Dossier> spec = buildDateRangeSpec(from, to);

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
        Specification<Dossier> spec = buildDateRangeSpec(from, to);

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
        Specification<Dossier> spec = buildDateRangeSpec(from, to);

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
