package com.example.backend.repository;

import com.example.backend.entity.WorkflowTemplateEntity;
import com.example.backend.entity.enums.DocumentWorkflowType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplateEntity, Long> {

    Optional<WorkflowTemplateEntity> findByIdAndOrgId(Long id, String orgId);

    List<WorkflowTemplateEntity> findByOrgIdAndIsActiveTrue(String orgId);

    List<WorkflowTemplateEntity> findByWorkflowTypeAndOrgIdAndIsActiveTrue(DocumentWorkflowType workflowType, String orgId);

    List<WorkflowTemplateEntity> findByIsSystemTemplateTrueAndIsActiveTrue();

    @Query("SELECT t FROM WorkflowTemplateEntity t WHERE t.orgId = :orgId AND t.isActive = true ORDER BY t.usageCount DESC")
    List<WorkflowTemplateEntity> findPopularTemplates(@Param("orgId") String orgId);
}
