package com.example.backend.repository;

import com.example.backend.entity.OutboundAttemptEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutboundAttemptRepository extends JpaRepository<OutboundAttemptEntity, Long> {
    
    List<OutboundAttemptEntity> findByOutboundMessageIdOrderByAttemptNoAsc(Long outboundMessageId);
    
    @Query("SELECT AVG(EXTRACT(EPOCH FROM (oa.updatedAt - oa.createdAt))) FROM OutboundAttemptEntity oa " +
           "JOIN oa.outboundMessage om " +
           "WHERE om.channel = :channel AND oa.status = 'SUCCESS' AND oa.createdAt >= :afterTime")
    Double calculateAverageDeliveryLatency(@Param("channel") MessageChannel channel, @Param("afterTime") LocalDateTime afterTime);
}
