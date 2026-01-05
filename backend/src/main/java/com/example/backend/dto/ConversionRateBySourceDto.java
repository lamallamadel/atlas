package com.example.backend.dto;

public class ConversionRateBySourceDto {
    private String source;
    private Long totalDossiers;
    private Long wonDossiers;
    private Double conversionRate;

    public ConversionRateBySourceDto() {
    }

    public ConversionRateBySourceDto(String source, Long totalDossiers, Long wonDossiers) {
        this.source = source;
        this.totalDossiers = totalDossiers;
        this.wonDossiers = wonDossiers;
        this.conversionRate = totalDossiers > 0 ? (wonDossiers * 100.0 / totalDossiers) : 0.0;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Long getTotalDossiers() {
        return totalDossiers;
    }

    public void setTotalDossiers(Long totalDossiers) {
        this.totalDossiers = totalDossiers;
    }

    public Long getWonDossiers() {
        return wonDossiers;
    }

    public void setWonDossiers(Long wonDossiers) {
        this.wonDossiers = wonDossiers;
    }

    public Double getConversionRate() {
        return conversionRate;
    }

    public void setConversionRate(Double conversionRate) {
        this.conversionRate = conversionRate;
    }
}
