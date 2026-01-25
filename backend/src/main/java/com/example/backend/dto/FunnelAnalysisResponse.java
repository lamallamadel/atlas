package com.example.backend.dto;

import java.util.List;
import java.util.Map;

public class FunnelAnalysisResponse {
    private List<ConversionRateBySourceDto> conversionRateBySource;
    private FunnelStageMetrics overallFunnelMetrics;
    private Map<String, FunnelStageMetrics> funnelByTimePeriod;

    public List<ConversionRateBySourceDto> getConversionRateBySource() {
        return conversionRateBySource;
    }

    public void setConversionRateBySource(List<ConversionRateBySourceDto> conversionRateBySource) {
        this.conversionRateBySource = conversionRateBySource;
    }

    public FunnelStageMetrics getOverallFunnelMetrics() {
        return overallFunnelMetrics;
    }

    public void setOverallFunnelMetrics(FunnelStageMetrics overallFunnelMetrics) {
        this.overallFunnelMetrics = overallFunnelMetrics;
    }

    public Map<String, FunnelStageMetrics> getFunnelByTimePeriod() {
        return funnelByTimePeriod;
    }

    public void setFunnelByTimePeriod(Map<String, FunnelStageMetrics> funnelByTimePeriod) {
        this.funnelByTimePeriod = funnelByTimePeriod;
    }

    public static class FunnelStageMetrics {
        private Long newCount;
        private Long qualifyingCount;
        private Long qualifiedCount;
        private Long appointmentCount;
        private Long wonCount;
        private Long lostCount;
        private Double newToQualifyingRate;
        private Double qualifyingToQualifiedRate;
        private Double qualifiedToAppointmentRate;
        private Double appointmentToWonRate;
        private Double overallConversionRate;

        public Long getNewCount() {
            return newCount;
        }

        public void setNewCount(Long newCount) {
            this.newCount = newCount;
        }

        public Long getQualifyingCount() {
            return qualifyingCount;
        }

        public void setQualifyingCount(Long qualifyingCount) {
            this.qualifyingCount = qualifyingCount;
        }

        public Long getQualifiedCount() {
            return qualifiedCount;
        }

        public void setQualifiedCount(Long qualifiedCount) {
            this.qualifiedCount = qualifiedCount;
        }

        public Long getAppointmentCount() {
            return appointmentCount;
        }

        public void setAppointmentCount(Long appointmentCount) {
            this.appointmentCount = appointmentCount;
        }

        public Long getWonCount() {
            return wonCount;
        }

        public void setWonCount(Long wonCount) {
            this.wonCount = wonCount;
        }

        public Long getLostCount() {
            return lostCount;
        }

        public void setLostCount(Long lostCount) {
            this.lostCount = lostCount;
        }

        public Double getNewToQualifyingRate() {
            return newToQualifyingRate;
        }

        public void setNewToQualifyingRate(Double newToQualifyingRate) {
            this.newToQualifyingRate = newToQualifyingRate;
        }

        public Double getQualifyingToQualifiedRate() {
            return qualifyingToQualifiedRate;
        }

        public void setQualifyingToQualifiedRate(Double qualifyingToQualifiedRate) {
            this.qualifyingToQualifiedRate = qualifyingToQualifiedRate;
        }

        public Double getQualifiedToAppointmentRate() {
            return qualifiedToAppointmentRate;
        }

        public void setQualifiedToAppointmentRate(Double qualifiedToAppointmentRate) {
            this.qualifiedToAppointmentRate = qualifiedToAppointmentRate;
        }

        public Double getAppointmentToWonRate() {
            return appointmentToWonRate;
        }

        public void setAppointmentToWonRate(Double appointmentToWonRate) {
            this.appointmentToWonRate = appointmentToWonRate;
        }

        public Double getOverallConversionRate() {
            return overallConversionRate;
        }

        public void setOverallConversionRate(Double overallConversionRate) {
            this.overallConversionRate = overallConversionRate;
        }
    }
}
