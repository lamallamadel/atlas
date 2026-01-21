package com.example.backend.repository;

import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long>, JpaSpecificationExecutor<MessageEntity> {
    
    @Query("SELECT m FROM MessageEntity m LEFT JOIN FETCH m.dossier WHERE m.dossier.id = :dossierId " +
           "AND (:channel IS NULL OR m.channel = :channel) " +
           "AND (:direction IS NULL OR m.direction = :direction) " +
           "AND (:startDate IS NULL OR m.timestamp >= :startDate) " +
           "AND (:endDate IS NULL OR m.timestamp <= :endDate)")
    List<MessageEntity> findByDossierIdWithFiltersUnpaged(
            @Param("dossierId") Long dossierId,
            @Param("channel") MessageChannel channel,
            @Param("direction") MessageDirection direction,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(value = "SELECT m FROM MessageEntity m WHERE m.dossier.id = :dossierId " +
           "AND (:channel IS NULL OR m.channel = :channel) " +
           "AND (:direction IS NULL OR m.direction = :direction) " +
           "AND (:startDate IS NULL OR m.timestamp >= :startDate) " +
           "AND (:endDate IS NULL OR m.timestamp <= :endDate)",
           countQuery = "SELECT COUNT(m) FROM MessageEntity m WHERE m.dossier.id = :dossierId " +
           "AND (:channel IS NULL OR m.channel = :channel) " +
           "AND (:direction IS NULL OR m.direction = :direction) " +
           "AND (:startDate IS NULL OR m.timestamp >= :startDate) " +
           "AND (:endDate IS NULL OR m.timestamp <= :endDate)")
    Page<MessageEntity> findByDossierIdWithFilters(
            @Param("dossierId") Long dossierId,
            @Param("channel") MessageChannel channel,
            @Param("direction") MessageDirection direction,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    boolean existsByProviderMessageId(String providerMessageId);
}
