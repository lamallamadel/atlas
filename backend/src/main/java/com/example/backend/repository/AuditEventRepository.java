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
    
    @Query("SELECT a FROM AuditEventEntity a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    Page<AuditEventEntity> findByEntityTypeAndEntityId(
            @Param("entityType") AuditEntityType entityType,
            @Param("entityId") Long entityId,
            Pageable pageable);
    
    @Query("SELECT a FROM AuditEventEntity a WHERE a.entityType = 'DOSSIER' AND a.entityId = :dossierId ORDER BY a.createdAt DESC")
    Page<AuditEventEntity> findByDossierId(
            @Param("dossierId") Long dossierId,
            Pageable pageable);
}
