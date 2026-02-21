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
    @Query(
            """
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
            Pageable pageable);

    // Aggregate all audit events for a dossier including related entities (parties, messages,
    // appointments)
    @Query(
            """
        SELECT a
        FROM AuditEventEntity a
        WHERE a.orgId = :orgId
          AND (
            (a.entityType = 'DOSSIER' AND a.entityId = :dossierId)
            OR (a.entityType = 'PARTIE_PRENANTE' AND a.entityId IN (
                SELECT p.id FROM PartiePrenanteEntity p WHERE p.dossier.id = :dossierId
            ))
            OR (a.entityType = 'MESSAGE' AND a.entityId IN (
                SELECT m.id FROM MessageEntity m WHERE m.dossier.id = :dossierId
            ))
            OR (a.entityType = 'APPOINTMENT' AND a.entityId IN (
                SELECT ap.id FROM AppointmentEntity ap WHERE ap.dossier.id = :dossierId
            ))
          )
    """)
    Page<AuditEventEntity> findByOrgIdAndDossierId(
            @Param("orgId") String orgId, @Param("dossierId") Long dossierId, Pageable pageable);
}
