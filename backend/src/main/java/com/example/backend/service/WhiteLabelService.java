package com.example.backend.service;

import com.example.backend.entity.WhiteLabelConfigEntity;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.WhiteLabelConfigRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhiteLabelService {

    private static final Logger logger = LoggerFactory.getLogger(WhiteLabelService.class);
    private final WhiteLabelConfigRepository repository;

    public WhiteLabelService(WhiteLabelConfigRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "whiteLabelConfig", key = "#orgId")
    public WhiteLabelConfigEntity getConfig(String orgId) {
        return repository
                .findByOrgId(orgId)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "White-label config not found for orgId: " + orgId));
    }

    @Transactional(readOnly = true)
    public WhiteLabelConfigEntity getConfigByDomain(String domain) {
        return repository
                .findByCustomDomain(domain)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "White-label config not found for domain: " + domain));
    }

    @Transactional
    @CacheEvict(value = "whiteLabelConfig", key = "#orgId")
    public WhiteLabelConfigEntity createOrUpdate(String orgId, WhiteLabelConfigEntity config) {
        WhiteLabelConfigEntity existing = repository.findByOrgId(orgId).orElse(null);

        if (existing != null) {
            updateExistingConfig(existing, config);
            return repository.save(existing);
        } else {
            config.setOrgId(orgId);
            if (config.getFeatures() == null) {
                config.setFeatures(new HashMap<>());
            }
            return repository.save(config);
        }
    }

    private void updateExistingConfig(
            WhiteLabelConfigEntity existing, WhiteLabelConfigEntity updated) {
        if (updated.getLogoUrl() != null) {
            existing.setLogoUrl(updated.getLogoUrl());
        }
        if (updated.getLogoUrlDark() != null) {
            existing.setLogoUrlDark(updated.getLogoUrlDark());
        }
        if (updated.getFaviconUrl() != null) {
            existing.setFaviconUrl(updated.getFaviconUrl());
        }
        if (updated.getPrimaryColor() != null) {
            existing.setPrimaryColor(updated.getPrimaryColor());
        }
        if (updated.getSecondaryColor() != null) {
            existing.setSecondaryColor(updated.getSecondaryColor());
        }
        if (updated.getAccentColor() != null) {
            existing.setAccentColor(updated.getAccentColor());
        }
        if (updated.getCustomCss() != null) {
            existing.setCustomCss(updated.getCustomCss());
        }
        if (updated.getCustomDomain() != null) {
            existing.setCustomDomain(updated.getCustomDomain());
        }
        if (updated.getEmailFromName() != null) {
            existing.setEmailFromName(updated.getEmailFromName());
        }
        if (updated.getEmailFromAddress() != null) {
            existing.setEmailFromAddress(updated.getEmailFromAddress());
        }
        if (updated.getEmailFooterHtml() != null) {
            existing.setEmailFooterHtml(updated.getEmailFooterHtml());
        }
        if (updated.getFeatures() != null) {
            existing.setFeatures(updated.getFeatures());
        }
    }

    @Transactional
    @CacheEvict(value = "whiteLabelConfig", key = "#orgId")
    public void updateSslCertificate(
            String orgId, String status, LocalDateTime issuedAt, LocalDateTime expiresAt) {
        WhiteLabelConfigEntity config = getConfig(orgId);
        config.setSslCertificateStatus(status);
        config.setSslCertificateIssuedAt(issuedAt);
        config.setSslCertificateExpiresAt(expiresAt);
        repository.save(config);
        logger.info("SSL certificate updated for orgId={}, status={}", orgId, status);
    }

    @Transactional
    @CacheEvict(value = "whiteLabelConfig", key = "#orgId")
    public void updateFeatureFlags(String orgId, Map<String, Object> features) {
        WhiteLabelConfigEntity config = getConfig(orgId);
        config.setFeatures(features);
        repository.save(config);
        logger.info("Feature flags updated for orgId={}", orgId);
    }
}
