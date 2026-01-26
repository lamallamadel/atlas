package com.example.backend.service;

import com.example.backend.dto.UserPreferencesDTO;
import com.example.backend.entity.UserPreferencesEntity;
import com.example.backend.repository.UserPreferencesRepository;
import com.example.backend.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserPreferencesService {

    private static final Logger logger = LoggerFactory.getLogger(UserPreferencesService.class);

    private final UserPreferencesRepository userPreferencesRepository;

    public UserPreferencesService(UserPreferencesRepository userPreferencesRepository) {
        this.userPreferencesRepository = userPreferencesRepository;
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
    public void deleteUserPreferences(String userId) {
        String orgId = TenantContext.getOrgId();
        logger.info("Deleting preferences for userId={}, orgId={}", userId, orgId);
        userPreferencesRepository.deleteByUserIdAndOrgId(userId, orgId);
    }

    @Transactional
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
}
