package com.example.backend.service;

import com.example.backend.dto.WorkflowDefinitionMapper;
import com.example.backend.dto.WorkflowDefinitionRequest;
import com.example.backend.dto.WorkflowDefinitionResponse;
import com.example.backend.dto.WorkflowTransitionMapper;
import com.example.backend.dto.WorkflowTransitionResponse;
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
    private final DossierRepository dossierRepository;

    public WorkflowService(
            WorkflowDefinitionRepository workflowDefinitionRepository,
            WorkflowTransitionRepository workflowTransitionRepository,
            WorkflowDefinitionMapper workflowDefinitionMapper,
            WorkflowTransitionMapper workflowTransitionMapper,
            WorkflowValidationService workflowValidationService,
            DossierRepository dossierRepository) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.workflowDefinitionMapper = workflowDefinitionMapper;
        this.workflowTransitionMapper = workflowTransitionMapper;
        this.workflowValidationService = workflowValidationService;
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
    public Page<WorkflowDefinitionResponse> listDefinitions(String caseType, Boolean isActive, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<WorkflowDefinition> definitions;
        
        if (caseType != null && !caseType.isBlank()) {
            if (isActive != null && isActive) {
                definitions = workflowDefinitionRepository.findAll(
                    (root, query, cb) -> cb.and(
                        cb.equal(root.get("orgId"), orgId),
                        cb.equal(root.get("caseType"), caseType),
                        cb.equal(root.get("isActive"), true)
                    ), pageable);
            } else {
                definitions = workflowDefinitionRepository.findAll(
                    (root, query, cb) -> cb.and(
                        cb.equal(root.get("orgId"), orgId),
                        cb.equal(root.get("caseType"), caseType)
                    ), pageable);
            }
        } else if (isActive != null && isActive) {
            definitions = workflowDefinitionRepository.findAll(
                (root, query, cb) -> cb.and(
                    cb.equal(root.get("orgId"), orgId),
                    cb.equal(root.get("isActive"), true)
                ), pageable);
        } else {
            definitions = workflowDefinitionRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("orgId"), orgId), pageable);
        }

        return definitions.map(workflowDefinitionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<WorkflowDefinitionResponse> getTransitionsForCaseType(String caseType) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        List<WorkflowDefinition> definitions = workflowDefinitionRepository.findByCaseType(orgId, caseType);
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

        workflowDefinitionMapper.updateEntity(definition, request);
        definition.setUpdatedAt(LocalDateTime.now());

        WorkflowDefinition updated = workflowDefinitionRepository.save(definition);
        return workflowDefinitionMapper.toResponse(updated);
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
