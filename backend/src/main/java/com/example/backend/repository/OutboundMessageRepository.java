package com.example.backend.repository;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OutboundMessageRepository extends JpaRepository<OutboundMessageEntity, Long> {

    Optional<OutboundMessageEntity> findByOrgIdAndIdempotencyKey(
            String orgId, String idempotencyKey);

    List<OutboundMessageEntity> findByDossierId(Long dossierId);

    Page<OutboundMessageEntity> findByDossierId(Long dossierId, Pageable pageable);

    @Query(
            "SELECT om FROM OutboundMessageEntity om WHERE om.status = :status AND om.attemptCount < om.maxAttempts ORDER BY om.createdAt ASC")
    List<OutboundMessageEntity> findPendingMessages(
            @Param("status") OutboundMessageStatus status, Pageable pageable);

    @Query(
            "SELECT om FROM OutboundMessageEntity om WHERE om.status = :status AND om.updatedAt < :beforeTime ORDER BY om.updatedAt ASC")
    List<OutboundMessageEntity> findStaleMessages(
            @Param("status") OutboundMessageStatus status,
            @Param("beforeTime") LocalDateTime beforeTime,
            Pageable pageable);

    Optional<OutboundMessageEntity> findByProviderMessageId(String providerMessageId);

    long countByStatusAndOrgId(OutboundMessageStatus status, String orgId);

    long countByStatus(OutboundMessageStatus status);

    long countByStatusAndChannel(OutboundMessageStatus status, MessageChannel channel);

    long countByChannelAndAttemptCountGreaterThan(MessageChannel channel, Integer attemptCount);

    @Query(
            "SELECT om FROM OutboundMessageEntity om WHERE om.status = :status AND om.attemptCount >= :minAttempts AND om.updatedAt < :beforeTime ORDER BY om.attemptCount DESC, om.updatedAt ASC")
    List<OutboundMessageEntity> findStuckMessages(
            @Param("status") OutboundMessageStatus status,
            @Param("minAttempts") Integer minAttempts,
            @Param("beforeTime") LocalDateTime beforeTime,
            Pageable pageable);

    @Query(
            "SELECT om FROM OutboundMessageEntity om WHERE om.status = :status AND om.attemptCount >= :minAttempts ORDER BY om.attemptCount DESC, om.updatedAt ASC")
    List<OutboundMessageEntity> findMessagesNeedingEscalation(
            @Param("status") OutboundMessageStatus status,
            @Param("minAttempts") Integer minAttempts,
            Pageable pageable);

    long countByChannelAndCreatedAtAfter(MessageChannel channel, LocalDateTime afterTime);

    long countByChannelAndStatusAndCreatedAtAfter(
            MessageChannel channel, OutboundMessageStatus status, LocalDateTime afterTime);

    @Query(
            "SELECT om.channel, COUNT(om) FROM OutboundMessageEntity om WHERE om.status = :status GROUP BY om.channel")
    List<Object[]> countByStatusGroupByChannel(@Param("status") OutboundMessageStatus status);

    @Query(
            "SELECT om.channel, COUNT(om) FROM OutboundMessageEntity om WHERE om.status = :status AND om.createdAt >= :afterTime GROUP BY om.channel")
    List<Object[]> countByStatusAndCreatedAtAfterGroupByChannel(
            @Param("status") OutboundMessageStatus status,
            @Param("afterTime") LocalDateTime afterTime);

    @Query(
            "SELECT om.errorCode, COUNT(om) FROM OutboundMessageEntity om WHERE om.status = 'FAILED' AND om.createdAt >= :afterTime AND om.errorCode IS NOT NULL GROUP BY om.errorCode ORDER BY COUNT(om) DESC")
    List<Object[]> countFailuresByErrorCode(@Param("afterTime") LocalDateTime afterTime);

    @Query(
            "SELECT om FROM OutboundMessageEntity om WHERE om.status = 'FAILED' AND om.attemptCount >= om.maxAttempts ORDER BY om.updatedAt DESC")
    List<OutboundMessageEntity> findDlqMessages(Pageable pageable);

    @Query(
            "SELECT om.channel, COUNT(om) FROM OutboundMessageEntity om WHERE om.status = 'FAILED' AND om.attemptCount >= om.maxAttempts GROUP BY om.channel")
    List<Object[]> countDlqMessagesByChannel();

    @Query(
            "SELECT DATE(om.createdAt), COUNT(om) FROM OutboundMessageEntity om WHERE om.status = 'FAILED' AND om.createdAt >= :afterTime GROUP BY DATE(om.createdAt) ORDER BY DATE(om.createdAt)")
    List<Object[]> countFailuresTrendByDate(@Param("afterTime") LocalDateTime afterTime);

    long countByStatusAndCreatedAtAfter(OutboundMessageStatus status, LocalDateTime afterTime);

    @Query(
            "SELECT om FROM OutboundMessageEntity om WHERE om.channel = :channel AND om.createdAt >= :afterTime ORDER BY om.createdAt DESC")
    List<OutboundMessageEntity> findByChannelAndCreatedAtAfter(
            @Param("channel") MessageChannel channel,
            @Param("afterTime") LocalDateTime afterTime,
            Pageable pageable);

    long countByStatusAndUpdatedAtBefore(OutboundMessageStatus status, LocalDateTime beforeTime);

    @Query(
            "SELECT om FROM OutboundMessageEntity om WHERE om.orgId = :orgId AND om.status = :status")
    List<OutboundMessageEntity> findByOrgIdAndStatus(
            @Param("orgId") String orgId, @Param("status") OutboundMessageStatus status);
}
