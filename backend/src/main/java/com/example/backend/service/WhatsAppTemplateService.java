package com.example.backend.service;

import com.example.backend.entity.TemplateVariable;
import com.example.backend.entity.WhatsAppTemplate;
import com.example.backend.entity.enums.TemplateStatus;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.TemplateVariableRepository;
import com.example.backend.repository.WhatsAppTemplateRepository;
import com.example.backend.util.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class WhatsAppTemplateService {

    private final WhatsAppTemplateRepository templateRepository;
    private final TemplateVariableRepository variableRepository;
    private final WhatsAppTemplateValidationService validationService;

    public WhatsAppTemplateService(
            WhatsAppTemplateRepository templateRepository,
            TemplateVariableRepository variableRepository,
            WhatsAppTemplateValidationService validationService) {
        this.templateRepository = templateRepository;
        this.variableRepository = variableRepository;
        this.validationService = validationService;
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
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public WhatsAppTemplate getTemplateByNameAndLanguage(String name, String language) {
        return templateRepository.findByNameAndLanguage(name, language)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Template not found with name: %s and language: %s", name, language)));
    }

    @Transactional
    public WhatsAppTemplate createTemplate(WhatsAppTemplate template) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        validationService.validateTemplateFormat(template);

        if (templateRepository.existsByNameAndLanguage(template.getName(), template.getLanguage())) {
            throw new IllegalArgumentException(
                    String.format("Template already exists with name: %s and language: %s",
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
        
        template.setStatus(TemplateStatus.PENDING_APPROVAL);
        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate approveTemplate(Long id, String whatsAppTemplateId) {
        WhatsAppTemplate template = getTemplateById(id);
        
        if (template.getStatus() != TemplateStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Template must be in PENDING_APPROVAL status to be approved");
        }
        
        template.setStatus(TemplateStatus.ACTIVE);
        template.setWhatsAppTemplateId(whatsAppTemplateId);
        template.setRejectionReason(null);
        return templateRepository.save(template);
    }

    @Transactional
    public WhatsAppTemplate rejectTemplate(Long id, String rejectionReason) {
        WhatsAppTemplate template = getTemplateById(id);
        
        if (template.getStatus() != TemplateStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Template must be in PENDING_APPROVAL status to be rejected");
        }
        
        template.setStatus(TemplateStatus.REJECTED);
        template.setRejectionReason(rejectionReason);
        return templateRepository.save(template);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        WhatsAppTemplate template = getTemplateById(id);
        
        if (template.getStatus() == TemplateStatus.ACTIVE) {
            throw new IllegalStateException("Cannot delete an active template. Please deactivate it first.");
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
}
