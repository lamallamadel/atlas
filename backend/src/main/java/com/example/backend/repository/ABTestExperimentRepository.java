package com.example.backend.repository;

import com.example.backend.entity.ABTestExperiment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ABTestExperimentRepository extends JpaRepository<ABTestExperiment, Long> {
    
    @Query("SELECT e FROM ABTestExperiment e WHERE e.status = 'RUNNING' AND e.orgId = :orgId")
    List<ABTestExperiment> findRunningExperiments(@Param("orgId") String orgId);
    
    Optional<ABTestExperiment> findByExperimentNameAndOrgId(String experimentName, String orgId);
    
    List<ABTestExperiment> findByOrgIdOrderByStartedAtDesc(String orgId);
}
