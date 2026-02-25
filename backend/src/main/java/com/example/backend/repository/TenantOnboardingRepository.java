package com.example.backend.repository;

import com.example.backend.entity.TenantOnboardingEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantOnboardingRepository extends JpaRepository<TenantOnboardingEntity, Long> {
    Optional<TenantOnboardingEntity> findByOrgIdAndUserId(String orgId, String userId);
}
