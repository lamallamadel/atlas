package com.example.backend.repository;

import com.example.backend.entity.RateLimitTier;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RateLimitTierRepository extends JpaRepository<RateLimitTier, Long> {
    Optional<RateLimitTier> findByOrgId(String orgId);
}
