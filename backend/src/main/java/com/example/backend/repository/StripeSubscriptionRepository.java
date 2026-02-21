package com.example.backend.repository;

import com.example.backend.entity.StripeSubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StripeSubscriptionRepository extends JpaRepository<StripeSubscriptionEntity, Long> {
    Optional<StripeSubscriptionEntity> findByOrgId(String orgId);
    Optional<StripeSubscriptionEntity> findByStripeCustomerId(String stripeCustomerId);
    Optional<StripeSubscriptionEntity> findByStripeSubscriptionId(String stripeSubscriptionId);
    List<StripeSubscriptionEntity> findByStatus(String status);
    
    @Query("SELECT s FROM StripeSubscriptionEntity s WHERE s.nextBillingDate <= :date AND s.status = 'active'")
    List<StripeSubscriptionEntity> findUpcomingBillingCycles(LocalDateTime date);
}
