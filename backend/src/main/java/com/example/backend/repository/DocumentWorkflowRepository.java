package com.example.backend.repository;

import com.example.backend.entity.DocumentWorkflowEntity;
import com.example.backend.entity.enums.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentWorkflowRepository extends JpaRepository<DocumentWorkflowEntity, Long> {

    Optional<DocumentWorkflowEntity> findByIdAndOrgId(Long id, String orgId);

    List<DocumentWorkflowEntity> findByDocumentIdAndOrgId(Long documentId, String orgId);

    List<DocumentWorkflowEntity> findByDossierIdAndOrgId(Long dossierId, String orgId);

    List<DocumentWorkflowEntity> findByStatusAndOrgId(WorkflowStatus status, String orgId);

    @Query("SELECT w FROM DocumentWorkflowEntity w WHERE w.orgId = :orgId AND w.status = :status AND w.currentStepOrder IS NOT NULL")
    List<DocumentWorkflowEntity> findActiveWorkflowsByStatus(@Param("orgId") String orgId, @Param("status") WorkflowStatus status);

    @Query("SELECT w FROM DocumentWorkflowEntity w WHERE w.orgId = :orgId AND w.initiatedBy = :userId ORDER BY w.createdAt DESC")
    List<DocumentWorkflowEntity> findByInitiatedBy(@Param("orgId") String orgId, @Param("userId") String userId);
}
