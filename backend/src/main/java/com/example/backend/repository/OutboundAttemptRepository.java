package com.example.backend.repository;

import com.example.backend.entity.OutboundAttemptEntity;
import com.example.backend.entity.enums.MessageChannel;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OutboundAttemptRepository extends JpaRepository<OutboundAttemptEntity, Long> {

    List<OutboundAttemptEntity> findByOutboundMessageIdOrderByAttemptNoAsc(Long outboundMessageId);

    @Query(
            "SELECT oa FROM OutboundAttemptEntity oa "
                    + "JOIN oa.outboundMessage om "
                    + "WHERE om.channel = :channel AND oa.status = 'SUCCESS' AND oa.createdAt >= :afterTime")
    List<OutboundAttemptEntity> findSuccessfulAttempts(
            @Param("channel") MessageChannel channel, @Param("afterTime") LocalDateTime afterTime);

    @Query(
            """
    SELECT (1.0 * timestampdiff( second ,oa.createdAt, oa.updatedAt) ) AS deliveryLatency
    FROM OutboundAttemptEntity oa
    JOIN oa.outboundMessage om
    WHERE om.channel = :channel
      AND oa.status = 'SUCCESS'
      AND oa.createdAt >= :afterTime
      AND oa.updatedAt IS NOT NULL
""")
    List<Double> findDeliveryLatencies(
            @Param("channel") MessageChannel channel, @Param("afterTime") LocalDateTime afterTime);
}
