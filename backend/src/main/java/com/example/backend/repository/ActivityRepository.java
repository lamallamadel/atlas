package com.example.backend.repository;

import com.example.backend.entity.ActivityEntity;
import com.example.backend.entity.enums.ActivityVisibility;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityRepository extends JpaRepository<ActivityEntity, Long> {

    Page<ActivityEntity> findByDossierIdOrderByCreatedAtDesc(Long dossierId, Pageable pageable);

    @Query(
            "SELECT a FROM ActivityEntity a WHERE a.dossier.id = :dossierId AND a.visibility = :visibility ORDER BY a.createdAt DESC")
    Page<ActivityEntity> findByDossierIdAndVisibility(
            @Param("dossierId") Long dossierId,
            @Param("visibility") ActivityVisibility visibility,
            Pageable pageable);

    @Query(
            "SELECT a FROM ActivityEntity a WHERE a.dossier.id = :dossierId AND a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    Page<ActivityEntity> findByDossierIdAndCreatedAtBetween(
            @Param("dossierId") Long dossierId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query(
            "SELECT a FROM ActivityEntity a WHERE a.dossier.id = :dossierId AND a.visibility = :visibility AND a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    Page<ActivityEntity> findByDossierIdAndVisibilityAndCreatedAtBetween(
            @Param("dossierId") Long dossierId,
            @Param("visibility") ActivityVisibility visibility,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}
