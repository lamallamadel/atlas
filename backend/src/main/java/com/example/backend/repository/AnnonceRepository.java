package com.example.backend.repository;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnnonceRepository extends JpaRepository<Annonce, Long>, JpaSpecificationExecutor<Annonce> {
    Optional<Annonce> findByTitleAndCityAndAddress(String title, String city, String address);
    
    @Query("SELECT DISTINCT a.city FROM Annonce a WHERE a.city IS NOT NULL ORDER BY a.city")
    List<String> findDistinctCities();
    
    Long countByStatus(AnnonceStatus status);
    
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND a.orgId = :orgId")
    Long countByStatusAndOrgId(@Param("status") AnnonceStatus status, @Param("orgId") String orgId);
    
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate")
    Long countByStatusAndCreatedAtAfter(@Param("status") AnnonceStatus status, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND a.orgId = :orgId AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate")
    Long countByStatusAndCreatedAtAfter(@Param("status") AnnonceStatus status, @Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) < :endDate")
    Long countByStatusAndCreatedAtBetween(@Param("status") AnnonceStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.status = :status AND a.orgId = :orgId AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) >= :startDate AND COALESCE(a.createdAt, CURRENT_TIMESTAMP) < :endDate")
    Long countByStatusAndCreatedAtBetween(@Param("status") AnnonceStatus status, @Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
