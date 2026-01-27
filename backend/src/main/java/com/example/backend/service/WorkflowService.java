package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.entity.WorkflowTransition;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.repository.WorkflowTransitionRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WorkflowService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final WorkflowDefinitionMapper workflowDefinitionMapper;
    private final WorkflowTransitionMapper workflowTransitionMapper;
    private final WorkflowValidationService workflowValidationService;
    private final WorkflowVersioningService workflowVersioningService;
    private final DossierRepository dossierRepository;

    public WorkflowService(
            WorkflowDefinitionRepository workflowDefinitionRepository,
            WorkflowTransitionRepository workflowTransitionRepository,
            WorkflowDefinitionMapper workflowDefinitionMapper,
            WorkflowTransitionMapper workflowTransitionMapper,
            WorkflowValidationService workflowValidationService,
            WorkflowVersioningService workflowVersioningService,
            DossierRepository dossierRepository) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.workflowDefinitionMapper = workflowDefinitionMapper;
        this.workflowTransitionMapper = workflowTransitionMapper;
        this.workflowValidationService = workflowValidationService;
        this.workflowVersioningService = workflowVersioningService;
        this.dossierRepository = dossierRepository;
    }

    @Transactional
    public WorkflowDefinitionResponse createDefinition(WorkflowDefinitionRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition definition = workflowDefinitionMapper.toEntity(request);
        definition.setOrgId(orgId);

        Integer maxVersion = workflowDefinitionRepository
                .findMaxVersionByCaseType(orgId, request.getCaseType())
                .orElse(0);
        definition.setVersion(maxVersion + 1);

        LocalDateTime now = LocalDateTime.now();
        definition.setCreatedAt(now);
        definition.setUpdatedAt(now);

        WorkflowDefinition saved = workflowDefinitionRepository.save(definition);
        return workflowDefinitionMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public WorkflowDefinitionResponse getDefinitionById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Workflow definition not found with id: " + id));

        if (!orgId.equals(definition.getOrgId())) {
            throw new EntityNotFoundException("Workflow definition not found with id: " + id);
        }

        return workflowDefinitionMapper.toResponse(definition);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowDefinitionResponse> listDefinitions(String caseType, Boolean isActive, Boolean isPublished, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<WorkflowDefinition> definitions = workflowDefinitionRepository.findAll(
                (root, query, cb) -> {
                    var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
                    predicates.add(cb.equal(root.get("orgId"), orgId));

                    if (caseType != null && !caseType.isBlank()) {
                        predicates.add(cb.equal(root.get("caseType"), caseType));
                    }
                    if (isActive != null) {
                        predicates.add(cb.equal(root.get("isActive"), isActive));
                    }
                    if (isPublished != null) {
                        predicates.add(cb.equal(root.get("isPublished"), isPublished));
                    }

                    return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
                }, pageable);

        return definitions.map(workflowDefinitionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<WorkflowDefinitionResponse> getVersionsByCaseType(String caseType) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        List<WorkflowDefinition> definitions = workflowDefinitionRepository
                .findAllVersionsByCaseType(orgId, caseType);
        return definitions.stream()
                .map(workflowDefinitionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkflowDefinitionResponse updateDefinition(Long id, WorkflowDefinitionRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Workflow definition not found with id: " + id));

        if (!orgId.equals(definition.getOrgId())) {
            throw new EntityNotFoundException("Workflow definition not found with id: " + id);
        }

        if (definition.getIsPublished()) {
            throw new IllegalStateException("Cannot update published workflow. Create a new version instead.");
        }

        workflowDefinitionMapper.updateEntity(definition, request);
        definition.setUpdatedAt(LocalDateTime.now());

        WorkflowDefinition updated = workflowDefinitionRepository.save(definition);
        return workflowDefinitionMapper.toResponse(updated);
    }

    @Transactional
    public WorkflowDefinitionResponse publishWorkflow(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Workflow definition not found with id: " + id));

        if (!orgId.equals(definition.getOrgId())) {
            throw new EntityNotFoundException("Workflow definition not found with id: " + id);
        }

        workflowValidationService.validateWorkflowStructure(definition);

        definition.setIsPublished(true);
        definition.setUpdatedAt(LocalDateTime.now());

        WorkflowDefinition updated = workflowDefinitionRepository.save(definition);
        return workflowDefinitionMapper.toResponse(updated);
    }

    @Transactional
    public WorkflowDefinitionResponse activateWorkflow(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Workflow definition not found with id: " + id));

        if (!orgId.equals(definition.getOrgId())) {
            throw new EntityNotFoundException("Workflow definition not found with id: " + id);
        }

        if (!definition.getIsPublished()) {
            throw new IllegalStateException("Cannot activate unpublished workflow. Publish it first.");
        }

        List<WorkflowDefinition> activeWorkflows = workflowDefinitionRepository
                .findAllVersionsByCaseType(orgId, definition.getCaseType()).stream()
                .filter(WorkflowDefinition::getIsActive)
                .collect(Collectors.toList());

        for (WorkflowDefinition active : activeWorkflows) {
            active.setIsActive(false);
            workflowDefinitionRepository.save(active);
        }

        definition.setIsActive(true);
        definition.setUpdatedAt(LocalDateTime.now());

        WorkflowDefinition updated = workflowDefinitionRepository.save(definition);
        return workflowDefinitionMapper.toResponse(updated);
    }

    @Transactional
    public WorkflowDefinitionResponse createNewVersion(Long parentId, String versionDescription) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        return workflowVersioningService.createNewVersion(parentId, versionDescription, orgId);
    }

    @Transactional
    public void deleteDefinition(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition definition = workflowDefinitionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Workflow definition not found with id: " + id));

        if (!orgId.equals(definition.getOrgId())) {
            throw new EntityNotFoundException("Workflow definition not found with id: " + id);
        }

        if (definition.getIsActive()) {
            throw new IllegalStateException("Cannot delete active workflow. Deactivate it first.");
        }

        long activeDossiers = dossierRepository.count(
                (root, query, cb) -> cb.and(
                        cb.equal(root.get("orgId"), orgId),
                        cb.equal(root.get("workflowDefinitionId"), id)
                ));

        if (activeDossiers > 0) {
            throw new IllegalStateException("Cannot delete workflow with active dossiers. Found " + activeDossiers + " dossiers.");
        }

        workflowDefinitionRepository.delete(definition);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowTransitionResponse> getTransitionHistory(Long dossierId, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<WorkflowTransition> transitions = workflowTransitionRepository.findByDossierId(dossierId, pageable);

        return transitions.map(workflowTransitionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validateTransition(Long dossierId, String fromStatus, String toStatus) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        return workflowValidationService.checkTransitionValidity(dossier, fromStatus, toStatus);
    }
}
