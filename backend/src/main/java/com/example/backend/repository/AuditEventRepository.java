package com.example.backend.repository;

import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.enums.AuditEntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEventEntity, Long> {

    // No ORDER BY: let Pageable sorting apply
    @Query("""
        SELECT a
        FROM AuditEventEntity a
        WHERE a.orgId = :orgId
          AND a.entityType = :entityType
          AND a.entityId = :entityId
    """)
    Page<AuditEventEntity> findByOrgIdAndEntityTypeAndEntityId(
            @Param("orgId") String orgId,
            @Param("entityType") AuditEntityType entityType,
            @Param("entityId") Long entityId,
            Pageable pageable
    );

    // No ORDER BY: let Pageable sorting apply
    @Query("""
        SELECT a
        FROM AuditEventEntity a
        WHERE a.orgId = :orgId
          AND a.entityType = 'DOSSIER'
          AND a.entityId = :dossierId
    """)
    Page<AuditEventEntity> findByOrgIdAndDossierId(
            @Param("orgId") String orgId,
            @Param("dossierId") Long dossierId,
            Pageable pageable
    );
}
