package com.example.backend.service;

import com.example.backend.entity.TemplateVariable;
import com.example.backend.entity.WhatsAppTemplate;
import com.example.backend.entity.WhatsAppTemplateVersion;
import com.example.backend.entity.enums.TemplateCategory;
import com.example.backend.entity.enums.TemplateStatus;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.TemplateVariableRepository;
import com.example.backend.repository.WhatsAppTemplateRepository;
import com.example.backend.repository.WhatsAppTemplateVersionRepository;
import com.example.backend.util.TemplateVariableValidator;
import com.example.backend.util.TenantContext;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppTemplateService.class);

    private final WhatsAppTemplateRepository templateRepository;
    private final TemplateVariableRepository variableRepository;
    private final WhatsAppTemplateVersionRepository versionRepository;
    private final WhatsAppTemplateValidationService validationService;
    private final MetaBusinessApiService metaBusinessApiService;

    public WhatsAppTemplateService(
            WhatsAppTemplateRepository templateRepository,
            TemplateVariableRepository variableRepository,
            WhatsAppTemplateVersionRepository versionRepository,
            WhatsAppTemplateValidationService validationService,
            MetaBusinessApiService metaBusinessApiService) {
        this.templateRepository = templateRepository;
        this.variableRepository = variableRepository;
        this.versionRepository = versionRepository;
        this.validationService = validationService;
        this.metaBusinessApiService = metaBusinessApiService;
    }

    @Transactional(readOnly = true)
    public List<WhatsAppTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<WhatsAppTemplate> getTemplatesByStatus(TemplateStatus status) {
        return templateRepository.findByStatusOrderByNameAsc(status);
    }

    @Transactional(readOnly = true)
    public WhatsAppTemplate getTemplateById(Long id) {
        return templateRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Template not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public WhatsAppTemplate getTemplateByNameAndLanguage(String name, String language) {
        return templateRepository
                .findByNameAndLanguage(name, language)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        String.format(
                                                "Template not found with name: %s and language: %s",
                                                name, language)));
    }

    @Transactional(readOnly = true)
    public WhatsAppTemplate getLocalizedTemplate(String templateName, String locale) {
        if (templateName == null || templateName.trim().isEmpty()) {
            throw new IllegalArgumentException("Template name cannot be null or empty");
        }

        final String effectiveLocale =
                (locale == null || locale.trim().isEmpty()) ? "fr_FR" : locale;
        String language = localeToLanguageCode(effectiveLocale);

        return templateRepository
                .findByNameAndLanguage(templateName, language)
                .or(
                        () -> {
                            logger.debug(
                                    "Template '{}' not found for locale '{}', falling back to French",
                                    templateName,
                                    effectiveLocale);
                            return templateRepository.findByNameAndLanguage(templateName, "fr_FR");
                        })
                .or(
                        () -> {
                            logger.debug(
                                    "Template '{}' not found for French, falling back to English",
                                    templateName);
                            return templateRepository.findByNameAndLanguage(templateName, "en_US");
                        })
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        String.format(
                                                "Template not found with name: %s for locale: %s or fallback languages",
                                                templateName, effectiveLocale)));
    }

    private String localeToLanguageCode(String locale) {
        if (locale == null) {
            return "fr_FR";
        }
        return switch (locale.toLowerCase()) {
            case "fr_fr", "fr_be", "fr_ch", "fr_ca" -> "fr_FR";
            case "en_us", "en_gb", "en_ca", "en_au" -> "en_US";
            case "ar_ma", "ar_sa", "ar_ae", "ar_eg" -> "ar_MA";
            case "es_es", "es_mx" -> "es_ES";
            case "de_de", "de_at", "de_ch" -> "de_DE";
            default -> locale;
        };
    }

    @Transactional
    public WhatsAppTemplate createTemplate(WhatsAppTemplate template) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        validationService.validateTemplateFormat(template);

        if (templateRepository.existsByNameAndLanguage(
                template.getName(), template.getLanguage())) {
            throw new IllegalArgumentException(
                    String.format(
                            "Template already exists with name: %s and language: %s",
                            template.getName(), template.getLanguage()));
        }

        template.setOrgId(orgId);
        if (template.getStatus() == null) {
            template.setStatus(TemplateStatus.DRAFT);
        }

        WhatsAppTemplate savedTemplate = templateRepository.save(template);

        if (template.getVariables() != null && !template.getVariables().isEmpty()) {
            for (TemplateVariable variable : template.getVariables()) {
                variable.setOrgId(orgId);
                variable.setTemplate(savedTemplate);
            }
            variableRepository.saveAll(template.getVariables());
        }

        return savedTemplate;
    }

    @Transactional
    public WhatsAppTemplate updateTemplate(Long id, WhatsAppTemplate updatedTemplate) {
        WhatsAppTemplate existing = getTemplateById(id);

        validationService.validateTemplateFormat(updatedTemplate);

        existing.setName(updatedTemplate.getName());
        existing.setLanguage(updatedTemplate.getLanguage());
        existing.setCategory(updatedTemplate.getCategory());
        existing.setComponents(updatedTemplate.getComponents());
        existing.setDescription(updatedTemplate.getDescription());

        WhatsAppTemplate savedTemplate = templateRepository.save(existing);

        variableRepository.deleteByTemplateId(id);

        if (updatedTemplate.getVariables() != null && !updatedTemplate.getVariables().isEmpty()) {
            String orgId = TenantContext.getOrgId();
            for (TemplateVariable variable : updatedTemplate.getVariables()) {
                variable.setOrgId(orgId);
                variable.setTemplate(savedTemplate);
            }
            variableRepository.saveAll(updatedTemplate.getVariables());
        }

        return savedTemplate;
    }

    @Transactional
    public WhatsAppTemplate activateTemplate(Long id) {
        WhatsAppTemplate template = getTemplateById(id);

        validationService.validateTemplateFormat(template);

        template.setStatus(TemplateStatus.ACTIVE);
        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate deactivateTemplate(Long id) {
        WhatsAppTemplate template = getTemplateById(id);
        template.setStatus(TemplateStatus.INACTIVE);
        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate submitForApproval(Long id) {
        WhatsAppTemplate template = getTemplateById(id);

        validationService.validateTemplateFormat(template);

        String submissionId = metaBusinessApiService.submitTemplateForApproval(template);
        template.setMetaSubmissionId(submissionId);
        template.setStatus(TemplateStatus.PENDING);

        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate approveTemplate(Long id, String whatsAppTemplateId) {
        WhatsAppTemplate template = getTemplateById(id);

        if (template.getStatus() != TemplateStatus.PENDING
                && template.getStatus() != TemplateStatus.APPROVED) {
            throw new IllegalStateException("Template must be in PENDING status to be approved");
        }

        template.setStatus(TemplateStatus.APPROVED);
        template.setWhatsAppTemplateId(whatsAppTemplateId);
        template.setRejectionReason(null);
        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate rejectTemplate(Long id, String rejectionReason) {
        WhatsAppTemplate template = getTemplateById(id);

        if (template.getStatus() != TemplateStatus.PENDING) {
            throw new IllegalStateException("Template must be in PENDING status to be rejected");
        }

        template.setStatus(TemplateStatus.REJECTED);
        template.setRejectionReason(rejectionReason);
        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate pauseTemplate(Long id) {
        WhatsAppTemplate template = getTemplateById(id);

        if (template.getStatus() != TemplateStatus.APPROVED
                && template.getStatus() != TemplateStatus.ACTIVE) {
            throw new IllegalStateException("Only approved or active templates can be paused");
        }

        template.setStatus(TemplateStatus.PAUSED);
        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate pollApprovalStatus(Long id) {
        WhatsAppTemplate template = getTemplateById(id);

        if (template.getMetaSubmissionId() == null) {
            throw new IllegalStateException("Template has not been submitted for approval");
        }

        MetaBusinessApiService.TemplateApprovalStatus status =
                metaBusinessApiService.pollApprovalStatus(template.getMetaSubmissionId());

        template.setStatus(status.getStatus());
        if (status.getWhatsappTemplateId() != null) {
            template.setWhatsAppTemplateId(status.getWhatsappTemplateId());
        }
        if (status.getRejectionReason() != null) {
            template.setRejectionReason(status.getRejectionReason());
        }

        return templateRepository.save(template);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        WhatsAppTemplate template = getTemplateById(id);

        if (template.getStatus() == TemplateStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Cannot delete an active template. Please deactivate it first.");
        }

        templateRepository.delete(template);
    }

    @Transactional(readOnly = true)
    public List<TemplateVariable> getTemplateVariables(Long templateId) {
        getTemplateById(templateId);
        return variableRepository.findByTemplateIdOrderByPositionAsc(templateId);
    }

    @Transactional(readOnly = true)
    public List<WhatsAppTemplate> getActiveTemplates() {
        return templateRepository.findByStatusOrderByNameAsc(TemplateStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public boolean templateExists(String name, String language) {
        return templateRepository.existsByNameAndLanguage(name, language);
    }

    @Transactional(readOnly = true)
    public List<WhatsAppTemplate> searchTemplates(
            TemplateCategory category, TemplateStatus status, String language, String searchTerm) {
        return templateRepository.searchTemplates(category, status, language, searchTerm);
    }

    @Transactional
    public WhatsAppTemplate createNewVersion(Long templateId, String changeSummary) {
        WhatsAppTemplate template = getTemplateById(templateId);
        String orgId = TenantContext.getOrgId();

        WhatsAppTemplateVersion newVersion = new WhatsAppTemplateVersion();
        newVersion.setOrgId(orgId);
        newVersion.setTemplate(template);
        newVersion.setVersionNumber(template.getCurrentVersion() + 1);
        newVersion.setComponents(template.getComponents());
        newVersion.setDescription(template.getDescription());
        newVersion.setChangeSummary(changeSummary);
        newVersion.setIsActive(false);

        List<Map<String, Object>> variablesSnapshot = new ArrayList<>();
        for (TemplateVariable var : template.getVariables()) {
            Map<String, Object> varMap = new HashMap<>();
            varMap.put("variableName", var.getVariableName());
            varMap.put("componentType", var.getComponentType().toString());
            varMap.put("position", var.getPosition());
            varMap.put("exampleValue", var.getExampleValue());
            varMap.put("description", var.getDescription());
            varMap.put("isRequired", var.getIsRequired());
            variablesSnapshot.add(varMap);
        }
        newVersion.setVariablesSnapshot(variablesSnapshot);

        versionRepository.save(newVersion);

        template.setCurrentVersion(template.getCurrentVersion() + 1);
        return templateRepository.save(template);
    }

    @Transactional(readOnly = true)
    public List<WhatsAppTemplateVersion> getTemplateVersions(Long templateId) {
        getTemplateById(templateId);
        return versionRepository.findByTemplateIdOrderByVersionNumberDesc(templateId);
    }

    @Transactional(readOnly = true)
    public WhatsAppTemplateVersion getTemplateVersion(Long templateId, Integer versionNumber) {
        return versionRepository
                .findByTemplateIdAndVersionNumber(templateId, versionNumber)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        String.format(
                                                "Version %d not found for template %d",
                                                versionNumber, templateId)));
    }

    @Transactional
    public WhatsAppTemplate activateVersion(Long templateId, Integer versionNumber) {
        WhatsAppTemplate template = getTemplateById(templateId);
        WhatsAppTemplateVersion version = getTemplateVersion(templateId, versionNumber);

        versionRepository
                .findActiveVersionByTemplateId(templateId)
                .ifPresent(
                        activeVersion -> {
                            activeVersion.setIsActive(false);
                            versionRepository.save(activeVersion);
                        });

        template.setComponents(version.getComponents());
        template.setDescription(version.getDescription());
        template.setCurrentVersion(versionNumber);

        variableRepository.deleteByTemplateId(templateId);

        if (version.getVariablesSnapshot() != null) {
            String orgId = TenantContext.getOrgId();
            for (Map<String, Object> varMap : version.getVariablesSnapshot()) {
                TemplateVariable variable = new TemplateVariable();
                variable.setOrgId(orgId);
                variable.setTemplate(template);
                variable.setVariableName((String) varMap.get("variableName"));
                variable.setComponentType(
                        com.example.backend.entity.enums.ComponentType.valueOf(
                                (String) varMap.get("componentType")));
                variable.setPosition((Integer) varMap.get("position"));
                variable.setExampleValue((String) varMap.get("exampleValue"));
                variable.setDescription((String) varMap.get("description"));
                variable.setIsRequired((Boolean) varMap.get("isRequired"));
                variableRepository.save(variable);
            }
        }

        version.setIsActive(true);
        versionRepository.save(version);

        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate submitTemplateToMeta(Long id) {
        WhatsAppTemplate template = getTemplateById(id);

        validationService.validateTemplateFormat(template);

        TemplateVariableValidator.ValidationResult validationResult =
                TemplateVariableValidator.validateMetaNaming(template.getComponents());

        if (!validationResult.isValid()) {
            throw new IllegalArgumentException(
                    "Template validation failed: "
                            + String.join(", ", validationResult.getErrors()));
        }

        String submissionId =
                metaBusinessApiService.submitTemplate(
                        template.getName(),
                        template.getLanguage(),
                        template.getCategory().getValue(),
                        template.getComponents());

        template.setMetaSubmissionId(submissionId);
        template.setStatus(TemplateStatus.PENDING);

        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate updateTemplateStatus(
            String messageTemplateId, TemplateStatus status, String rejectionReason) {
        WhatsAppTemplate template =
                templateRepository
                        .findByWhatsAppTemplateId(messageTemplateId)
                        .or(() -> templateRepository.findByMetaSubmissionId(messageTemplateId))
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Template not found with ID: "
                                                        + messageTemplateId));

        template.setStatus(status);

        if (status == TemplateStatus.APPROVED) {
            template.setWhatsAppTemplateId(messageTemplateId);
            template.setRejectionReason(null);
        } else if (status == TemplateStatus.REJECTED) {
            template.setRejectionReason(rejectionReason);
        }

        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate updateTemplateStatusByNameAndLanguage(
            String name,
            String language,
            TemplateStatus status,
            String messageTemplateId,
            String rejectionReason) {
        WhatsAppTemplate template =
                templateRepository
                        .findByNameAndLanguage(name, language)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                String.format(
                                                        "Template not found with name: %s and language: %s",
                                                        name, language)));

        template.setStatus(status);

        if (status == TemplateStatus.APPROVED) {
            template.setWhatsAppTemplateId(messageTemplateId);
            template.setRejectionReason(null);
        } else if (status == TemplateStatus.REJECTED) {
            template.setRejectionReason(rejectionReason);
        }

        return templateRepository.save(template);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> previewTemplate(Long id, Map<String, String> variables) {
        WhatsAppTemplate template = getTemplateById(id);
        return renderTemplateWithVariables(template.getComponents(), variables);
    }

    private List<Map<String, Object>> renderTemplateWithVariables(
            List<Map<String, Object>> components, Map<String, String> variables) {
        if (components == null) {
            return null;
        }

        List<Map<String, Object>> renderedComponents = new ArrayList<>();

        for (Map<String, Object> component : components) {
            Map<String, Object> renderedComponent = new HashMap<>(component);
            String type = (String) component.get("type");

            if (type != null) {
                switch (type.toUpperCase()) {
                    case "HEADER":
                        String format = (String) component.get("format");
                        if ("TEXT".equalsIgnoreCase(format)) {
                            String text = (String) component.get("text");
                            if (text != null) {
                                renderedComponent.put("text", replaceVariables(text, variables));
                            }
                        }
                        break;

                    case "BODY":
                        String bodyText = (String) component.get("text");
                        if (bodyText != null) {
                            renderedComponent.put("text", replaceVariables(bodyText, variables));
                        }
                        break;

                    case "BUTTONS":
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> buttons =
                                (List<Map<String, Object>>) component.get("buttons");
                        if (buttons != null) {
                            List<Map<String, Object>> renderedButtons = new ArrayList<>();
                            for (Map<String, Object> button : buttons) {
                                Map<String, Object> renderedButton = new HashMap<>(button);
                                String buttonType = (String) button.get("type");
                                if ("URL".equalsIgnoreCase(buttonType)) {
                                    String url = (String) button.get("url");
                                    if (url != null) {
                                        renderedButton.put("url", replaceVariables(url, variables));
                                    }
                                }
                                renderedButtons.add(renderedButton);
                            }
                            renderedComponent.put("buttons", renderedButtons);
                        }
                        break;
                }
            }

            renderedComponents.add(renderedComponent);
        }

        return renderedComponents;
    }

    private String replaceVariables(String text, Map<String, String> variables) {
        if (text == null || variables == null || variables.isEmpty()) {
            return text;
        }

        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }

        return result;
    }

    @Transactional
    public WhatsAppTemplate submitTemplateTranslation(
            Long templateId,
            String languageCode,
            List<Map<String, Object>> components,
            String description,
            Boolean setRtlDirection) {

        WhatsAppTemplate originalTemplate = getTemplateById(templateId);
        String orgId = TenantContext.getOrgId();

        if (templateRepository.existsByNameAndLanguage(originalTemplate.getName(), languageCode)) {
            throw new IllegalArgumentException(
                    String.format(
                            "Translation already exists for template '%s' with language: %s",
                            originalTemplate.getName(), languageCode));
        }

        if (components == null || components.isEmpty()) {
            throw new IllegalArgumentException("Template components cannot be null or empty");
        }

        boolean shouldSetRtl =
                (setRtlDirection != null && setRtlDirection) || isRtlLanguage(languageCode);

        String submissionId =
                metaBusinessApiService.submitTemplateTranslation(
                        originalTemplate.getName(),
                        languageCode,
                        originalTemplate.getCategory().getValue(),
                        components,
                        shouldSetRtl);

        WhatsAppTemplate translationTemplate = new WhatsAppTemplate();
        translationTemplate.setOrgId(orgId);
        translationTemplate.setName(originalTemplate.getName());
        translationTemplate.setLanguage(languageCode);
        translationTemplate.setCategory(originalTemplate.getCategory());
        translationTemplate.setComponents(components);
        translationTemplate.setDescription(
                description != null ? description : originalTemplate.getDescription());
        translationTemplate.setStatus(TemplateStatus.PENDING);
        translationTemplate.setMetaSubmissionId(submissionId);

        WhatsAppTemplate savedTemplate = templateRepository.save(translationTemplate);

        if (originalTemplate.getVariables() != null && !originalTemplate.getVariables().isEmpty()) {
            for (TemplateVariable variable : originalTemplate.getVariables()) {
                TemplateVariable translatedVar = new TemplateVariable();
                translatedVar.setOrgId(orgId);
                translatedVar.setTemplate(savedTemplate);
                translatedVar.setVariableName(variable.getVariableName());
                translatedVar.setComponentType(variable.getComponentType());
                translatedVar.setPosition(variable.getPosition());
                translatedVar.setExampleValue(variable.getExampleValue());
                translatedVar.setDescription(variable.getDescription());
                translatedVar.setIsRequired(variable.getIsRequired());
                variableRepository.save(translatedVar);
            }
        }

        return savedTemplate;
    }

    private boolean isRtlLanguage(String languageCode) {
        if (languageCode == null) {
            return false;
        }
        String lowerCode = languageCode.toLowerCase();
        return lowerCode.startsWith("ar_")
                || lowerCode.startsWith("he_")
                || lowerCode.startsWith("fa_")
                || lowerCode.startsWith("ur_");
    }
}
