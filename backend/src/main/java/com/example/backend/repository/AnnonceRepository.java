package com.example.backend.repository;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnnonceRepository extends JpaRepository<Annonce, Long>, JpaSpecificationExecutor<Annonce> {
    Optional<Annonce> findByTitleAndCityAndAddress(String title, String city, String address);
    
    @Query("SELECT DISTINCT a.city FROM Annonce a WHERE a.city IS NOT NULL ORDER BY a.city")
    List<String> findDistinctCities();
    
    Long countByStatus(AnnonceStatus status);
}
