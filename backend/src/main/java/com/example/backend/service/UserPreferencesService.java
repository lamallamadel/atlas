package com.example.backend.service;

import com.example.backend.dto.UserPreferencesDTO;
import com.example.backend.dto.UserLocalePreferenceDto;
import com.example.backend.entity.OrganizationSettings;
import com.example.backend.entity.UserPreferences;
import com.example.backend.entity.UserPreferencesEntity;
import com.example.backend.repository.OrganizationSettingsRepository;
import com.example.backend.repository.SystemConfigRepository;
import com.example.backend.repository.UserPreferencesRepository;
import com.example.backend.repository.UserPreferencesV2Repository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * UserPreferencesService - Comprehensive User Preferences Management
 * 
 * Features:
 * 1. Category-based preferences (ui, notifications, formats, shortcuts)
 * 2. JSON Schema validation for each category
 * 3. Three-level inheritance: User -> Organization -> System defaults
 * 4. L1 caching with @Cacheable to avoid repeated database queries
 * 5. Automatic audit trail via AuditAspect on modifications
 * 
 * Categories:
 * - ui: theme, sidebar, dashboard layout, density
 * - notifications: email, push, SMS, quiet hours
 * - formats: locale, date/time formats, timezone, currency
 * - shortcuts: keyboard shortcuts configuration
 * 
 * Inheritance Logic:
 * System defaults <- Organization settings <- User preferences
 * User preferences override organization, which overrides system defaults
 * 
 * Caching:
 * - Cache key: userId:category
 * - TTL: 30 minutes (configured in CacheConfig)
 * - Eviction: automatic on set/reset operations
 * 
 * Audit Trail:
 * - Captured by AuditAspect for set/reset operations
 * - Includes before/after snapshots and diff calculation
 * - Entity type: USER_PREFERENCES
 */
@Service
public class UserPreferencesService {

    private static final Logger logger = LoggerFactory.getLogger(UserPreferencesService.class);

    private static final String CACHE_NAME = "userPreferences";
    private static final String CATEGORY_UI = "ui";
    private static final String CATEGORY_NOTIFICATIONS = "notifications";
    private static final String CATEGORY_FORMATS = "formats";
    private static final String CATEGORY_SHORTCUTS = "shortcuts";

    private final UserPreferencesRepository userPreferencesRepository;
    private final UserPreferencesV2Repository userPreferencesV2Repository;
    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final ObjectMapper objectMapper;
    private final Map<String, JsonSchema> schemaCache = new HashMap<>();

    public UserPreferencesService(
            UserPreferencesRepository userPreferencesRepository,
            UserPreferencesV2Repository userPreferencesV2Repository,
            OrganizationSettingsRepository organizationSettingsRepository,
            SystemConfigRepository systemConfigRepository,
            ObjectMapper objectMapper) {
        this.userPreferencesRepository = userPreferencesRepository;
        this.userPreferencesV2Repository = userPreferencesV2Repository;
        this.organizationSettingsRepository = organizationSettingsRepository;
        this.systemConfigRepository = systemConfigRepository;
        this.objectMapper = objectMapper;
        initializeSchemas();
    }

    /**
     * Initialize JSON schemas for each category.
     * Schemas are loaded once at service initialization.
     */
    private void initializeSchemas() {
        JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);
        
