package com.example.backend.repository;

import com.example.backend.entity.CustomQueryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomQueryRepository extends JpaRepository<CustomQueryEntity, Long> {
    
    Page<CustomQueryEntity> findByOrgId(String orgId, Pageable pageable);
    
    List<CustomQueryEntity> findByOrgIdAndIsPublic(String orgId, Boolean isPublic);
    
    List<CustomQueryEntity> findByOrgIdAndCategory(String orgId, String category);
    
    List<CustomQueryEntity> findByOrgIdAndIsApproved(String orgId, Boolean isApproved);
}
