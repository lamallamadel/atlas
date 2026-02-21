package com.example.backend.repository;

import com.example.backend.entity.MLModelVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MLModelVersionRepository extends JpaRepository<MLModelVersion, Long> {
    
    @Query("SELECT m FROM MLModelVersion m WHERE m.isActive = true AND m.orgId = :orgId")
    Optional<MLModelVersion> findActiveModel(@Param("orgId") String orgId);
    
    List<MLModelVersion> findByOrgIdOrderByTrainedAtDesc(String orgId);
    
    Optional<MLModelVersion> findByVersionAndOrgId(String version, String orgId);
}
