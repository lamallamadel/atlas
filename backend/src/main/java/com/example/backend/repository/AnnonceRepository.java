package com.example.backend.repository;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnonceRepository
        extends JpaRepository<Annonce, Long>, JpaSpecificationExecutor<Annonce> {

    Optional<Annonce> findByTitleAndCityAndAddress(String title, String city, String address);

    List<Annonce> findTop10ByOrgIdOrderByCreatedAtDesc(String orgId);

    List<Annonce> findTop50ByOrgIdOrderByCreatedAtDesc(String orgId);

    List<Annonce> findByStatusAndOrgId(AnnonceStatus status, String orgId);

    /** Candidats au matching : annonces récentes de l'organisation dans les statuts donnés. */
    List<Annonce> findTop300ByOrgIdAndStatusInOrderByCreatedAtDesc(
            String orgId, java.util.Collection<AnnonceStatus> statuses);

    @Query("SELECT DISTINCT a.city FROM Annonce a WHERE a.city IS NOT NULL ORDER BY a.city")
    List<String> findDistinctCities();

    Long countByStatus(AnnonceStatus status);

    Long countByOrgIdAndStatus(String orgId, AnnonceStatus status);

    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND a.orgId = :orgId")
    Long countByStatusAndOrgId(@Param("status") AnnonceStatus status, @Param("orgId") String orgId);

    @Query(
            "SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate")
    Long countByStatusAndCreatedAtAfter(
            @Param("status") AnnonceStatus status, @Param("startDate") LocalDateTime startDate);

    @Query(
            "SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND a.orgId = :orgId AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate")
    Long countByStatusAndCreatedAtAfter(
            @Param("status") AnnonceStatus status,
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate);

    @Query(
            "SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) < :endDate")
    Long countByStatusAndCreatedAtBetween(
            @Param("status") AnnonceStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND a.orgId = :orgId AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) < :endDate")
    Long countByStatusAndCreatedAtBetween(
            @Param("status") AnnonceStatus status,
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Cas d'usage n°1 : annonce d'un bien de propriétaire, modération a priori.
    Optional<Annonce> findFirstByOrgIdAndPropertyId(String orgId, Long propertyId);

    List<Annonce> findByOrgIdAndPublisherKind(String orgId, String publisherKind);

    boolean existsByOrgIdAndModerationStatus(String orgId, String moderationStatus);

    List<Annonce> findByModerationStatusOrderByUpdatedAtAsc(String moderationStatus);
}
