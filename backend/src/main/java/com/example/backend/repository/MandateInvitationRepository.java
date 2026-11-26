package com.example.backend.repository;

import com.example.backend.entity.MandateInvitationEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MandateInvitationRepository extends JpaRepository<MandateInvitationEntity, Long> {

    List<MandateInvitationEntity> findByRequestIdOrderByScoreDesc(Long requestId);

    Optional<MandateInvitationEntity> findByRequestIdAndAgencyOrgId(
            Long requestId, String agencyOrgId);

    List<MandateInvitationEntity> findByAgencyOrgId(String agencyOrgId);
}
