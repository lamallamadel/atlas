package com.example.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QuotaSettingsDto {

    @NotNull(message = "Max users is required")
    @Min(value = 1, message = "Max users must be at least 1")
    private Integer maxUsers;

    @NotNull(message = "Max dossiers is required")
    @Min(value = 1, message = "Max dossiers must be at least 1")
    private Integer maxDossiers;

    @NotNull(message = "Max storage is required")
    @Min(value = 1, message = "Max storage (in MB) must be at least 1")
    private Long maxStorage;

    @NotBlank(message = "Rate limit tier is required")
    private String rateLimitTier;

    public QuotaSettingsDto() {
    }

    public QuotaSettingsDto(Integer maxUsers, Integer maxDossiers, Long maxStorage, String rateLimitTier) {
        this.maxUsers = maxUsers;
        this.maxDossiers = maxDossiers;
        this.maxStorage = maxStorage;
        this.rateLimitTier = rateLimitTier;
    }

    public Integer getMaxUsers() {
        return maxUsers;
    }

    public void setMaxUsers(Integer maxUsers) {
        this.maxUsers = maxUsers;
    }

    public Integer getMaxDossiers() {
        return maxDossiers;
    }

    public void setMaxDossiers(Integer maxDossiers) {
        this.maxDossiers = maxDossiers;
    }

    public Long getMaxStorage() {
        return maxStorage;
    }

    public void setMaxStorage(Long maxStorage) {
        this.maxStorage = maxStorage;
    }

    public String getRateLimitTier() {
        return rateLimitTier;
    }

    public void setRateLimitTier(String rateLimitTier) {
        this.rateLimitTier = rateLimitTier;
    }
}
