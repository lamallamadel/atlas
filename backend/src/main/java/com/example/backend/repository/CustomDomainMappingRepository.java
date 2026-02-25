package com.example.backend.repository;

import com.example.backend.entity.CustomDomainMappingEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomDomainMappingRepository
        extends JpaRepository<CustomDomainMappingEntity, Long> {
    List<CustomDomainMappingEntity> findByOrgId(String orgId);

    Optional<CustomDomainMappingEntity> findByDomain(String domain);

    Optional<CustomDomainMappingEntity> findByOrgIdAndIsPrimary(String orgId, Boolean isPrimary);

    List<CustomDomainMappingEntity> findByStatus(String status);
}
