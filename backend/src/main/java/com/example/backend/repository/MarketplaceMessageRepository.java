package com.example.backend.repository;

import com.example.backend.entity.MarketplaceMessageEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketplaceMessageRepository
        extends JpaRepository<MarketplaceMessageEntity, Long> {

    List<MarketplaceMessageEntity> findByProposalIdOrderByCreatedAtAscIdAsc(Long proposalId);

    long countByProposalIdAndAuthorSideAndCreatedAtAfter(
            Long proposalId, String authorSide, LocalDateTime after);

    long countByProposalIdAndAuthorSide(Long proposalId, String authorSide);
}
