package com.example.backend.repository;

import com.example.backend.entity.ScheduledReportEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduledReportRepository extends JpaRepository<ScheduledReportEntity, Long> {
    
    Page<ScheduledReportEntity> findByOrgId(String orgId, Pageable pageable);
    
    List<ScheduledReportEntity> findByOrgIdAndEnabled(String orgId, Boolean enabled);
    
    @Query("SELECT sr FROM ScheduledReportEntity sr WHERE sr.enabled = true AND sr.nextRunAt <= :now")
    List<ScheduledReportEntity> findDueReports(LocalDateTime now);
}
