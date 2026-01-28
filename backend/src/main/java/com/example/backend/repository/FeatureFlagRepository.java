package com.example.backend.repository;

import com.example.backend.entity.FeatureFlagEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlagEntity, Long> {
    Optional<FeatureFlagEntity> findByOrgIdAndFeatureKey(String orgId, String featureKey);
    List<FeatureFlagEntity> findByOrgId(String orgId);
    List<FeatureFlagEntity> findByOrgIdAndEnabled(String orgId, Boolean enabled);
}
