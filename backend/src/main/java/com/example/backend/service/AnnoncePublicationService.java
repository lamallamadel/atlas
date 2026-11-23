package com.example.backend.service;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Règles de publication d'une annonce (étape 4 du backlog, spec {@code
 * 10_ui_pro_listings_publication.md}).
 *
 * <pre>
 * DRAFT ──publier──▶ PUBLISHED ──suspendre──▶ SUSPENDED
 *   │                   │  ▲                     │
 *   │                   │  └──────republier──────┘
 *   └──────archiver─────┴───────archiver─────────┴──▶ ARCHIVED (fin de vie)
 * </pre>
 *
 * <p>Publier (ou republier) exige : les éléments bloquants de qualité ({@link
 * AnnonceQualityService}), pas de doublon certain ni de fraude détectés par le brain, sauf
 * dérogation d'un manager enregistrée sur l'annonce. Suspendre exige une raison.
 */
@Service
public class AnnoncePublicationService {

    public static final String T_PUBLISH = "ANN_T_PUBLISH";
    public static final String T_SUSPEND = "ANN_T_SUSPEND";
    public static final String T_ARCHIVE = "ANN_T_ARCHIVE";

    /** Raisons de suspension (nomenclature {@code MOD_*}, plus la pause demandée par l'agence). */
    public static final Set<String> SUSPEND_REASONS =
            Set.of(
                    "OWNER_PAUSE",
                    "MOD_SUSPECT_FRAUD",
                    "MOD_ILLEGAL_CONTENT",
                    "MOD_DUPLICATE_LISTING",
                    "MOD_OTHER");

    static final String DUPLICATE_CERTAIN = "DOUBLON_CERTAIN";
    static final String FRAUD_CONFIRMED = "FRAUDULEUX";
    static final String META_TRUST_OVERRIDE = "trustOverride";
    static final String META_SUSPENSION = "suspension";

    /** Une transition proposée à l'écran, avec ce qui l'empêche le cas échéant. */
    public record TransitionOption(
            String code,
            String label,
            AnnonceStatus targetStatus,
            boolean requiresReason,
            boolean allowed,
            List<Blocker> blockers) {}

    public record Blocker(String code, String message) {}

    private final AnnonceQualityService qualityService;

    public AnnoncePublicationService(AnnonceQualityService qualityService) {
        this.qualityService = qualityService;
    }

    /** Transitions possibles depuis le statut courant, avec leurs blocages. */
    public List<TransitionOption> options(Annonce annonce) {
        AnnonceStatus current = AnnonceStatus.normalize(annonce.getStatus());
        List<TransitionOption> options = new ArrayList<>();
        if (current == AnnonceStatus.DRAFT || current == AnnonceStatus.SUSPENDED) {
            List<Blocker> blockers = publicationBlockers(annonce);
            options.add(
                    new TransitionOption(
                            T_PUBLISH,
                            current == AnnonceStatus.DRAFT ? "Publier" : "Republier",
                            AnnonceStatus.PUBLISHED,
                            false,
                            blockers.isEmpty(),
                            blockers));
        }
        if (current == AnnonceStatus.PUBLISHED) {
            options.add(
                    new TransitionOption(
                            T_SUSPEND,
                            "Suspendre",
                            AnnonceStatus.SUSPENDED,
                            true,
                            true,
                            List.of()));
        }
        if (current != AnnonceStatus.ARCHIVED) {
            options.add(
                    new TransitionOption(
                            T_ARCHIVE, "Archiver", AnnonceStatus.ARCHIVED, false, true, List.of()));
        }
        return options;
    }

    /**
     * Code de transition qui mène de {@code from} à {@code to}, ou {@code null} s'il n'y en a pas.
     */
    public static String transitionCode(AnnonceStatus from, AnnonceStatus to) {
        AnnonceStatus f = AnnonceStatus.normalize(from);
        AnnonceStatus t = AnnonceStatus.normalize(to);
        if (t == AnnonceStatus.PUBLISHED
                && (f == AnnonceStatus.DRAFT || f == AnnonceStatus.SUSPENDED)) {
            return T_PUBLISH;
        }
        if (t == AnnonceStatus.SUSPENDED && f == AnnonceStatus.PUBLISHED) {
            return T_SUSPEND;
        }
        if (t == AnnonceStatus.ARCHIVED && f != AnnonceStatus.ARCHIVED) {
            return T_ARCHIVE;
        }
        return null;
    }

