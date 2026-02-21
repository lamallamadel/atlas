package com.example.backend.repository;

import com.example.backend.entity.DocumentAuditEntity;
import com.example.backend.entity.enums.DocumentActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DocumentAuditRepository extends JpaRepository<DocumentAuditEntity, Long> {

    List<DocumentAuditEntity> findByDocumentIdAndOrgIdOrderByActionAtDesc(Long documentId, String orgId);

    List<DocumentAuditEntity> findByWorkflowIdAndOrgIdOrderByActionAtDesc(Long workflowId, String orgId);

    List<DocumentAuditEntity> findByActionTypeAndOrgId(DocumentActionType actionType, String orgId);

    @Query("SELECT a FROM DocumentAuditEntity a WHERE a.documentId = :documentId AND a.orgId = :orgId AND a.actionAt >= :since ORDER BY a.actionAt DESC")
    List<DocumentAuditEntity> findRecentAuditTrail(@Param("documentId") Long documentId, @Param("orgId") String orgId, @Param("since") LocalDateTime since);

    @Query("SELECT a FROM DocumentAuditEntity a WHERE a.actionBy = :userId AND a.orgId = :orgId ORDER BY a.actionAt DESC")
    List<DocumentAuditEntity> findByUser(@Param("userId") String userId, @Param("orgId") String orgId);
}
