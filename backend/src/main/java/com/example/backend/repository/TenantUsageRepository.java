package com.example.backend.repository;

import com.example.backend.entity.TenantUsageEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantUsageRepository extends JpaRepository<TenantUsageEntity, Long> {
    Optional<TenantUsageEntity> findByOrgIdAndPeriodStart(String orgId, LocalDateTime periodStart);

    List<TenantUsageEntity> findByOrgIdOrderByPeriodStartDesc(String orgId);

    @Query(
            "SELECT u FROM TenantUsageEntity u WHERE u.orgId = :orgId AND u.periodStart >= :startDate AND u.periodEnd <= :endDate")
    List<TenantUsageEntity> findUsageInPeriod(
            String orgId, LocalDateTime startDate, LocalDateTime endDate);
}
