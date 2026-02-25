package com.example.backend.repository;

import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsentementRepository extends JpaRepository<ConsentementEntity, Long> {

    List<ConsentementEntity> findByDossierId(Long dossierId);

    List<ConsentementEntity> findByDossierIdOrderByUpdatedAtDesc(Long dossierId);

    List<ConsentementEntity> findByDossierIdAndChannelOrderByUpdatedAtDesc(
            Long dossierId, ConsentementChannel channel);

    List<ConsentementEntity> findByDossierIdAndChannelAndConsentTypeOrderByUpdatedAtDesc(
            Long dossierId, ConsentementChannel channel, ConsentementType consentType);

    Page<ConsentementEntity> findByDossierId(Long dossierId, Pageable pageable);

    Page<ConsentementEntity> findByDossierIdAndChannel(
            Long dossierId, ConsentementChannel channel, Pageable pageable);

    List<ConsentementEntity> findByStatusAndExpiresAtBefore(
            ConsentementStatus status, LocalDateTime dateTime);

    List<ConsentementEntity> findByStatusAndExpiresAtBetween(
            ConsentementStatus status, LocalDateTime start, LocalDateTime end);
}
