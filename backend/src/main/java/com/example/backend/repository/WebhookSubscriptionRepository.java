package com.example.backend.repository;

import com.example.backend.entity.WebhookSubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookSubscriptionRepository extends JpaRepository<WebhookSubscriptionEntity, Long> {
    
    List<WebhookSubscriptionEntity> findByOrgId(String orgId);
    
    List<WebhookSubscriptionEntity> findByOrgIdAndStatus(String orgId, WebhookSubscriptionEntity.WebhookStatus status);
    
    List<WebhookSubscriptionEntity> findByEventTypeAndStatus(String eventType, WebhookSubscriptionEntity.WebhookStatus status);
}
