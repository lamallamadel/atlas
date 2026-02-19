package com.example.backend.repository;

import com.example.backend.entity.UserBehaviorPattern;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBehaviorPatternRepository extends JpaRepository<UserBehaviorPattern, Long> {

    Optional<UserBehaviorPattern> findByOrgIdAndUserIdAndActionTypeAndContextTypeAndContextId(
            String orgId, String userId, String actionType, String contextType, Long contextId);

    @Query(
            "SELECT ubp FROM UserBehaviorPattern ubp WHERE ubp.orgId = :orgId AND ubp.userId = :userId "
                    + "ORDER BY ubp.frequencyCount DESC, ubp.lastPerformedAt DESC")
    List<UserBehaviorPattern> findTopPatternsByUser(
            @Param("orgId") String orgId, @Param("userId") String userId);

    @Query(
            "SELECT ubp FROM UserBehaviorPattern ubp WHERE ubp.orgId = :orgId AND ubp.userId = :userId "
                    + "AND ubp.contextType = :contextType ORDER BY ubp.frequencyCount DESC")
    List<UserBehaviorPattern> findByUserAndContextType(
            @Param("orgId") String orgId,
            @Param("userId") String userId,
            @Param("contextType") String contextType);
}
