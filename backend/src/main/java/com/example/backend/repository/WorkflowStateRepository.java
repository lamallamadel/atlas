package com.example.backend.repository;

import com.example.backend.entity.WorkflowState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStateRepository extends JpaRepository<WorkflowState, Long> {

    @Query("SELECT ws FROM WorkflowState ws WHERE ws.workflowDefinitionId = :workflowDefinitionId AND ws.orgId = :orgId")
    List<WorkflowState> findByWorkflowDefinitionId(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("orgId") String orgId);

    @Query("SELECT ws FROM WorkflowState ws WHERE ws.workflowDefinitionId = :workflowDefinitionId AND ws.stateCode = :stateCode AND ws.orgId = :orgId")
    Optional<WorkflowState> findByWorkflowDefinitionIdAndStateCode(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("stateCode") String stateCode,
            @Param("orgId") String orgId);

    @Query("SELECT ws FROM WorkflowState ws WHERE ws.workflowDefinitionId = :workflowDefinitionId AND ws.isInitial = true AND ws.orgId = :orgId")
    Optional<WorkflowState> findInitialState(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("orgId") String orgId);

    @Query("SELECT ws FROM WorkflowState ws WHERE ws.workflowDefinitionId = :workflowDefinitionId AND ws.isFinal = true AND ws.orgId = :orgId")
    List<WorkflowState> findFinalStates(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("orgId") String orgId);
}
