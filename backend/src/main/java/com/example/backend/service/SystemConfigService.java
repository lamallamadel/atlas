package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.SystemConfig;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedAccessException;
import com.example.backend.repository.SystemConfigRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

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
    
    private static final Set<String> SENSITIVE_SECURITY_FIELDS = new HashSet<>(Arrays.asList(
        "passwordPolicy"
    ));
    
    private final SystemConfigRepository systemConfigRepository;
    private final FieldEncryptionService fieldEncryptionService;
    private final ObjectMapper objectMapper;

    public SystemConfigService(
            SystemConfigRepository systemConfigRepository,
            FieldEncryptionService fieldEncryptionService,
            ObjectMapper objectMapper) {
        this.systemConfigRepository = systemConfigRepository;
        this.fieldEncryptionService = fieldEncryptionService;
        this.objectMapper = objectMapper;
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

        Optional<SystemConfig> networkConfig = systemConfigRepository.findByKey(NETWORK_SETTINGS_KEY);
        networkConfig.ifPresent(config -> {
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
                SecuritySettingsDto settings = objectMapper.readValue(config.get().getValue(), SecuritySettingsDto.class);
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
                return objectMapper.readValue(config.get().getValue(), PerformanceSettingsDto.class);
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
            
            Optional<SystemConfig> existing = systemConfigRepository.findByKey(NETWORK_SETTINGS_KEY);
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
            
            Optional<SystemConfig> existing = systemConfigRepository.findByKey(SECURITY_SETTINGS_KEY);
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
            
            Optional<SystemConfig> existing = systemConfigRepository.findByKey(PERFORMANCE_SETTINGS_KEY);
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

        boolean isSuperAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_SUPER_ADMIN"));

        if (!isSuperAdmin) {
            logger.warn("Unauthorized system config access attempt by user: {}", authentication.getName());
            throw new UnauthorizedAccessException("Only super administrators can access system configuration");
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
            encrypted.setPasswordPolicy(fieldEncryptionService.encrypt(settings.getPasswordPolicy()));
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
                decrypted.setPasswordPolicy(fieldEncryptionService.decrypt(settings.getPasswordPolicy()));
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
}
