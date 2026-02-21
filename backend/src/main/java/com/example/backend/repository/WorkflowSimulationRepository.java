package com.example.backend.repository;

import com.example.backend.entity.WorkflowSimulation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowSimulationRepository extends JpaRepository<WorkflowSimulation, Long> {

    @Query("SELECT ws FROM WorkflowSimulation ws WHERE ws.workflowDefinitionId = :workflowDefinitionId AND ws.orgId = :orgId ORDER BY ws.createdAt DESC")
    List<WorkflowSimulation> findByWorkflowDefinitionId(
            @Param("workflowDefinitionId") Long workflowDefinitionId,
            @Param("orgId") String orgId);
}
