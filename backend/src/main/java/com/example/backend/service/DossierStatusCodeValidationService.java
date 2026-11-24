package com.example.backend.service;

import com.example.backend.entity.ReferentialEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.ReferentialRepository;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.util.TenantContext;
import com.example.backend.workflow.DossierStatusCodes;
import com.example.backend.workflow.DossierWorkflow;
import com.example.backend.workflow.DossierWorkflowResolver;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DossierStatusCodeValidationService {

    private static final Logger log =
            LoggerFactory.getLogger(DossierStatusCodeValidationService.class);

    private final ReferentialRepository referentialRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final ReferentialSeedingService referentialSeedingService;
    private final boolean seedOnMissingReferentials;
    private final DossierWorkflowResolver workflowResolver;

    public DossierStatusCodeValidationService(
            ReferentialRepository referentialRepository,
            WorkflowDefinitionRepository workflowDefinitionRepository,
            ReferentialSeedingService referentialSeedingService,
            @Value("${referential.seed-on-missing:false}") boolean seedOnMissingReferentials,
            DossierWorkflowResolver workflowResolver) {
        this.referentialRepository = referentialRepository;
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.referentialSeedingService = referentialSeedingService;
        this.seedOnMissingReferentials = seedOnMissingReferentials;
        this.workflowResolver = workflowResolver;
    }

    @Transactional(readOnly = true)
    public void validateCaseType(String caseType) {
        if (caseType == null || caseType.isBlank()) {
            return;
        }

        Optional<ReferentialEntity> caseTypeRef = findReferentialByOrg("CASE_TYPE", caseType);
        if (caseTypeRef.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format(
                            "Invalid caseType: '%s'. Case type does not exist in CASE_TYPE referential.",
                            caseType));
        }

        if (!caseTypeRef.get().getIsActive()) {
            throw new IllegalArgumentException(
                    String.format("Invalid caseType: '%s'. Case type is not active.", caseType));
        }
    }

    @Transactional(readOnly = true)
    public void validateStatusCodeForCaseType(String caseType, String statusCode) {
        if (statusCode == null || statusCode.isBlank()) {
            return;
        }
        statusCode = DossierStatusCodes.normalize(statusCode);

        Optional<ReferentialEntity> statusRef = findReferentialByOrg("CASE_STATUS", statusCode);
        if (statusRef.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format(
                            "Invalid statusCode: '%s'. Status code does not exist in CASE_STATUS referential.",
                            statusCode));
        }

        if (!statusRef.get().getIsActive()) {
            throw new IllegalArgumentException(
                    String.format(
                            "Invalid statusCode: '%s'. Status code is not active.", statusCode));
        }

        if (caseType != null && !caseType.isBlank()) {
            validateCaseType(caseType);
            String orgId = TenantContext.getOrgId();
            if (orgId == null) {
                return;
            }
            Optional<DossierWorkflow> workflow = workflowResolver.resolve(orgId, caseType);
            if (workflow.isPresent() && !workflow.get().hasState(statusCode)) {
                throw new IllegalArgumentException(
                        String.format(
                                "Invalid statusCode: '%s' for caseType: '%s'. "
                                        + "Allowed status codes for this case type are: %s",
                                statusCode,
                                caseType,
                                String.join(", ", workflow.get().stateCodes())));
            }
        }
    }

    public String deriveStatusCodeFromEnumStatus(DossierStatus status) {
        return DossierStatusCodes.toCode(status);
    }

    @Transactional(readOnly = true)
    public List<String> getAllowedStatusCodesForCaseType(String caseType) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        Optional<DossierWorkflow> workflow = workflowResolver.resolve(orgId, caseType);
        if (workflow.isPresent()) {
            return workflow.get().stateCodes();
        }
        return referentialRepository
                .findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc("CASE_STATUS")
                .stream()
                .map(ReferentialEntity::getCode)
                .collect(Collectors.toList());
    }

    /** Code et libellé d'une valeur de référentiel. */
    public record Option(String code, String label) {}

    /**
     * Valeurs actives d'une catégorie : celles de l'organisation si elle en a, sinon les valeurs
     * système (ADR 0004 : une organisation ne dépend pas d'un semis pour fonctionner).
     */
    @Transactional(readOnly = true)
    public List<Option> options(String category) {
        String orgId = TenantContext.getOrgId();
        List<ReferentialEntity> rows =
                referentialRepository
                        .findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(category)
                        .stream()
                        .filter(r -> orgId == null || orgId.equals(r.getOrgId()))
                        .toList();
        if (rows.isEmpty()) {
            rows = referentialSeedingService.systemDefaults(category);
        }
        return rows.stream().map(r -> new Option(r.getCode(), r.getLabel())).toList();
    }

    /** Libellé d'un code de référentiel (organisation, sinon système), à défaut le code. */
    @Transactional(readOnly = true)
    public String label(String category, String code) {
        if (code == null) {
            return null;
        }
        return findReferentialByOrg(category, code)
                .map(ReferentialEntity::getLabel)
                .filter(l -> l != null && !l.isBlank())
                .orElse(code);
    }

    private Optional<ReferentialEntity> findReferentialByOrg(String category, String code) {
        String orgId = TenantContext.getOrgId();
        if (orgId != null && !orgId.isBlank()) {
            Optional<ReferentialEntity> referential =
                    referentialRepository.findByOrgIdAndCategoryAndCode(orgId, category, code);
            if (referential.isEmpty() && seedOnMissingReferentials) {
                log.debug(
                        "Seeding missing referentials for orgId={} before validating {}:{}",
                        orgId,
                        category,
                        code);
                referentialSeedingService.seedDefaultReferentialsForOrg(orgId);
                referential =
                        referentialRepository.findByOrgIdAndCategoryAndCode(orgId, category, code);
            }
            if (referential.isPresent()) {
                return referential;
            }
            // Pas de ligne pour l'organisation : on retombe sur le code système (ADR 0004).
            return referentialSeedingService.findSystemDefault(category, code);
        }
        Optional<ReferentialEntity> referential =
                referentialRepository.findByCategoryAndCode(category, code);
        return referential.isPresent()
                ? referential
                : referentialSeedingService.findSystemDefault(category, code);
    }
}
