package com.example.backend.repository;

import com.example.backend.entity.WorkflowStepEntity;
import com.example.backend.entity.enums.WorkflowStepStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStepRepository extends JpaRepository<WorkflowStepEntity, Long> {

    Optional<WorkflowStepEntity> findByIdAndOrgId(Long id, String orgId);

    List<WorkflowStepEntity> findByWorkflowIdAndOrgIdOrderByStepOrder(Long workflowId, String orgId);

    Optional<WorkflowStepEntity> findByWorkflowIdAndStepOrderAndOrgId(Long workflowId, Integer stepOrder, String orgId);

    List<WorkflowStepEntity> findByWorkflowIdAndStatusAndOrgId(Long workflowId, WorkflowStepStatus status, String orgId);

    @Query("SELECT s FROM WorkflowStepEntity s WHERE s.orgId = :orgId AND s.status = :status AND :approverId MEMBER OF s.assignedApprovers")
    List<WorkflowStepEntity> findPendingStepsForApprover(@Param("orgId") String orgId, @Param("status") WorkflowStepStatus status, @Param("approverId") String approverId);
}
