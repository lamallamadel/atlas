package com.example.backend.repository;

import com.example.backend.entity.AnnonceDossierMatch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnonceDossierMatchRepository extends JpaRepository<AnnonceDossierMatch, Long> {

    List<AnnonceDossierMatch> findByAnnonceIdOrderByScoreDescIdAsc(Long annonceId);

    /** Dernière proposition envoyée à ce dossier (la réponse du client s'y rapporte). */
    java.util.Optional<AnnonceDossierMatch>
            findFirstByOrgIdAndDossierIdAndPitchedAtIsNotNullOrderByPitchedAtDesc(
                    String orgId, Long dossierId);
}
