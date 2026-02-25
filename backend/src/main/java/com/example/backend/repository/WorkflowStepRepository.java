package com.example.backend.repository;

import com.example.backend.entity.WorkflowStepEntity;
import com.example.backend.entity.enums.WorkflowStepStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowStepRepository extends JpaRepository<WorkflowStepEntity, Long> {

    Optional<WorkflowStepEntity> findByIdAndOrgId(Long id, String orgId);

    List<WorkflowStepEntity> findByWorkflowIdAndOrgIdOrderByStepOrder(
            Long workflowId, String orgId);

    Optional<WorkflowStepEntity> findByWorkflowIdAndStepOrderAndOrgId(
            Long workflowId, Integer stepOrder, String orgId);

    List<WorkflowStepEntity> findByWorkflowIdAndStatusAndOrgId(
            Long workflowId, WorkflowStepStatus status, String orgId);

    @Query(
            value =
                    "SELECT * FROM workflow_step WHERE org_id = :orgId AND status = :#{#status.name()} AND CAST(assigned_approvers AS VARCHAR) LIKE CONCAT('%', :approverId, '%')",
            nativeQuery = true)
    List<WorkflowStepEntity> findPendingStepsForApprover(
            @Param("orgId") String orgId,
            @Param("status") WorkflowStepStatus status,
            @Param("approverId") String approverId);
}
