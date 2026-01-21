package com.example.backend.service;

import com.example.backend.entity.ReferentialEntity;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.ReferentialRepository;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.util.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DossierStatusCodeValidationService {

    private final ReferentialRepository referentialRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;

    public DossierStatusCodeValidationService(
            ReferentialRepository referentialRepository,
            WorkflowDefinitionRepository workflowDefinitionRepository) {
        this.referentialRepository = referentialRepository;
        this.workflowDefinitionRepository = workflowDefinitionRepository;
    }

    @Transactional(readOnly = true)
    public void validateCaseType(String caseType) {
        if (caseType == null || caseType.isBlank()) {
            return;
        }

        Optional<ReferentialEntity> caseTypeRef = referentialRepository.findByCategoryAndCode("CASE_TYPE", caseType);
        if (caseTypeRef.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format("Invalid caseType: '%s'. Case type does not exist in CASE_TYPE referential.", caseType));
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

        Optional<ReferentialEntity> statusRef = referentialRepository.findByCategoryAndCode("CASE_STATUS", statusCode);
        if (statusRef.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format("Invalid statusCode: '%s'. Status code does not exist in CASE_STATUS referential.", statusCode));
        }

        if (!statusRef.get().getIsActive()) {
            throw new IllegalArgumentException(
                    String.format("Invalid statusCode: '%s'. Status code is not active.", statusCode));
        }

        if (caseType != null && !caseType.isBlank()) {
            validateCaseType(caseType);

            String orgId = TenantContext.getOrgId();
            if (orgId == null) {
                return;
            }

            List<WorkflowDefinition> allowedTransitions = workflowDefinitionRepository.findByCaseType(orgId, caseType);
            
            if (!allowedTransitions.isEmpty()) {
                List<String> allowedStatusCodes = allowedTransitions.stream()
                        .map(WorkflowDefinition::getToStatus)
                        .distinct()
                        .collect(Collectors.toList());

                List<WorkflowDefinition> fromTransitions = workflowDefinitionRepository.findByCaseType(orgId, caseType);
                allowedStatusCodes.addAll(fromTransitions.stream()
                        .map(WorkflowDefinition::getFromStatus)
                        .distinct()
                        .collect(Collectors.toList()));
                allowedStatusCodes = allowedStatusCodes.stream().distinct().collect(Collectors.toList());

                if (!allowedStatusCodes.contains(statusCode)) {
                    throw new IllegalArgumentException(
                            String.format("Invalid statusCode: '%s' for caseType: '%s'. " +
                                    "Allowed status codes for this case type are: %s",
                                    statusCode, caseType, String.join(", ", allowedStatusCodes)));
                }
            }
        }
    }

    public String deriveStatusCodeFromEnumStatus(DossierStatus status) {
        if (status == null) {
            return null;
        }
        return status.name();
    }

    @Transactional(readOnly = true)
    public List<String> getAllowedStatusCodesForCaseType(String caseType) {
        if (caseType == null || caseType.isBlank()) {
            List<ReferentialEntity> allStatuses = referentialRepository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc("CASE_STATUS");
            return allStatuses.stream()
                    .map(ReferentialEntity::getCode)
                    .collect(Collectors.toList());
        }

        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        List<WorkflowDefinition> allowedTransitions = workflowDefinitionRepository.findByCaseType(orgId, caseType);
        
        if (allowedTransitions.isEmpty()) {
            List<ReferentialEntity> allStatuses = referentialRepository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc("CASE_STATUS");
            return allStatuses.stream()
                    .map(ReferentialEntity::getCode)
                    .collect(Collectors.toList());
        }

        List<String> allowedStatusCodes = allowedTransitions.stream()
                .map(WorkflowDefinition::getToStatus)
                .distinct()
                .collect(Collectors.toList());

        allowedStatusCodes.addAll(allowedTransitions.stream()
                .map(WorkflowDefinition::getFromStatus)
                .distinct()
                .collect(Collectors.toList()));

        return allowedStatusCodes.stream().distinct().collect(Collectors.toList());
    }
}
