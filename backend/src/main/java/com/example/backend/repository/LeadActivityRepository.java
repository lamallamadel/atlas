package com.example.backend.repository;

import com.example.backend.entity.LeadActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeadActivityRepository extends JpaRepository<LeadActivity, Long> {
    List<LeadActivity> findByDossierIdOrderByCreatedAtDesc(Long dossierId);

    @org.springframework.data.jpa.repository.Query(
            "SELECT COUNT(a) FROM LeadActivity a JOIN a.dossier d WHERE d.annonceId = :annonceId AND a.createdAt >= :startDate")
    Long countActivitiesByAnnonceIdAndCreatedAtAfter(
            @org.springframework.data.repository.query.Param("annonceId") Long annonceId,
            @org.springframework.data.repository.query.Param("startDate")
                    java.time.LocalDateTime startDate);
}
