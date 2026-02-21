package com.example.backend.dto;

import java.util.List;

public class AgentPerformanceResponse {
    private List<AgentMetrics> agentMetrics;
    private AggregateMetrics aggregateMetrics;

    public List<AgentMetrics> getAgentMetrics() {
        return agentMetrics;
    }

    public void setAgentMetrics(List<AgentMetrics> agentMetrics) {
        this.agentMetrics = agentMetrics;
    }

    public AggregateMetrics getAggregateMetrics() {
        return aggregateMetrics;
    }

    public void setAggregateMetrics(AggregateMetrics aggregateMetrics) {
        this.aggregateMetrics = aggregateMetrics;
    }

    public static class AgentMetrics {
        private String agentId;
        private Double averageResponseTimeHours;
        private Long messagesSent;
        private Long appointmentsScheduled;
        private Long dossiersAssigned;
        private Long dossiersWon;
        private Double winRate;

        public AgentMetrics() {}

        public AgentMetrics(
                String agentId,
                Double averageResponseTimeHours,
                Long messagesSent,
                Long appointmentsScheduled,
                Long dossiersAssigned,
                Long dossiersWon) {
            this.agentId = agentId;
            this.averageResponseTimeHours = averageResponseTimeHours;
            this.messagesSent = messagesSent;
            this.appointmentsScheduled = appointmentsScheduled;
            this.dossiersAssigned = dossiersAssigned;
            this.dossiersWon = dossiersWon;
            this.winRate = dossiersAssigned > 0 ? (dossiersWon * 100.0 / dossiersAssigned) : 0.0;
        }

        public String getAgentId() {
            return agentId;
        }

        public void setAgentId(String agentId) {
            this.agentId = agentId;
        }

        public Double getAverageResponseTimeHours() {
            return averageResponseTimeHours;
        }

        public void setAverageResponseTimeHours(Double averageResponseTimeHours) {
            this.averageResponseTimeHours = averageResponseTimeHours;
        }

        public Long getMessagesSent() {
            return messagesSent;
        }

        public void setMessagesSent(Long messagesSent) {
            this.messagesSent = messagesSent;
        }

        public Long getAppointmentsScheduled() {
            return appointmentsScheduled;
        }

        public void setAppointmentsScheduled(Long appointmentsScheduled) {
            this.appointmentsScheduled = appointmentsScheduled;
        }

        public Long getDossiersAssigned() {
            return dossiersAssigned;
        }

        public void setDossiersAssigned(Long dossiersAssigned) {
            this.dossiersAssigned = dossiersAssigned;
        }

        public Long getDossiersWon() {
            return dossiersWon;
        }

        public void setDossiersWon(Long dossiersWon) {
            this.dossiersWon = dossiersWon;
        }

        public Double getWinRate() {
            return winRate;
        }

        public void setWinRate(Double winRate) {
            this.winRate = winRate;
        }
    }

    public static class AggregateMetrics {
        private Double averageResponseTimeHours;
        private Long totalMessagesSent;
        private Long totalAppointmentsScheduled;
        private Long totalDossiersAssigned;
        private Long totalDossiersWon;
        private Double overallWinRate;

        public Double getAverageResponseTimeHours() {
            return averageResponseTimeHours;
        }

        public void setAverageResponseTimeHours(Double averageResponseTimeHours) {
            this.averageResponseTimeHours = averageResponseTimeHours;
        }

        public Long getTotalMessagesSent() {
            return totalMessagesSent;
        }

        public void setTotalMessagesSent(Long totalMessagesSent) {
            this.totalMessagesSent = totalMessagesSent;
        }

        public Long getTotalAppointmentsScheduled() {
            return totalAppointmentsScheduled;
        }

        public void setTotalAppointmentsScheduled(Long totalAppointmentsScheduled) {
            this.totalAppointmentsScheduled = totalAppointmentsScheduled;
        }

        public Long getTotalDossiersAssigned() {
            return totalDossiersAssigned;
        }

        public void setTotalDossiersAssigned(Long totalDossiersAssigned) {
            this.totalDossiersAssigned = totalDossiersAssigned;
        }

        public Long getTotalDossiersWon() {
            return totalDossiersWon;
        }

        public void setTotalDossiersWon(Long totalDossiersWon) {
            this.totalDossiersWon = totalDossiersWon;
        }

        public Double getOverallWinRate() {
            return overallWinRate;
        }

        public void setOverallWinRate(Double overallWinRate) {
            this.overallWinRate = overallWinRate;
        }
    }
}
