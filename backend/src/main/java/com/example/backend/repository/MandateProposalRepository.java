package com.example.backend.repository;

import com.example.backend.entity.MandateProposalEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MandateProposalRepository extends JpaRepository<MandateProposalEntity, Long> {

    List<MandateProposalEntity> findByRequestIdOrderByCreatedAtAsc(Long requestId);

    Optional<MandateProposalEntity> findByRequestIdAndAgencyOrgId(
            Long requestId, String agencyOrgId);

    List<MandateProposalEntity> findByAgencyOrgIdOrderByCreatedAtDesc(String agencyOrgId);

    long countByAgencyOrgIdAndCreatedAtAfter(String agencyOrgId, LocalDateTime after);
}
