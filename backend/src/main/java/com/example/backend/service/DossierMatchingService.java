package com.example.backend.service;

import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.MatchRequest;
import com.example.backend.brain.dto.MatchResponse;
import com.example.backend.dto.DossierMatchesResponse;
import com.example.backend.dto.DossierSearchCriteria;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Critères de recherche d'un dossier et biens correspondants. Le calcul (filtres + score
 * explicable) est fait par le brain ; ce service prépare les données et enrichit le résultat.
 */
@Service
public class DossierMatchingService {

    public enum Scope {
        /** Annonces actives, publiées et brouillons. */
        ALL(Set.of(AnnonceStatus.ACTIVE, AnnonceStatus.PUBLISHED, AnnonceStatus.DRAFT)),
        /** Brouillons uniquement : biens pas encore diffusés. */
        OFF_MARKET(Set.of(AnnonceStatus.DRAFT));

        final Set<AnnonceStatus> statuses;

        Scope(Set<AnnonceStatus> statuses) {
            this.statuses = statuses;
        }
    }

    static final Set<String> TRANSACTION_TYPES =
            Set.of("SALE", "RENT", "RENTAL", "LEASE", "EXCHANGE");
    static final Set<String> CONDITIONS = Set.of("neuf", "bon_etat", "a_rafraichir", "a_renover");

    private final DossierRepository dossierRepository;
    private final AnnonceRepository annonceRepository;
    private final BrainClientService brainClientService;
    private final ObjectMapper objectMapper;

    public DossierMatchingService(
            DossierRepository dossierRepository,
            AnnonceRepository annonceRepository,
            @Autowired(required = false) @Nullable BrainClientService brainClientService,
            ObjectMapper objectMapper) {
        this.dossierRepository = dossierRepository;
        this.annonceRepository = annonceRepository;
        this.brainClientService = brainClientService;
        this.objectMapper = objectMapper;
    }

