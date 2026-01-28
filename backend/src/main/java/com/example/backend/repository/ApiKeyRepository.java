package com.example.backend.repository;

import com.example.backend.entity.ApiKeyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKeyEntity, Long> {
    
    Optional<ApiKeyEntity> findByKeyHash(String keyHash);
    
    List<ApiKeyEntity> findByOrgIdAndStatus(String orgId, ApiKeyEntity.ApiKeyStatus status);
    
    List<ApiKeyEntity> findByOrgId(String orgId);
    
    @Query("SELECT COUNT(k) FROM ApiKeyEntity k WHERE k.orgId = :orgId AND k.status = 'ACTIVE'")
    long countActiveKeysByOrgId(String orgId);
}
