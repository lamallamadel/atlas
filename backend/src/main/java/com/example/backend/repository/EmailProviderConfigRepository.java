package com.example.backend.repository;

import com.example.backend.entity.EmailProviderConfig;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailProviderConfigRepository extends JpaRepository<EmailProviderConfig, Long> {
    Optional<EmailProviderConfig> findByOrgId(String orgId);
}
