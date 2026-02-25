package com.example.backend.repository;

import com.example.backend.entity.AnalyticsMetricEntity;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalyticsMetricRepository extends JpaRepository<AnalyticsMetricEntity, Long> {

    List<AnalyticsMetricEntity> findByOrgIdAndMetricTypeAndMetricDateBetween(
            String orgId, String metricType, LocalDate startDate, LocalDate endDate);

    @Query(
            "SELECT am FROM AnalyticsMetricEntity am WHERE am.orgId = :orgId "
                    + "AND am.metricType = :metricType AND am.metricDate >= :startDate "
                    + "ORDER BY am.metricDate ASC")
    List<AnalyticsMetricEntity> findMetricsForTimeSeries(
            @Param("orgId") String orgId,
            @Param("metricType") String metricType,
            @Param("startDate") LocalDate startDate);

    @Query(
            "SELECT am FROM AnalyticsMetricEntity am WHERE am.orgId = :orgId "
                    + "AND am.category = :category AND am.metricDate = :date")
    List<AnalyticsMetricEntity> findByOrgIdAndCategoryAndDate(
            @Param("orgId") String orgId,
            @Param("category") String category,
            @Param("date") LocalDate date);
}
