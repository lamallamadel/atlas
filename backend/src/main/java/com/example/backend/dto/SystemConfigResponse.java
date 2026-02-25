package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class SystemConfigResponse {

    private Long id;
    private String key;
    private String value;
    private String category;
    private Boolean encrypted;
    private NetworkSettingsDto networkSettings;
    private SecuritySettingsDto securitySettings;
    private PerformanceSettingsDto performanceSettings;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SystemConfigResponse() {}

    public SystemConfigResponse(
            Long id,
            NetworkSettingsDto networkSettings,
            SecuritySettingsDto securitySettings,
            PerformanceSettingsDto performanceSettings,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.networkSettings = networkSettings;
        this.securitySettings = securitySettings;
        this.performanceSettings = performanceSettings;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NetworkSettingsDto getNetworkSettings() {
        return networkSettings;
    }

    public void setNetworkSettings(NetworkSettingsDto networkSettings) {
        this.networkSettings = networkSettings;
    }

    public SecuritySettingsDto getSecuritySettings() {
        return securitySettings;
    }

    public void setSecuritySettings(SecuritySettingsDto securitySettings) {
        this.securitySettings = securitySettings;
    }

    public PerformanceSettingsDto getPerformanceSettings() {
        return performanceSettings;
    }

    public void setPerformanceSettings(PerformanceSettingsDto performanceSettings) {
        this.performanceSettings = performanceSettings;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getEncrypted() {
        return encrypted;
    }

    public void setEncrypted(Boolean encrypted) {
        this.encrypted = encrypted;
    }

    public static class ConfigListResponse {
        private List<SystemConfigResponse> configs;
        private int totalCount;

        public ConfigListResponse() {}

        public ConfigListResponse(List<SystemConfigResponse> configs, int totalCount) {
            this.configs = configs;
            this.totalCount = totalCount;
        }

        public List<SystemConfigResponse> getConfigs() {
            return configs;
        }

        public void setConfigs(List<SystemConfigResponse> configs) {
            this.configs = configs;
        }

        public int getTotalCount() {
            return totalCount;
        }

        public void setTotalCount(int totalCount) {
            this.totalCount = totalCount;
        }
    }

    public static class ConfigHealthResponse {
        private boolean valid;
        private String status;
        private List<String> errors;
        private Map<String, Object> details;
        private LocalDateTime checkedAt;

        public ConfigHealthResponse() {}

        public ConfigHealthResponse(
                boolean valid, String status, List<String> errors, Map<String, Object> details) {
            this.valid = valid;
            this.status = status;
            this.errors = errors;
            this.details = details;
            this.checkedAt = LocalDateTime.now();
        }

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public List<String> getErrors() {
            return errors;
        }

        public void setErrors(List<String> errors) {
            this.errors = errors;
        }

        public Map<String, Object> getDetails() {
            return details;
        }

        public void setDetails(Map<String, Object> details) {
            this.details = details;
        }

        public LocalDateTime getCheckedAt() {
            return checkedAt;
        }

        public void setCheckedAt(LocalDateTime checkedAt) {
            this.checkedAt = checkedAt;
        }
    }

    public static class ConfigReloadResponse {
        private boolean success;
        private String message;
        private int configsReloaded;
        private LocalDateTime reloadedAt;

        public ConfigReloadResponse() {}

        public ConfigReloadResponse(boolean success, String message, int configsReloaded) {
            this.success = success;
            this.message = message;
            this.configsReloaded = configsReloaded;
            this.reloadedAt = LocalDateTime.now();
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public int getConfigsReloaded() {
            return configsReloaded;
        }

        public void setConfigsReloaded(int configsReloaded) {
            this.configsReloaded = configsReloaded;
        }

        public LocalDateTime getReloadedAt() {
            return reloadedAt;
        }

        public void setReloadedAt(LocalDateTime reloadedAt) {
            this.reloadedAt = reloadedAt;
        }
    }
}
