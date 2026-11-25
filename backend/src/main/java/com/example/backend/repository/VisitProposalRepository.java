package com.example.backend.repository;

import com.example.backend.entity.VisitProposalEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitProposalRepository extends JpaRepository<VisitProposalEntity, Long> {

    List<VisitProposalEntity> findByDossierIdOrderByStartTimeAsc(Long dossierId);

    List<VisitProposalEntity> findByDossierIdAndStatus(Long dossierId, String status);
}
