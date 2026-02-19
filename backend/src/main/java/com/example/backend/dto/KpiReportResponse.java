package com.example.backend.dto;

import java.util.List;

public class KpiReportResponse {
    private List<ConversionRateBySourceDto> conversionRateBySource;
    private Double averageResponseTimeHours;
    private Double appointmentShowRate;
    private Double pipelineVelocityDays;
    private List<TimeSeriesDataPointDto> dossierCreationTimeSeries;
    private List<TimeSeriesDataPointDto> conversionTimeSeries;

    public List<ConversionRateBySourceDto> getConversionRateBySource() {
        return conversionRateBySource;
    }

    public void setConversionRateBySource(List<ConversionRateBySourceDto> conversionRateBySource) {
        this.conversionRateBySource = conversionRateBySource;
    }

    public Double getAverageResponseTimeHours() {
        return averageResponseTimeHours;
    }

    public void setAverageResponseTimeHours(Double averageResponseTimeHours) {
        this.averageResponseTimeHours = averageResponseTimeHours;
    }

    public Double getAppointmentShowRate() {
        return appointmentShowRate;
    }

    public void setAppointmentShowRate(Double appointmentShowRate) {
        this.appointmentShowRate = appointmentShowRate;
    }

    public Double getPipelineVelocityDays() {
        return pipelineVelocityDays;
    }

    public void setPipelineVelocityDays(Double pipelineVelocityDays) {
        this.pipelineVelocityDays = pipelineVelocityDays;
    }

    public List<TimeSeriesDataPointDto> getDossierCreationTimeSeries() {
        return dossierCreationTimeSeries;
    }

    public void setDossierCreationTimeSeries(
            List<TimeSeriesDataPointDto> dossierCreationTimeSeries) {
        this.dossierCreationTimeSeries = dossierCreationTimeSeries;
    }

    public List<TimeSeriesDataPointDto> getConversionTimeSeries() {
        return conversionTimeSeries;
    }

    public void setConversionTimeSeries(List<TimeSeriesDataPointDto> conversionTimeSeries) {
        this.conversionTimeSeries = conversionTimeSeries;
    }
}
