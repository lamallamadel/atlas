package com.example.backend.service;

import com.example.backend.entity.WorkflowTemplateEntity;
import com.example.backend.entity.enums.DocumentWorkflowType;
import com.example.backend.entity.enums.WorkflowStepType;
import com.example.backend.repository.WorkflowTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.util.*;

@Service
public class DocumentWorkflowTemplateService {

    private final WorkflowTemplateRepository templateRepository;

    public DocumentWorkflowTemplateService(WorkflowTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @PostConstruct
    @Transactional
    public void initializeSystemTemplates() {
        if (templateRepository.findByIsSystemTemplateTrueAndIsActiveTrue().isEmpty()) {
            createSystemTemplates();
        }
    }

    private void createSystemTemplates() {
        createPurchaseAgreementTemplate();
        createLeaseContractTemplate();
        createMandateTemplate();
    }

    private void createPurchaseAgreementTemplate() {
        WorkflowTemplateEntity template = new WorkflowTemplateEntity();
        template.setOrgId("SYSTEM");
        template.setTemplateName("Purchase Agreement Workflow");
        template.setDescription("Standard workflow for real estate purchase agreements with agent review, manager approval, client signature, and archival");
        template.setWorkflowType(DocumentWorkflowType.PURCHASE_AGREEMENT);
        template.setIsSystemTemplate(true);
        template.setIsActive(true);
        template.setCategory("Real Estate");
        template.setTags("purchase,agreement,contract,sale");
        template.setCreatedBy("SYSTEM");

        List<Map<String, Object>> steps = new ArrayList<>();

        steps.add(Map.of(
                "stepName", "Agent Review",
                "stepDescription", "Initial review by assigned real estate agent",
                "stepType", WorkflowStepType.REVIEW.name(),
                "assignedApprovers", List.of("agent"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Manager Approval",
                "stepDescription", "Manager approval for purchase agreement",
                "stepType", WorkflowStepType.APPROVAL.name(),
                "assignedApprovers", List.of("manager"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Property Value Check",
                "stepDescription", "Conditional approval for high-value properties",
                "stepType", WorkflowStepType.CONDITIONAL_BRANCH.name(),
                "conditionRules", Map.of("propertyValueThreshold", 500000),
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Client Signature",
                "stepDescription", "Electronic signature by client",
                "stepType", WorkflowStepType.SIGNATURE.name(),
                "assignedApprovers", List.of("client"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Archive Document",
                "stepDescription", "Archive signed document",
                "stepType", WorkflowStepType.ARCHIVE.name(),
                "isParallel", false
        ));

        template.setStepsDefinition(steps);
        template.setDefaultConfig(Map.of("autoArchive", true, "notifyOnComplete", true));

        templateRepository.save(template);
    }

    private void createLeaseContractTemplate() {
        WorkflowTemplateEntity template = new WorkflowTemplateEntity();
        template.setOrgId("SYSTEM");
        template.setTemplateName("Lease Contract Workflow");
        template.setDescription("Standard workflow for lease contracts with review, approval, and signature steps");
        template.setWorkflowType(DocumentWorkflowType.LEASE_CONTRACT);
        template.setIsSystemTemplate(true);
        template.setIsActive(true);
        template.setCategory("Real Estate");
        template.setTags("lease,rental,contract,tenant");
        template.setCreatedBy("SYSTEM");

        List<Map<String, Object>> steps = new ArrayList<>();

        steps.add(Map.of(
                "stepName", "Legal Review",
                "stepDescription", "Legal team reviews lease terms",
                "stepType", WorkflowStepType.REVIEW.name(),
                "assignedApprovers", List.of("legal"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Property Manager Approval",
                "stepDescription", "Property manager approval",
                "stepType", WorkflowStepType.APPROVAL.name(),
                "assignedApprovers", List.of("property_manager"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Tenant Signature",
                "stepDescription", "Tenant signs lease contract",
                "stepType", WorkflowStepType.SIGNATURE.name(),
                "assignedApprovers", List.of("tenant"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Landlord Signature",
                "stepDescription", "Landlord counter-signature",
                "stepType", WorkflowStepType.SIGNATURE.name(),
                "assignedApprovers", List.of("landlord"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Archive Contract",
                "stepDescription", "Archive signed lease contract",
                "stepType", WorkflowStepType.ARCHIVE.name(),
                "isParallel", false
        ));

        template.setStepsDefinition(steps);
        template.setDefaultConfig(Map.of("autoArchive", true, "notifyOnComplete", true));

        templateRepository.save(template);
    }

    private void createMandateTemplate() {
        WorkflowTemplateEntity template = new WorkflowTemplateEntity();
        template.setOrgId("SYSTEM");
        template.setTemplateName("Mandate Workflow");
        template.setDescription("Workflow for broker mandates with compliance review and client authorization");
        template.setWorkflowType(DocumentWorkflowType.MANDATE);
        template.setIsSystemTemplate(true);
        template.setIsActive(true);
        template.setCategory("Real Estate");
        template.setTags("mandate,broker,authorization,exclusive");
        template.setCreatedBy("SYSTEM");

        List<Map<String, Object>> steps = new ArrayList<>();

        steps.add(Map.of(
                "stepName", "Compliance Review",
                "stepDescription", "Compliance team reviews mandate terms",
                "stepType", WorkflowStepType.REVIEW.name(),
                "assignedApprovers", List.of("compliance"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Broker Manager Approval",
                "stepDescription", "Broker manager approves mandate",
                "stepType", WorkflowStepType.APPROVAL.name(),
                "assignedApprovers", List.of("broker_manager"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Client Authorization",
                "stepDescription", "Client signs mandate authorization",
                "stepType", WorkflowStepType.SIGNATURE.name(),
                "assignedApprovers", List.of("client"),
                "approvalsRequired", 1,
                "requiresAllApprovers", true,
                "isParallel", false
        ));

        steps.add(Map.of(
                "stepName", "Archive Mandate",
                "stepDescription", "Archive authorized mandate",
                "stepType", WorkflowStepType.ARCHIVE.name(),
                "isParallel", false
        ));

        template.setStepsDefinition(steps);
        template.setDefaultConfig(Map.of("autoArchive", true, "notifyOnComplete", true, "mandateValidityDays", 90));

        templateRepository.save(template);
    }

    public List<WorkflowTemplateEntity> getAllTemplates(String orgId) {
        List<WorkflowTemplateEntity> systemTemplates = templateRepository.findByIsSystemTemplateTrueAndIsActiveTrue();
        List<WorkflowTemplateEntity> orgTemplates = templateRepository.findByOrgIdAndIsActiveTrue(orgId);

        List<WorkflowTemplateEntity> allTemplates = new ArrayList<>();
        allTemplates.addAll(systemTemplates);
        allTemplates.addAll(orgTemplates);

        return allTemplates;
    }

    public List<WorkflowTemplateEntity> getTemplatesByType(DocumentWorkflowType type, String orgId) {
        return templateRepository.findByWorkflowTypeAndOrgIdAndIsActiveTrue(type, orgId);
    }

    public WorkflowTemplateEntity getTemplate(Long templateId, String orgId) {
        return templateRepository.findByIdAndOrgId(templateId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));
    }

    public List<WorkflowTemplateEntity> getPopularTemplates(String orgId) {
        return templateRepository.findPopularTemplates(orgId);
    }

    @Transactional
    public WorkflowTemplateEntity createCustomTemplate(WorkflowTemplateEntity template, String orgId, String userId) {
        template.setOrgId(orgId);
        template.setIsSystemTemplate(false);
        template.setIsActive(true);
        template.setUsageCount(0);
        template.setCreatedBy(userId);
        return templateRepository.save(template);
    }

    @Transactional
    public WorkflowTemplateEntity updateTemplate(Long templateId, WorkflowTemplateEntity updates, String orgId) {
        WorkflowTemplateEntity template = templateRepository.findByIdAndOrgId(templateId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (template.getIsSystemTemplate()) {
            throw new IllegalStateException("Cannot modify system templates");
        }

        template.setTemplateName(updates.getTemplateName());
        template.setDescription(updates.getDescription());
        template.setStepsDefinition(updates.getStepsDefinition());
        template.setDefaultConfig(updates.getDefaultConfig());
        template.setCategory(updates.getCategory());
        template.setTags(updates.getTags());

        return templateRepository.save(template);
    }

    @Transactional
    public void deleteTemplate(Long templateId, String orgId) {
        WorkflowTemplateEntity template = templateRepository.findByIdAndOrgId(templateId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (template.getIsSystemTemplate()) {
            throw new IllegalStateException("Cannot delete system templates");
        }

        template.setIsActive(false);
        templateRepository.save(template);
    }
}
