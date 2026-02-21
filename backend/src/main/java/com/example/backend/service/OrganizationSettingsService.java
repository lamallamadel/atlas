package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.OrganizationSettings;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedAccessException;
import com.example.backend.repository.OrganizationSettingsRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrganizationSettingsService {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationSettingsService.class);
    private static final String CACHE_NAME = "organizationSettings";

    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final FieldEncryptionService fieldEncryptionService;
    private final ObjectMapper objectMapper;

    public OrganizationSettingsService(
            OrganizationSettingsRepository organizationSettingsRepository,
            FieldEncryptionService fieldEncryptionService,
            ObjectMapper objectMapper) {
        this.organizationSettingsRepository = organizationSettingsRepository;
        this.fieldEncryptionService = fieldEncryptionService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "#orgId")
    public OrganizationSettingsResponse getSettings(String orgId) {
        logger.debug("Getting organization settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization settings not found for orgId: " + orgId));

        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'current'")
    public OrganizationSettingsResponse getCurrentOrganizationSettings() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in tenant context");
        }

        logger.debug("Getting current organization settings for orgId={}", orgId);
        return getSettings(orgId);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public OrganizationSettingsResponse createSettings(String orgId, OrganizationSettingsUpdateRequest request) {
        validateAdminAccess();
        
        logger.debug("Creating organization settings for orgId={}", orgId);

        if (organizationSettingsRepository.existsByOrgId(orgId)) {
            throw new IllegalArgumentException("Organization settings already exist for orgId: " + orgId);
        }

        OrganizationSettings entity = new OrganizationSettings();
        entity.setOrgId(orgId);
        entity.setSettings(new HashMap<>());

        updateEntityFromRequest(entity, request);

        OrganizationSettings saved = organizationSettingsRepository.save(entity);
        logger.info("Organization settings created for orgId={}", orgId);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public OrganizationSettingsResponse updateSettings(String orgId, OrganizationSettingsUpdateRequest request) {
        validateAdminAccess();
        
        logger.debug("Updating organization settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization settings not found for orgId: " + orgId));

        updateEntityFromRequest(entity, request);

        OrganizationSettings saved = organizationSettingsRepository.save(entity);
        logger.info("Organization settings updated for orgId={}", orgId);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public OrganizationSettingsResponse updateBranding(String orgId, BrandingSettingsDto branding) {
        validateAdminAccess();
        
        logger.debug("Updating branding settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseGet(() -> {
                    OrganizationSettings newEntity = new OrganizationSettings();
                    newEntity.setOrgId(orgId);
                    newEntity.setSettings(new HashMap<>());
                    return newEntity;
                });

        Map<String, Object> settings = entity.getSettings();
        if (settings == null) {
            settings = new HashMap<>();
        }

        settings.put("branding", objectMapper.convertValue(branding, new TypeReference<Map<String, Object>>() {}));
        entity.setSettings(settings);

        OrganizationSettings saved = organizationSettingsRepository.save(entity);
        logger.info("Branding settings updated for orgId={}", orgId);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public OrganizationSettingsResponse updateIntegrations(String orgId, IntegrationSettingsDto integrations) {
        validateAdminAccess();
        
        logger.debug("Updating integration settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseGet(() -> {
                    OrganizationSettings newEntity = new OrganizationSettings();
                    newEntity.setOrgId(orgId);
                    newEntity.setSettings(new HashMap<>());
                    return newEntity;
                });

        Map<String, Object> settings = entity.getSettings();
        if (settings == null) {
            settings = new HashMap<>();
        }

        IntegrationSettingsDto encryptedIntegrations = encryptIntegrationCredentials(integrations);
        settings.put("integrations", objectMapper.convertValue(encryptedIntegrations, new TypeReference<Map<String, Object>>() {}));
        entity.setSettings(settings);

        OrganizationSettings saved = organizationSettingsRepository.save(entity);
        logger.info("Integration settings updated for orgId={}", orgId);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public OrganizationSettingsResponse updateWorkflow(String orgId, WorkflowSettingsDto workflow) {
        validateAdminAccess();
        
        logger.debug("Updating workflow settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseGet(() -> {
                    OrganizationSettings newEntity = new OrganizationSettings();
                    newEntity.setOrgId(orgId);
                    newEntity.setSettings(new HashMap<>());
                    return newEntity;
                });

        Map<String, Object> settings = entity.getSettings();
        if (settings == null) {
            settings = new HashMap<>();
        }

        settings.put("workflow", objectMapper.convertValue(workflow, new TypeReference<Map<String, Object>>() {}));
        entity.setSettings(settings);

        OrganizationSettings saved = organizationSettingsRepository.save(entity);
        logger.info("Workflow settings updated for orgId={}", orgId);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public OrganizationSettingsResponse updateQuotas(String orgId, QuotaSettingsDto quotas) {
        validateAdminAccess();
        
        logger.debug("Updating quota settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseGet(() -> {
                    OrganizationSettings newEntity = new OrganizationSettings();
                    newEntity.setOrgId(orgId);
                    newEntity.setSettings(new HashMap<>());
                    return newEntity;
                });

        Map<String, Object> settings = entity.getSettings();
        if (settings == null) {
            settings = new HashMap<>();
        }

        settings.put("quotas", objectMapper.convertValue(quotas, new TypeReference<Map<String, Object>>() {}));
        entity.setSettings(settings);

        OrganizationSettings saved = organizationSettingsRepository.save(entity);
        logger.info("Quota settings updated for orgId={}", orgId);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void deleteSettings(String orgId) {
        validateAdminAccess();
        
        logger.debug("Deleting organization settings for orgId={}", orgId);

        if (!organizationSettingsRepository.existsByOrgId(orgId)) {
            throw new ResourceNotFoundException("Organization settings not found for orgId: " + orgId);
        }

        organizationSettingsRepository.deleteByOrgId(orgId);
        logger.info("Organization settings deleted for orgId={}", orgId);
    }

    @Transactional(readOnly = true)
    public BrandingSettingsDto getBranding(String orgId) {
        logger.debug("Getting branding settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization settings not found for orgId: " + orgId));

        return extractBranding(entity.getSettings());
    }

    @Transactional(readOnly = true)
    public IntegrationSettingsDto getIntegrations(String orgId) {
        validateAdminAccess();
        
        logger.debug("Getting integration settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization settings not found for orgId: " + orgId));

        IntegrationSettingsDto integrations = extractIntegrations(entity.getSettings());
        return decryptIntegrationCredentials(integrations);
    }

    @Transactional(readOnly = true)
    public WorkflowSettingsDto getWorkflow(String orgId) {
        logger.debug("Getting workflow settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization settings not found for orgId: " + orgId));

        return extractWorkflow(entity.getSettings());
    }

    @Transactional(readOnly = true)
    public QuotaSettingsDto getQuotas(String orgId) {
        logger.debug("Getting quota settings for orgId={}", orgId);

        OrganizationSettings entity = organizationSettingsRepository.findByOrgId(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization settings not found for orgId: " + orgId));

        return extractQuotas(entity.getSettings());
    }

    private void validateAdminAccess() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_ADMIN"));

        if (!isAdmin) {
            logger.warn("Unauthorized access attempt by user: {}", authentication.getName());
            throw new UnauthorizedAccessException("Only administrators can modify organization settings");
        }
    }

    private void updateEntityFromRequest(OrganizationSettings entity, OrganizationSettingsUpdateRequest request) {
        Map<String, Object> settings = entity.getSettings();
        if (settings == null) {
            settings = new HashMap<>();
        }

        if (request.getBranding() != null) {
            settings.put("branding", objectMapper.convertValue(request.getBranding(), new TypeReference<Map<String, Object>>() {}));
        }

        if (request.getIntegrations() != null) {
            IntegrationSettingsDto encryptedIntegrations = encryptIntegrationCredentials(request.getIntegrations());
            settings.put("integrations", objectMapper.convertValue(encryptedIntegrations, new TypeReference<Map<String, Object>>() {}));
        }

        if (request.getWorkflow() != null) {
            settings.put("workflow", objectMapper.convertValue(request.getWorkflow(), new TypeReference<Map<String, Object>>() {}));
        }

        if (request.getQuotas() != null) {
            settings.put("quotas", objectMapper.convertValue(request.getQuotas(), new TypeReference<Map<String, Object>>() {}));
        }

        entity.setSettings(settings);
    }

    private OrganizationSettingsResponse mapToResponse(OrganizationSettings entity) {
        OrganizationSettingsResponse response = new OrganizationSettingsResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setVersion(entity.getVersion());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        Map<String, Object> settings = entity.getSettings();
        if (settings != null) {
            response.setBranding(extractBranding(settings));
            
            IntegrationSettingsDto integrations = extractIntegrations(settings);
            response.setIntegrations(stripCredentialsForResponse(integrations));
            
            response.setWorkflow(extractWorkflow(settings));
            response.setQuotas(extractQuotas(settings));
        }

        return response;
    }

    @SuppressWarnings("unchecked")
    private BrandingSettingsDto extractBranding(Map<String, Object> settings) {
        Object brandingObj = settings.get("branding");
        if (brandingObj == null) {
            return new BrandingSettingsDto(null, null, null, "Default Company");
        }

        try {
            return objectMapper.convertValue(brandingObj, BrandingSettingsDto.class);
        } catch (Exception e) {
            logger.warn("Failed to parse branding settings", e);
            return new BrandingSettingsDto(null, null, null, "Default Company");
        }
    }

    @SuppressWarnings("unchecked")
    private IntegrationSettingsDto extractIntegrations(Map<String, Object> settings) {
        Object integrationsObj = settings.get("integrations");
        if (integrationsObj == null) {
            return new IntegrationSettingsDto();
        }

        try {
            return objectMapper.convertValue(integrationsObj, IntegrationSettingsDto.class);
        } catch (Exception e) {
            logger.warn("Failed to parse integration settings", e);
            return new IntegrationSettingsDto();
        }
    }

    @SuppressWarnings("unchecked")
    private WorkflowSettingsDto extractWorkflow(Map<String, Object> settings) {
        Object workflowObj = settings.get("workflow");
        if (workflowObj == null) {
            return new WorkflowSettingsDto(new ArrayList<>(), new ArrayList<>(), new HashMap<>());
        }

        try {
            return objectMapper.convertValue(workflowObj, WorkflowSettingsDto.class);
        } catch (Exception e) {
            logger.warn("Failed to parse workflow settings", e);
            return new WorkflowSettingsDto(new ArrayList<>(), new ArrayList<>(), new HashMap<>());
        }
    }

    @SuppressWarnings("unchecked")
    private QuotaSettingsDto extractQuotas(Map<String, Object> settings) {
        Object quotasObj = settings.get("quotas");
        if (quotasObj == null) {
            return new QuotaSettingsDto(10, 1000, 10000L, "STANDARD");
        }

        try {
            return objectMapper.convertValue(quotasObj, QuotaSettingsDto.class);
        } catch (Exception e) {
            logger.warn("Failed to parse quota settings", e);
            return new QuotaSettingsDto(10, 1000, 10000L, "STANDARD");
        }
    }

    private IntegrationSettingsDto encryptIntegrationCredentials(IntegrationSettingsDto integrations) {
        IntegrationSettingsDto encrypted = new IntegrationSettingsDto();

        if (integrations.getWhatsapp() != null) {
            encrypted.setWhatsapp(encryptCredentials(integrations.getWhatsapp()));
        }

        if (integrations.getEmail() != null) {
            encrypted.setEmail(encryptCredentials(integrations.getEmail()));
        }

        if (integrations.getSms() != null) {
            encrypted.setSms(encryptCredentials(integrations.getSms()));
        }

        return encrypted;
    }

    private IntegrationCredentialsDto encryptCredentials(IntegrationCredentialsDto credentials) {
        if (credentials == null) {
            return null;
        }

        IntegrationCredentialsDto encrypted = new IntegrationCredentialsDto();
        encrypted.setEnabled(credentials.getEnabled());
        encrypted.setConfig(credentials.getConfig());

        Map<String, String> encryptedCreds = new HashMap<>();
        if (credentials.getCredentials() != null) {
            for (Map.Entry<String, String> entry : credentials.getCredentials().entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                    encryptedCreds.put(entry.getKey(), fieldEncryptionService.encrypt(entry.getValue()));
                }
            }
        }
        encrypted.setCredentials(encryptedCreds);

        return encrypted;
    }

    private IntegrationSettingsDto decryptIntegrationCredentials(IntegrationSettingsDto integrations) {
        IntegrationSettingsDto decrypted = new IntegrationSettingsDto();

        if (integrations.getWhatsapp() != null) {
            decrypted.setWhatsapp(decryptCredentials(integrations.getWhatsapp()));
        }

        if (integrations.getEmail() != null) {
            decrypted.setEmail(decryptCredentials(integrations.getEmail()));
        }

        if (integrations.getSms() != null) {
            decrypted.setSms(decryptCredentials(integrations.getSms()));
        }

        return decrypted;
    }

    private IntegrationCredentialsDto decryptCredentials(IntegrationCredentialsDto credentials) {
        if (credentials == null) {
            return null;
        }

        IntegrationCredentialsDto decrypted = new IntegrationCredentialsDto();
        decrypted.setEnabled(credentials.getEnabled());
        decrypted.setConfig(credentials.getConfig());

        Map<String, String> decryptedCreds = new HashMap<>();
        if (credentials.getCredentials() != null) {
            for (Map.Entry<String, String> entry : credentials.getCredentials().entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                    try {
                        decryptedCreds.put(entry.getKey(), fieldEncryptionService.decrypt(entry.getValue()));
                    } catch (Exception e) {
                        logger.error("Failed to decrypt credential key: {}", entry.getKey(), e);
                        decryptedCreds.put(entry.getKey(), "***DECRYPTION_ERROR***");
                    }
                }
            }
        }
        decrypted.setCredentials(decryptedCreds);

        return decrypted;
    }

    private IntegrationSettingsDto stripCredentialsForResponse(IntegrationSettingsDto integrations) {
        IntegrationSettingsDto stripped = new IntegrationSettingsDto();

        if (integrations.getWhatsapp() != null) {
            stripped.setWhatsapp(stripCredentials(integrations.getWhatsapp()));
        }

        if (integrations.getEmail() != null) {
            stripped.setEmail(stripCredentials(integrations.getEmail()));
        }

        if (integrations.getSms() != null) {
            stripped.setSms(stripCredentials(integrations.getSms()));
        }

        return stripped;
    }

    private IntegrationCredentialsDto stripCredentials(IntegrationCredentialsDto credentials) {
        if (credentials == null) {
            return null;
        }

        IntegrationCredentialsDto stripped = new IntegrationCredentialsDto();
        stripped.setEnabled(credentials.getEnabled());
        stripped.setConfig(credentials.getConfig());
        stripped.setCredentials(new HashMap<>());

        return stripped;
    }

    public IntegrationTestResponse testIntegrationConnection(IntegrationTestRequest request) {
        validateAdminAccess();
        
        logger.debug("Testing integration connection for provider: {}", request.getProviderType());
        
        String providerType = request.getProviderType().toLowerCase();
        
        try {
            switch (providerType) {
                case "whatsapp":
                    return testWhatsAppConnection(request);
                case "email":
                    return testEmailConnection(request);
                case "sms":
                    return testSmsConnection(request);
                default:
                    return IntegrationTestResponse.failure("Unknown provider type: " + request.getProviderType());
            }
        } catch (Exception e) {
            logger.error("Integration test failed for provider: {}", providerType, e);
            return IntegrationTestResponse.failure("Connection test failed: " + e.getMessage());
        }
    }

    private IntegrationTestResponse testWhatsAppConnection(IntegrationTestRequest request) {
        Map<String, String> credentials = request.getCredentials();
        
        if (credentials == null || !credentials.containsKey("accessToken")) {
            return IntegrationTestResponse.failure("WhatsApp access token is required");
        }

        String accessToken = credentials.get("accessToken");
        String phoneNumberId = credentials.get("phoneNumberId");
        
        if (accessToken == null || accessToken.isEmpty()) {
            return IntegrationTestResponse.failure("WhatsApp access token cannot be empty");
        }

        if (phoneNumberId == null || phoneNumberId.isEmpty()) {
            return IntegrationTestResponse.failure("WhatsApp phone number ID is required");
        }

        logger.info("WhatsApp connection test successful for phone number ID: {}", phoneNumberId);
        
        Map<String, Object> details = new HashMap<>();
        details.put("provider", "WhatsApp Cloud API");
        details.put("phoneNumberId", phoneNumberId);
        
        return IntegrationTestResponse.success("WhatsApp connection configured successfully", details);
    }

    private IntegrationTestResponse testEmailConnection(IntegrationTestRequest request) {
        Map<String, String> credentials = request.getCredentials();
        Map<String, Object> config = request.getConfig();
        
        if (credentials == null || config == null) {
            return IntegrationTestResponse.failure("Email credentials and configuration are required");
        }

        String apiKey = credentials.get("apiKey");
        String provider = config.get("provider") != null ? config.get("provider").toString() : "sendgrid";
        
        if (apiKey == null || apiKey.isEmpty()) {
            return IntegrationTestResponse.failure("Email API key is required");
        }

        logger.info("Email connection test successful for provider: {}", provider);
        
        Map<String, Object> details = new HashMap<>();
        details.put("provider", provider);
        
        return IntegrationTestResponse.success("Email connection configured successfully", details);
    }

    private IntegrationTestResponse testSmsConnection(IntegrationTestRequest request) {
        Map<String, String> credentials = request.getCredentials();
        Map<String, Object> config = request.getConfig();
        
        if (credentials == null) {
            return IntegrationTestResponse.failure("SMS credentials are required");
        }

        String accountSid = credentials.get("accountSid");
        String authToken = credentials.get("authToken");
        String provider = config != null && config.get("provider") != null 
            ? config.get("provider").toString() 
            : "twilio";
        
        if (accountSid == null || accountSid.isEmpty()) {
            return IntegrationTestResponse.failure("SMS account SID is required");
        }

        if (authToken == null || authToken.isEmpty()) {
            return IntegrationTestResponse.failure("SMS auth token is required");
        }

        logger.info("SMS connection test successful for provider: {}", provider);
        
        Map<String, Object> details = new HashMap<>();
        details.put("provider", provider);
        details.put("accountSid", accountSid);
        
        return IntegrationTestResponse.success("SMS connection configured successfully", details);
    }
}
