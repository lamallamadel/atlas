package com.example.backend.repository;

import com.example.backend.entity.UserPreferencesEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPreferencesRepository extends JpaRepository<UserPreferencesEntity, Long> {

    @Query("SELECT u FROM UserPreferencesEntity u WHERE u.userId = :userId AND u.orgId = :orgId")
    Optional<UserPreferencesEntity> findByUserIdAndOrgId(
            @Param("userId") String userId, @Param("orgId") String orgId);

    @Query(
            "SELECT COUNT(u) > 0 FROM UserPreferencesEntity u WHERE u.userId = :userId AND u.orgId = :orgId")
    boolean existsByUserIdAndOrgId(@Param("userId") String userId, @Param("orgId") String orgId);

    void deleteByUserIdAndOrgId(String userId, String orgId);
}
