package com.example.backend.repository;

import com.example.backend.entity.WhatsAppCostTracking;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WhatsAppCostTrackingRepository extends JpaRepository<WhatsAppCostTracking, Long> {

    @Query(
            "SELECT c FROM WhatsAppCostTracking c WHERE c.orgId = :orgId AND c.createdAt >= :startDate")
    List<WhatsAppCostTracking> findByOrgIdAndCreatedAtAfter(
            @Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate);

    @Query(
            "SELECT COALESCE(SUM(c.totalCost), 0) FROM WhatsAppCostTracking c WHERE c.orgId = :orgId AND c.createdAt >= :startDate")
    BigDecimal sumTotalCostByOrgIdAndCreatedAtAfter(
            @Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate);

    @Query(
            "SELECT COUNT(c) FROM WhatsAppCostTracking c WHERE c.orgId = :orgId AND c.createdAt >= :startDate")
    Long countByOrgIdAndCreatedAtAfter(
            @Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate);

    @Query(
            "SELECT c.conversationType, COUNT(c), SUM(c.totalCost) FROM WhatsAppCostTracking c WHERE c.orgId = :orgId AND c.createdAt >= :startDate GROUP BY c.conversationType")
    List<Object[]> findCostBreakdownByOrgIdAndCreatedAtAfter(
            @Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate);
}
