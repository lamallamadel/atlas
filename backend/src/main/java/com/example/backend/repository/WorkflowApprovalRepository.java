package com.example.backend.repository;

import com.example.backend.entity.WorkflowApprovalEntity;
import com.example.backend.entity.enums.WorkflowStepStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowApprovalRepository extends JpaRepository<WorkflowApprovalEntity, Long> {

    Optional<WorkflowApprovalEntity> findByIdAndOrgId(Long id, String orgId);

    List<WorkflowApprovalEntity> findByWorkflowIdAndOrgId(Long workflowId, String orgId);

    List<WorkflowApprovalEntity> findByStepIdAndOrgId(Long stepId, String orgId);

    Optional<WorkflowApprovalEntity> findByStepIdAndApproverIdAndOrgId(Long stepId, String approverId, String orgId);

    List<WorkflowApprovalEntity> findByApproverIdAndDecisionIsNullAndOrgId(String approverId, String orgId);

    @Query("SELECT a FROM WorkflowApprovalEntity a WHERE a.stepId = :stepId AND a.orgId = :orgId AND a.decision = :decision")
    List<WorkflowApprovalEntity> findApprovalsByStepAndDecision(@Param("stepId") Long stepId, @Param("orgId") String orgId, @Param("decision") WorkflowStepStatus decision);
}
