package com.example.backend.service;

import com.example.backend.brain.BrainClientService;
import com.example.backend.dto.BuyerMatchResponse;
import com.example.backend.dto.DossierSearchCriteria;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Matching inverse : quand une annonce est créée, modifiée ou que ses photos sont analysées, on
 * cherche les acheteurs dont les critères correspondent, on garde ceux au-dessus du seuil et on
 * prévient l'agent du dossier (une seule fois par couple annonce / acheteur).
 */
@Service
public class ReverseMatchingService {

    private static final Logger log = LoggerFactory.getLogger(ReverseMatchingService.class);

    static final Set<AnnonceStatus> MATCHABLE =
            Set.of(AnnonceStatus.ACTIVE, AnnonceStatus.PUBLISHED, AnnonceStatus.DRAFT);
    static final Set<DossierStatus> CLOSED = Set.of(DossierStatus.WON, DossierStatus.LOST);

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final AnnonceDossierMatchRepository matchRepository;
    private final NotificationService notificationService;
    private final BrainClientService brainClientService;
    private final ObjectMapper objectMapper;
    private final int threshold;
    private final org.springframework.transaction.support.TransactionTemplate newTransaction;

    public ReverseMatchingService(
            AnnonceRepository annonceRepository,
            DossierRepository dossierRepository,
            AnnonceDossierMatchRepository matchRepository,
            NotificationService notificationService,
            @Autowired(required = false) @Nullable BrainClientService brainClientService,
            ObjectMapper objectMapper,
            @Value("${atlas.matching.notify-threshold:70}") int threshold,
            org.springframework.transaction.PlatformTransactionManager transactionManager) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.matchRepository = matchRepository;
        this.notificationService = notificationService;
        this.brainClientService = brainClientService;
        this.objectMapper = objectMapper;
        this.threshold = threshold;
        this.newTransaction =
                new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(
                org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** Déclenché après création / modification d'une annonce. Ne fait jamais échouer l'appelant. */
    @Async("brainTaskExecutor")
    public void triggerAsync(Long annonceId) {
        try {
            // Transaction propre : l'appel interne à recompute() ne passe pas par le proxy Spring,
            // et
            // ce déclenchement peut venir d'un rappel « après validation » d'une autre transaction.
            newTransaction.executeWithoutResult(status -> recompute(annonceId));
        } catch (Exception e) {
            log.warn("Matching inverse de l'annonce {} échoué : {}", annonceId, e.getMessage());
        }
    }

    /**
     * Recalcule les acheteurs correspondants. Renvoie false si le brain est indisponible (les
     * correspondances existantes sont alors conservées telles quelles).
     */
    @Transactional
    public boolean recompute(Long annonceId) {
        Annonce annonce = annonceRepository.findById(annonceId).orElse(null);
        if (annonce == null) {
            return true;
        }
        List<AnnonceDossierMatch> existing =
                matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId);
        if (annonce.getStatus() == null || !MATCHABLE.contains(annonce.getStatus())) {
            deleteUnlessDismissed(existing, Set.of());
            return true;
        }

        List<Dossier> buyers =
                dossierRepository.findByOrgIdAndSearchCriteriaIsNotNullAndStatusNotIn(
                        annonce.getOrgId(), CLOSED);
        List<Map<String, Object>> acheteurs = new ArrayList<>();
        for (Dossier d : buyers) {
            DossierSearchCriteria c =
                    objectMapper.convertValue(d.getSearchCriteria(), DossierSearchCriteria.class);
            if (c != null && !c.isEmpty()) {
                acheteurs.add(
                        Map.of(
                                "client_id",
                                d.getId(),
                                "criteres",
                                DossierMatchingService.toBrainCriteria(c)));
            }
        }
        if (acheteurs.isEmpty()) {
            deleteUnlessDismissed(existing, Set.of());
            return true;
        }
        if (brainClientService == null) {
            return false;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("bien", DossierMatchingService.toBien(annonce));
        body.put("acheteurs", acheteurs);
        body.put("seuil", threshold);
        Optional<Map<String, Object>> response = brainClientService.matchBuyers(body);
        if (response.isEmpty()) {
            return false;
        }

        Map<Long, AnnonceDossierMatch> byDossier =
                existing.stream()
                        .collect(
                                Collectors.toMap(
                                        AnnonceDossierMatch::getDossierId, Function.identity()));
        Map<Long, Dossier> dossiers =
                buyers.stream().collect(Collectors.toMap(Dossier::getId, Function.identity()));
        Set<Long> kept = new java.util.HashSet<>();
        for (Map<String, Object> r : asList(response.get().get("resultats"))) {
            Long dossierId = r.get("client_id") instanceof Number n ? n.longValue() : null;
            Dossier dossier = dossiers.get(dossierId);
            if (dossier == null) {
                continue;
            }
            kept.add(dossierId);
            AnnonceDossierMatch m = byDossier.get(dossierId);
            if (m != null && AnnonceDossierMatch.STATUS_DISMISSED.equals(m.getStatus())) {
                continue; // écarté par l'agent : on ne le remet pas en avant
            }
            boolean isNew = m == null;
            if (isNew) {
                m = new AnnonceDossierMatch();
                m.setOrgId(annonce.getOrgId());
                m.setAnnonceId(annonceId);
                m.setDossierId(dossierId);
                m.setStatus(AnnonceDossierMatch.STATUS_NEW);
            }
            m.setScore(r.get("score_match") instanceof Number n ? n.intValue() : 0);
            m.setReasons(asStrings(r.get("raisons")));
            m.setAlerts(asStrings(r.get("alertes")));
            if (isNew) {
                notify(annonce, dossier, m);
            }
            matchRepository.save(m);
        }
        deleteUnlessDismissed(existing, kept);
        log.info(
                "Matching inverse annonce {} : {} acheteur(s) au-dessus de {}",
                annonceId,
                kept.size(),
                threshold);
        return true;
    }

    private void notify(Annonce annonce, Dossier dossier, AnnonceDossierMatch m) {
        try {
            String who = dossier.getLeadName() != null ? dossier.getLeadName() : "un acheteur";
            notificationService.createInAppNotification(
                    annonce.getOrgId(),
                    dossier.getId(),
                    dossier.getCreatedBy() != null ? dossier.getCreatedBy() : "equipe",
                    "Nouveau bien pour " + who + " (" + m.getScore() + "/100)",
                    "« "
                            + annonce.getTitle()
                            + " » correspond aux critères de "
                            + who
                            + (m.getReasons().isEmpty()
                                    ? "."
                                    : " : " + String.join(", ", m.getReasons()) + "."),
                    "/annonces/" + annonce.getId());
            m.setNotifiedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.warn("Notification de correspondance non envoyée : {}", e.getMessage());
        }
    }

    private void deleteUnlessDismissed(List<AnnonceDossierMatch> existing, Set<Long> kept) {
        for (AnnonceDossierMatch m : existing) {
            if (!kept.contains(m.getDossierId())
                    && !AnnonceDossierMatch.STATUS_DISMISSED.equals(m.getStatus())) {
                matchRepository.delete(m);
            }
        }
    }

    // ─── Lecture et actions de l'agent ───────────────────────────────────────

    private Annonce requireAnnonce(Long annonceId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        Annonce a =
                annonceRepository
                        .findById(annonceId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Annonce not found with id: " + annonceId));
        if (!orgId.equals(a.getOrgId())) {
            throw new EntityNotFoundException("Annonce not found with id: " + annonceId);
        }
        return a;
    }

    /** Acheteurs correspondants (les écartés en dernier). Marque les nouveaux comme vus. */
    @Transactional
    public List<BuyerMatchResponse> list(Long annonceId, boolean markSeen) {
        requireAnnonce(annonceId);
        List<AnnonceDossierMatch> matches =
                matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId);
        Map<Long, Dossier> dossiers =
                dossierRepository
                        .findAllById(
                                matches.stream().map(AnnonceDossierMatch::getDossierId).toList())
                        .stream()
                        .collect(Collectors.toMap(Dossier::getId, Function.identity()));
        List<BuyerMatchResponse> out = new ArrayList<>();
        for (AnnonceDossierMatch m : matches) {
            Dossier d = dossiers.get(m.getDossierId());
            out.add(
                    new BuyerMatchResponse(
                            m.getId(),
                            m.getDossierId(),
                            d != null ? d.getLeadName() : null,
                            d != null && d.getStatus() != null ? d.getStatus().name() : null,
                            m.getScore(),
                            nullToEmpty(m.getReasons()),
                            nullToEmpty(m.getAlerts()),
                            m.getStatus(),
                            m.getCreatedAt()));
            if (markSeen && AnnonceDossierMatch.STATUS_NEW.equals(m.getStatus())) {
                m.setStatus(AnnonceDossierMatch.STATUS_SEEN);
                matchRepository.save(m);
            }
        }
        out.sort(
                (a, b) ->
                        Boolean.compare(
                                AnnonceDossierMatch.STATUS_DISMISSED.equals(a.status()),
                                AnnonceDossierMatch.STATUS_DISMISSED.equals(b.status())));
        return out;
    }

    /** Recalcul à la demande (bouton « Actualiser »). */
    public boolean refresh(Long annonceId) {
        requireAnnonce(annonceId);
        return recompute(annonceId);
    }

    @Transactional
    public void setDismissed(Long annonceId, Long matchId, boolean dismissed) {
        requireAnnonce(annonceId);
        AnnonceDossierMatch m =
                matchRepository
                        .findById(matchId)
                        .filter(x -> x.getAnnonceId().equals(annonceId))
                        .orElseThrow(
                                () -> new EntityNotFoundException("Match not found: " + matchId));
        m.setStatus(
                dismissed ? AnnonceDossierMatch.STATUS_DISMISSED : AnnonceDossierMatch.STATUS_SEEN);
        matchRepository.save(m);
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> asList(Object o) {
        if (!(o instanceof List<?> l)) {
            return List.of();
        }
        return l.stream().filter(x -> x instanceof Map).map(x -> (Map<String, Object>) x).toList();
    }

    private static List<String> asStrings(Object o) {
        if (!(o instanceof List<?> l)) {
            return List.of();
        }
        return l.stream().filter(x -> x != null).map(Object::toString).toList();
    }

    private static List<String> nullToEmpty(List<String> l) {
        return l != null ? l : List.of();
    }
}
