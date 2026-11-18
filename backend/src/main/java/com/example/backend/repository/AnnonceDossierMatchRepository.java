package com.example.backend.repository;

import com.example.backend.entity.AnnonceDossierMatch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnonceDossierMatchRepository extends JpaRepository<AnnonceDossierMatch, Long> {

    List<AnnonceDossierMatch> findByAnnonceIdOrderByScoreDescIdAsc(Long annonceId);
}
