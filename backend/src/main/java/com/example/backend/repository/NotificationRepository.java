package com.example.backend.repository;

import com.example.backend.entity.NotificationEntity;
import com.example.backend.entity.enums.NotificationStatus;
import com.example.backend.entity.enums.NotificationType;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    @Query(
            "SELECT n FROM NotificationEntity n WHERE n.status = :status AND n.retryCount < n.maxRetries ORDER BY n.createdAt ASC")
    List<NotificationEntity> findPendingNotifications(@Param("status") NotificationStatus status);

    @Query(
            "SELECT n FROM NotificationEntity n WHERE "
                    + "(:dossierId IS NULL OR n.dossierId = :dossierId) AND "
                    + "(:type IS NULL OR n.type = :type) AND "
                    + "(:status IS NULL OR n.status = :status)")
    Page<NotificationEntity> findByFilters(
            @Param("dossierId") Long dossierId,
            @Param("type") NotificationType type,
            @Param("status") NotificationStatus status,
            Pageable pageable);

    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.type = 'IN_APP' AND n.readAt IS NULL")
    long countUnread();
}
