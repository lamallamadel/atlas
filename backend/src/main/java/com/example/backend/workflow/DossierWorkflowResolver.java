package com.example.backend.workflow;

import com.example.backend.repository.WorkflowDefinitionRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Trouve le workflow applicable à un type de dossier : la définition publiée et active de
 * l'organisation, sinon le modèle système (ADR 0004).
 */
@Component
public class DossierWorkflowResolver {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;

    public DossierWorkflowResolver(WorkflowDefinitionRepository workflowDefinitionRepository) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
    }

    public Optional<DossierWorkflow> resolve(String orgId, String caseType) {
        String effective = DossierStatusCodes.effectiveCaseType(caseType);
        if (orgId != null && !orgId.isBlank()) {
            // Liste plutôt qu'Optional : plusieurs versions actives ne doivent pas faire échouer
            // la requête ; on retient la version publiée la plus récente.
            Optional<DossierWorkflow> orgWorkflow =
                    workflowDefinitionRepository
                            .findAllVersionsByCaseType(orgId, effective)
                            .stream()
                            .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                            .filter(d -> Boolean.TRUE.equals(d.getIsPublished()))
                            .findFirst()
                            .map(DossierWorkflow::fromDefinition)
                            .filter(w -> !w.stateCodes().isEmpty());
            if (orgWorkflow.isPresent()) {
                return orgWorkflow;
            }
        }
        return DossierWorkflowCatalog.systemWorkflow(effective);
    }
}
