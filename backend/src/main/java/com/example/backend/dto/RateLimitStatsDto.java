package com.example.backend.dto;

public class RateLimitStatsDto {

    private Long totalHits;
    private Long totalRejections;
    private Long orgHits;
    private Long orgRejections;
    private Long ipHits;
    private Long ipRejections;
    private Double rejectionRate;

    public RateLimitStatsDto() {
    }

    public RateLimitStatsDto(Long totalHits, Long totalRejections, Long orgHits, Long orgRejections, Long ipHits, Long ipRejections) {
        this.totalHits = totalHits;
        this.totalRejections = totalRejections;
        this.orgHits = orgHits;
        this.orgRejections = orgRejections;
        this.ipHits = ipHits;
        this.ipRejections = ipRejections;
        this.rejectionRate = totalHits > 0 ? (totalRejections * 100.0) / totalHits : 0.0;
    }

    public Long getTotalHits() {
        return totalHits;
    }

    public void setTotalHits(Long totalHits) {
        this.totalHits = totalHits;
    }

    public Long getTotalRejections() {
        return totalRejections;
    }

    public void setTotalRejections(Long totalRejections) {
        this.totalRejections = totalRejections;
    }

    public Long getOrgHits() {
        return orgHits;
    }

    public void setOrgHits(Long orgHits) {
        this.orgHits = orgHits;
    }

    public Long getOrgRejections() {
        return orgRejections;
    }

    public void setOrgRejections(Long orgRejections) {
        this.orgRejections = orgRejections;
    }

    public Long getIpHits() {
        return ipHits;
    }

    public void setIpHits(Long ipHits) {
        this.ipHits = ipHits;
    }

    public Long getIpRejections() {
        return ipRejections;
    }

    public void setIpRejections(Long ipRejections) {
        this.ipRejections = ipRejections;
    }

    public Double getRejectionRate() {
        return rejectionRate;
    }

    public void setRejectionRate(Double rejectionRate) {
        this.rejectionRate = rejectionRate;
    }
}
