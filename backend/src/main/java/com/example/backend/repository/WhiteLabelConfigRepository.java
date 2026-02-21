package com.example.backend.repository;

import com.example.backend.entity.WhiteLabelConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WhiteLabelConfigRepository extends JpaRepository<WhiteLabelConfigEntity, Long> {
    Optional<WhiteLabelConfigEntity> findByOrgId(String orgId);

    Optional<WhiteLabelConfigEntity> findByCustomDomain(String customDomain);
}
