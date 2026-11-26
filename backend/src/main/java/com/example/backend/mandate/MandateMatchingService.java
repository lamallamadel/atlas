package com.example.backend.mandate;

import com.example.backend.dto.DossierSearchCriteria;
import com.example.backend.dto.QuotaSettingsDto;
import com.example.backend.entitlement.EntitlementService;
import com.example.backend.entitlement.Feature;
import com.example.backend.entity.AgencyProfileEntity;
import com.example.backend.entity.AgencyZoneEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MandateEntity;
import com.example.backend.entity.MandateProposalEntity;
import com.example.backend.entity.MandateRequestEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.AgencyProfileRepository;
import com.example.backend.repository.AgencyZoneRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MandateProposalRepository;
import com.example.backend.repository.MandateRepository;
import com.example.backend.repository.MandateRequestRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.PropertyRepository;
import com.example.backend.service.OrganizationSettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Rapprochements du cas d'usage n°1, lot C.
 *
 * <p>§ 5.1 — score sur 100 d'une agence pour une demande : zone (35), spécialité (20), historique
 * dans la ville (15), réactivité (10), avis (10), acquéreurs compatibles (10). Filtres stricts :
 * agence vérifiée, module actif, quota restant, ville couverte, transaction et type de bien
 * couverts. Une agence de moins de 3 mois sans historique ni avis reçoit la moitié de ces poids.
 *
 * <p>§ 5.2 — acquéreurs compatibles : dossiers acheteurs ou locataires <b>de l'agence</b> dont les
 * critères correspondent au bien. Le calcul se fait dans l'organisation de l'agence et ne renvoie
 * qu'un nombre : aucune donnée ne passe d'une agence à l'autre.
 */
@Service
public class MandateMatchingService {

    static final int W_ZONE = 35;
    static final int W_SPECIALTY = 20;
    static final int W_HISTORY = 15;
    static final int W_REACTIVITY = 10;
    static final int W_REVIEWS = 10;
    static final int W_BUYERS = 10;
    static final int NEW_AGENCY_MONTHS = 3;
    static final Set<DossierStatus> CLOSED = Set.of(DossierStatus.WON, DossierStatus.LOST);

    private final AgencyDirectoryService agencies;
    private final AgencyZoneRepository zones;
    private final AgencyProfileRepository profiles;
    private final OrganizationRepository organizations;
    private final MandateRepository mandates;
    private final MandateProposalRepository proposals;
    private final MandateRequestRepository requests;
    private final PropertyRepository properties;
    private final DossierRepository dossiers;
    private final EntitlementService entitlements;
    private final MarketplaceSettings settings;
    private final OrgScope orgScope;
    private final ObjectMapper objectMapper;
    private final OrganizationSettingsService organizationSettings;

    public MandateMatchingService(
            AgencyDirectoryService agencies,
            AgencyZoneRepository zones,
            AgencyProfileRepository profiles,
            OrganizationRepository organizations,
            MandateRepository mandates,
            MandateProposalRepository proposals,
            MandateRequestRepository requests,
            PropertyRepository properties,
            DossierRepository dossiers,
            EntitlementService entitlements,
            MarketplaceSettings settings,
            OrgScope orgScope,
            ObjectMapper objectMapper,
            @Autowired(required = false) @Nullable
                    OrganizationSettingsService organizationSettings) {
        this.agencies = agencies;
        this.zones = zones;
        this.profiles = profiles;
        this.organizations = organizations;
        this.mandates = mandates;
        this.proposals = proposals;
        this.requests = requests;
        this.properties = properties;
        this.dossiers = dossiers;
        this.entitlements = entitlements;
        this.settings = settings;
        this.orgScope = orgScope;
        this.objectMapper = objectMapper;
        this.organizationSettings = organizationSettings;
    }

    /** Score d'une agence ; {@code eligible = false} si un filtre strict l'écarte. */
    public record Score(String agencyOrgId, boolean eligible, int total, int compatibleBuyers) {}

    // ---------------------------------------------------------------- § 5.1

    /** Agences éligibles, de la plus pertinente à la moins pertinente. */
    @Transactional(readOnly = true)
    public List<Score> ranking(MandateRequestEntity r) {
        List<Score> out = new ArrayList<>();
        for (String agency : agencies.agenciesCovering(r.getCity())) {
            Score s = score(r, agency);
            if (s.eligible()) {
                out.add(s);
            }
        }
        out.sort(
                Comparator.comparingInt(Score::total).reversed().thenComparing(Score::agencyOrgId));
        return out;
    }

