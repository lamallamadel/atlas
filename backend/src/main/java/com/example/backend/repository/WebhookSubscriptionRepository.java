package com.example.backend.repository;

import com.example.backend.entity.WebhookSubscriptionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebhookSubscriptionRepository
        extends JpaRepository<WebhookSubscriptionEntity, Long> {

    List<WebhookSubscriptionEntity> findByOrgId(String orgId);

    List<WebhookSubscriptionEntity> findByOrgIdAndStatus(
            String orgId, WebhookSubscriptionEntity.WebhookStatus status);

    List<WebhookSubscriptionEntity> findByEventTypeAndStatus(
            String eventType, WebhookSubscriptionEntity.WebhookStatus status);
}
