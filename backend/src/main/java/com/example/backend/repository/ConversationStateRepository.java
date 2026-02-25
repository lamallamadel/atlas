package com.example.backend.repository;

import com.example.backend.entity.ConversationStateEntity;
import com.example.backend.entity.enums.ConversationState;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConversationStateRepository extends JpaRepository<ConversationStateEntity, Long> {

    @Query("SELECT c FROM ConversationStateEntity c WHERE c.orgId = :orgId AND c.phoneNumber = :phoneNumber AND c.expiresAt > :now ORDER BY c.createdAt DESC")
    Optional<ConversationStateEntity> findActiveConversation(
            @Param("orgId") String orgId,
            @Param("phoneNumber") String phoneNumber,
            @Param("now") LocalDateTime now);

    @Query("SELECT c FROM ConversationStateEntity c WHERE c.orgId = :orgId AND c.appointmentId = :appointmentId AND c.expiresAt > :now")
    Optional<ConversationStateEntity> findActiveConversationByAppointment(
            @Param("orgId") String orgId,
            @Param("appointmentId") Long appointmentId,
            @Param("now") LocalDateTime now);

    @Query("SELECT c FROM ConversationStateEntity c WHERE c.expiresAt <= :now AND c.state = :state")
    List<ConversationStateEntity> findExpiredConversations(
            @Param("now") LocalDateTime now, @Param("state") ConversationState state);

    @Modifying
    @Query("UPDATE ConversationStateEntity c SET c.state = :newState, c.expiresAt = :now WHERE c.expiresAt <= :now AND c.state = :currentState")
    int expireOldConversations(
            @Param("currentState") ConversationState currentState,
            @Param("newState") ConversationState newState,
            @Param("now") LocalDateTime now);

    @Query("SELECT c FROM ConversationStateEntity c WHERE c.orgId = :orgId AND c.dossierId = :dossierId ORDER BY c.createdAt DESC")
    List<ConversationStateEntity> findByDossierId(
            @Param("orgId") String orgId, @Param("dossierId") Long dossierId);
}
