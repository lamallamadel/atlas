package com.example.backend.service;

import com.example.backend.dto.AppointmentReminderMetricsResponse;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.AppointmentReminderMetricsEntity;
import com.example.backend.repository.AppointmentReminderMetricsRepository;
import com.example.backend.util.TenantContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentReminderMetricsService {

    private final AppointmentReminderMetricsRepository metricsRepository;

    public AppointmentReminderMetricsService(
            AppointmentReminderMetricsRepository metricsRepository) {
        this.metricsRepository = metricsRepository;
    }

    @Transactional
    public AppointmentReminderMetricsEntity recordReminderSent(
            AppointmentEntity appointment,
            String channel,
            String templateCode,
            String agentId,
            String status,
            LocalDateTime sentAt) {

        AppointmentReminderMetricsEntity metrics = new AppointmentReminderMetricsEntity();
        metrics.setOrgId(TenantContext.getTenantId());
        metrics.setAppointment(appointment);
        metrics.setChannel(channel);
        metrics.setTemplateCode(templateCode);
        metrics.setAgentId(agentId);
        metrics.setStatus(status);
        metrics.setSentAt(sentAt);
        metrics.setNoShowOccurred(false);

        return metricsRepository.save(metrics);
    }

    @Transactional
    public AppointmentReminderMetricsEntity recordReminderSentWithStrategy(
            AppointmentEntity appointment,
            String channel,
            String templateCode,
            String agentId,
            String status,
            LocalDateTime sentAt,
            String reminderStrategy,
            Double noShowProbability) {

        AppointmentReminderMetricsEntity metrics = new AppointmentReminderMetricsEntity();
        metrics.setOrgId(TenantContext.getTenantId());
        metrics.setAppointment(appointment);
        metrics.setChannel(channel);
        metrics.setTemplateCode(templateCode);
        metrics.setAgentId(agentId);
        metrics.setStatus(status);
        metrics.setSentAt(sentAt);
        metrics.setNoShowOccurred(false);
        metrics.setReminderStrategy(reminderStrategy);
        metrics.setNoShowProbability(noShowProbability);

        return metricsRepository.save(metrics);
    }

    @Transactional(readOnly = true)
    public Double computeDeliveryRate(
            String orgId, String channel, LocalDateTime startDate, LocalDateTime endDate) {

        Long totalSent =
                metricsRepository.countSentByChannel(
                        orgId, channel, startDate != null ? startDate : LocalDateTime.MIN, endDate);

        if (totalSent == null || totalSent == 0) {
            return 0.0;
        }

        Long totalDelivered =
                metricsRepository.countDeliveredByChannel(
                        orgId, channel, startDate != null ? startDate : LocalDateTime.MIN, endDate);

        if (totalDelivered == null) {
            return 0.0;
        }

        return BigDecimal.valueOf(totalDelivered)
                .multiply(BigDecimal.valueOf(100.0))
                .divide(BigDecimal.valueOf(totalSent), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    @Transactional(readOnly = true)
    public Double computeReadRate(
            String orgId, String channel, LocalDateTime startDate, LocalDateTime endDate) {

        List<Object[]> channelMetrics =
                metricsRepository.aggregateMetricsByChannel(orgId, startDate, endDate);

        for (Object[] row : channelMetrics) {
            String metricChannel = (String) row[0];
            if (metricChannel.equals(channel)) {
                Long totalSent = ((Number) row[1]).longValue();
                Long totalRead = ((Number) row[2]).longValue();

                if (totalSent == 0) {
                    return 0.0;
                }

                return BigDecimal.valueOf(totalRead)
                        .multiply(BigDecimal.valueOf(100.0))
                        .divide(BigDecimal.valueOf(totalSent), 2, RoundingMode.HALF_UP)
                        .doubleValue();
            }
        }

        return 0.0;
    }

    @Transactional(readOnly = true)
    public Double computeNoShowCorrelation(
            String orgId, String channel, LocalDateTime startDate, LocalDateTime endDate) {

        List<Object[]> channelMetrics =
                metricsRepository.aggregateMetricsByChannel(orgId, startDate, endDate);

        for (Object[] row : channelMetrics) {
            String metricChannel = (String) row[0];
            if (metricChannel.equals(channel)) {
                Long totalSent = ((Number) row[1]).longValue();
                Long totalNoShows = ((Number) row[4]).longValue();

                if (totalSent == 0) {
                    return 0.0;
                }

                return BigDecimal.valueOf(totalNoShows)
                        .multiply(BigDecimal.valueOf(100.0))
                        .divide(BigDecimal.valueOf(totalSent), 2, RoundingMode.HALF_UP)
                        .doubleValue();
            }
        }

        return 0.0;
    }

    @Transactional(readOnly = true)
    public AppointmentReminderMetricsResponse getAggregatedMetrics(
            String orgId, LocalDateTime startDate, LocalDateTime endDate) {

        AppointmentReminderMetricsResponse response = new AppointmentReminderMetricsResponse();

        List<Object[]> channelData =
                metricsRepository.aggregateMetricsByChannel(orgId, startDate, endDate);
        List<AppointmentReminderMetricsResponse.ChannelMetrics> channelMetrics =
                new ArrayList<>();
        for (Object[] row : channelData) {
            String channel = (String) row[0];
            Long totalSent = ((Number) row[1]).longValue();
            Long totalDelivered = ((Number) row[2]).longValue();
            Long totalRead = ((Number) row[3]).longValue();
            Long totalNoShows = ((Number) row[4]).longValue();

            channelMetrics.add(
                    new AppointmentReminderMetricsResponse.ChannelMetrics(
                            channel, totalSent, totalDelivered, totalRead, totalNoShows));
        }
        response.setChannelMetrics(channelMetrics);

        List<Object[]> templateData =
                metricsRepository.aggregateMetricsByTemplate(orgId, startDate, endDate);
        List<AppointmentReminderMetricsResponse.TemplateMetrics> templateMetrics =
                new ArrayList<>();
        for (Object[] row : templateData) {
            String templateCode = (String) row[0];
            Long totalSent = ((Number) row[1]).longValue();
            Long totalDelivered = ((Number) row[2]).longValue();
            Long totalRead = ((Number) row[3]).longValue();
            Long totalNoShows = ((Number) row[4]).longValue();

            templateMetrics.add(
                    new AppointmentReminderMetricsResponse.TemplateMetrics(
                            templateCode, totalSent, totalDelivered, totalRead, totalNoShows));
        }
        response.setTemplateMetrics(templateMetrics);

        List<Object[]> agentData =
                metricsRepository.aggregateMetricsByAgent(orgId, startDate, endDate);
        List<AppointmentReminderMetricsResponse.AgentMetrics> agentMetrics = new ArrayList<>();
        for (Object[] row : agentData) {
            String agentId = (String) row[0];
            Long totalSent = ((Number) row[1]).longValue();
            Long totalDelivered = ((Number) row[2]).longValue();
            Long totalRead = ((Number) row[3]).longValue();
            Long totalNoShows = ((Number) row[4]).longValue();

            agentMetrics.add(
                    new AppointmentReminderMetricsResponse.AgentMetrics(
                            agentId, totalSent, totalDelivered, totalRead, totalNoShows));
        }
        response.setAgentMetrics(agentMetrics);

        List<Object[]> timeSeriesData =
                metricsRepository.getTimeSeriesMetrics(orgId, startDate, endDate);
        List<AppointmentReminderMetricsResponse.TimeSeriesDataPoint> timeSeries =
                new ArrayList<>();
        for (Object[] row : timeSeriesData) {
            LocalDate date = null;
            if (row[0] instanceof Date) {
                date = ((Date) row[0]).toLocalDate();
            } else if (row[0] instanceof java.util.Date) {
                date =
                        new java.sql.Date(((java.util.Date) row[0]).getTime())
                                .toLocalDate();
            } else if (row[0] instanceof LocalDate) {
                date = (LocalDate) row[0];
            }

            Long totalSent = ((Number) row[1]).longValue();
            Long totalDelivered = ((Number) row[2]).longValue();
            Long totalRead = ((Number) row[3]).longValue();
            Long totalNoShows = ((Number) row[4]).longValue();

            timeSeries.add(
                    new AppointmentReminderMetricsResponse.TimeSeriesDataPoint(
                            date, totalSent, totalDelivered, totalRead, totalNoShows));
        }
        response.setTimeSeriesData(timeSeries);

        AppointmentReminderMetricsResponse.AggregateMetrics aggregateMetrics =
                calculateAggregateMetrics(channelData, startDate, endDate);
        response.setAggregateMetrics(aggregateMetrics);

        return response;
    }

    @Transactional(readOnly = true)
    public Page<AppointmentReminderMetricsEntity> getMetrics(
            String orgId,
            String channel,
            String templateCode,
            String agentId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        return metricsRepository.findByFilters(
                orgId, channel, templateCode, agentId, startDate, endDate, pageable);
    }

    private AppointmentReminderMetricsResponse.AggregateMetrics calculateAggregateMetrics(
            List<Object[]> channelData, LocalDateTime startDate, LocalDateTime endDate) {

        AppointmentReminderMetricsResponse.AggregateMetrics metrics =
                new AppointmentReminderMetricsResponse.AggregateMetrics();

        long totalSent = 0;
        long totalDelivered = 0;
        long totalRead = 0;
        long totalNoShows = 0;

        for (Object[] row : channelData) {
            totalSent += ((Number) row[1]).longValue();
            totalDelivered += ((Number) row[2]).longValue();
            totalRead += ((Number) row[3]).longValue();
            totalNoShows += ((Number) row[4]).longValue();
        }

        metrics.setTotalReminders(totalSent);
        metrics.setOverallDeliveryRate(
                totalSent > 0
                        ? BigDecimal.valueOf(totalDelivered)
                                .multiply(BigDecimal.valueOf(100.0))
                                .divide(BigDecimal.valueOf(totalSent), 2, RoundingMode.HALF_UP)
                                .doubleValue()
                        : 0.0);
        metrics.setOverallReadRate(
                totalSent > 0
                        ? BigDecimal.valueOf(totalRead)
                                .multiply(BigDecimal.valueOf(100.0))
                                .divide(BigDecimal.valueOf(totalSent), 2, RoundingMode.HALF_UP)
                                .doubleValue()
                        : 0.0);
        metrics.setOverallNoShowRate(
                totalSent > 0
                        ? BigDecimal.valueOf(totalNoShows)
                                .multiply(BigDecimal.valueOf(100.0))
                                .divide(BigDecimal.valueOf(totalSent), 2, RoundingMode.HALF_UP)
                                .doubleValue()
                        : 0.0);
        metrics.setPeriodStart(startDate);
        metrics.setPeriodEnd(endDate);

        return metrics;
    }

    @Transactional
    public void updateDeliveryStatus(Long metricsId, LocalDateTime deliveredAt) {
        metricsRepository
                .findById(metricsId)
                .ifPresent(
                        metrics -> {
                            metrics.setStatus("DELIVERED");
                            metrics.setDeliveredAt(deliveredAt);
                            metricsRepository.save(metrics);
                        });
    }

    @Transactional
    public void updateReadStatus(Long metricsId, LocalDateTime readAt) {
        metricsRepository
                .findById(metricsId)
                .ifPresent(
                        metrics -> {
                            metrics.setReadAt(readAt);
                            metricsRepository.save(metrics);
                        });
    }

    @Transactional
    public void updateNoShowStatus(Long appointmentId, Boolean noShowOccurred) {
        List<AppointmentReminderMetricsEntity> metricsList =
                metricsRepository.findByAppointmentId(appointmentId);

        for (AppointmentReminderMetricsEntity metrics : metricsList) {
            metrics.setNoShowOccurred(noShowOccurred);
            metricsRepository.save(metrics);
        }
    }

    @Transactional
    public void recordFailure(Long metricsId, String failedReason) {
        metricsRepository
                .findById(metricsId)
                .ifPresent(
                        metrics -> {
                            metrics.setStatus("FAILED");
                            metrics.setFailedReason(failedReason);
                            metricsRepository.save(metrics);
                        });
    }
}
