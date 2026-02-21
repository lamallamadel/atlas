package com.example.backend.service;

import com.example.backend.entity.WhiteLabelConfigEntity;
import com.example.backend.repository.WhiteLabelConfigRepository;
import com.example.backend.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class DynamicThemeService {

    private static final Logger logger = LoggerFactory.getLogger(DynamicThemeService.class);
    private final WhiteLabelConfigRepository whiteLabelConfigRepository;

    public DynamicThemeService(WhiteLabelConfigRepository whiteLabelConfigRepository) {
        this.whiteLabelConfigRepository = whiteLabelConfigRepository;
    }

    @Cacheable(value = "tenantTheme", key = "#orgId")
    public Map<String, String> getTenantTheme(String orgId) {
        logger.debug("Loading theme for orgId={}", orgId);
        
        Optional<WhiteLabelConfigEntity> config = whiteLabelConfigRepository.findByOrgId(orgId);
        
        if (config.isPresent()) {
            return buildThemeFromConfig(config.get());
        } else {
            return getDefaultTheme();
        }
    }

    public Map<String, String> getCurrentTenantTheme() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            return getDefaultTheme();
        }
        return getTenantTheme(orgId);
    }

    private Map<String, String> buildThemeFromConfig(WhiteLabelConfigEntity config) {
        Map<String, String> theme = new HashMap<>();
        
        theme.put("--primary-color", config.getPrimaryColor() != null ? config.getPrimaryColor() : "#1976d2");
        theme.put("--secondary-color", config.getSecondaryColor() != null ? config.getSecondaryColor() : "#424242");
        theme.put("--accent-color", config.getAccentColor() != null ? config.getAccentColor() : "#ff4081");
        
        theme.put("--logo-url", config.getLogoUrl() != null ? config.getLogoUrl() : "");
        theme.put("--logo-url-dark", config.getLogoUrlDark() != null ? config.getLogoUrlDark() : "");
        theme.put("--favicon-url", config.getFaviconUrl() != null ? config.getFaviconUrl() : "");
        
        if (config.getCustomCss() != null && !config.getCustomCss().isBlank()) {
            theme.put("custom-css", config.getCustomCss());
        }
        
        return theme;
    }

    private Map<String, String> getDefaultTheme() {
        Map<String, String> theme = new HashMap<>();
        theme.put("--primary-color", "#1976d2");
        theme.put("--secondary-color", "#424242");
        theme.put("--accent-color", "#ff4081");
        theme.put("--logo-url", "");
        theme.put("--logo-url-dark", "");
        theme.put("--favicon-url", "");
        return theme;
    }

    public String generateCssProperties(Map<String, String> theme) {
        StringBuilder css = new StringBuilder();
        css.append(":root {\n");
        
        for (Map.Entry<String, String> entry : theme.entrySet()) {
            if (!entry.getKey().equals("custom-css") && entry.getKey().startsWith("--")) {
                css.append("  ").append(entry.getKey()).append(": ").append(entry.getValue()).append(";\n");
            }
        }
        
        css.append("}\n");
        
        if (theme.containsKey("custom-css")) {
            css.append("\n").append(theme.get("custom-css"));
        }
        
        return css.toString();
    }
}
