package com.example.backend.repository;

import com.example.backend.entity.TenantProvisioningEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantProvisioningRepository extends JpaRepository<TenantProvisioningEntity, Long> {
    Optional<TenantProvisioningEntity> findByOrgId(String orgId);
    List<TenantProvisioningEntity> findByStatus(String status);
    List<TenantProvisioningEntity> findByAdminUserEmail(String adminUserEmail);
}