        schemaCache.put(CATEGORY_UI, factory.getSchema(getUiSchema()));
        schemaCache.put(CATEGORY_NOTIFICATIONS, factory.getSchema(getNotificationsSchema()));
        schemaCache.put(CATEGORY_FORMATS, factory.getSchema(getFormatsSchema()));
        schemaCache.put(CATEGORY_SHORTCUTS, factory.getSchema(getShortcutsSchema()));
    }

    private String getUiSchema() {
        return """
        {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "theme": {
              "type": "string",
              "enum": ["light", "dark", "auto"]
            },
            "sidebarCollapsed": {
              "type": "boolean"
            },
            "dashboardLayout": {
              "type": "object",
              "properties": {
                "widgets": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "type": { "type": "string" },
                      "x": { "type": "integer", "minimum": 0 },
                      "y": { "type": "integer", "minimum": 0 },
                      "cols": { "type": "integer", "minimum": 1 },
                      "rows": { "type": "integer", "minimum": 1 }
                    },
                    "required": ["type", "x", "y", "cols", "rows"]
                  }
                }
              }
            },
            "density": {
              "type": "string",
              "enum": ["compact", "comfortable", "spacious"]
            }
          },
          "additionalProperties": true
        }
        """;
    }

    private String getNotificationsSchema() {
        return """
        {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "emailEnabled": {
              "type": "boolean"
            },
            "pushEnabled": {
              "type": "boolean"
            },
            "smsEnabled": {
              "type": "boolean"
            },
            "channels": {
              "type": "object",
              "properties": {
                "taskAssigned": { "type": "boolean" },
                "dossierUpdated": { "type": "boolean" },
                "messageReceived": { "type": "boolean" },
                "appointmentReminder": { "type": "boolean" }
              },
              "additionalProperties": true
            },
            "quietHours": {
              "type": "object",
              "properties": {
                "enabled": { "type": "boolean" },
                "start": { "type": "string", "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$" },
                "end": { "type": "string", "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$" }
              }
            }
          },
          "additionalProperties": true
        }
        """;
    }

    private String getFormatsSchema() {
        return """
        {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "locale": {
              "type": "string",
              "pattern": "^[a-z]{2}(-[A-Z]{2})?$"
            },
            "dateFormat": {
              "type": "string",
              "enum": ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]
            },
            "timeFormat": {
              "type": "string",
              "enum": ["HH:mm", "hh:mm a"]
            },
            "timezone": {
              "type": "string"
            },
            "currency": {
              "type": "string",
              "pattern": "^[A-Z]{3}$"
            },
            "numberFormat": {
              "type": "string"
            }
          },
          "additionalProperties": true
        }
        """;
    }

    private String getShortcutsSchema() {
        return """
        {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "patternProperties": {
            "^[a-zA-Z0-9_]+$": {
              "type": "object",
              "properties": {
                "keys": {
                  "type": "array",
                  "items": { "type": "string" }
                },
                "enabled": { "type": "boolean" }
              },
              "required": ["keys"]
            }
          },
          "additionalProperties": false
        }
        """;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "#userId + ':' + #category")
    public Map<String, Object> getPreferencesByCategory(String userId, String category) {
        logger.debug("Getting preferences for userId={}, category={}", userId, category);
        
        validateCategory(category);
        
        Map<String, Object> userPrefs = getUserPreferencesMap(userId);
        Map<String, Object> orgPrefs = getOrganizationPreferencesMap();
        Map<String, Object> systemPrefs = getSystemPreferencesMap();
        
        Map<String, Object> categoryUserPrefs = extractCategory(userPrefs, category);
        Map<String, Object> categoryOrgPrefs = extractCategory(orgPrefs, category);
        Map<String, Object> categorySystemPrefs = extractCategory(systemPrefs, category);
        
        Map<String, Object> merged = mergePreferences(categorySystemPrefs, categoryOrgPrefs, categoryUserPrefs);
        
        logger.debug("Merged preferences for category={}: {}", category, merged);
        return merged;
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, key = "#userId + ':' + #category")
    public Map<String, Object> setPreferencesByCategory(String userId, String category, Map<String, Object> preferences) {
        logger.debug("Setting preferences for userId={}, category={}", userId, category);
        
        validateCategory(category);
        validatePreferences(category, preferences);
        
        UserPreferences userPreferences = userPreferencesV2Repository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPreferences newPrefs = new UserPreferences();
                    newPrefs.setUserId(userId);
                    newPrefs.setPreferences(new HashMap<>());
                    return newPrefs;
                });
        
        Map<String, Object> allPreferences = userPreferences.getPreferences();
        if (allPreferences == null) {
            allPreferences = new HashMap<>();
        }
        
        allPreferences.put(category, preferences);
        userPreferences.setPreferences(allPreferences);
        
        UserPreferences saved = userPreferencesV2Repository.save(userPreferences);
        
        logger.info("Preferences saved for userId={}, category={}", userId, category);
        
        return extractCategory(saved.getPreferences(), category);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, key = "#userId + ':' + #category")
    public Map<String, Object> resetPreferencesByCategory(String userId, String category) {
        logger.debug("Resetting preferences for userId={}, category={}", userId, category);
        
        validateCategory(category);
        
        Optional<UserPreferences> optionalPrefs = userPreferencesV2Repository.findByUserId(userId);
        if (optionalPrefs.isPresent()) {
            UserPreferences userPreferences = optionalPrefs.get();
            Map<String, Object> allPreferences = userPreferences.getPreferences();
            
            if (allPreferences != null) {
                allPreferences.remove(category);
                userPreferences.setPreferences(allPreferences);
                userPreferencesV2Repository.save(userPreferences);
            }
        }
        
        Map<String, Object> orgPrefs = getOrganizationPreferencesMap();
        Map<String, Object> systemPrefs = getSystemPreferencesMap();
        
        Map<String, Object> categoryOrgPrefs = extractCategory(orgPrefs, category);
        Map<String, Object> categorySystemPrefs = extractCategory(systemPrefs, category);
        
        Map<String, Object> merged = mergePreferences(categorySystemPrefs, categoryOrgPrefs, null);
        
        logger.info("Preferences reset for userId={}, category={}", userId, category);
        return merged;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "#userId + ':all'")
    public Map<String, Object> getAllPreferences(String userId) {
        logger.debug("Getting all preferences for userId={}", userId);
        
        Map<String, Object> userPrefs = getUserPreferencesMap(userId);
        Map<String, Object> orgPrefs = getOrganizationPreferencesMap();
        Map<String, Object> systemPrefs = getSystemPreferencesMap();
        
        Map<String, Object> result = new HashMap<>();
        
        for (String category : Arrays.asList(CATEGORY_UI, CATEGORY_NOTIFICATIONS, CATEGORY_FORMATS, CATEGORY_SHORTCUTS)) {
            Map<String, Object> categoryUserPrefs = extractCategory(userPrefs, category);
            Map<String, Object> categoryOrgPrefs = extractCategory(orgPrefs, category);
            Map<String, Object> categorySystemPrefs = extractCategory(systemPrefs, category);
            
            result.put(category, mergePreferences(categorySystemPrefs, categoryOrgPrefs, categoryUserPrefs));
        }
        
        return result;
    }

    private void validateCategory(String category) {
        if (!Arrays.asList(CATEGORY_UI, CATEGORY_NOTIFICATIONS, CATEGORY_FORMATS, CATEGORY_SHORTCUTS).contains(category)) {
            throw new IllegalArgumentException("Invalid category: " + category + ". Must be one of: ui, notifications, formats, shortcuts");
        }
    }

    private void validatePreferences(String category, Map<String, Object> preferences) {
        if (preferences == null) {
            throw new IllegalArgumentException("Preferences cannot be null");
        }
        
        JsonSchema schema = schemaCache.get(category);
        if (schema == null) {
            logger.warn("No schema found for category: {}", category);
            return;
        }
        
        try {
            String json = objectMapper.writeValueAsString(preferences);
            JsonNode jsonNode = objectMapper.readTree(json);
            Set<ValidationMessage> errors = schema.validate(jsonNode);
            
            if (!errors.isEmpty()) {
                String errorMessages = errors.stream()
                        .map(ValidationMessage::getMessage)
                        .collect(Collectors.joining(", "));
                throw new IllegalArgumentException("Validation failed for category " + category + ": " + errorMessages);
            }
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid JSON for category " + category + ": " + e.getMessage());
        }
    }

    private Map<String, Object> getUserPreferencesMap(String userId) {
        return userPreferencesV2Repository.findByUserId(userId)
                .map(UserPreferences::getPreferences)
                .orElse(new HashMap<>());
    }

    private Map<String, Object> getOrganizationPreferencesMap() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return new HashMap<>();
        }
        
        return organizationSettingsRepository.findByOrgId(orgId)
                .map(OrganizationSettings::getSettings)
                .map(settings -> {
                    Object preferencesObj = settings.get("preferences");
                    if (preferencesObj instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> preferencesMap = (Map<String, Object>) preferencesObj;
                        return preferencesMap;
                    }
                    return new HashMap<String, Object>();
                })
                .orElse(new HashMap<>());
    }

    private Map<String, Object> getSystemPreferencesMap() {
        return systemConfigRepository.findByKey("preferences.defaults")
                .map(config -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> map = objectMapper.readValue(config.getValue(), Map.class);
                        return map;
                    } catch (JsonProcessingException e) {
                        logger.error("Failed to parse system preferences", e);
                        return new HashMap<String, Object>();
                    }
                })
                .orElse(getDefaultSystemPreferences());
    }

    private Map<String, Object> getDefaultSystemPreferences() {
        Map<String, Object> defaults = new HashMap<>();
        
        Map<String, Object> ui = new HashMap<>();
        ui.put("theme", "light");
        ui.put("sidebarCollapsed", false);
        ui.put("density", "comfortable");
        defaults.put(CATEGORY_UI, ui);
        
        Map<String, Object> notifications = new HashMap<>();
        notifications.put("emailEnabled", true);
        notifications.put("pushEnabled", true);
        notifications.put("smsEnabled", false);
        defaults.put(CATEGORY_NOTIFICATIONS, notifications);
        
        Map<String, Object> formats = new HashMap<>();
        formats.put("locale", "fr");
        formats.put("dateFormat", "dd/MM/yyyy");
        formats.put("timeFormat", "HH:mm");
        formats.put("timezone", "Europe/Paris");
        formats.put("currency", "EUR");
        formats.put("numberFormat", "1 234,56");
        defaults.put(CATEGORY_FORMATS, formats);
        
        Map<String, Object> shortcuts = new HashMap<>();
        defaults.put(CATEGORY_SHORTCUTS, shortcuts);
        
        return defaults;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractCategory(Map<String, Object> preferences, String category) {
        if (preferences == null) {
            return new HashMap<>();
        }
        
        Object categoryObj = preferences.get(category);
        if (categoryObj instanceof Map) {
            return new HashMap<>((Map<String, Object>) categoryObj);
        }
        
        return new HashMap<>();
    }

    private Map<String, Object> mergePreferences(
            Map<String, Object> systemPrefs,
            Map<String, Object> orgPrefs,
            Map<String, Object> userPrefs) {
        
        Map<String, Object> result = new HashMap<>();
        
        if (systemPrefs != null) {
            result.putAll(deepCopy(systemPrefs));
        }
        
        if (orgPrefs != null) {
            deepMerge(result, orgPrefs);
        }
        
        if (userPrefs != null) {
            deepMerge(result, userPrefs);
        }
        
        return result;
    }

    @SuppressWarnings("unchecked")
    private void deepMerge(Map<String, Object> target, Map<String, Object> source) {
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = entry.getKey();
            Object sourceValue = entry.getValue();
            Object targetValue = target.get(key);
            
            if (sourceValue instanceof Map && targetValue instanceof Map) {
                deepMerge((Map<String, Object>) targetValue, (Map<String, Object>) sourceValue);
            } else {
                target.put(key, deepCopy(sourceValue));
            }
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T deepCopy(T obj) {
        if (obj == null) {
            return null;
        }
        
        if (obj instanceof Map) {
            Map<String, Object> original = (Map<String, Object>) obj;
            Map<String, Object> copy = new HashMap<>();
            for (Map.Entry<String, Object> entry : original.entrySet()) {
                copy.put(entry.getKey(), deepCopy(entry.getValue()));
            }
            return (T) copy;
        }
        
        if (obj instanceof List) {
            List<Object> original = (List<Object>) obj;
            List<Object> copy = new ArrayList<>();
            for (Object item : original) {
                copy.add(deepCopy(item));
            }
            return (T) copy;
        }
        
        return obj;
    }

    @Transactional(readOnly = true)
    public UserPreferencesDTO getUserPreferences(String userId) {
        String orgId = TenantContext.getOrgId();
        logger.debug("Fetching preferences for userId={}, orgId={}", userId, orgId);

        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> createDefaultPreferences(userId, orgId));

        return toDTO(entity);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public UserPreferencesDTO saveUserPreferences(String userId, UserPreferencesDTO dto) {
        String orgId = TenantContext.getOrgId();
        logger.debug("Saving preferences for userId={}, orgId={}", userId, orgId);

        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> {
                    UserPreferencesEntity newEntity = new UserPreferencesEntity();
                    newEntity.setUserId(userId);
                    newEntity.setOrgId(orgId);
                    return newEntity;
                });

        updateEntityFromDTO(entity, dto);
        UserPreferencesEntity saved = userPreferencesRepository.save(entity);
        logger.info("Preferences saved for userId={}, orgId={}", userId, orgId);

        return toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public UserPreferencesDTO updateDashboardLayout(String userId, Map<String, Object> layout) {
        String orgId = TenantContext.getOrgId();
        logger.debug("Updating dashboard layout for userId={}, orgId={}", userId, orgId);

        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> {
                    UserPreferencesEntity newEntity = new UserPreferencesEntity();
                    newEntity.setUserId(userId);
                    newEntity.setOrgId(orgId);
                    return newEntity;
                });

        entity.setDashboardLayout(layout);
        UserPreferencesEntity saved = userPreferencesRepository.save(entity);

        return toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public UserPreferencesDTO updateWidgetSettings(String userId, Map<String, Object> settings) {
        String orgId = TenantContext.getOrgId();
        logger.debug("Updating widget settings for userId={}, orgId={}", userId, orgId);

        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> {
                    UserPreferencesEntity newEntity = new UserPreferencesEntity();
                    newEntity.setUserId(userId);
                    newEntity.setOrgId(orgId);
                    return newEntity;
                });

        entity.setWidgetSettings(settings);
        UserPreferencesEntity saved = userPreferencesRepository.save(entity);

        return toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void deleteUserPreferences(String userId) {
        String orgId = TenantContext.getOrgId();
        logger.info("Deleting preferences for userId={}, orgId={}", userId, orgId);
        userPreferencesRepository.deleteByUserIdAndOrgId(userId, orgId);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public UserPreferencesDTO applyRoleTemplate(String userId, String roleTemplate) {
        String orgId = TenantContext.getOrgId();
        logger.debug("Applying role template '{}' for userId={}, orgId={}", roleTemplate, userId, orgId);

        Map<String, Object> templateLayout = getTemplateLayout(roleTemplate);

        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> {
                    UserPreferencesEntity newEntity = new UserPreferencesEntity();
                    newEntity.setUserId(userId);
                    newEntity.setOrgId(orgId);
                    return newEntity;
                });

        entity.setDashboardLayout(templateLayout);
        entity.setRoleTemplate(roleTemplate);
        UserPreferencesEntity saved = userPreferencesRepository.save(entity);

        return toDTO(saved);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public UserPreferencesDTO updateTourProgress(String userId, Map<String, Object> tourProgress) {
        String orgId = TenantContext.getOrgId();
        logger.debug("Updating tour progress for userId={}, orgId={}", userId, orgId);

        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> {
                    UserPreferencesEntity newEntity = new UserPreferencesEntity();
                    newEntity.setUserId(userId);
                    newEntity.setOrgId(orgId);
                    return newEntity;
                });

        entity.setTourProgress(tourProgress);
        UserPreferencesEntity saved = userPreferencesRepository.save(entity);

        return toDTO(saved);
    }

    private UserPreferencesEntity createDefaultPreferences(String userId, String orgId) {
        UserPreferencesEntity entity = new UserPreferencesEntity();
        entity.setUserId(userId);
        entity.setOrgId(orgId);
        entity.setTheme("light");
        entity.setLanguage("fr");
        entity.setDashboardLayout(new HashMap<>());
        entity.setWidgetSettings(new HashMap<>());
        entity.setGeneralPreferences(new HashMap<>());
        entity.setTourProgress(new HashMap<>());
        return entity;
    }

    private Map<String, Object> getTemplateLayout(String roleTemplate) {
        Map<String, Object> layout = new HashMap<>();

        switch (roleTemplate.toLowerCase()) {
            case "agent":
                layout.put("widgets", new Object[]{
                    createWidget("my-tasks", 0, 0, 6, 4),
                    createWidget("recent-dossiers", 6, 0, 6, 4),
                    createWidget("today-appointments", 0, 4, 6, 3),
                    createWidget("kpi-conversion", 6, 4, 3, 3),
                    createWidget("kpi-response-time", 9, 4, 3, 3)
                });
                break;

            case "manager":
                layout.put("widgets", new Object[]{
                    createWidget("kpi-team-performance", 0, 0, 4, 3),
                    createWidget("kpi-conversion-rate", 4, 0, 4, 3),
                    createWidget("kpi-revenue", 8, 0, 4, 3),
                    createWidget("team-activity", 0, 3, 6, 4),
                    createWidget("pipeline-chart", 6, 3, 6, 4),
                    createWidget("top-agents", 0, 7, 4, 3),
                    createWidget("recent-deals", 4, 7, 8, 3)
                });
                break;

            case "admin":
                layout.put("widgets", new Object[]{
                    createWidget("system-health", 0, 0, 6, 3),
                    createWidget("user-activity", 6, 0, 6, 3),
                    createWidget("kpi-overview", 0, 3, 12, 3),
                    createWidget("recent-users", 0, 6, 6, 4),
                    createWidget("audit-log", 6, 6, 6, 4)
                });
                break;

            default:
                layout.put("widgets", new Object[]{
                    createWidget("welcome", 0, 0, 12, 2),
                    createWidget("quick-stats", 0, 2, 12, 3)
                });
        }

        return layout;
    }

    private Map<String, Object> createWidget(String type, int x, int y, int cols, int rows) {
        Map<String, Object> widget = new HashMap<>();
        widget.put("type", type);
        widget.put("x", x);
        widget.put("y", y);
        widget.put("cols", cols);
        widget.put("rows", rows);
        return widget;
    }

    private UserPreferencesDTO toDTO(UserPreferencesEntity entity) {
        UserPreferencesDTO dto = new UserPreferencesDTO();
        dto.setUserId(entity.getUserId());
        dto.setDashboardLayout(entity.getDashboardLayout());
        dto.setWidgetSettings(entity.getWidgetSettings());
        dto.setGeneralPreferences(entity.getGeneralPreferences());
        dto.setTheme(entity.getTheme());
        dto.setLanguage(entity.getLanguage());
        dto.setRoleTemplate(entity.getRoleTemplate());
        dto.setTourProgress(entity.getTourProgress());
        return dto;
    }

    private void updateEntityFromDTO(UserPreferencesEntity entity, UserPreferencesDTO dto) {
        if (dto.getDashboardLayout() != null) {
            entity.setDashboardLayout(dto.getDashboardLayout());
        }
        if (dto.getWidgetSettings() != null) {
            entity.setWidgetSettings(dto.getWidgetSettings());
        }
        if (dto.getGeneralPreferences() != null) {
            entity.setGeneralPreferences(dto.getGeneralPreferences());
        }
        if (dto.getTheme() != null) {
            entity.setTheme(dto.getTheme());
        }
        if (dto.getLanguage() != null) {
            entity.setLanguage(dto.getLanguage());
        }
        if (dto.getRoleTemplate() != null) {
            entity.setRoleTemplate(dto.getRoleTemplate());
        }
        if (dto.getTourProgress() != null) {
            entity.setTourProgress(dto.getTourProgress());
        }
    }

    @Transactional(readOnly = true)
    public UserLocalePreferenceDto getUserLocalePreference() {
        String userId = TenantContext.getUserId();
        String orgId = TenantContext.getOrgId();
        
        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> createDefaultPreferences(userId, orgId));

        String locale = entity.getLanguage() != null ? entity.getLanguage() : "fr";
        return new UserLocalePreferenceDto(locale);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public UserLocalePreferenceDto saveUserLocalePreference(UserLocalePreferenceDto preferenceDto) {
        String userId = TenantContext.getUserId();
        String orgId = TenantContext.getOrgId();
        
        logger.debug("Saving locale preference for userId={}, orgId={}, locale={}", 
                     userId, orgId, preferenceDto.getLocale());

        UserPreferencesEntity entity = userPreferencesRepository
                .findByUserIdAndOrgId(userId, orgId)
                .orElseGet(() -> {
                    UserPreferencesEntity newEntity = new UserPreferencesEntity();
                    newEntity.setUserId(userId);
                    newEntity.setOrgId(orgId);
                    return newEntity;
                });

        entity.setLanguage(preferenceDto.getLocale());
        
        Map<String, Object> generalPrefs = entity.getGeneralPreferences();
        if (generalPrefs == null) {
            generalPrefs = new HashMap<>();
        }
        generalPrefs.put("dateFormat", preferenceDto.getDateFormat());
        generalPrefs.put("timeFormat", preferenceDto.getTimeFormat());
        generalPrefs.put("numberFormat", preferenceDto.getNumberFormat());
        generalPrefs.put("currency", preferenceDto.getCurrency());
        entity.setGeneralPreferences(generalPrefs);

        userPreferencesRepository.save(entity);
        logger.info("Locale preference saved for userId={}, orgId={}, locale={}", 
                    userId, orgId, preferenceDto.getLocale());

        return preferenceDto;
    }
}
