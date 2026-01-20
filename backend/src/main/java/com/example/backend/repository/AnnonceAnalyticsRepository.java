package com.example.backend.repository;

import com.example.backend.entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnonceAnalyticsRepository extends JpaRepository<Annonce, Long> {

    @Query("SELECT COALESCE(SUM(a.price), 0) FROM Annonce a " +
           "WHERE a.orgId = :orgId " +
           "AND a.price IS NOT NULL")
    BigDecimal getTotalPipelineValue(@Param("orgId") String orgId);

    @Query("SELECT COALESCE(SUM(a.price), 0) FROM Annonce a " +
           "JOIN Dossier d ON d.annonceId = a.id " +
           "WHERE a.orgId = :orgId " +
           "AND d.orgId = :orgId " +
           "AND d.status = 'NEW' " +
           "AND a.price IS NOT NULL")
    BigDecimal getPipelineValueByStage(@Param("orgId") String orgId);

    @Query("SELECT COALESCE(SUM(a.price), 0) FROM Annonce a " +
           "JOIN Dossier d ON d.annonceId = a.id " +
           "WHERE a.orgId = :orgId " +
           "AND d.orgId = :orgId " +
           "AND d.status IN :statuses " +
           "AND a.price IS NOT NULL")
    BigDecimal getPipelineValueByStatuses(@Param("orgId") String orgId, @Param("statuses") List<String> statuses);

    @Query("SELECT d.source as source, COALESCE(SUM(a.price), 0) as totalValue, COUNT(d) as count " +
           "FROM Annonce a " +
           "JOIN Dossier d ON d.annonceId = a.id " +
           "WHERE a.orgId = :orgId " +
           "AND d.orgId = :orgId " +
           "AND d.status NOT IN ('WON', 'LOST') " +
           "AND a.price IS NOT NULL " +
           "GROUP BY d.source")
    List<Object[]> getPipelineValueBySource(@Param("orgId") String orgId);

    @Query("SELECT COUNT(DISTINCT d) FROM Dossier d " +
           "WHERE d.annonceId IS NOT NULL " +
           "AND d.orgId = :orgId " +
           "AND d.status NOT IN ('WON', 'LOST')")
    Long getActiveOpportunitiesCount(@Param("orgId") String orgId);

    @Query("SELECT COALESCE(AVG(a.price), 0) FROM Annonce a " +
           "JOIN Dossier d ON d.annonceId = a.id " +
           "WHERE a.orgId = :orgId " +
           "AND d.orgId = :orgId " +
           "AND d.status = 'WON' " +
           "AND a.price IS NOT NULL " +
           "AND d.updatedAt >= :startDate")
    BigDecimal getAverageWonDealValue(@Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(d) FROM Dossier d " +
           "WHERE d.annonceId IS NOT NULL " +
           "AND d.orgId = :orgId " +
           "AND d.createdAt >= :startDate " +
           "AND d.createdAt < :endDate")
    Long getTotalDossiersInPeriod(@Param("orgId") String orgId, 
                                  @Param("startDate") LocalDateTime startDate, 
                                  @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(d) FROM Dossier d " +
           "WHERE d.annonceId IS NOT NULL " +
           "AND d.orgId = :orgId " +
           "AND d.status = 'WON' " +
           "AND d.createdAt >= :startDate " +
           "AND d.createdAt < :endDate")
    Long getWonDossiersInPeriod(@Param("orgId") String orgId, 
                                @Param("startDate") LocalDateTime startDate, 
                                @Param("endDate") LocalDateTime endDate);

    @Query("SELECT d.source as source, COUNT(d) as total, " +
           "SUM(CASE WHEN d.status = 'WON' THEN 1 ELSE 0 END) as won " +
           "FROM Dossier d " +
           "WHERE d.annonceId IS NOT NULL " +
           "AND d.orgId = :orgId " +
           "AND d.createdAt >= :startDate " +
           "GROUP BY d.source")
    List<Object[]> getConversionRatesBySource(@Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT d.status as status, COUNT(d) as count, COALESCE(SUM(a.price), 0) as totalValue " +
           "FROM Dossier d " +
           "LEFT JOIN Annonce a ON d.annonceId = a.id AND a.orgId = :orgId " +
           "WHERE d.orgId = :orgId " +
           "AND d.status NOT IN ('WON', 'LOST') " +
           "GROUP BY d.status")
    List<Object[]> getPipelineMetricsByStage(@Param("orgId") String orgId);
}
