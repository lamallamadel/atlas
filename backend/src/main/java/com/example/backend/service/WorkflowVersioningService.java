package com.example.backend.service;

import com.example.backend.dto.WorkflowDefinitionMapper;
import com.example.backend.dto.WorkflowDefinitionResponse;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.WorkflowDefinitionRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkflowVersioningService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowDefinitionMapper workflowDefinitionMapper;
    private final DossierRepository dossierRepository;

    public WorkflowVersioningService(
            WorkflowDefinitionRepository workflowDefinitionRepository,
            WorkflowDefinitionMapper workflowDefinitionMapper,
            DossierRepository dossierRepository) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.workflowDefinitionMapper = workflowDefinitionMapper;
        this.dossierRepository = dossierRepository;
    }

    @Transactional
    public WorkflowDefinitionResponse createNewVersion(
            Long parentId, String versionDescription, String orgId) {
        WorkflowDefinition parent =
                workflowDefinitionRepository
                        .findById(parentId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Parent workflow not found with id: " + parentId));

        if (!orgId.equals(parent.getOrgId())) {
            throw new EntityNotFoundException("Parent workflow not found with id: " + parentId);
        }

        if (!parent.getIsPublished()) {
            throw new IllegalStateException("Cannot create version from unpublished workflow");
        }

        Integer maxVersion =
                workflowDefinitionRepository
                        .findMaxVersionByCaseType(orgId, parent.getCaseType())
                        .orElse(parent.getVersion());

        WorkflowDefinition newVersion = new WorkflowDefinition();
        newVersion.setOrgId(orgId);
        newVersion.setName(parent.getName());
        newVersion.setDescription(
                versionDescription != null ? versionDescription : parent.getDescription());
        newVersion.setCaseType(parent.getCaseType());
        newVersion.setVersion(maxVersion + 1);
        newVersion.setIsActive(false);
        newVersion.setIsPublished(false);
        newVersion.setIsTemplate(false);
        newVersion.setParentVersionId(parentId);
        newVersion.setStatesJson(new ArrayList<>(parent.getStatesJson()));
        newVersion.setTransitionsJson(new ArrayList<>(parent.getTransitionsJson()));
        newVersion.setMetadataJson(
                parent.getMetadataJson() != null ? new HashMap<>(parent.getMetadataJson()) : null);
        newVersion.setInitialState(parent.getInitialState());
        newVersion.setFinalStates(parent.getFinalStates());

        LocalDateTime now = LocalDateTime.now();
        newVersion.setCreatedAt(now);
        newVersion.setUpdatedAt(now);

        WorkflowDefinition saved = workflowDefinitionRepository.save(newVersion);
        return workflowDefinitionMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public boolean canSafelyActivateVersion(Long workflowId, String orgId) {
        WorkflowDefinition workflow =
                workflowDefinitionRepository
                        .findById(workflowId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Workflow not found with id: " + workflowId));

        if (!orgId.equals(workflow.getOrgId())) {
            return false;
        }

        long activeDossiersWithOldVersion =
                dossierRepository.count(
                        (root, query, cb) ->
                                cb.and(
                                        cb.equal(root.get("orgId"), orgId),
                                        cb.equal(root.get("caseType"), workflow.getCaseType()),
                                        cb.or(
                                                cb.isNull(root.get("workflowDefinitionId")),
                                                cb.notEqual(
                                                        root.get("workflowDefinitionId"),
                                                        workflowId))));

        return activeDossiersWithOldVersion == 0;
    }
}
