package com.example.backend.repository;

import com.example.backend.entity.WorkflowTransitionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowTransitionRuleRepository extends JpaRepository<WorkflowTransitionRule, Long> {

    @Query("SELECT wtr FROM WorkflowTransitionRule wtr WHERE wtr.workflowDefinitionId = :workflowDefinitionId AND wtr.orgId = :orgId")
    List<WorkflowTransitionRule> findByWorkflowDefinitionId(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("orgId") String orgId);

    @Query("SELECT wtr FROM WorkflowTransitionRule wtr WHERE wtr.workflowDefinitionId = :workflowDefinitionId AND wtr.fromState = :fromState AND wtr.isActive = true AND wtr.orgId = :orgId ORDER BY wtr.priority")
    List<WorkflowTransitionRule> findActiveTransitionsFrom(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("fromState") String fromState,
            @Param("orgId") String orgId);

    @Query("SELECT wtr FROM WorkflowTransitionRule wtr WHERE wtr.workflowDefinitionId = :workflowDefinitionId AND wtr.fromState = :fromState AND wtr.toState = :toState AND wtr.isActive = true AND wtr.orgId = :orgId")
    Optional<WorkflowTransitionRule> findActiveTransition(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("fromState") String fromState,
            @Param("toState") String toState,
            @Param("orgId") String orgId);
}
