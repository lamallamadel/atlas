package com.example.backend.repository;

import com.example.backend.entity.WhatsAppRateLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WhatsAppRateLimitRepository extends JpaRepository<WhatsAppRateLimit, Long> {

    @Query("SELECT r FROM WhatsAppRateLimit r WHERE r.orgId = :orgId")
    Optional<WhatsAppRateLimit> findByOrgId(@Param("orgId") String orgId);
}