    /**
     * Applique une transition sur l'annonce (sans la sauvegarder). Lève 409 si la transition
     * n'existe pas depuis le statut courant, 400 si elle est bloquée ou s'il manque la raison.
     */
    public void apply(Annonce annonce, String transitionCode, String reasonCode, String comment) {
        TransitionOption option =
                options(annonce).stream()
                        .filter(o -> o.code().equals(transitionCode))
                        .findFirst()
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "TRANSITION_NOT_ALLOWED: "
                                                        + transitionCode
                                                        + " n'est pas possible depuis le statut "
                                                        + AnnonceStatus.normalize(
                                                                annonce.getStatus())));
        if (!option.allowed()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PUBLICATION_BLOCKED: "
                            + String.join(
                                    " ; ",
                                    option.blockers().stream().map(Blocker::message).toList()));
        }
        if (T_SUSPEND.equals(transitionCode)) {
            if (reasonCode == null || !SUSPEND_REASONS.contains(reasonCode)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "REASON_REQUIRED: indiquez la raison de la suspension parmi "
                                + SUSPEND_REASONS);
            }
            Map<String, Object> suspension = new LinkedHashMap<>();
            suspension.put("reasonCode", reasonCode);
            suspension.put("comment", comment);
            suspension.put("by", currentUser());
            suspension.put("at", LocalDateTime.now().toString());
            meta(annonce).put(META_SUSPENSION, suspension);
        }
        if (T_PUBLISH.equals(transitionCode)) {
            meta(annonce).remove(META_SUSPENSION);
        }
        annonce.setStatus(option.targetStatus());
    }

    /** Ce qui empêche de publier l'annonce dans son état actuel. */
    public List<Blocker> publicationBlockers(Annonce annonce) {
        List<Blocker> blockers = new ArrayList<>();
        AnnonceQualityService.Quality quality = qualityService.evaluate(annonce);
        for (AnnonceQualityService.Criterion c : quality.blockingMissing()) {
            blockers.add(new Blocker("MISSING_" + c.code(), "Manque : " + c.label()));
        }
        if (!trustOverridden(annonce)) {
            if (DUPLICATE_CERTAIN.equals(annonce.getDuplicateStatut())) {
                blockers.add(
                        new Blocker(
                                "DUPLICATE_CERTAIN",
                                "Doublon certain de l'annonce n°"
                                        + annonce.getDuplicateOfId()
                                        + " : un manager doit valider la publication"));
            }
            if (FRAUD_CONFIRMED.equals(annonce.getFraudStatut())) {
                blockers.add(
                        new Blocker(
                                "FRAUD_SUSPECTED",
                                "Annonce jugée frauduleuse par l'analyse : un manager doit"
                                        + " valider la publication"));
            }
        }
        return blockers;
    }

    /** Vrai si un signal de confiance bloquant existe (doublon certain ou fraude). */
    public static boolean hasBlockingTrustSignal(Annonce annonce) {
        return DUPLICATE_CERTAIN.equals(annonce.getDuplicateStatut())
                || FRAUD_CONFIRMED.equals(annonce.getFraudStatut());
    }

    /**
     * Dérogation d'un manager : l'annonce peut être publiée malgré le doublon ou la fraude
     * signalés. Elle vaut pour les signaux présents au moment de la dérogation ; un nouveau signal
     * (autre doublon, fraude apparue ensuite) la rend caduque.
     */
    public void overrideTrust(Annonce annonce, String reason) {
        if (!isManager()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "MANAGER_REQUIRED: seul un manager peut déroger.");
        }
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "REASON_REQUIRED: indiquez pourquoi vous dérogez.");
        }
        if (!hasBlockingTrustSignal(annonce)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "NOTHING_TO_OVERRIDE: aucun doublon ni fraude signalé.");
        }
        Map<String, Object> override = new LinkedHashMap<>();
        override.put("duplicateOfId", annonce.getDuplicateOfId());
        override.put("duplicateStatut", annonce.getDuplicateStatut());
        override.put("fraudStatut", annonce.getFraudStatut());
        override.put("reason", reason.trim());
        override.put("by", currentUser());
        override.put("at", LocalDateTime.now().toString());
        meta(annonce).put(META_TRUST_OVERRIDE, override);
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> trustOverride(Annonce annonce) {
        Object o = annonce.getMeta() == null ? null : annonce.getMeta().get(META_TRUST_OVERRIDE);
        return o instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
    }

    static boolean trustOverridden(Annonce annonce) {
        Map<String, Object> o = trustOverride(annonce);
        if (o == null) {
            return false;
        }
        boolean sameDuplicate =
                !DUPLICATE_CERTAIN.equals(annonce.getDuplicateStatut())
                        || Objects.equals(
                                asLong(o.get("duplicateOfId")), annonce.getDuplicateOfId());
        boolean sameFraud =
                !FRAUD_CONFIRMED.equals(annonce.getFraudStatut())
                        || FRAUD_CONFIRMED.equals(o.get("fraudStatut"));
        return sameDuplicate && sameFraud;
    }

    private static Long asLong(Object o) {
        return o instanceof Number n ? n.longValue() : null;
    }

    private static Map<String, Object> meta(Annonce annonce) {
        if (annonce.getMeta() == null) {
            annonce.setMeta(new HashMap<>());
        } else {
            // Copie : Hibernate détecte le changement d'une colonne JSON par sa valeur.
            annonce.setMeta(new HashMap<>(annonce.getMeta()));
        }
        return annonce.getMeta();
    }

    static boolean isManager() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(
                        a ->
                                a.equals("ROLE_ADMIN")
                                        || a.equals("ROLE_MANAGER")
                                        || a.equals("ROLE_SUPER_ADMIN"));
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }
}
