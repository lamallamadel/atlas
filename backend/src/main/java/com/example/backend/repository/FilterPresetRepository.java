package com.example.backend.repository;

import com.example.backend.entity.FilterPresetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilterPresetRepository extends JpaRepository<FilterPresetEntity, Long> {

    List<FilterPresetEntity> findByFilterTypeAndOrgId(String filterType, String orgId);

    @Query("SELECT f FROM FilterPresetEntity f WHERE f.filterType = :filterType AND f.orgId = :orgId AND (f.isShared = true OR f.createdBy = :userId)")
    List<FilterPresetEntity> findAccessibleByFilterTypeAndOrgId(
        @Param("filterType") String filterType,
        @Param("orgId") String orgId,
        @Param("userId") String userId
    );

    List<FilterPresetEntity> findByFilterTypeAndIsPredefinedTrue(String filterType);

    @Query("SELECT f FROM FilterPresetEntity f WHERE f.filterType = :filterType AND f.orgId = :orgId AND f.isPredefined = true")
    List<FilterPresetEntity> findPredefinedByFilterType(
        @Param("filterType") String filterType,
        @Param("orgId") String orgId
    );

    @Query("SELECT f FROM FilterPresetEntity f WHERE f.filterType = :filterType AND f.createdBy = :userId AND f.orgId = :orgId")
    List<FilterPresetEntity> findByFilterTypeAndCreatedBy(
        @Param("filterType") String filterType,
        @Param("userId") String userId,
        @Param("orgId") String orgId
    );
}
