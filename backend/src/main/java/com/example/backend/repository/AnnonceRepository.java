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

    /** Annonce publiée par une agence sous ce mandat (lot B). */
    Optional<Annonce> findFirstByMandateIdOrderByIdAsc(Long mandateId);

    /** Annonces d'un même bien (toutes organisations ; lecture portail ou sans filtre). */
    List<Annonce> findByPropertyIdOrderByIdAsc(Long propertyId);

    List<Annonce> findByOrgIdAndPublisherKind(String orgId, String publisherKind);

    boolean existsByOrgIdAndModerationStatus(String orgId, String moderationStatus);

    List<Annonce> findByModerationStatusOrderByUpdatedAtAsc(String moderationStatus);

    // Facettes du portail : valeurs réellement présentes parmi les annonces publiées.

    @Query(
            "select distinct a.city from Annonce a where a.status = :status and a.city is not null"
                    + " order by a.city")
    List<String> findPublicCities(@Param("status") AnnonceStatus status);

    @Query(
            "select distinct a.category from Annonce a where a.status = :status"
                    + " and a.category is not null order by a.category")
    List<String> findPublicCategories(@Param("status") AnnonceStatus status);

    @Query(
            "select distinct a.category from Annonce a where a.status = :status"
                    + " and a.category is not null and a.city = :city order by a.category")
    List<String> findPublicCategoriesInCity(
            @Param("status") AnnonceStatus status, @Param("city") String city);

    @Query(
            "select distinct p.district from Annonce a, PropertyEntity p where a.propertyId = p.id"
                    + " and a.status = :status and p.district is not null and a.city = :city"
                    + " order by p.district")
    List<String> findPublicDistrictsInCity(
            @Param("status") AnnonceStatus status, @Param("city") String city);

    /** Annonces publiées d'une ville, toutes agences, pour le repère de prix du propriétaire. */
    @Query(
            "select a from Annonce a where a.status = :status and lower(a.city) = lower(:city)"
                    + " and a.type in :types and a.surface > 0 and a.price > 0")
    List<Annonce> findPublishedPricedInCity(
            @Param("status") AnnonceStatus status,
            @Param("city") String city,
            @Param("types")
                    java.util.Collection<com.example.backend.entity.enums.AnnonceType> types);
}
