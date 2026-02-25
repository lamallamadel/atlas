package com.example.backend.repository;

import com.example.backend.entity.ConsentEventEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsentEventRepository extends JpaRepository<ConsentEventEntity, Long> {

    List<ConsentEventEntity> findByConsentementIdOrderByCreatedAtAsc(Long consentementId);

    List<ConsentEventEntity> findByDossierIdOrderByCreatedAtDesc(Long dossierId);

    Page<ConsentEventEntity> findByDossierId(Long dossierId, Pageable pageable);

    Page<ConsentEventEntity> findByOrgIdAndCreatedAtBetween(
            String orgId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<ConsentEventEntity> findByOrgId(String orgId, Pageable pageable);

    @Query(
            "SELECT e FROM ConsentEventEntity e WHERE e.orgId = :orgId "
                    + "AND e.dossierId = :dossierId "
                    + "AND (:startDate IS NULL OR e.createdAt >= :startDate) "
                    + "AND (:endDate IS NULL OR e.createdAt <= :endDate) "
                    + "ORDER BY e.createdAt DESC")
    Page<ConsentEventEntity> findByOrgIdAndDossierIdWithDateRange(
            @Param("orgId") String orgId,
            @Param("dossierId") Long dossierId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query(
            "SELECT e FROM ConsentEventEntity e WHERE e.orgId = :orgId "
                    + "AND (:startDate IS NULL OR e.createdAt >= :startDate) "
                    + "AND (:endDate IS NULL OR e.createdAt <= :endDate) "
                    + "ORDER BY e.createdAt DESC")
    Page<ConsentEventEntity> findByOrgIdWithDateRange(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    long countByOrgIdAndCreatedAtBetween(
            String orgId, LocalDateTime startDate, LocalDateTime endDate);

    long countByDossierId(Long dossierId);
}
