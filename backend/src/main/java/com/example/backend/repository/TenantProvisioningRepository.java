package com.example.backend.repository;

import com.example.backend.entity.TenantProvisioningEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantProvisioningRepository
        extends JpaRepository<TenantProvisioningEntity, Long> {
    Optional<TenantProvisioningEntity> findByOrgId(String orgId);

    List<TenantProvisioningEntity> findByStatus(String status);

    List<TenantProvisioningEntity> findByAdminUserEmail(String adminUserEmail);
}