    @Transactional(readOnly = true)
    public Score score(MandateRequestEntity r, String agency) {
        PropertyEntity property = properties.findById(r.getPropertyId()).orElse(null);
        if (!agencies.isVerified(agency)
                || !orgScope.unfiltered(
                        () -> entitlements.isEnabled(agency, Feature.MODULE_MANDATE_MARKETPLACE))
                || remainingQuota(agency) <= 0) {
            return new Score(agency, false, 0, 0);
        }
        List<AgencyZoneEntity> agencyZones =
                orgScope.unfiltered(() -> zones.findByOrgIdOrderByCityAscDistrictAsc(agency));
        List<AgencyZoneEntity> inCity =
                agencyZones.stream()
                        .filter(
                                z ->
                                        AgencyDirectoryService.norm(z.getCity())
                                                .equals(AgencyDirectoryService.norm(r.getCity())))
                        .toList();
        if (inCity.isEmpty()) {
            return new Score(agency, false, 0, 0);
        }
        AgencyProfileEntity profile =
                orgScope.unfiltered(() -> profiles.findByOrgId(agency).orElse(null));
        List<String> transactions =
                AgencyDirectoryService.split(profile != null ? profile.getTransactions() : null);
        List<String> types =
                lower(
                        AgencyDirectoryService.split(
                                profile != null ? profile.getPropertyTypes() : null));
        String type =
                property != null && property.getPropertyType() != null
                        ? property.getPropertyType().toLowerCase(Locale.ROOT)
                        : null;
        boolean txCovered = transactions.isEmpty() || transactions.contains(r.getObjective());
        boolean typeCovered = types.isEmpty() || type == null || types.contains(type);
        if (!txCovered || !typeCovered) {
            return new Score(agency, false, 0, 0);
        }

        // Zone : quartier couvert, sinon toute la ville, sinon seulement d'autres quartiers.
        String district = AgencyDirectoryService.norm(r.getDistrict());
        double zone;
        if (!district.isEmpty()
                && inCity.stream()
                        .anyMatch(
                                z ->
                                        AgencyDirectoryService.norm(z.getDistrict())
                                                .equals(district))) {
            zone = W_ZONE;
        } else if (inCity.stream().anyMatch(z -> z.getDistrict() == null)) {
            zone = W_ZONE * 0.7;
        } else {
            zone = W_ZONE * 0.4;
        }

        // Spécialité : type de bien (12) et transaction (8) déclarés ; profil muet = moitié.
        double specialty = (types.isEmpty() ? 6 : 12) + (transactions.isEmpty() ? 4 : 8);

        boolean newcomer = isNewcomer(agency);
        long history = closedMandatesInCity(agency, r.getCity());
        double historyPts =
                history == 0 && newcomer ? W_HISTORY / 2.0 : Math.min(history, 5) / 5.0 * W_HISTORY;

        double reactivity = reactivity(agency);

        AgencyDirectoryService.Rating rating = agencies.rating(agency);
        double reviewPts =
                rating.count() == 0
                        ? (newcomer ? W_REVIEWS / 2.0 : 0)
                        : rating.average() / 5.0 * W_REVIEWS;

        int buyers = compatibleBuyers(agency, r, property);
        double buyerPts = Math.min(buyers, 10) / 10.0 * W_BUYERS;

        int total =
                (int) Math.round(zone + specialty + historyPts + reactivity + reviewPts + buyerPts);
        return new Score(agency, true, Math.min(100, total), buyers);
    }

    /** Mandats clos sur la plateforme dans la ville (ventes ou locations conclues). */
    private long closedMandatesInCity(String agency, String city) {
        return mandates.findByAgencyOrgIdOrderByCreatedAtDesc(agency).stream()
                .filter(m -> MandateEntity.MANDATE_COMPLETED.equals(m.getStatus()))
                .filter(
                        m ->
                                requests.findById(m.getRequestId())
                                        .map(
                                                x ->
                                                        AgencyDirectoryService.norm(x.getCity())
                                                                .equals(
                                                                        AgencyDirectoryService.norm(
                                                                                city)))
                                        .orElse(false))
                .count();
    }