    private Dossier requireDossier(Long dossierId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }
        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found: " + dossierId));
        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found: " + dossierId);
        }
        return dossier;
    }

    @Transactional(readOnly = true)
    public Optional<DossierSearchCriteria> getCriteria(Long dossierId) {
        return toCriteria(requireDossier(dossierId).getSearchCriteria());
    }

    @Transactional
    public DossierSearchCriteria saveCriteria(Long dossierId, DossierSearchCriteria criteria) {
        validate(criteria);
        Dossier dossier = requireDossier(dossierId);
        DossierSearchCriteria clean = normalize(criteria);
        @SuppressWarnings("unchecked")
        Map<String, Object> asMap = objectMapper.convertValue(clean, Map.class);
        dossier.setSearchCriteria(asMap);
        dossier.setSearchCriteriaUpdatedAt(LocalDateTime.now());
        dossierRepository.save(dossier);
        return clean;
    }

    /**
     * Biens correspondant aux critères. Vide si le dossier n'a pas de critères ; {@code
     * Optional.empty()} si le brain est indisponible.
     */
    @Transactional(readOnly = true)
    public Optional<DossierMatchesResponse> findMatches(Long dossierId, Scope scope, int limit) {
        Dossier dossier = requireDossier(dossierId);
        Optional<DossierSearchCriteria> criteria = toCriteria(dossier.getSearchCriteria());
        if (criteria.isEmpty() || criteria.get().isEmpty()) {
            throw new IllegalArgumentException("Renseignez au moins un critère de recherche");
        }
        List<Annonce> candidates =
                annonceRepository.findTop300ByOrgIdAndStatusInOrderByCreatedAtDesc(
                        dossier.getOrgId(), scope.statuses);
        if (candidates.isEmpty()) {
            return Optional.of(
                    new DossierMatchesResponse(
                            scope.name(),
                            0,
                            Map.of(),
                            List.of(),
                            dossier.getSearchCriteriaUpdatedAt()));
        }
        Optional<MatchResponse> brain = callBrain(dossier, criteria.get(), candidates, limit);
        if (brain.isEmpty()) {
            return Optional.empty();
        }

        Map<Long, Annonce> byId =
                candidates.stream().collect(Collectors.toMap(Annonce::getId, Function.identity()));
        List<DossierMatchesResponse.Match> matches = new ArrayList<>();
        for (Map<String, Object> m : brain.get().getMatches()) {
            Annonce a = byId.get(asLong(m.get("bien_id")));
            if (a == null) {
                continue;
            }
            matches.add(
                    new DossierMatchesResponse.Match(
                            a.getId(),
                            a.getTitle(),
                            a.getCity(),
                            a.getCategory(),
                            a.getType() != null ? a.getType().name() : null,
                            a.getStatus() != null ? a.getStatus().name() : null,
                            a.getPrice(),
                            a.getCurrency(),
                            a.getSurface(),
                            firstPhoto(a),
                            asInt(m.get("score_match")),
                            asStringList(m.get("raisons")),
                            asStringList(m.get("alertes")),
                            visionProfile(a) != null));
        }
        return Optional.of(
                new DossierMatchesResponse(
                        scope.name(),
                        candidates.size(),
                        brain.get().getExclus() != null ? brain.get().getExclus() : Map.of(),
                        matches,
                        dossier.getSearchCriteriaUpdatedAt()));
    }

    /**
     * Réponse brute du brain (ancien endpoint match-off-market) ; null si pas de critère ou brain
     * indisponible.
     */
    @Transactional(readOnly = true)
    public MatchResponse rawOffMarketMatch(Long dossierId) {
        Dossier dossier = requireDossier(dossierId);
        Optional<DossierSearchCriteria> criteria = toCriteria(dossier.getSearchCriteria());
        if (criteria.isEmpty() || criteria.get().isEmpty()) {
            return null;
        }
        List<Annonce> candidates =
                annonceRepository.findTop300ByOrgIdAndStatusInOrderByCreatedAtDesc(
                        dossier.getOrgId(), Scope.OFF_MARKET.statuses);
        return callBrain(dossier, criteria.get(), candidates, 50).orElse(null);
    }

    private Optional<MatchResponse> callBrain(
            Dossier dossier, DossierSearchCriteria criteria, List<Annonce> candidates, int limit) {
        if (brainClientService == null) {
            return Optional.empty();
        }
        MatchRequest request = new MatchRequest();
        request.setClientId(dossier.getId());
        request.setCriteres(toBrainCriteria(criteria));
        request.setBiens(candidates.stream().map(DossierMatchingService::toBien).toList());
        request.setLimit(Math.max(1, Math.min(limit, 200)));
        return brainClientService.calculateMatch(request);
    }

    // ─── Conversions ─────────────────────────────────────────────────────────

    static void validate(DossierSearchCriteria c) {
        if (c == null || c.isEmpty()) {
            throw new IllegalArgumentException("Renseignez au moins un critère de recherche");
        }
        if (c.budgetMin() != null
                && c.budgetMax() != null
                && c.budgetMin().compareTo(c.budgetMax()) > 0) {
            throw new IllegalArgumentException("Le budget minimum dépasse le budget maximum");
        }
        if (c.surfaceMin() != null && c.surfaceMax() != null && c.surfaceMin() > c.surfaceMax()) {
            throw new IllegalArgumentException("La surface minimum dépasse la surface maximum");
        }
        if (c.transactionTypes() != null) {
            for (String t : c.transactionTypes()) {
                if (t == null || !TRANSACTION_TYPES.contains(t.toUpperCase())) {
                    throw new IllegalArgumentException("Type de transaction inconnu : " + t);
                }
            }
        }
        if (c.acceptedConditions() != null) {
            for (String s : c.acceptedConditions()) {
                if (!CONDITIONS.contains(s)) {
                    throw new IllegalArgumentException("État inconnu : " + s);
                }
            }
        }
    }

    /** Supprime les entrées vides et les doublons. */
    static DossierSearchCriteria normalize(DossierSearchCriteria c) {
        return new DossierSearchCriteria(
                clean(c.transactionTypes(), true),
                clean(c.categories(), true),
                clean(c.cities(), false),
                c.budgetMin(),
                c.budgetMax(),
                c.surfaceMin(),
                c.surfaceMax(),
                c.furnished(),
                clean(c.equipments(), false),
                clean(c.acceptedConditions(), false));
    }

    private static List<String> clean(List<String> values, boolean upper) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> upper ? v.trim().toUpperCase() : v.trim())
                .distinct()
                .toList();
    }

    private Optional<DossierSearchCriteria> toCriteria(Map<String, Object> stored) {
        if (stored == null || stored.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(objectMapper.convertValue(stored, DossierSearchCriteria.class));
    }

    static Map<String, Object> toBrainCriteria(DossierSearchCriteria c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("transaction_types", nullToEmpty(c.transactionTypes()));
        m.put("categories", nullToEmpty(c.categories()));
        m.put("cities", nullToEmpty(c.cities()));
        m.put("budget_min", c.budgetMin() != null ? c.budgetMin().doubleValue() : null);
        m.put("budget_max", c.budgetMax() != null ? c.budgetMax().doubleValue() : null);
        m.put("surface_min", c.surfaceMin());
        m.put("surface_max", c.surfaceMax());
        m.put("furnished", c.furnished());
        m.put("equipments", nullToEmpty(c.equipments()));
        m.put("accepted_conditions", nullToEmpty(c.acceptedConditions()));
        return m;
    }

    static Map<String, Object> toBien(Annonce a) {
        Map<String, Object> b = new HashMap<>();
        b.put("id", a.getId());
        b.put("title", a.getTitle());
        b.put("description", a.getDescription());
        b.put("category", a.getCategory());
        b.put("type", a.getType() != null ? a.getType().name() : null);
        b.put("city", a.getCity());
        b.put("price", a.getPrice() != null ? a.getPrice().doubleValue() : null);
        b.put("surface", a.getSurface());
        b.put("currency", a.getCurrency());
        b.put("fraud_statut", a.getFraudStatut());
        b.put("duplicate_statut", a.getDuplicateStatut());

        Map<String, Object> profile = visionProfile(a);
        if (profile != null) {
            b.put("vision_meuble", profile.get("meuble"));
            b.put("vision_etat", profile.get("etat_general"));
            b.put("vision_equipements", labels(profile.get("equipements"), "label"));
            b.put("vision_vues", asStringList(profile.get("vues")));
            b.put("vision_pieces", labels(profile.get("pieces"), "room_type"));
        }
        return b;
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> visionProfile(Annonce a) {
        Map<String, Object> result = a.getAiVisionResult();
        if (result == null || !(result.get("profile") instanceof Map<?, ?> p)) {
            return null;
        }
        return (Map<String, Object>) p;
    }

    private static List<String> labels(Object list, String key) {
        List<String> out = new ArrayList<>();
        if (list instanceof List<?> l) {
            for (Object o : l) {
                if (o instanceof Map<?, ?> m && m.get(key) != null) {
                    out.add(m.get(key).toString());
                }
            }
        }
        return out;
    }

    private static String firstPhoto(Annonce a) {
        if (a.getPhotos() == null) {
            return null;
        }
        return a.getPhotos().stream()
                .filter(u -> u != null && u.startsWith("https://"))
                .findFirst()
                .orElse(null);
    }

    private static List<String> nullToEmpty(List<String> l) {
        return l != null ? l : List.of();
    }

    private static List<String> asStringList(Object o) {
        if (!(o instanceof List<?> l)) {
            return List.of();
        }
        return l.stream().filter(x -> x != null).map(Object::toString).toList();
    }

    private static Long asLong(Object o) {
        return o instanceof Number n ? n.longValue() : null;
    }

    private static int asInt(Object o) {
        return o instanceof Number n ? n.intValue() : 0;
    }
}
