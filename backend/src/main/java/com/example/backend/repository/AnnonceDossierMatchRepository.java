package com.example.backend.repository;

import com.example.backend.entity.AnnonceDossierMatch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnonceDossierMatchRepository extends JpaRepository<AnnonceDossierMatch, Long> {

    List<AnnonceDossierMatch> findByAnnonceIdOrderByScoreDescIdAsc(Long annonceId);

    /**
     * Clients qui ont répondu (visite, intérêt, prix, question) avant {@code before} sans visite
     * planifiée, et dont cette réponse n'a pas encore été examinée pour relance.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT m FROM AnnonceDossierMatch m WHERE m.replyIntent IN :intents"
                    + " AND m.replyAt < :before AND m.replyAt > :since"
                    + " AND m.visitAppointmentId IS NULL AND m.status <> 'DISMISSED'"
                    + " AND (m.followUpNotifiedAt IS NULL OR m.followUpNotifiedAt < m.replyAt)")
    List<AnnonceDossierMatch> findAwaitingAgentReply(
            @org.springframework.data.repository.query.Param("intents")
                    java.util.Collection<String> intents,
            @org.springframework.data.repository.query.Param("before")
                    java.time.LocalDateTime before,
            @org.springframework.data.repository.query.Param("since")
                    java.time.LocalDateTime since);

    /** Propositions restées sans réponse du client, jamais relancées. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT m FROM AnnonceDossierMatch m WHERE m.pitchedAt < :before AND m.pitchedAt > :since"
                    + " AND m.replyIntent IS NULL AND m.status <> 'DISMISSED'"
                    + " AND m.followUpNotifiedAt IS NULL")
    List<AnnonceDossierMatch> findSilentClients(
            @org.springframework.data.repository.query.Param("before")
                    java.time.LocalDateTime before,
            @org.springframework.data.repository.query.Param("since")
                    java.time.LocalDateTime since);

    /** Propositions récentes ou avec visite de l'organisation (page « Mes relances »). */
    @org.springframework.data.jpa.repository.Query(
            "SELECT m FROM AnnonceDossierMatch m WHERE m.orgId = :orgId AND m.status <> 'DISMISSED'"
                    + " AND (m.pitchedAt > :since OR m.visitAppointmentId IS NOT NULL)"
                    + " ORDER BY m.id DESC")
    List<AnnonceDossierMatch> findInbox(
            @org.springframework.data.repository.query.Param("orgId") String orgId,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since,
            org.springframework.data.domain.Pageable page);

    /** Dernière proposition envoyée à ce dossier (la réponse du client s'y rapporte). */
    java.util.Optional<AnnonceDossierMatch>
            findFirstByOrgIdAndDossierIdAndPitchedAtIsNotNullOrderByPitchedAtDesc(
                    String orgId, Long dossierId);
}
