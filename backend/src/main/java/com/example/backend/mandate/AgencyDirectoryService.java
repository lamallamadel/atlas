package com.example.backend.mandate;

import com.example.backend.entity.AgencyProfileEntity;
import com.example.backend.entity.AgencyZoneEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.repository.AgencyProfileRepository;
import com.example.backend.repository.AgencyZoneRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.security.AccessPolicy;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Profil public et zones des agences (cas d'usage n°1, lot B), vérification par la plateforme, et
 * annuaire montré aux propriétaires pour une demande directe.
 */
@Service
public class AgencyDirectoryService {

    static final Set<String> TRANSACTIONS = Set.of("SALE", "RENT");

    private final AgencyProfileRepository profiles;
    private final AgencyZoneRepository zones;
    private final OrganizationRepository organizations;
    private final OrgScope orgScope;
    private final com.example.backend.repository.AgencyReviewRepository reviews;

    public AgencyDirectoryService(
            AgencyProfileRepository profiles,
            AgencyZoneRepository zones,
            OrganizationRepository organizations,
            OrgScope orgScope,
            com.example.backend.repository.AgencyReviewRepository reviews) {
        this.reviews = reviews;
        this.profiles = profiles;
        this.zones = zones;
        this.organizations = organizations;
        this.orgScope = orgScope;
    }

    public record Zone(String city, String district) {}

    public record AgencySettings(
            String orgId,
            boolean verified,
            String displayName,
            String description,
            List<String> languages,
            List<String> propertyTypes,
            List<String> transactions,
            List<Zone> zones,
            Double rating,
            int reviews,
            List<MarketplaceViews.Review> recentReviews) {}

    public record ProfileRequest(
            String displayName,
            String description,
            List<String> languages,
            List<String> propertyTypes,
            List<String> transactions) {}

    /** Fiche d'annuaire montrée au propriétaire. */
    public record AgencyCard(
            String orgId,
            String name,
            String description,
            List<String> languages,
            List<String> propertyTypes,
            List<String> transactions,
            List<String> districts,
            Double rating,
            int reviews) {}

    // ---------------------------------------------------------------- côté agence

    @Transactional(readOnly = true)
    public AgencySettings mySettings() {
        String orgId = requireOrg();
        AgencyProfileEntity p = profiles.findByOrgId(orgId).orElse(null);
        var received = reviews.findByAgencyOrgIdOrderByCreatedAtDesc(orgId);
        Rating rating = rating(received);
        return new AgencySettings(
                orgId,
                isVerified(orgId),
                p != null ? p.getDisplayName() : null,
                p != null ? p.getDescription() : null,
                split(p != null ? p.getLanguages() : null),
                split(p != null ? p.getPropertyTypes() : null),
                split(p != null ? p.getTransactions() : null),
                zones.findByOrgIdOrderByCityAscDistrictAsc(orgId).stream()
                        .map(z -> new Zone(z.getCity(), z.getDistrict()))
                        .toList(),
                rating.average(),
                rating.count(),
                // Lot C : avis vérifiés reçus, les 20 derniers, sans le nom du propriétaire.
                received.stream()
                        .limit(20)
                        .map(
                                r ->
                                        new MarketplaceViews.Review(
                                                r.getRating(), r.getComment(), r.getCreatedAt()))
                        .toList());
    }

    @Transactional
    public AgencySettings saveProfile(ProfileRequest request) {
        requireManager();
        String orgId = requireOrg();
        if (request == null || blank(request.displayName())) {
            throw bad("NAME_REQUIRED: indiquez le nom de l'agence affiché aux propriétaires.");
        }
        List<String> transactions = clean(request.transactions());
        if (!TRANSACTIONS.containsAll(transactions)) {
            throw bad("TRANSACTIONS_INVALID: SALE ou RENT.");
        }
        AgencyProfileEntity p = profiles.findByOrgId(orgId).orElseGet(AgencyProfileEntity::new);
        p.setOrgId(orgId);
        p.setDisplayName(request.displayName().trim());
        p.setDescription(trim(request.description(), 2000));
        p.setLanguages(join(request.languages()));
        p.setPropertyTypes(join(request.propertyTypes()));
        p.setTransactions(join(transactions));
        profiles.save(p);
        return mySettings();
    }

    @Transactional
    public AgencySettings saveZones(List<Zone> requested) {
        requireManager();
        String orgId = requireOrg();
        if (requested == null || requested.isEmpty() || requested.size() > 30) {
            throw bad("ZONES_INVALID: indiquez entre 1 et 30 zones.");
        }
        zones.deleteAll(zones.findByOrgIdOrderByCityAscDistrictAsc(orgId));
        zones.flush();
        LocalDateTime now = LocalDateTime.now();
        Set<String> seen = new java.util.HashSet<>();
        for (Zone z : requested) {
            if (z == null || blank(z.city())) {
                throw bad("ZONES_INVALID: chaque zone a une ville.");
            }
            String city = z.city().trim();
            String district = blank(z.district()) ? null : z.district().trim();
            if (!seen.add(norm(city) + "|" + norm(district))) {
                continue;
            }
            AgencyZoneEntity e = new AgencyZoneEntity();
            e.setOrgId(orgId);
            e.setCity(city);
            e.setDistrict(district);
            e.setCreatedAt(now);
            e.setUpdatedAt(now);
            zones.save(e);
        }
        return mySettings();
    }

    // ---------------------------------------------------------------- plateforme

    /** Vérification d'une agence par l'équipe Atlas (accès à la bourse). */
    @Transactional
    public void setVerified(String orgId, boolean verified) {
        OrganizationEntity org =
                organizations
                        .findByOrgId(orgId)
                        .orElseGet(
                                () -> {
                                    OrganizationEntity o = new OrganizationEntity();
                                    o.setOrgId(orgId);
                                    o.setOrgType(OrganizationEntity.TYPE_AGENCY);
                                    o.setDisplayName(orgId);
                                    return o;
                                });
        if (org.isOwner()) {
            throw bad("NOT_AN_AGENCY: cette organisation est celle d'un propriétaire.");
        }
        org.setVerified(verified);
        organizations.save(org);
    }

    // ---------------------------------------------------------------- lectures partagées

    public boolean isVerified(String orgId) {
        return organizations
                .findByOrgId(orgId)
                .filter(o -> !o.isOwner())
                .map(OrganizationEntity::isVerified)
                .orElse(false);
    }

    /** Nom affiché d'une agence : profil, sinon nom de l'organisation, sinon identifiant. */
    @Transactional(readOnly = true)
    public String agencyName(String orgId) {
        return names(List.of(orgId)).getOrDefault(orgId, orgId);
    }

    @Transactional(readOnly = true)
    public Map<String, String> names(java.util.Collection<String> orgIds) {
        Map<String, String> out = new LinkedHashMap<>();
        if (orgIds.isEmpty()) {
            return out;
        }
        orgScope.unfiltered(
                () -> {
                    profiles.findByOrgIdIn(orgIds)
                            .forEach(p -> out.put(p.getOrgId(), p.getDisplayName()));
                    return null;
                });
        for (String id : orgIds) {
            if (!out.containsKey(id)) {
                out.put(
                        id,
                        organizations
                                .findByOrgId(id)
                                .map(OrganizationEntity::getDisplayName)
                                .filter(n -> !blank(n))
                                .orElse(id));
            }
        }
        return out;
    }

    /** Agences (organisations) dont une zone couvre la ville. */
    @Transactional(readOnly = true)
    public Set<String> agenciesCovering(String city) {
        if (blank(city)) {
            return Set.of();
        }
        return orgScope.unfiltered(
                () ->
                        zones.findByCityIgnoreCase(city.trim()).stream()
                                .map(AgencyZoneEntity::getOrgId)
                                .collect(Collectors.toSet()));
    }

    /** La ville (et, si la zone en a un, le quartier) est couverte par l'agence. */
    @Transactional(readOnly = true)
    public boolean covers(String agencyOrgId, String city) {
        return !blank(city)
                && zones.findByOrgIdOrderByCityAscDistrictAsc(agencyOrgId).stream()
                        .anyMatch(z -> norm(z.getCity()).equals(norm(city)));
    }

    /** Annuaire pour un propriétaire : agences vérifiées qui couvrent la ville. */
    @Transactional(readOnly = true)
    public List<AgencyCard> directory(String city, String transaction) {
        Set<String> covering = agenciesCovering(city);
        return orgScope.unfiltered(
                () -> {
                    List<AgencyCard> out = new ArrayList<>();
                    for (String orgId : covering) {
                        if (!isVerified(orgId)) {
                            continue;
                        }
                        AgencyProfileEntity p = profiles.findByOrgId(orgId).orElse(null);
                        List<String> tx = split(p != null ? p.getTransactions() : null);
                        if (transaction != null && !tx.isEmpty() && !tx.contains(transaction)) {
                            continue;
                        }
                        List<String> districts =
                                zones.findByOrgIdOrderByCityAscDistrictAsc(orgId).stream()
                                        .filter(z -> norm(z.getCity()).equals(norm(city)))
                                        .map(AgencyZoneEntity::getDistrict)
                                        .filter(Objects::nonNull)
                                        .toList();
                        Rating rating = rating(orgId);
                        out.add(
                                new AgencyCard(
                                        orgId,
                                        p != null ? p.getDisplayName() : agencyName(orgId),
                                        p != null ? p.getDescription() : null,
                                        split(p != null ? p.getLanguages() : null),
                                        split(p != null ? p.getPropertyTypes() : null),
                                        tx,
                                        districts,
                                        rating.average(),
                                        rating.count()));
                    }
                    out.sort(java.util.Comparator.comparing(AgencyCard::name));
                    return out;
                });
    }

    /** Note moyenne sur 5 (une décimale, ou {@code null}) et nombre d'avis vérifiés. */
    public record Rating(Double average, int count) {}

    public Rating rating(String orgId) {
        return rating(reviews.findByAgencyOrgIdOrderByCreatedAtDesc(orgId));
    }

    private static Rating rating(List<com.example.backend.entity.AgencyReviewEntity> list) {
        if (list.isEmpty()) {
            return new Rating(null, 0);
        }
        double avg =
                list.stream()
                        .mapToInt(com.example.backend.entity.AgencyReviewEntity::getRating)
                        .average()
                        .orElse(0);
        return new Rating(Math.round(avg * 10) / 10.0, list.size());
    }

    // ---------------------------------------------------------------- utilitaires

    private static String requireOrg() {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Organisation inconnue");
        }
        return orgId;
    }

    private static void requireManager() {
        if (!AccessPolicy.isManagerOrAdmin()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "MANAGER_ONLY: seuls un manager ou un administrateur règlent le profil de"
                            + " l'agence.");
        }
    }

    static List<String> split(String csv) {
        if (blank(csv)) {
            return List.of();
        }
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    static String join(List<String> values) {
        List<String> c = clean(values);
        return c.isEmpty() ? null : String.join(",", c);
    }

    private static List<String> clean(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(v -> !blank(v))
                .map(v -> v.trim().replace(",", " "))
                .distinct()
                .toList();
    }

    static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
    }

    static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String trim(String s, int max) {
        if (blank(s)) {
            return null;
        }
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
