package com.example.backend.repository;

import com.example.backend.entity.OrganizationSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationSettingsRepository extends JpaRepository<OrganizationSettings, Long> {

    Optional<OrganizationSettings> findByOrgId(String orgId);

    boolean existsByOrgId(String orgId);

    void deleteByOrgId(String orgId);
}
