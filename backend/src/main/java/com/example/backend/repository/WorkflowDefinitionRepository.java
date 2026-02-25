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
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.caseType = :caseType AND wd.isActive = true AND wd.isPublished = true ORDER BY wd.version DESC")
    Optional<WorkflowDefinition> findActiveWorkflowByCaseType(
            @Param("orgId") String orgId, @Param("caseType") String caseType);

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.caseType = :caseType AND wd.isActive = true")
    List<WorkflowDefinition> findByCaseType(
            @Param("orgId") String orgId, @Param("caseType") String caseType);

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.caseType = :caseType ORDER BY wd.version DESC")
    List<WorkflowDefinition> findAllVersionsByCaseType(
            @Param("orgId") String orgId, @Param("caseType") String caseType);

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.isTemplate = true AND wd.templateCategory = :category")
    List<WorkflowDefinition> findTemplatesByCategory(
            @Param("orgId") String orgId, @Param("category") String category);

    @Query("SELECT wd FROM WorkflowDefinition wd WHERE wd.isTemplate = true")
    List<WorkflowDefinition> findAllTemplates();

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.isActive = true AND wd.isPublished = true")
    List<WorkflowDefinition> findAllActivePublished(@Param("orgId") String orgId);

    @Query(
            "SELECT wd FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.parentVersionId = :parentVersionId")
    List<WorkflowDefinition> findChildVersions(
            @Param("orgId") String orgId, @Param("parentVersionId") Long parentVersionId);

    @Query(
            "SELECT MAX(wd.version) FROM WorkflowDefinition wd WHERE wd.orgId = :orgId AND wd.caseType = :caseType")
    Optional<Integer> findMaxVersionByCaseType(
            @Param("orgId") String orgId, @Param("caseType") String caseType);

    @Deprecated
    default Optional<WorkflowDefinition> findActiveTransition(
            String orgId, String caseType, String fromStatus, String toStatus) {
        return Optional.empty();
    }

    @Deprecated
    default List<WorkflowDefinition> findAllowedTransitionsFrom(
            String orgId, String caseType, String fromStatus) {
        return List.of();
    }
}
