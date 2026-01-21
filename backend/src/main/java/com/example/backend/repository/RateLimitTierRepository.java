package com.example.backend.repository;

import com.example.backend.entity.RateLimitTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RateLimitTierRepository extends JpaRepository<RateLimitTier, Long> {
    Optional<RateLimitTier> findByOrgId(String orgId);
}
