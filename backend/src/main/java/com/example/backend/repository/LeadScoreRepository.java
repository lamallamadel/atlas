package com.example.backend.repository;

import com.example.backend.entity.LeadScore;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadScoreRepository extends JpaRepository<LeadScore, Long> {
    
    Optional<LeadScore> findByDossierId(Long dossierId);
    
    @Query("SELECT ls FROM LeadScore ls WHERE ls.dossierId IN :dossierIds")
    List<LeadScore> findByDossierIdIn(@Param("dossierIds") List<Long> dossierIds);
    
    @Query("SELECT ls FROM LeadScore ls WHERE ls.orgId = :orgId ORDER BY ls.totalScore DESC")
    List<LeadScore> findTopScoresByOrgId(@Param("orgId") String orgId, Pageable pageable);
    
    @Query("SELECT ls FROM LeadScore ls WHERE ls.totalScore >= :minScore AND ls.orgId = :orgId ORDER BY ls.totalScore DESC")
    List<LeadScore> findByMinScoreAndOrgId(@Param("minScore") Integer minScore, @Param("orgId") String orgId);
}
