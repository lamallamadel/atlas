package com.example.backend.repository;

import com.example.backend.entity.TenantOnboardingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantOnboardingRepository extends JpaRepository<TenantOnboardingEntity, Long> {
    Optional<TenantOnboardingEntity> findByOrgIdAndUserId(String orgId, String userId);
}
