package com.example.backend.repository;

import com.example.backend.entity.WebhookDeliveryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WebhookDeliveryRepository extends JpaRepository<WebhookDeliveryEntity, Long> {
    
    Page<WebhookDeliveryEntity> findBySubscriptionId(Long subscriptionId, Pageable pageable);
    
    List<WebhookDeliveryEntity> findByStatusAndNextRetryAtBefore(
        WebhookDeliveryEntity.DeliveryStatus status, 
        LocalDateTime now
    );
    
    @Query("SELECT d FROM WebhookDeliveryEntity d WHERE d.subscriptionId = :subscriptionId ORDER BY d.createdAt DESC")
    Page<WebhookDeliveryEntity> findRecentDeliveriesBySubscriptionId(Long subscriptionId, Pageable pageable);
    
    @Query("SELECT COUNT(d) FROM WebhookDeliveryEntity d WHERE d.subscriptionId = :subscriptionId AND d.status = :status")
    long countBySubscriptionIdAndStatus(Long subscriptionId, WebhookDeliveryEntity.DeliveryStatus status);
}