    /** Délai médian entre l'ouverture d'une demande et la proposition de l'agence. */
    private double reactivity(String agency) {
        List<Long> hours = new ArrayList<>();
        for (MandateProposalEntity p : proposals.findByAgencyOrgIdOrderByCreatedAtDesc(agency)) {
            if (hours.size() >= 20) {
                break;
            }
            requests.findById(p.getRequestId())
                    .filter(
                            x ->
                                    x.getOpenedAt() != null
                                            && !p.getCreatedAt().isBefore(x.getOpenedAt()))
                    .ifPresent(
                            x ->
                                    hours.add(
                                            Duration.between(x.getOpenedAt(), p.getCreatedAt())
                                                    .toHours()));
        }
        if (hours.isEmpty()) {
            return W_REACTIVITY / 2.0;
        }
        hours.sort(Comparator.naturalOrder());
        long median = hours.get(hours.size() / 2);
        return median <= 24 ? W_REACTIVITY : median <= 72 ? W_REACTIVITY * 0.6 : W_REACTIVITY * 0.3;
    }

    private boolean isNewcomer(String agency) {
        LocalDateTime since =
                organizations
                        .findByOrgId(agency)
                        .map(OrganizationEntity::getCreatedAt)
                        .orElse(null);
        return since == null || since.isAfter(LocalDateTime.now().minusMonths(NEW_AGENCY_MONTHS));
    }

    // ---------------------------------------------------------------- quota (R-PROP-11)

    /** Propositions du mois prévues par le plan de l'agence ({@code -1} : illimité). */
    public int monthlyQuota(String agency) {
        if (organizationSettings != null) {
            try {
                QuotaSettingsDto q =
                        orgScope.unfiltered(() -> organizationSettings.getQuotas(agency));
                if (q != null && q.getMaxMandateProposalsMonth() != null) {
                    return q.getMaxMandateProposalsMonth();
                }
            } catch (ResourceNotFoundException e) {
                // Agence sans réglages : quota par défaut.
            }
        }
        return settings.monthlyProposalQuota();
    }

    public long remainingQuota(String agency) {
        int quota = monthlyQuota(agency);
        if (quota < 0) {
            return Long.MAX_VALUE;
        }
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        return quota - proposals.countByAgencyOrgIdAndCreatedAtAfter(agency, monthStart);
    }

    // ---------------------------------------------------------------- § 5.2

    /**
     * Acquéreurs ou locataires ouverts de l'agence dont les critères correspondent au bien. Lu dans
     * l'organisation de l'agence ; seul le nombre sort.
     */
    @Transactional(readOnly = true)
    public int compatibleBuyers(String agency, MandateRequestEntity r, PropertyEntity property) {
        BigDecimal price = r.getExpectedPrice();
        List<Dossier> buyers =
                orgScope.as(
                        agency,
                        () ->
                                dossiers.findByOrgIdAndSearchCriteriaIsNotNullAndStatusNotIn(
                                        agency, CLOSED));
        int n = 0;
        for (Dossier d : buyers) {
            DossierSearchCriteria c;
            try {
                c = objectMapper.convertValue(d.getSearchCriteria(), DossierSearchCriteria.class);
            } catch (IllegalArgumentException e) {
                continue;
            }
            if (c != null
                    && !c.isEmpty()
                    && matches(c, r.getObjective(), r.getCity(), property, price)) {
                n++;
            }
        }
        return n;
    }

    static boolean matches(
            DossierSearchCriteria c,
            String objective,
            String city,
            PropertyEntity property,
            BigDecimal price) {
        if (!emptyOr(c.transactionTypes(), objective)) {
            return false;
        }
        if (!emptyOr(c.cities(), city)) {
            return false;
        }
        String type = property != null ? property.getPropertyType() : null;
        if (type != null && !emptyOr(c.categories(), type)) {
            return false;
        }
        if (price != null) {
            if (c.budgetMax() != null
                    && price.compareTo(c.budgetMax().multiply(new BigDecimal("1.10"))) > 0) {
                return false;
            }
            if (c.budgetMin() != null
                    && price.compareTo(c.budgetMin().multiply(new BigDecimal("0.80"))) < 0) {
                return false;
            }
        }
        Double surface = property != null ? property.getSurface() : null;
        if (surface != null) {
            if (c.surfaceMin() != null && surface < c.surfaceMin() * 0.9) {
                return false;
            }
            if (c.surfaceMax() != null && surface > c.surfaceMax() * 1.1) {
                return false;
            }
        }
        return true;
    }

    private static boolean emptyOr(List<String> values, String value) {
        if (values == null || values.isEmpty() || value == null) {
            return true;
        }
        return values.stream().anyMatch(v -> v != null && v.trim().equalsIgnoreCase(value.trim()));
    }

    private static List<String> lower(List<String> values) {
        return values.stream().map(v -> v.toLowerCase(Locale.ROOT)).toList();
    }
}
