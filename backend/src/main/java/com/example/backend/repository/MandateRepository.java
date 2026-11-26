package com.example.backend.repository;

import com.example.backend.entity.MandateEntity;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MandateRepository extends JpaRepository<MandateEntity, Long> {

    List<MandateEntity> findByOwnerOrgIdOrderByCreatedAtDesc(String ownerOrgId);

    List<MandateEntity> findByAgencyOrgIdOrderByCreatedAtDesc(String agencyOrgId);

    List<MandateEntity> findByPropertyIdAndStatusIn(Long propertyId, Collection<String> statuses);

    Optional<MandateEntity> findByDossierId(Long dossierId);

    Optional<MandateEntity> findByProposalId(Long proposalId);

    List<MandateEntity> findByStatusAndCreatedAtBefore(String status, LocalDateTime before);

    List<MandateEntity> findByStatusAndEndsAtBefore(String status, LocalDateTime before);
}
