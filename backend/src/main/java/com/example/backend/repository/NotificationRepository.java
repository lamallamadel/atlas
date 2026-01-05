package com.example.backend.repository;

import com.example.backend.entity.NotificationEntity;
import com.example.backend.entity.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    
    @Query("SELECT n FROM NotificationEntity n WHERE n.status = :status AND n.retryCount < n.maxRetries ORDER BY n.createdAt ASC")
    List<NotificationEntity> findPendingNotifications(@Param("status") NotificationStatus status);
}
