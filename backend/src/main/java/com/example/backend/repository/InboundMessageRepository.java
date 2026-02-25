package com.example.backend.repository;

import com.example.backend.entity.InboundMessageEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InboundMessageRepository extends JpaRepository<InboundMessageEntity, Long> {

    @Query("SELECT i FROM InboundMessageEntity i WHERE i.orgId = :orgId AND i.phoneNumber = :phoneNumber ORDER BY i.receivedAt DESC")
    List<InboundMessageEntity> findByOrgIdAndPhoneNumberOrderByReceivedAtDesc(
            @Param("orgId") String orgId, @Param("phoneNumber") String phoneNumber);

    @Query("SELECT i FROM InboundMessageEntity i WHERE i.orgId = :orgId AND i.processedAt IS NULL ORDER BY i.receivedAt ASC")
    List<InboundMessageEntity> findUnprocessedMessages(@Param("orgId") String orgId);

    @Query("SELECT i FROM InboundMessageEntity i WHERE i.providerMessageId = :providerMessageId")
    Optional<InboundMessageEntity> findByProviderMessageId(
            @Param("providerMessageId") String providerMessageId);

    @Query("SELECT i FROM InboundMessageEntity i WHERE i.orgId = :orgId AND i.phoneNumber = :phoneNumber AND i.receivedAt >= :since ORDER BY i.receivedAt DESC")
    List<InboundMessageEntity> findRecentMessagesByPhoneNumber(
            @Param("orgId") String orgId,
            @Param("phoneNumber") String phoneNumber,
            @Param("since") LocalDateTime since);
}
