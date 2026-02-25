package com.example.backend.service;

import com.example.backend.audit.AuditDiffCalculator;
import com.example.backend.dto.*;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.SystemConfig;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.exception.UnauthorizedAccessException;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.SystemConfigRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemConfigService {

    private static final Logger logger = LoggerFactory.getLogger(SystemConfigService.class);
    private static final String CACHE_NAME = "systemConfig";

    private static final String NETWORK_SETTINGS_KEY = "system.network.settings";
    private static final String SECURITY_SETTINGS_KEY = "system.security.settings";
    private static final String PERFORMANCE_SETTINGS_KEY = "system.performance.settings";

    private static final String CATEGORY_NETWORK = "NETWORK";
    private static final String CATEGORY_SECURITY = "SECURITY";
    private static final String CATEGORY_PERFORMANCE = "PERFORMANCE";

    private static final Set<String> SENSITIVE_SECURITY_FIELDS =
            new HashSet<>(Arrays.asList("passwordPolicy"));

    private final SystemConfigRepository systemConfigRepository;
    private final FieldEncryptionService fieldEncryptionService;
    private final ObjectMapper objectMapper;
    private final AuditEventRepository auditEventRepository;
    private final AuditDiffCalculator auditDiffCalculator;

    public SystemConfigService(
            SystemConfigRepository systemConfigRepository,
            FieldEncryptionService fieldEncryptionService,
            ObjectMapper objectMapper,
            AuditEventRepository auditEventRepository,
            AuditDiffCalculator auditDiffCalculator) {
        this.systemConfigRepository = systemConfigRepository;
        this.fieldEncryptionService = fieldEncryptionService;
        this.objectMapper = objectMapper;
        this.auditEventRepository = auditEventRepository;
        this.auditDiffCalculator = auditDiffCalculator;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'all'")
    public SystemConfigResponse getSystemConfig() {
        validateSuperAdminAccess();

        logger.debug("Getting system configuration");

        NetworkSettingsDto networkSettings = getNetworkSettings();
        SecuritySettingsDto securitySettings = getSecuritySettings();
        PerformanceSettingsDto performanceSettings = getPerformanceSettings();

        SystemConfigResponse response = new SystemConfigResponse();
        response.setNetworkSettings(networkSettings);
        response.setSecuritySettings(securitySettings);
        response.setPerformanceSettings(performanceSettings);

        Optional<SystemConfig> networkConfig =
                systemConfigRepository.findByKey(NETWORK_SETTINGS_KEY);
        networkConfig.ifPresent(
                config -> {
                    response.setId(config.getId());
                    response.setCreatedAt(config.getCreatedAt());
                    response.setUpdatedAt(config.getUpdatedAt());
                });

        return response;
    }

    @Transactional(readOnly = true)
    public NetworkSettingsDto getNetworkSettings() {
        validateSuperAdminAccess();

        logger.debug("Getting network settings");

        Optional<SystemConfig> config = systemConfigRepository.findByKey(NETWORK_SETTINGS_KEY);
        if (config.isPresent()) {
            try {
                return objectMapper.readValue(config.get().getValue(), NetworkSettingsDto.class);
            } catch (JsonProcessingException e) {
                logger.error("Failed to parse network settings", e);
                return getDefaultNetworkSettings();
            }
        }

        return getDefaultNetworkSettings();
    }

    @Transactional(readOnly = true)
    public SecuritySettingsDto getSecuritySettings() {
        validateSuperAdminAccess();

        logger.debug("Getting security settings");

        Optional<SystemConfig> config = systemConfigRepository.findByKey(SECURITY_SETTINGS_KEY);
        if (config.isPresent()) {
            try {
                SecuritySettingsDto settings =
                        objectMapper.readValue(config.get().getValue(), SecuritySettingsDto.class);
                return decryptSecuritySettings(settings);
            } catch (JsonProcessingException e) {
                logger.error("Failed to parse security settings", e);
                return getDefaultSecuritySettings();
            }
        }

        return getDefaultSecuritySettings();
    }

    @Transactional(readOnly = true)
    public PerformanceSettingsDto getPerformanceSettings() {
        validateSuperAdminAccess();

        logger.debug("Getting performance settings");

        Optional<SystemConfig> config = systemConfigRepository.findByKey(PERFORMANCE_SETTINGS_KEY);
        if (config.isPresent()) {
            try {
                return objectMapper.readValue(
                        config.get().getValue(), PerformanceSettingsDto.class);
            } catch (JsonProcessingException e) {
                logger.error("Failed to parse performance settings", e);
                return getDefaultPerformanceSettings();
            }
        }

        return getDefaultPerformanceSettings();
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public SystemConfigResponse updateSystemConfig(SystemConfigUpdateRequest request) {
        validateSuperAdminAccess();

        logger.debug("Updating system configuration");

        if (request.getNetworkSettings() != null) {
            updateNetworkSettings(request.getNetworkSettings());
        }

        if (request.getSecuritySettings() != null) {
            updateSecuritySettings(request.getSecuritySettings());
        }

        if (request.getPerformanceSettings() != null) {
            updatePerformanceSettings(request.getPerformanceSettings());
        }

        logger.info("System configuration updated successfully");
        return getSystemConfig();
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public NetworkSettingsDto updateNetworkSettings(NetworkSettingsDto settings) {
        validateSuperAdminAccess();

        logger.debug("Updating network settings");

        try {
            String jsonValue = objectMapper.writeValueAsString(settings);

            Optional<SystemConfig> existing =
                    systemConfigRepository.findByKey(NETWORK_SETTINGS_KEY);
            SystemConfig config;

            if (existing.isPresent()) {
                config = existing.get();
                config.setValue(jsonValue);
            } else {
                config = new SystemConfig();
                config.setKey(NETWORK_SETTINGS_KEY);
                config.setValue(jsonValue);
                config.setCategory(CATEGORY_NETWORK);
                config.setEncrypted(false);
            }

            systemConfigRepository.save(config);
            logger.info("Network settings updated successfully");

            return settings;
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize network settings", e);
            throw new RuntimeException("Failed to update network settings", e);
        }
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public SecuritySettingsDto updateSecuritySettings(SecuritySettingsDto settings) {
        validateSuperAdminAccess();

        logger.debug("Updating security settings");

        try {
            SecuritySettingsDto encryptedSettings = encryptSecuritySettings(settings);
            String jsonValue = objectMapper.writeValueAsString(encryptedSettings);

            Optional<SystemConfig> existing =
                    systemConfigRepository.findByKey(SECURITY_SETTINGS_KEY);
            SystemConfig config;

            if (existing.isPresent()) {
                config = existing.get();
                config.setValue(jsonValue);
                config.setEncrypted(true);
            } else {
                config = new SystemConfig();
                config.setKey(SECURITY_SETTINGS_KEY);
                config.setValue(jsonValue);
                config.setCategory(CATEGORY_SECURITY);
                config.setEncrypted(true);
            }

            systemConfigRepository.save(config);
            logger.info("Security settings updated successfully");

            return settings;
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize security settings", e);
            throw new RuntimeException("Failed to update security settings", e);
        }
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public PerformanceSettingsDto updatePerformanceSettings(PerformanceSettingsDto settings) {
        validateSuperAdminAccess();

        logger.debug("Updating performance settings");

        try {
            String jsonValue = objectMapper.writeValueAsString(settings);

            Optional<SystemConfig> existing =
                    systemConfigRepository.findByKey(PERFORMANCE_SETTINGS_KEY);
            SystemConfig config;

            if (existing.isPresent()) {
                config = existing.get();
                config.setValue(jsonValue);
            } else {
                config = new SystemConfig();
                config.setKey(PERFORMANCE_SETTINGS_KEY);
                config.setValue(jsonValue);
                config.setCategory(CATEGORY_PERFORMANCE);
                config.setEncrypted(false);
            }

            systemConfigRepository.save(config);
            logger.info("Performance settings updated successfully");

            return settings;
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize performance settings", e);
            throw new RuntimeException("Failed to update performance settings", e);
        }
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void resetToDefaults() {
        validateSuperAdminAccess();

        logger.debug("Resetting system configuration to defaults");

        updateNetworkSettings(getDefaultNetworkSettings());
        updateSecuritySettings(getDefaultSecuritySettings());
        updatePerformanceSettings(getDefaultPerformanceSettings());

        logger.info("System configuration reset to defaults");
    }

    private void validateSuperAdminAccess() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        boolean isSuperAdmin =
                authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .anyMatch(authority -> authority.equals("ROLE_SUPER_ADMIN"));

        if (!isSuperAdmin) {
            logger.warn(
                    "Unauthorized system config access attempt by user: {}",
                    authentication.getName());
            throw new UnauthorizedAccessException(
                    "Only super administrators can access system configuration");
        }
    }

    private SecuritySettingsDto encryptSecuritySettings(SecuritySettingsDto settings) {
        if (settings == null) {
            return null;
        }

        SecuritySettingsDto encrypted = new SecuritySettingsDto();
        encrypted.setSessionTimeout(settings.getSessionTimeout());
        encrypted.setMfaEnabled(settings.getMfaEnabled());
        encrypted.setMaxLoginAttempts(settings.getMaxLoginAttempts());

        if (settings.getPasswordPolicy() != null && !settings.getPasswordPolicy().isEmpty()) {
            encrypted.setPasswordPolicy(
                    fieldEncryptionService.encrypt(settings.getPasswordPolicy()));
        }

        return encrypted;
    }

    private SecuritySettingsDto decryptSecuritySettings(SecuritySettingsDto settings) {
        if (settings == null) {
            return null;
        }

        SecuritySettingsDto decrypted = new SecuritySettingsDto();
        decrypted.setSessionTimeout(settings.getSessionTimeout());
        decrypted.setMfaEnabled(settings.getMfaEnabled());
        decrypted.setMaxLoginAttempts(settings.getMaxLoginAttempts());

        if (settings.getPasswordPolicy() != null && !settings.getPasswordPolicy().isEmpty()) {
            try {
                decrypted.setPasswordPolicy(
                        fieldEncryptionService.decrypt(settings.getPasswordPolicy()));
            } catch (Exception e) {
                logger.error("Failed to decrypt password policy", e);
                decrypted.setPasswordPolicy("***DECRYPTION_ERROR***");
            }
        }

        return decrypted;
    }

    private NetworkSettingsDto getDefaultNetworkSettings() {
        return new NetworkSettingsDto(null, null, 30000, 60000);
    }

    private SecuritySettingsDto getDefaultSecuritySettings() {
        return new SecuritySettingsDto(3600, "MEDIUM", false, 5);
    }

    private PerformanceSettingsDto getDefaultPerformanceSettings() {
        return new PerformanceSettingsDto(true, 100, 10, 10485760L);
    }

    @Transactional(readOnly = true)
    public SystemConfigResponse.ConfigListResponse getAllSystemConfigs() {
        validateSuperAdminAccess();

        logger.debug("Getting all system configuration parameters");

        List<SystemConfig> configs = systemConfigRepository.findAll();
        List<SystemConfigResponse> responses =
                configs.stream().map(this::toConfigResponse).collect(Collectors.toList());

        logger.info("Retrieved {} system configuration parameters", responses.size());

        return new SystemConfigResponse.ConfigListResponse(responses, responses.size());
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public SystemConfigResponse updateSystemConfigByKey(String key, String value) {
        validateSuperAdminAccess();

        logger.debug("Updating system configuration parameter: {}", key);

        validateConfigValue(key, value);

        Optional<SystemConfig> existingOpt = systemConfigRepository.findByKey(key);
        SystemConfig config;
        SystemConfig oldConfig = null;

        if (existingOpt.isPresent()) {
            config = existingOpt.get();
            oldConfig = cloneConfig(config);
            config.setValue(value);
        } else {
            config = new SystemConfig();
            config.setKey(key);
            config.setValue(value);
            config.setCategory("CUSTOM");
            config.setEncrypted(false);
        }

        config = systemConfigRepository.save(config);

        logAuditEvent(config.getId(), AuditAction.UPDATED, oldConfig, config);

        logger.info("System configuration parameter updated: {} by user: {}", key, extractUserId());

        return toConfigResponse(config);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public SystemConfigResponse.ConfigReloadResponse reloadConfiguration() {
        validateSuperAdminAccess();

        logger.info("Reloading system configuration without restart by user: {}", extractUserId());

        List<SystemConfig> configs = systemConfigRepository.findAll();
        int configsReloaded = configs.size();

        logAuditEvent(null, AuditAction.RELOAD, null, Map.of("configsReloaded", configsReloaded));

        logger.info("System configuration reloaded successfully: {} parameters", configsReloaded);

        return new SystemConfigResponse.ConfigReloadResponse(
                true, "Configuration reloaded successfully", configsReloaded);
    }

    @Transactional(readOnly = true)
    public SystemConfigResponse.ConfigHealthResponse checkConfigHealth() {
        validateSuperAdminAccess();

        logger.debug("Checking system configuration health");

        List<String> errors = new ArrayList<>();
        Map<String, Object> details = new HashMap<>();
        boolean isValid = true;

        try {
            NetworkSettingsDto networkSettings = getNetworkSettings();
            if (networkSettings.getConnectTimeout() != null
                    && networkSettings.getConnectTimeout() < 0) {
                errors.add("Network connection timeout is negative");
                isValid = false;
            }
            if (networkSettings.getReadTimeout() != null && networkSettings.getReadTimeout() < 0) {
                errors.add("Network read timeout is negative");
                isValid = false;
            }
            if (networkSettings.getProxyPort() != null
                    && (networkSettings.getProxyPort() < 1
                            || networkSettings.getProxyPort() > 65535)) {
                errors.add("Proxy port must be between 1 and 65535");
                isValid = false;
            }
            details.put("networkSettings", "checked");
        } catch (Exception e) {
            errors.add("Network settings validation failed: " + e.getMessage());
            isValid = false;
            details.put("networkSettings", "error");
        }

        try {
            SecuritySettingsDto securitySettings = getSecuritySettings();
            if (securitySettings.getSessionTimeout() != null
                    && securitySettings.getSessionTimeout() < 60) {
                errors.add("Session timeout is too short (minimum 60 seconds)");
                isValid = false;
            }
            if (securitySettings.getMaxLoginAttempts() != null
                    && securitySettings.getMaxLoginAttempts() < 1) {
                errors.add("Max login attempts must be at least 1");
                isValid = false;
            }
            details.put("securitySettings", "checked");
        } catch (Exception e) {
            errors.add("Security settings validation failed: " + e.getMessage());
            isValid = false;
            details.put("securitySettings", "error");
        }

        try {
            PerformanceSettingsDto performanceSettings = getPerformanceSettings();
            if (performanceSettings.getBatchSize() != null
                    && performanceSettings.getBatchSize() < 1) {
                errors.add("Batch size must be at least 1");
                isValid = false;
            }
            if (performanceSettings.getAsyncPoolSize() != null
                    && performanceSettings.getAsyncPoolSize() < 1) {
                errors.add("Async pool size must be at least 1");
                isValid = false;
            }
            if (performanceSettings.getMaxFileUploadSize() != null
                    && performanceSettings.getMaxFileUploadSize() < 0) {
                errors.add("Max file upload size cannot be negative");
                isValid = false;
            }
            details.put("performanceSettings", "checked");
        } catch (Exception e) {
            errors.add("Performance settings validation failed: " + e.getMessage());
            isValid = false;
            details.put("performanceSettings", "error");
        }

        List<SystemConfig> allConfigs = systemConfigRepository.findAll();
        details.put("totalConfigs", allConfigs.size());
        details.put(
                "encryptedConfigs",
                allConfigs.stream()
                        .filter(c -> c.getEncrypted() != null && c.getEncrypted())
                        .count());

        String status = isValid ? "HEALTHY" : "UNHEALTHY";

        logAuditEvent(
                null,
                AuditAction.CONFIG_HEALTH_CHECK,
                null,
                Map.of(
                        "status", status,
                        "errorCount", errors.size(),
                        "valid", isValid));

        logger.info(
                "System configuration health check completed: status={}, errors={}",
                status,
                errors.size());

        return new SystemConfigResponse.ConfigHealthResponse(isValid, status, errors, details);
    }

    private SystemConfigResponse toConfigResponse(SystemConfig config) {
        SystemConfigResponse response = new SystemConfigResponse();
        response.setId(config.getId());
        response.setKey(config.getKey());
        response.setValue(config.getValue());
        response.setCategory(config.getCategory());
        response.setEncrypted(config.getEncrypted());
        response.setCreatedAt(config.getCreatedAt());
        response.setUpdatedAt(config.getUpdatedAt());
        return response;
    }

    private SystemConfig cloneConfig(SystemConfig config) {
        SystemConfig clone = new SystemConfig();
        clone.setId(config.getId());
        clone.setKey(config.getKey());
        clone.setValue(config.getValue());
        clone.setCategory(config.getCategory());
        clone.setEncrypted(config.getEncrypted());
        clone.setCreatedAt(config.getCreatedAt());
        clone.setUpdatedAt(config.getUpdatedAt());
        return clone;
    }

    private void logAuditEvent(Long entityId, AuditAction action, Object before, Object after) {
        try {
            String userId = extractUserId();

            AuditEventEntity auditEvent = new AuditEventEntity();
            auditEvent.setEntityType(AuditEntityType.SYSTEM_CONFIG);
            auditEvent.setEntityId(entityId != null ? entityId : 0L);
            auditEvent.setAction(action);
            auditEvent.setUserId(userId);
            auditEvent.setOrgId("system");

            Map<String, Object> diff;
            if (before != null && after != null) {
                diff = auditDiffCalculator.buildDiff(before, after);
            } else if (after != null) {
                diff = new HashMap<>();
                diff.put("after", after);
            } else {
                diff = new HashMap<>();
            }

            auditEvent.setDiff(diff);

            LocalDateTime now = LocalDateTime.now();
            auditEvent.setCreatedAt(now);
            auditEvent.setUpdatedAt(now);

            auditEventRepository.save(auditEvent);

            logger.info(
                    "Audit event logged: entityType={}, action={}, userId={}",
                    AuditEntityType.SYSTEM_CONFIG,
                    action,
                    userId);
        } catch (Exception e) {
            logger.error("Failed to log audit event", e);
        }
    }

    private void validateConfigValue(String key, String value) {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("Configuration key cannot be null or empty");
        }

        if (value == null) {
            throw new IllegalArgumentException("Configuration value cannot be null");
        }

        if (NETWORK_SETTINGS_KEY.equals(key)
                || SECURITY_SETTINGS_KEY.equals(key)
                || PERFORMANCE_SETTINGS_KEY.equals(key)) {
            try {
                if (NETWORK_SETTINGS_KEY.equals(key)) {
                    NetworkSettingsDto settings =
                            objectMapper.readValue(value, NetworkSettingsDto.class);
                    if (settings.getConnectTimeout() != null
                            && (settings.getConnectTimeout() < 100
                                    || settings.getConnectTimeout() > 300000)) {
                        throw new IllegalArgumentException(
                                "Connect timeout must be between 100 and 300000 milliseconds");
                    }
                    if (settings.getReadTimeout() != null
                            && (settings.getReadTimeout() < 100
                                    || settings.getReadTimeout() > 300000)) {
                        throw new IllegalArgumentException(
                                "Read timeout must be between 100 and 300000 milliseconds");
                    }
                    if (settings.getProxyPort() != null
                            && (settings.getProxyPort() < 1 || settings.getProxyPort() > 65535)) {
                        throw new IllegalArgumentException(
                                "Proxy port must be between 1 and 65535");
                    }
                } else if (SECURITY_SETTINGS_KEY.equals(key)) {
                    SecuritySettingsDto settings =
                            objectMapper.readValue(value, SecuritySettingsDto.class);
                    if (settings.getSessionTimeout() != null && settings.getSessionTimeout() < 60) {
                        throw new IllegalArgumentException(
                                "Session timeout must be at least 60 seconds");
                    }
                    if (settings.getMaxLoginAttempts() != null
                            && settings.getMaxLoginAttempts() < 1) {
                        throw new IllegalArgumentException("Max login attempts must be at least 1");
                    }
                } else if (PERFORMANCE_SETTINGS_KEY.equals(key)) {
                    PerformanceSettingsDto settings =
                            objectMapper.readValue(value, PerformanceSettingsDto.class);
                    if (settings.getBatchSize() != null && settings.getBatchSize() < 1) {
                        throw new IllegalArgumentException("Batch size must be at least 1");
                    }
                    if (settings.getAsyncPoolSize() != null && settings.getAsyncPoolSize() < 1) {
                        throw new IllegalArgumentException("Async pool size must be at least 1");
                    }
                    if (settings.getMaxFileUploadSize() != null
                            && settings.getMaxFileUploadSize() < 0) {
                        throw new IllegalArgumentException(
                                "Max file upload size cannot be negative");
                    }
                }
            } catch (JsonProcessingException e) {
                logger.error("Invalid JSON format for configuration key: {}", key, e);
                throw new IllegalArgumentException(
                        "Invalid JSON format for configuration value: " + e.getMessage());
            }
        }

        logger.debug("Configuration value validated successfully for key: {}", key);
    }

    private String extractUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof Jwt jwt) {
                String sub = jwt.getSubject();
                if (sub != null) return sub;
            }
            return authentication.getName();
        }
        return "system";
    }
}
