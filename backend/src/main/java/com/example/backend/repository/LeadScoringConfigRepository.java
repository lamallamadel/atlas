package com.example.backend.repository;

import com.example.backend.entity.LeadScoringConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeadScoringConfigRepository extends JpaRepository<LeadScoringConfig, Long> {
    
    @Query("SELECT c FROM LeadScoringConfig c WHERE c.isActive = true AND c.orgId = :orgId")
    Optional<LeadScoringConfig> findActiveConfig(@Param("orgId") String orgId);
    
    Optional<LeadScoringConfig> findByConfigNameAndOrgId(String configName, String orgId);
}
