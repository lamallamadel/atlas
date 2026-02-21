package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ReportScheduleDto {
    private Long id;
    private String name;
    private String reportType;
    private String frequency;
    private List<String> recipients;
    private String format;
    private Map<String, Object> parameters;
    private Boolean enabled;
    private LocalDateTime nextRunDate;
    private LocalDateTime lastRunDate;
    private BrandingDto branding;
    private Integer dayOfWeek;
    private Integer dayOfMonth;
    private String time;

    public static class BrandingDto {
        private String logoUrl;
        private String companyName;
        private String primaryColor;

        public BrandingDto() {}

        public String getLogoUrl() {
            return logoUrl;
        }

        public void setLogoUrl(String logoUrl) {
            this.logoUrl = logoUrl;
        }

        public String getCompanyName() {
            return companyName;
        }

        public void setCompanyName(String companyName) {
            this.companyName = companyName;
        }

        public String getPrimaryColor() {
            return primaryColor;
        }

        public void setPrimaryColor(String primaryColor) {
            this.primaryColor = primaryColor;
        }
    }

    public ReportScheduleDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public List<String> getRecipients() {
        return recipients;
    }

    public void setRecipients(List<String> recipients) {
        this.recipients = recipients;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public LocalDateTime getNextRunDate() {
        return nextRunDate;
    }

    public void setNextRunDate(LocalDateTime nextRunDate) {
        this.nextRunDate = nextRunDate;
    }

    public LocalDateTime getLastRunDate() {
        return lastRunDate;
    }

    public void setLastRunDate(LocalDateTime lastRunDate) {
        this.lastRunDate = lastRunDate;
    }

    public BrandingDto getBranding() {
        return branding;
    }

    public void setBranding(BrandingDto branding) {
        this.branding = branding;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public Integer getDayOfMonth() {
        return dayOfMonth;
    }

    public void setDayOfMonth(Integer dayOfMonth) {
        this.dayOfMonth = dayOfMonth;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }
}
