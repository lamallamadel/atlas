package com.example.backend.repository;

import com.example.backend.entity.EmailProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailProviderConfigRepository extends JpaRepository<EmailProviderConfig, Long> {
    Optional<EmailProviderConfig> findByOrgId(String orgId);
}
