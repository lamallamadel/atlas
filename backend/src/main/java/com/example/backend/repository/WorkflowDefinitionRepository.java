package com.example.backend.repository;

import com.example.backend.entity.WorkflowDefinition;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowDefinitionRepository
        extends JpaRepository<WorkflowDefinition, Long>,
                JpaSpecificationExecutor<WorkflowDefinition> {

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.caseType = :caseType AND wd.fromStatus = :fromStatus AND wd.toStatus = :toStatus AND wd.isActive = true")
    Optional<WorkflowDefinition> findActiveTransition(
            @Param("orgId") String orgId,
            @Param("caseType") String caseType,
            @Param("fromStatus") String fromStatus,
            @Param("toStatus") String toStatus);

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.caseType = :caseType AND wd.fromStatus = :fromStatus AND wd.isActive = true")
    List<WorkflowDefinition> findAllowedTransitionsFrom(
            @Param("orgId") String orgId,
            @Param("caseType") String caseType,
            @Param("fromStatus") String fromStatus);

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.caseType = :caseType AND wd.isActive = true")
    List<WorkflowDefinition> findByCaseType(
            @Param("orgId") String orgId, @Param("caseType") String caseType);

    @Query("SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.isActive = true")
    List<WorkflowDefinition> findAllActive(@Param("orgId") String orgId);

    List<WorkflowDefinition> findByCaseType(String caseType);
}
