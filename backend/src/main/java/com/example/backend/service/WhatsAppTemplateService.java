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
import com.example.backend.util.TenantContext;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WhatsAppTemplateService {

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
                        () -> new ResourceNotFoundException(
                                String.format(
                                        "Template not found with name: %s and language: %s",
                                        name, language)));
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

        if (template.getStatus() != TemplateStatus.APPROVED && template.getStatus() != TemplateStatus.ACTIVE) {
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

        MetaBusinessApiService.TemplateApprovalStatus status = metaBusinessApiService
                .pollApprovalStatus(template.getMetaSubmissionId());

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
    public List<WhatsAppTemplate> searchTemplates(TemplateCategory category, TemplateStatus status,
            String language, String searchTerm) {
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
        return versionRepository.findByTemplateIdAndVersionNumber(templateId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Version %d not found for template %d", versionNumber, templateId)));
    }

    @Transactional
    public WhatsAppTemplate activateVersion(Long templateId, Integer versionNumber) {
        WhatsAppTemplate template = getTemplateById(templateId);
        WhatsAppTemplateVersion version = getTemplateVersion(templateId, versionNumber);

        versionRepository.findActiveVersionByTemplateId(templateId)
                .ifPresent(activeVersion -> {
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
                        com.example.backend.entity.enums.ComponentType.valueOf((String) varMap.get("componentType")));
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
}
