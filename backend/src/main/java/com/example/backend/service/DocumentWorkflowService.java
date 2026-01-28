package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DocumentWorkflowService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentWorkflowService.class);

    private final DocumentWorkflowRepository workflowRepository;
    private final WorkflowStepRepository stepRepository;
    private final WorkflowApprovalRepository approvalRepository;
    private final DocumentAuditRepository auditRepository;
    private final WorkflowTemplateRepository templateRepository;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final ESignatureService eSignatureService;
    private final ObjectMapper objectMapper;

    public DocumentWorkflowService(
            DocumentWorkflowRepository workflowRepository,
            WorkflowStepRepository stepRepository,
            WorkflowApprovalRepository approvalRepository,
            DocumentAuditRepository auditRepository,
            WorkflowTemplateRepository templateRepository,
            DocumentRepository documentRepository,
            NotificationService notificationService,
            ESignatureService eSignatureService,
            ObjectMapper objectMapper) {
        this.workflowRepository = workflowRepository;
        this.stepRepository = stepRepository;
        this.approvalRepository = approvalRepository;
        this.auditRepository = auditRepository;
        this.templateRepository = templateRepository;
        this.documentRepository = documentRepository;
        this.notificationService = notificationService;
        this.eSignatureService = eSignatureService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DocumentWorkflowResponse createWorkflow(DocumentWorkflowRequest request, String orgId, String userId) {
        DocumentEntity document = documentRepository.findByIdAndOrgId(request.getDocumentId(), orgId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        DocumentWorkflowEntity workflow = new DocumentWorkflowEntity();
        workflow.setOrgId(orgId);
        workflow.setDocumentId(request.getDocumentId());
        workflow.setDossierId(request.getDossierId());
        workflow.setTemplateId(request.getTemplateId());
        workflow.setWorkflowName(request.getWorkflowName());
        workflow.setWorkflowType(request.getWorkflowType());
        workflow.setStatus(WorkflowStatus.DRAFT);
        workflow.setWorkflowConfig(request.getWorkflowConfig());
        workflow.setContextData(request.getContextData());
        workflow.setInitiatedBy(userId);
        workflow.setPropertyValue(request.getPropertyValue());
        workflow.setCreatedBy(userId);

        if (request.getPropertyValue() != null && request.getPropertyValue() > 500000) {
            workflow.setRequiresAdditionalApproval(true);
        }

        workflow = workflowRepository.save(workflow);

        if (request.getTemplateId() != null) {
            createStepsFromTemplate(workflow, request.getTemplateId(), orgId);
        }

        logAudit(workflow.getDocumentId(), workflow.getId(), null, DocumentActionType.WORKFLOW_STARTED,
                userId, "Workflow created: " + workflow.getWorkflowName(), orgId);

        return mapToResponse(workflow);
    }

    @Transactional
    public DocumentWorkflowResponse startWorkflow(Long workflowId, String orgId, String userId) {
        DocumentWorkflowEntity workflow = workflowRepository.findByIdAndOrgId(workflowId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found"));

        if (workflow.getStatus() != WorkflowStatus.DRAFT) {
            throw new IllegalStateException("Workflow is not in DRAFT status");
        }

        List<WorkflowStepEntity> steps = stepRepository.findByWorkflowIdAndOrgIdOrderByStepOrder(workflowId, orgId);
        if (steps.isEmpty()) {
            throw new IllegalStateException("Workflow has no steps defined");
        }

        workflow.setStatus(WorkflowStatus.ACTIVE);
        workflow.setStartedAt(LocalDateTime.now());
        workflow.setCurrentStepOrder(1);
        workflow = workflowRepository.save(workflow);

        WorkflowStepEntity firstStep = steps.get(0);
        activateStep(firstStep, orgId, userId);

        return mapToResponse(workflow);
    }

    @Transactional
    public void submitApproval(Long approvalId, WorkflowApprovalRequest request, String orgId, String userId) {
        WorkflowApprovalEntity approval = approvalRepository.findByIdAndOrgId(approvalId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Approval request not found"));

        if (!approval.getApproverId().equals(userId)) {
            throw new IllegalArgumentException("User is not authorized to approve this request");
        }

        if (approval.getDecision() != null) {
            throw new IllegalStateException("Approval decision has already been submitted");
        }

        approval.setDecision(request.getDecision());
        approval.setComments(request.getComments());
        approval.setReason(request.getReason());
        approval.setDecidedAt(LocalDateTime.now());
        approvalRepository.save(approval);

        WorkflowStepEntity step = stepRepository.findByIdAndOrgId(approval.getStepId(), orgId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow step not found"));

        if (request.getDecision() == WorkflowStepStatus.APPROVED) {
            step.setApprovalsReceived(step.getApprovalsReceived() + 1);
        } else if (request.getDecision() == WorkflowStepStatus.REJECTED) {
            step.setStatus(WorkflowStepStatus.REJECTED);
            step.setCompletedAt(LocalDateTime.now());
            stepRepository.save(step);

            DocumentWorkflowEntity workflow = workflowRepository.findByIdAndOrgId(step.getWorkflowId(), orgId)
                    .orElseThrow();
            workflow.setStatus(WorkflowStatus.CANCELLED);
            workflow.setCancelledAt(LocalDateTime.now());
            workflow.setCancellationReason("Step rejected by " + userId);
            workflowRepository.save(workflow);

            logAudit(workflow.getDocumentId(), workflow.getId(), null, DocumentActionType.WORKFLOW_CANCELLED,
                    userId, "Workflow cancelled due to rejection", orgId);
            return;
        }

        if (isStepCompleted(step)) {
            completeStep(step, orgId, userId);
        }

        stepRepository.save(step);
    }

    @Transactional
    public void bulkApprove(BulkApprovalRequest request, String orgId, String userId) {
        for (Long approvalId : request.getApprovalIds()) {
            try {
                WorkflowApprovalRequest singleRequest = new WorkflowApprovalRequest();
                singleRequest.setDecision(request.getDecision());
                singleRequest.setComments(request.getComments());
                singleRequest.setReason(request.getReason());
                submitApproval(approvalId, singleRequest, orgId, userId);
            } catch (Exception e) {
                logger.error("Error processing approval {}: {}", approvalId, e.getMessage());
            }
        }
    }

    private void activateStep(WorkflowStepEntity step, String orgId, String userId) {
        step.setStatus(WorkflowStepStatus.IN_PROGRESS);
        step.setStartedAt(LocalDateTime.now());
        stepRepository.save(step);

        if (step.getStepType() == WorkflowStepType.APPROVAL || step.getStepType() == WorkflowStepType.REVIEW) {
            createApprovalRequests(step, orgId);
        } else if (step.getStepType() == WorkflowStepType.SIGNATURE) {
            initiateSignature(step, orgId, userId);
        } else if (step.getStepType() == WorkflowStepType.CONDITIONAL_BRANCH) {
            evaluateConditionalBranch(step, orgId, userId);
        }
    }

    private void createApprovalRequests(WorkflowStepEntity step, String orgId) {
        for (String approverId : step.getAssignedApprovers()) {
            WorkflowApprovalEntity approval = new WorkflowApprovalEntity();
            approval.setOrgId(orgId);
            approval.setWorkflowId(step.getWorkflowId());
            approval.setStepId(step.getId());
            approval.setApproverId(approverId);
            approval.setNotifiedAt(LocalDateTime.now());
            approval.setCreatedBy("system");
            approvalRepository.save(approval);

            sendApprovalNotification(approval, step);
        }
    }

    private void sendApprovalNotification(WorkflowApprovalEntity approval, WorkflowStepEntity step) {
        try {
            NotificationCreateRequest notificationRequest = new NotificationCreateRequest();
            notificationRequest.setType(NotificationType.APPROVAL_REQUEST);
            notificationRequest.setRecipient(approval.getApproverId());
            notificationRequest.setTemplateId("approval_request");
            notificationRequest.setSubject("Approval Required: " + step.getStepName());
            notificationRequest.setMessage("You have been requested to review and approve: " + step.getStepName());
            notificationRequest.setActionUrl("/workflows/approvals/" + approval.getId());

            Map<String, Object> variables = new HashMap<>();
            variables.put("stepName", step.getStepName());
            variables.put("approvalId", approval.getId());
            variables.put("workflowId", step.getWorkflowId());
            notificationRequest.setVariables(variables);

            notificationService.createNotification(notificationRequest, approval.getOrgId());
        } catch (Exception e) {
            logger.error("Failed to send approval notification", e);
        }
    }

    private boolean isStepCompleted(WorkflowStepEntity step) {
        if (step.getRequiresAllApprovers()) {
            return step.getApprovalsReceived() >= step.getApprovalsRequired();
        } else {
            return step.getApprovalsReceived() >= 1;
        }
    }

    private void completeStep(WorkflowStepEntity step, String orgId, String userId) {
        step.setStatus(WorkflowStepStatus.COMPLETED);
        step.setCompletedAt(LocalDateTime.now());
        stepRepository.save(step);

        DocumentWorkflowEntity workflow = workflowRepository.findByIdAndOrgId(step.getWorkflowId(), orgId)
                .orElseThrow();

        List<WorkflowStepEntity> allSteps = stepRepository.findByWorkflowIdAndOrgIdOrderByStepOrder(workflow.getId(), orgId);
        Optional<WorkflowStepEntity> nextStep = allSteps.stream()
                .filter(s -> s.getStepOrder() > step.getStepOrder())
                .filter(s -> s.getStatus() == WorkflowStepStatus.PENDING)
                .findFirst();

        if (nextStep.isPresent()) {
            workflow.setCurrentStepOrder(nextStep.get().getStepOrder());
            workflowRepository.save(workflow);
            activateStep(nextStep.get(), orgId, userId);
        } else {
            workflow.setStatus(WorkflowStatus.COMPLETED);
            workflow.setCompletedAt(LocalDateTime.now());
            workflowRepository.save(workflow);

            logAudit(workflow.getDocumentId(), workflow.getId(), null, DocumentActionType.WORKFLOW_COMPLETED,
                    userId, "Workflow completed successfully", orgId);
        }
    }

    private void initiateSignature(WorkflowStepEntity step, String orgId, String userId) {
        try {
            DocumentWorkflowEntity workflow = workflowRepository.findByIdAndOrgId(step.getWorkflowId(), orgId)
                    .orElseThrow();

            logger.info("Signature step initiated for workflow {}", workflow.getId());
            step.setStatus(WorkflowStepStatus.COMPLETED);
            step.setCompletedAt(LocalDateTime.now());
            stepRepository.save(step);

            completeStep(step, orgId, userId);
        } catch (Exception e) {
            logger.error("Error initiating signature", e);
        }
    }

    private void evaluateConditionalBranch(WorkflowStepEntity step, String orgId, String userId) {
        DocumentWorkflowEntity workflow = workflowRepository.findByIdAndOrgId(step.getWorkflowId(), orgId)
                .orElseThrow();

        Map<String, Object> conditionRules = step.getConditionRules();
        if (conditionRules != null && conditionRules.containsKey("propertyValueThreshold")) {
            Long threshold = ((Number) conditionRules.get("propertyValueThreshold")).longValue();
            if (workflow.getPropertyValue() != null && workflow.getPropertyValue() > threshold) {
                workflow.setRequiresAdditionalApproval(true);
                workflowRepository.save(workflow);
            }
        }

        step.setStatus(WorkflowStepStatus.COMPLETED);
        step.setCompletedAt(LocalDateTime.now());
        stepRepository.save(step);

        completeStep(step, orgId, userId);
    }

    private void createStepsFromTemplate(DocumentWorkflowEntity workflow, Long templateId, String orgId) {
        WorkflowTemplateEntity template = templateRepository.findByIdAndOrgId(templateId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        int order = 1;
        for (Map<String, Object> stepDef : template.getStepsDefinition()) {
            WorkflowStepEntity step = new WorkflowStepEntity();
            step.setOrgId(orgId);
            step.setWorkflowId(workflow.getId());
            step.setStepName((String) stepDef.get("stepName"));
            step.setStepDescription((String) stepDef.get("stepDescription"));
            step.setStepType(WorkflowStepType.valueOf((String) stepDef.get("stepType")));
            step.setStepOrder(order++);
            step.setStatus(WorkflowStepStatus.PENDING);
            
            if (stepDef.containsKey("assignedApprovers")) {
                step.setAssignedApprovers((List<String>) stepDef.get("assignedApprovers"));
            }
            
            if (stepDef.containsKey("approvalsRequired")) {
                step.setApprovalsRequired(((Number) stepDef.get("approvalsRequired")).intValue());
            }
            
            step.setRequiresAllApprovers((Boolean) stepDef.getOrDefault("requiresAllApprovers", true));
            step.setIsParallel((Boolean) stepDef.getOrDefault("isParallel", false));
            step.setStepConfig((Map<String, Object>) stepDef.get("stepConfig"));
            step.setConditionRules((Map<String, Object>) stepDef.get("conditionRules"));
            step.setCreatedBy("system");
            
            stepRepository.save(step);
        }

        template.setUsageCount(template.getUsageCount() + 1);
        templateRepository.save(template);
    }

    private void logAudit(Long documentId, Long workflowId, Long versionId, DocumentActionType actionType,
                          String userId, String description, String orgId) {
        DocumentAuditEntity audit = new DocumentAuditEntity();
        audit.setOrgId(orgId);
        audit.setDocumentId(documentId);
        audit.setWorkflowId(workflowId);
        audit.setVersionId(versionId);
        audit.setActionType(actionType);
        audit.setActionBy(userId);
        audit.setActionAt(LocalDateTime.now());
        audit.setDescription(description);
        audit.setCreatedBy(userId);
        auditRepository.save(audit);
    }

    public List<DocumentWorkflowResponse> getWorkflowsByDocument(Long documentId, String orgId) {
        return workflowRepository.findByDocumentIdAndOrgId(documentId, orgId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<WorkflowApprovalEntity> getPendingApprovals(String userId, String orgId) {
        return approvalRepository.findByApproverIdAndDecisionIsNullAndOrgId(userId, orgId);
    }

    public DocumentWorkflowResponse getWorkflow(Long workflowId, String orgId) {
        DocumentWorkflowEntity workflow = workflowRepository.findByIdAndOrgId(workflowId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found"));
        return mapToResponse(workflow);
    }

    public List<DocumentAuditEntity> getDocumentAuditTrail(Long documentId, String orgId) {
        return auditRepository.findByDocumentIdAndOrgIdOrderByActionAtDesc(documentId, orgId);
    }

    private DocumentWorkflowResponse mapToResponse(DocumentWorkflowEntity entity) {
        DocumentWorkflowResponse response = new DocumentWorkflowResponse();
        response.setId(entity.getId());
        response.setDocumentId(entity.getDocumentId());
        response.setDossierId(entity.getDossierId());
        response.setTemplateId(entity.getTemplateId());
        response.setWorkflowName(entity.getWorkflowName());
        response.setWorkflowType(entity.getWorkflowType());
        response.setStatus(entity.getStatus());
        response.setCurrentStepOrder(entity.getCurrentStepOrder());
        response.setWorkflowConfig(entity.getWorkflowConfig());
        response.setContextData(entity.getContextData());
        response.setInitiatedBy(entity.getInitiatedBy());
        response.setStartedAt(entity.getStartedAt());
        response.setCompletedAt(entity.getCompletedAt());
        response.setCancelledAt(entity.getCancelledAt());
        response.setCancellationReason(entity.getCancellationReason());
        response.setPropertyValue(entity.getPropertyValue());
        response.setRequiresAdditionalApproval(entity.getRequiresAdditionalApproval());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
