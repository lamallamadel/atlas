package com.example.backend.repository;

import com.example.backend.entity.AnnonceReport;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnonceReportRepository extends JpaRepository<AnnonceReport, Long> {

    List<AnnonceReport> findByOrgIdAndAnnonceIdOrderByCreatedAtDesc(String orgId, Long annonceId);

    List<AnnonceReport> findByOrgIdAndStatusOrderByCreatedAtDesc(String orgId, String status);

    List<AnnonceReport> findByOrgIdOrderByCreatedAtDesc(String orgId);

    Optional<AnnonceReport> findByIdAndOrgId(Long id, String orgId);

    List<AnnonceReport> findByOrgIdAndAnnonceIdAndStatus(
            String orgId, Long annonceId, String status);

    long countByOrgIdAndAnnonceIdAndStatus(String orgId, Long annonceId, String status);

    /** Anti-doublon : même visiteur, même annonce, signalement encore ouvert et récent. */
    boolean existsByAnnonceIdAndIpAddressAndStatusAndCreatedAtAfter(
            Long annonceId, String ipAddress, String status, LocalDateTime after);
}
