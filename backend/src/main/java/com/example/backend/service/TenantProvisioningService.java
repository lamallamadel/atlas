package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.repository.*;
import com.example.backend.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TenantProvisioningService {

    private static final Logger logger = LoggerFactory.getLogger(TenantProvisioningService.class);

    private final TenantProvisioningRepository provisioningRepository;
    private final WhiteLabelConfigRepository whiteLabelConfigRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final ReferentialRepository referentialRepository;
    private final TenantOnboardingRepository onboardingRepository;
    private final FeatureFlagRepository featureFlagRepository;
    private final DossierRepository dossierRepository;
    private final PartiePrenanteRepository partiePrenanteRepository;

    public TenantProvisioningService(
            TenantProvisioningRepository provisioningRepository,
            WhiteLabelConfigRepository whiteLabelConfigRepository,
            OrganizationSettingsRepository organizationSettingsRepository,
            ReferentialRepository referentialRepository,
            TenantOnboardingRepository onboardingRepository,
            FeatureFlagRepository featureFlagRepository,
            DossierRepository dossierRepository,
            PartiePrenanteRepository partiePrenanteRepository) {
        this.provisioningRepository = provisioningRepository;
        this.whiteLabelConfigRepository = whiteLabelConfigRepository;
        this.organizationSettingsRepository = organizationSettingsRepository;
        this.referentialRepository = referentialRepository;
        this.onboardingRepository = onboardingRepository;
        this.featureFlagRepository = featureFlagRepository;
        this.dossierRepository = dossierRepository;
        this.partiePrenanteRepository = partiePrenanteRepository;
    }

    @Transactional
    public TenantProvisioningEntity initiateTenantProvisioning(
            String orgId,
            String companyName,
            String adminUserEmail,
            String adminUserName,
            String planTier,
            boolean includeSampleData) {

        logger.info("Initiating tenant provisioning for orgId={}, company={}", orgId, companyName);

        TenantProvisioningEntity provisioning = new TenantProvisioningEntity();
        provisioning.setOrgId(orgId);
        provisioning.setCompanyName(companyName);
        provisioning.setAdminUserEmail(adminUserEmail);
        provisioning.setAdminUserName(adminUserName);
        provisioning.setPlanTier(planTier);
        provisioning.setIncludeSampleData(includeSampleData);
        provisioning.setStatus("pending");
        provisioning.setProgressPercent(0);

        return provisioningRepository.save(provisioning);
    }

    @Transactional
    public void provisionTenant(String orgId) {
        logger.info("Starting tenant provisioning for orgId={}", orgId);

        TenantProvisioningEntity provisioning = provisioningRepository.findByOrgId(orgId)
                .orElseThrow(() -> new IllegalStateException("Provisioning record not found for orgId: " + orgId));

        try {
            provisioning.setStatus("in_progress");
            provisioning.setProvisioningStartedAt(LocalDateTime.now());
            provisioningRepository.save(provisioning);

            updateProvisioningProgress(provisioning, "Creating database schema", 10);
            
            updateProvisioningProgress(provisioning, "Initializing default referentials", 25);
            initializeDefaultReferentials(orgId);

            updateProvisioningProgress(provisioning, "Creating default branding configuration", 40);
            createDefaultBranding(orgId, provisioning.getCompanyName());

            updateProvisioningProgress(provisioning, "Setting up organization settings", 55);
            createDefaultOrganizationSettings(orgId, provisioning.getPlanTier());

            updateProvisioningProgress(provisioning, "Initializing feature flags", 70);
            initializeFeatureFlags(orgId, provisioning.getPlanTier());

            if (provisioning.getIncludeSampleData()) {
                updateProvisioningProgress(provisioning, "Generating sample data", 85);
                generateSampleData(orgId);
                provisioning.setSampleDataGenerated(true);
            }

            updateProvisioningProgress(provisioning, "Finalizing provisioning", 95);
            
            provisioning.setStatus("completed");
            provisioning.setProgressPercent(100);
            provisioning.setProvisioningCompletedAt(LocalDateTime.now());
            provisioningRepository.save(provisioning);

            logger.info("Tenant provisioning completed successfully for orgId={}", orgId);

        } catch (Exception e) {
            logger.error("Tenant provisioning failed for orgId={}", orgId, e);
            provisioning.setStatus("failed");
            provisioning.setErrorMessage(e.getMessage());
            provisioningRepository.save(provisioning);
            throw new RuntimeException("Tenant provisioning failed", e);
        }
    }

    private void updateProvisioningProgress(TenantProvisioningEntity provisioning, String step, int progressPercent) {
        provisioning.setProvisioningStep(step);
        provisioning.setProgressPercent(progressPercent);
        provisioningRepository.save(provisioning);
        logger.info("Provisioning progress: {}% - {}", progressPercent, step);
    }

    private void initializeDefaultReferentials(String orgId) {
        String originalOrgId = TenantContext.getOrgId();
        try {
            TenantContext.setOrgId(orgId);

            List<ReferentialEntity> defaultReferentials = Arrays.asList(
                createReferential(orgId, "DOSSIER_STATUS", "NEW", "Nouveau", "New dossier", 1),
                createReferential(orgId, "DOSSIER_STATUS", "IN_PROGRESS", "En cours", "In progress", 2),
                createReferential(orgId, "DOSSIER_STATUS", "CLOSED", "Clôturé", "Closed", 3),
                createReferential(orgId, "LEAD_SOURCE", "WEBSITE", "Site Web", "Website", 1),
                createReferential(orgId, "LEAD_SOURCE", "REFERRAL", "Recommandation", "Referral", 2),
                createReferential(orgId, "LEAD_SOURCE", "PHONE", "Téléphone", "Phone", 3)
            );

            referentialRepository.saveAll(defaultReferentials);
            logger.info("Default referentials initialized for orgId={}", orgId);
        } finally {
            TenantContext.setOrgId(originalOrgId);
        }
    }

    private ReferentialEntity createReferential(String orgId, String entityType, String code, 
                                                 String labelFr, String labelEn, int sortOrder) {
        ReferentialEntity ref = new ReferentialEntity();
        ref.setOrgId(orgId);
        ref.setCategory(entityType);
        ref.setCode(code);
        ref.setLabel(labelFr);
        ref.setDescription(labelEn);
        ref.setDisplayOrder(sortOrder);
        ref.setIsActive(true);
        return ref;
    }

    private void createDefaultBranding(String orgId, String companyName) {
        WhiteLabelConfigEntity branding = new WhiteLabelConfigEntity();
        branding.setOrgId(orgId);
        branding.setPrimaryColor("#1976d2");
        branding.setSecondaryColor("#424242");
        branding.setAccentColor("#ff4081");
        branding.setEmailFromName(companyName);
        branding.setFeatures(new HashMap<>());
        whiteLabelConfigRepository.save(branding);
        logger.info("Default branding created for orgId={}", orgId);
    }

    private void createDefaultOrganizationSettings(String orgId, String planTier) {
        if (organizationSettingsRepository.findByOrgId(orgId).isEmpty()) {
            OrganizationSettings settings = new OrganizationSettings();
            settings.setOrgId(orgId);
            settings.setSettings(createDefaultSettings(planTier));
            organizationSettingsRepository.save(settings);
            logger.info("Default organization settings created for orgId={}", orgId);
        }
    }

    private Map<String, Object> createDefaultSettings(String planTier) {
        Map<String, Object> settings = new HashMap<>();
        Map<String, Object> quotas = new HashMap<>();
        
        switch (planTier.toLowerCase()) {
            case "starter":
                quotas.put("maxUsers", 5);
                quotas.put("maxDossiers", 100);
                quotas.put("storageGb", 10);
                break;
            case "professional":
                quotas.put("maxUsers", 20);
                quotas.put("maxDossiers", 1000);
                quotas.put("storageGb", 50);
                break;
            case "enterprise":
                quotas.put("maxUsers", -1);
                quotas.put("maxDossiers", -1);
                quotas.put("storageGb", 500);
                break;
        }
        
        settings.put("quotas", quotas);
        return settings;
    }

    private void initializeFeatureFlags(String orgId, String planTier) {
        List<FeatureFlagEntity> features = new ArrayList<>();
        
        features.add(createFeatureFlag(orgId, "whatsapp_integration", "WhatsApp Integration", 
            "Send and receive WhatsApp messages", "professional,enterprise"));
        features.add(createFeatureFlag(orgId, "advanced_analytics", "Advanced Analytics", 
            "Access to advanced analytics and reports", "enterprise"));
        features.add(createFeatureFlag(orgId, "custom_branding", "Custom Branding", 
            "Customize logo, colors, and branding", "professional,enterprise"));
        features.add(createFeatureFlag(orgId, "api_access", "API Access", 
            "Programmatic API access", "professional,enterprise"));
        features.add(createFeatureFlag(orgId, "workflow_automation", "Workflow Automation", 
            "Automated workflow engine", "professional,enterprise"));

        for (FeatureFlagEntity feature : features) {
            if (feature.getAvailableInPlans().contains(planTier.toLowerCase())) {
                feature.setEnabled(true);
            }
        }

        featureFlagRepository.saveAll(features);
        logger.info("Feature flags initialized for orgId={} with plan={}", orgId, planTier);
    }

    private FeatureFlagEntity createFeatureFlag(String orgId, String key, String name, 
                                                 String description, String availablePlans) {
        FeatureFlagEntity flag = new FeatureFlagEntity();
        flag.setOrgId(orgId);
        flag.setFeatureKey(key);
        flag.setFeatureName(name);
        flag.setFeatureDescription(description);
        flag.setAvailableInPlans(availablePlans);
        flag.setEnabled(false);
        return flag;
    }

    private void generateSampleData(String orgId) {
        String originalOrgId = TenantContext.getOrgId();
        try {
            TenantContext.setOrgId(orgId);
            
            logger.info("Sample data generation would occur here for orgId={}", orgId);

        } finally {
            TenantContext.setOrgId(originalOrgId);
        }
    }

    public Optional<TenantProvisioningEntity> getProvisioningStatus(String orgId) {
        return provisioningRepository.findByOrgId(orgId);
    }
}
