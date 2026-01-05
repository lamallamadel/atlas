package com.example.backend.repository;

import com.example.backend.entity.WhatsAppProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WhatsAppProviderConfigRepository extends JpaRepository<WhatsAppProviderConfig, Long> {
    Optional<WhatsAppProviderConfig> findByOrgId(String orgId);
}
