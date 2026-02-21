package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Notification preferences data transfer object")
public class NotificationPreferencesDto {

    @Schema(description = "Enable email notifications", example = "true")
    private Boolean enableEmail;

    @Schema(description = "Enable SMS notifications", example = "false")
    private Boolean enableSms;

    @Schema(description = "Enable in-app notifications", example = "true")
    private Boolean enableInApp;

    @Schema(description = "Quiet hours configuration")
    @Valid
    private QuietHours quietHours;

    public NotificationPreferencesDto() {
    }

    public NotificationPreferencesDto(Boolean enableEmail, Boolean enableSms, Boolean enableInApp, QuietHours quietHours) {
        this.enableEmail = enableEmail;
        this.enableSms = enableSms;
        this.enableInApp = enableInApp;
        this.quietHours = quietHours;
    }

    public Boolean getEnableEmail() {
        return enableEmail;
    }

    public void setEnableEmail(Boolean enableEmail) {
        this.enableEmail = enableEmail;
    }

    public Boolean getEnableSms() {
        return enableSms;
    }

    public void setEnableSms(Boolean enableSms) {
        this.enableSms = enableSms;
    }

    public Boolean getEnableInApp() {
        return enableInApp;
    }

    public void setEnableInApp(Boolean enableInApp) {
        this.enableInApp = enableInApp;
    }

    public QuietHours getQuietHours() {
        return quietHours;
    }

    public void setQuietHours(QuietHours quietHours) {
        this.quietHours = quietHours;
    }

    @Schema(description = "Quiet hours time range configuration")
    public static class QuietHours {

        @Schema(description = "Start time in HH:mm format", example = "22:00")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Start time must be in HH:mm format (00:00 to 23:59)")
        private String startTime;

        @Schema(description = "End time in HH:mm format", example = "08:00")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "End time must be in HH:mm format (00:00 to 23:59)")
        private String endTime;

        @Schema(description = "Enable quiet hours", example = "true")
        private Boolean enabled;

        public QuietHours() {
        }

        public QuietHours(String startTime, String endTime, Boolean enabled) {
            this.startTime = startTime;
            this.endTime = endTime;
            this.enabled = enabled;
        }

        public String getStartTime() {
            return startTime;
        }

        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public void setEndTime(String endTime) {
            this.endTime = endTime;
        }

        public Boolean getEnabled() {
            return enabled;
        }

        public void setEnabled(Boolean enabled) {
            this.enabled = enabled;
        }
    }
}
