package com.example.backend.repository;

import com.example.backend.entity.ApiUsageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApiUsageRepository extends JpaRepository<ApiUsageEntity, Long> {
    
    Optional<ApiUsageEntity> findByApiKeyIdAndUsageDateAndEndpoint(Long apiKeyId, LocalDate usageDate, String endpoint);
    
    List<ApiUsageEntity> findByApiKeyIdAndUsageDateBetween(Long apiKeyId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT u FROM ApiUsageEntity u WHERE u.orgId = :orgId AND u.usageDate BETWEEN :startDate AND :endDate")
    List<ApiUsageEntity> findByOrgIdAndDateRange(String orgId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT SUM(u.requestCount) FROM ApiUsageEntity u WHERE u.apiKeyId = :apiKeyId AND u.usageDate = :date")
    Long sumRequestCountByApiKeyIdAndDate(Long apiKeyId, LocalDate date);
}
