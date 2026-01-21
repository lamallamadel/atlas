package com.example.backend.repository;

import com.example.backend.entity.CoopContribution;
import com.example.backend.entity.enums.ContributionStatus;
import com.example.backend.entity.enums.ContributionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CoopContributionRepository extends JpaRepository<CoopContribution, Long>, JpaSpecificationExecutor<CoopContribution> {

    Optional<CoopContribution> findByIdAndOrgId(Long id, String orgId);

    Page<CoopContribution> findByMemberIdAndOrgId(Long memberId, String orgId, Pageable pageable);

    Page<CoopContribution> findByProjectIdAndOrgId(Long projectId, String orgId, Pageable pageable);

    Page<CoopContribution> findByStatusAndOrgId(ContributionStatus status, String orgId, Pageable pageable);

    Page<CoopContribution> findByTypeAndOrgId(ContributionType type, String orgId, Pageable pageable);

    List<CoopContribution> findByStatusAndDueDateBeforeAndOrgId(ContributionStatus status, LocalDate date, String orgId);
}
