package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AppointmentReminderMetricsResponse {

    private List<ChannelMetrics> channelMetrics;
    private List<TemplateMetrics> templateMetrics;
    private List<AgentMetrics> agentMetrics;
    private List<TimeSeriesDataPoint> timeSeriesData;
    private AggregateMetrics aggregateMetrics;

    public List<ChannelMetrics> getChannelMetrics() {
        return channelMetrics;
    }

    public void setChannelMetrics(List<ChannelMetrics> channelMetrics) {
        this.channelMetrics = channelMetrics;
    }

    public List<TemplateMetrics> getTemplateMetrics() {
        return templateMetrics;
    }

    public void setTemplateMetrics(List<TemplateMetrics> templateMetrics) {
        this.templateMetrics = templateMetrics;
    }

    public List<AgentMetrics> getAgentMetrics() {
        return agentMetrics;
    }

    public void setAgentMetrics(List<AgentMetrics> agentMetrics) {
        this.agentMetrics = agentMetrics;
    }

    public List<TimeSeriesDataPoint> getTimeSeriesData() {
        return timeSeriesData;
    }

    public void setTimeSeriesData(List<TimeSeriesDataPoint> timeSeriesData) {
        this.timeSeriesData = timeSeriesData;
    }

    public AggregateMetrics getAggregateMetrics() {
        return aggregateMetrics;
    }

    public void setAggregateMetrics(AggregateMetrics aggregateMetrics) {
        this.aggregateMetrics = aggregateMetrics;
    }

    public static class ChannelMetrics {
        private String channel;
        private Long totalSent;
        private Long totalDelivered;
        private Long totalRead;
        private Long totalNoShows;
        private Double deliveryRate;
        private Double readRate;
        private Double noShowRate;

        public ChannelMetrics() {}

        public ChannelMetrics(
                String channel,
                Long totalSent,
                Long totalDelivered,
                Long totalRead,
                Long totalNoShows) {
            this.channel = channel;
            this.totalSent = totalSent;
            this.totalDelivered = totalDelivered;
            this.totalRead = totalRead;
            this.totalNoShows = totalNoShows;
            this.deliveryRate = totalSent > 0 ? (totalDelivered * 100.0 / totalSent) : 0.0;
            this.readRate = totalSent > 0 ? (totalRead * 100.0 / totalSent) : 0.0;
            this.noShowRate = totalSent > 0 ? (totalNoShows * 100.0 / totalSent) : 0.0;
        }

        public String getChannel() {
            return channel;
        }

        public void setChannel(String channel) {
            this.channel = channel;
        }

        public Long getTotalSent() {
            return totalSent;
        }

        public void setTotalSent(Long totalSent) {
            this.totalSent = totalSent;
        }

        public Long getTotalDelivered() {
            return totalDelivered;
        }

        public void setTotalDelivered(Long totalDelivered) {
            this.totalDelivered = totalDelivered;
        }

        public Long getTotalRead() {
            return totalRead;
        }

        public void setTotalRead(Long totalRead) {
            this.totalRead = totalRead;
        }

        public Long getTotalNoShows() {
            return totalNoShows;
        }

        public void setTotalNoShows(Long totalNoShows) {
            this.totalNoShows = totalNoShows;
        }

        public Double getDeliveryRate() {
            return deliveryRate;
        }

        public void setDeliveryRate(Double deliveryRate) {
            this.deliveryRate = deliveryRate;
        }

        public Double getReadRate() {
            return readRate;
        }

        public void setReadRate(Double readRate) {
            this.readRate = readRate;
        }

        public Double getNoShowRate() {
            return noShowRate;
        }

        public void setNoShowRate(Double noShowRate) {
            this.noShowRate = noShowRate;
        }
    }

    public static class TemplateMetrics {
        private String templateCode;
        private Long totalSent;
        private Long totalDelivered;
        private Long totalRead;
        private Long totalNoShows;
        private Double deliveryRate;
        private Double readRate;
        private Double noShowRate;

        public TemplateMetrics() {}

        public TemplateMetrics(
                String templateCode,
                Long totalSent,
                Long totalDelivered,
                Long totalRead,
                Long totalNoShows) {
            this.templateCode = templateCode;
            this.totalSent = totalSent;
            this.totalDelivered = totalDelivered;
            this.totalRead = totalRead;
            this.totalNoShows = totalNoShows;
            this.deliveryRate = totalSent > 0 ? (totalDelivered * 100.0 / totalSent) : 0.0;
            this.readRate = totalSent > 0 ? (totalRead * 100.0 / totalSent) : 0.0;
            this.noShowRate = totalSent > 0 ? (totalNoShows * 100.0 / totalSent) : 0.0;
        }

        public String getTemplateCode() {
            return templateCode;
        }

        public void setTemplateCode(String templateCode) {
            this.templateCode = templateCode;
        }

        public Long getTotalSent() {
            return totalSent;
        }

        public void setTotalSent(Long totalSent) {
            this.totalSent = totalSent;
        }

        public Long getTotalDelivered() {
            return totalDelivered;
        }

        public void setTotalDelivered(Long totalDelivered) {
            this.totalDelivered = totalDelivered;
        }

        public Long getTotalRead() {
            return totalRead;
        }

        public void setTotalRead(Long totalRead) {
            this.totalRead = totalRead;
        }

        public Long getTotalNoShows() {
            return totalNoShows;
        }

        public void setTotalNoShows(Long totalNoShows) {
            this.totalNoShows = totalNoShows;
        }

        public Double getDeliveryRate() {
            return deliveryRate;
        }

        public void setDeliveryRate(Double deliveryRate) {
            this.deliveryRate = deliveryRate;
        }

        public Double getReadRate() {
            return readRate;
        }

        public void setReadRate(Double readRate) {
            this.readRate = readRate;
        }

        public Double getNoShowRate() {
            return noShowRate;
        }

        public void setNoShowRate(Double noShowRate) {
            this.noShowRate = noShowRate;
        }
    }

    public static class AgentMetrics {
        private String agentId;
        private Long totalSent;
        private Long totalDelivered;
        private Long totalRead;
        private Long totalNoShows;
        private Double deliveryRate;
        private Double readRate;
        private Double noShowRate;

        public AgentMetrics() {}

        public AgentMetrics(
                String agentId,
                Long totalSent,
                Long totalDelivered,
                Long totalRead,
                Long totalNoShows) {
            this.agentId = agentId;
            this.totalSent = totalSent;
            this.totalDelivered = totalDelivered;
            this.totalRead = totalRead;
            this.totalNoShows = totalNoShows;
            this.deliveryRate = totalSent > 0 ? (totalDelivered * 100.0 / totalSent) : 0.0;
            this.readRate = totalSent > 0 ? (totalRead * 100.0 / totalSent) : 0.0;
            this.noShowRate = totalSent > 0 ? (totalNoShows * 100.0 / totalSent) : 0.0;
        }

        public String getAgentId() {
            return agentId;
        }

        public void setAgentId(String agentId) {
            this.agentId = agentId;
        }

        public Long getTotalSent() {
            return totalSent;
        }

        public void setTotalSent(Long totalSent) {
            this.totalSent = totalSent;
        }

        public Long getTotalDelivered() {
            return totalDelivered;
        }

        public void setTotalDelivered(Long totalDelivered) {
            this.totalDelivered = totalDelivered;
        }

        public Long getTotalRead() {
            return totalRead;
        }

        public void setTotalRead(Long totalRead) {
            this.totalRead = totalRead;
        }

        public Long getTotalNoShows() {
            return totalNoShows;
        }

        public void setTotalNoShows(Long totalNoShows) {
            this.totalNoShows = totalNoShows;
        }

        public Double getDeliveryRate() {
            return deliveryRate;
        }

        public void setDeliveryRate(Double deliveryRate) {
            this.deliveryRate = deliveryRate;
        }

        public Double getReadRate() {
            return readRate;
        }

        public void setReadRate(Double readRate) {
            this.readRate = readRate;
        }

        public Double getNoShowRate() {
            return noShowRate;
        }

        public void setNoShowRate(Double noShowRate) {
            this.noShowRate = noShowRate;
        }
    }

    public static class TimeSeriesDataPoint {
        private LocalDate date;
        private Long totalSent;
        private Long totalDelivered;
        private Long totalRead;
        private Long totalNoShows;

        public TimeSeriesDataPoint() {}

        public TimeSeriesDataPoint(
                LocalDate date,
                Long totalSent,
                Long totalDelivered,
                Long totalRead,
                Long totalNoShows) {
            this.date = date;
            this.totalSent = totalSent;
            this.totalDelivered = totalDelivered;
            this.totalRead = totalRead;
            this.totalNoShows = totalNoShows;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public Long getTotalSent() {
            return totalSent;
        }

        public void setTotalSent(Long totalSent) {
            this.totalSent = totalSent;
        }

        public Long getTotalDelivered() {
            return totalDelivered;
        }

        public void setTotalDelivered(Long totalDelivered) {
            this.totalDelivered = totalDelivered;
        }

        public Long getTotalRead() {
            return totalRead;
        }

        public void setTotalRead(Long totalRead) {
            this.totalRead = totalRead;
        }

        public Long getTotalNoShows() {
            return totalNoShows;
        }

        public void setTotalNoShows(Long totalNoShows) {
            this.totalNoShows = totalNoShows;
        }
    }

    public static class AggregateMetrics {
        private Long totalReminders;
        private Double overallDeliveryRate;
        private Double overallReadRate;
        private Double overallNoShowRate;
        private LocalDateTime periodStart;
        private LocalDateTime periodEnd;

        public Long getTotalReminders() {
            return totalReminders;
        }

        public void setTotalReminders(Long totalReminders) {
            this.totalReminders = totalReminders;
        }

        public Double getOverallDeliveryRate() {
            return overallDeliveryRate;
        }

        public void setOverallDeliveryRate(Double overallDeliveryRate) {
            this.overallDeliveryRate = overallDeliveryRate;
        }

        public Double getOverallReadRate() {
            return overallReadRate;
        }

        public void setOverallReadRate(Double overallReadRate) {
            this.overallReadRate = overallReadRate;
        }

        public Double getOverallNoShowRate() {
            return overallNoShowRate;
        }

        public void setOverallNoShowRate(Double overallNoShowRate) {
            this.overallNoShowRate = overallNoShowRate;
        }

        public LocalDateTime getPeriodStart() {
            return periodStart;
        }

        public void setPeriodStart(LocalDateTime periodStart) {
            this.periodStart = periodStart;
        }

        public LocalDateTime getPeriodEnd() {
            return periodEnd;
        }

        public void setPeriodEnd(LocalDateTime periodEnd) {
            this.periodEnd = periodEnd;
        }
    }
}
