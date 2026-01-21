package com.example.backend.repository;

import com.example.backend.entity.SmsProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SmsProviderConfigRepository extends JpaRepository<SmsProviderConfig, Long> {
    Optional<SmsProviderConfig> findByOrgId(String orgId);
}
