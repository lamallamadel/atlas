package com.example.backend.repository;

import com.example.backend.entity.SmsRateLimit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SmsRateLimitRepository extends JpaRepository<SmsRateLimit, Long> {
    Optional<SmsRateLimit> findByOrgId(String orgId);
}
