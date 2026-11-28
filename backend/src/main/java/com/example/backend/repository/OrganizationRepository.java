package com.example.backend.repository;

import com.example.backend.entity.OrganizationEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<OrganizationEntity, Long> {

    Optional<OrganizationEntity> findByOrgId(String orgId);

    java.util.List<OrganizationEntity> findByVerificationStatus(String verificationStatus);

    boolean existsByOwnerPhone(String ownerPhone);
}
