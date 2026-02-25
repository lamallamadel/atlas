package com.example.backend.repository;

import com.example.backend.entity.MLPrediction;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MLPredictionRepository extends JpaRepository<MLPrediction, Long> {

    Optional<MLPrediction> findTopByDossierIdOrderByPredictedAtDesc(Long dossierId);

    List<MLPrediction> findByDossierIdOrderByPredictedAtDesc(Long dossierId);

    @Query(
            "SELECT p FROM MLPrediction p WHERE p.orgId = :orgId "
                    + "AND p.predictedAt >= :startDate AND p.predictedAt <= :endDate")
    List<MLPrediction> findByOrgIdAndDateRange(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p FROM MLPrediction p WHERE p.modelVersion = :version AND p.orgId = :orgId")
    List<MLPrediction> findByModelVersionAndOrgId(
            @Param("version") String version, @Param("orgId") String orgId, Pageable pageable);

    @Query(
            "SELECT p FROM MLPrediction p WHERE p.actualOutcome IS NOT NULL "
                    + "AND p.modelVersion = :version AND p.orgId = :orgId")
    List<MLPrediction> findPredictionsWithOutcomeByModelVersion(
            @Param("version") String version, @Param("orgId") String orgId);
}
