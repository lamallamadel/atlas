package com.example.backend.repository;

import com.example.backend.entity.WorkflowTransition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, Long> {

    Page<WorkflowTransition> findByDossierId(Long dossierId, Pageable pageable);

    List<WorkflowTransition> findByDossierId(Long dossierId);

    @Query("SELECT wt FROM WorkflowTransition wt WHERE wt.dossierId = :dossierId AND wt.isAllowed = false")
    List<WorkflowTransition> findFailedTransitionsByDossierId(@Param("dossierId") Long dossierId);

    @Query("SELECT wt FROM WorkflowTransition wt WHERE wt.orgId = :orgId AND wt.transitionedAt >= :startDate")
    List<WorkflowTransition> findByOrgIdAndTransitionedAtAfter(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(wt) FROM WorkflowTransition wt WHERE wt.orgId = :orgId AND wt.isAllowed = false AND wt.transitionedAt >= :startDate")
    Long countFailedTransitions(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate);
}
