package com.example.backend.repository;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutboundMessageRepository extends JpaRepository<OutboundMessageEntity, Long> {
    
    Optional<OutboundMessageEntity> findByOrgIdAndIdempotencyKey(String orgId, String idempotencyKey);
    
    List<OutboundMessageEntity> findByDossierId(Long dossierId);
    
    Page<OutboundMessageEntity> findByDossierId(Long dossierId, Pageable pageable);
    
    @Query("SELECT om FROM OutboundMessageEntity om WHERE om.status = :status AND om.attemptCount < om.maxAttempts ORDER BY om.createdAt ASC")
    List<OutboundMessageEntity> findPendingMessages(@Param("status") OutboundMessageStatus status, Pageable pageable);
    
    @Query("SELECT om FROM OutboundMessageEntity om WHERE om.status = :status AND om.updatedAt < :beforeTime ORDER BY om.updatedAt ASC")
    List<OutboundMessageEntity> findStaleMessages(@Param("status") OutboundMessageStatus status, @Param("beforeTime") LocalDateTime beforeTime, Pageable pageable);
    
    Optional<OutboundMessageEntity> findByProviderMessageId(String providerMessageId);
    
    long countByStatusAndOrgId(OutboundMessageStatus status, String orgId);
    
    long countByStatus(OutboundMessageStatus status);
    
    long countByStatusAndChannel(OutboundMessageStatus status, MessageChannel channel);
    
    long countByChannelAndAttemptCountGreaterThan(MessageChannel channel, Integer attemptCount);
    
    @Query("SELECT om FROM OutboundMessageEntity om WHERE om.status = :status AND om.attemptCount >= :minAttempts AND om.updatedAt < :beforeTime ORDER BY om.attemptCount DESC, om.updatedAt ASC")
    List<OutboundMessageEntity> findStuckMessages(@Param("status") OutboundMessageStatus status, @Param("minAttempts") Integer minAttempts, @Param("beforeTime") LocalDateTime beforeTime, Pageable pageable);
}
