package com.example.backend.repository;

import com.example.backend.entity.ApiKeyEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKeyEntity, Long> {

    Optional<ApiKeyEntity> findByKeyHash(String keyHash);

    List<ApiKeyEntity> findByOrgIdAndStatus(String orgId, ApiKeyEntity.ApiKeyStatus status);

    List<ApiKeyEntity> findByOrgId(String orgId);

    long countByOrgIdAndStatus(String orgId, ApiKeyEntity.ApiKeyStatus status);
}
