package com.example.backend.mandate;

import com.example.backend.entity.AgencyZoneEntity;
import com.example.backend.entity.MandateProposalEntity;
import com.example.backend.entity.MandateRequestEntity;
import com.example.backend.repository.AgencyZoneRepository;
import com.example.backend.repository.MandateProposalRepository;
import com.example.backend.repository.MandateRequestRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Liquidité de la bourse aux mandats, zone par zone (ville) : de quoi décider d'ouvrir une zone aux
 * propriétaires. Critère de passage : au moins {@value #MIN_VERIFIED_AGENCIES} agences vérifiées
 * couvrent la ville. À côté, les signaux qui disent si la zone tient sa promesse : délai médian
 * jusqu'à la première proposition, demandes restées sans proposition après {@value #STALE_HOURS} h,
 * taux de demandes confiées.
 *
 * <p>Calculé en mémoire sur les {@value #WINDOW_DAYS} derniers jours : volumes de lancement. À
 * passer en requêtes agrégées quand la bourse dépassera quelques milliers de demandes.
 */
@Service
public class MarketplaceLiquidityService {

    static final int MIN_VERIFIED_AGENCIES = 3;
    static final int STALE_HOURS = 72;
    static final int WINDOW_DAYS = 90;

    private final AgencyZoneRepository zones;
    private final MandateRequestRepository requests;
    private final MandateProposalRepository proposals;
    private final AgencyDirectoryService directory;
    private final OrgScope orgScope;

    public MarketplaceLiquidityService(
            AgencyZoneRepository zones,
            MandateRequestRepository requests,
            MandateProposalRepository proposals,
            AgencyDirectoryService directory,
            OrgScope orgScope) {
        this.zones = zones;
        this.requests = requests;
        this.proposals = proposals;
        this.directory = directory;
        this.orgScope = orgScope;
    }

    /**
     * {@code status} : {@code OPEN} (critère atteint) ou {@code BUILDING} ; {@code
     * medianHoursToFirstProposal} est nul sans proposition ; {@code awardRate} (0 à 1) est nul sans
     * demande close.
     */
    public record ZoneLiquidity(
            String city,
            String status,
            int verifiedAgencies,
            int pendingAgencies,
            int requests,
            int openRequests,
            int staleRequests,
            Double medianHoursToFirstProposal,
            Double awardRate) {}

    public record Liquidity(
            int minVerifiedAgencies, int staleHours, int windowDays, List<ZoneLiquidity> zones) {}

    @Transactional(readOnly = true)
    public Liquidity liquidity() {
        return orgScope.unfiltered(this::compute);
    }

    private Liquidity compute() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusDays(WINDOW_DAYS);

        // Agences par ville (une agence compte une fois par ville, quel que soit le quartier).
        Map<String, String> label = new TreeMap<>();
        Map<String, Set<String>> agenciesByCity = new HashMap<>();
        for (AgencyZoneEntity z : zones.findAll()) {
            String key = key(z.getCity());
            if (key.isEmpty()) {
                continue;
            }
            label.putIfAbsent(key, z.getCity().trim());
            agenciesByCity.computeIfAbsent(key, k -> new HashSet<>()).add(z.getOrgId());
        }

        // Demandes à la bourse de la période, et première proposition de chacune.
        List<MandateRequestEntity> window =
                requests.findAll().stream()
                        .filter(
                                r ->
                                        MandateRequestEntity.MREQ_OPEN_MARKET.equals(
                                                r.getVisibility()))
                        .filter(r -> !MandateRequestEntity.MREQ_DRAFT.equals(r.getStatus()))
                        .filter(r -> r.getOpenedAt() != null && r.getOpenedAt().isAfter(since))
                        .toList();
        Map<Long, LocalDateTime> firstProposal = new HashMap<>();
        for (MandateProposalEntity p : proposals.findAll()) {
            firstProposal.merge(
                    p.getRequestId(), p.getCreatedAt(), (a, b) -> a.isBefore(b) ? a : b);
        }
        Map<String, List<MandateRequestEntity>> requestsByCity = new HashMap<>();
        for (MandateRequestEntity r : window) {
            String key = key(r.getCity());
            if (key.isEmpty()) {
                continue;
            }
            label.putIfAbsent(key, r.getCity().trim());
            requestsByCity.computeIfAbsent(key, k -> new ArrayList<>()).add(r);
        }

        List<ZoneLiquidity> out = new ArrayList<>();
        for (Map.Entry<String, String> e : label.entrySet()) {
            Set<String> agencies = agenciesByCity.getOrDefault(e.getKey(), Set.of());
            int verified = 0;
            int pending = 0;
            for (String orgId : agencies) {
                if (directory.isVerified(orgId)) {
                    verified++;
                } else {
                    pending++;
                }
            }
            List<MandateRequestEntity> rs = requestsByCity.getOrDefault(e.getKey(), List.of());
            int open = 0;
            int stale = 0;
            int awarded = 0;
            int closed = 0;
            List<Double> hours = new ArrayList<>();
            for (MandateRequestEntity r : rs) {
                LocalDateTime first = firstProposal.get(r.getId());
                if (first != null) {
                    hours.add(Duration.between(r.getOpenedAt(), first).toMinutes() / 60.0);
                }
                if (MandateRequestEntity.MREQ_OPEN.equals(r.getStatus())) {
                    open++;
                    if (first == null && r.getOpenedAt().isBefore(now.minusHours(STALE_HOURS))) {
                        stale++;
                    }
                } else {
                    closed++;
                    if (MandateRequestEntity.MREQ_AWARDED.equals(r.getStatus())) {
                        awarded++;
                    }
                }
            }
            out.add(
                    new ZoneLiquidity(
                            e.getValue(),
                            verified >= MIN_VERIFIED_AGENCIES ? "OPEN" : "BUILDING",
                            verified,
                            pending,
                            rs.size(),
                            open,
                            stale,
                            median(hours),
                            closed == 0 ? null : round2((double) awarded / closed)));
        }
        out.sort(
                Comparator.comparing((ZoneLiquidity z) -> !"OPEN".equals(z.status()))
                        .thenComparing(ZoneLiquidity::verifiedAgencies, Comparator.reverseOrder())
                        .thenComparing(ZoneLiquidity::city));
        return new Liquidity(MIN_VERIFIED_AGENCIES, STALE_HOURS, WINDOW_DAYS, out);
    }

    static Double median(List<Double> values) {
        if (values.isEmpty()) {
            return null;
        }
        List<Double> sorted = values.stream().sorted().toList();
        int n = sorted.size();
        double m = n % 2 == 1 ? sorted.get(n / 2) : (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2;
        return Math.round(m * 10) / 10.0;
    }

    private static double round2(double v) {
        return Math.round(v * 100) / 100.0;
    }

    private static String key(String city) {
        return city == null ? "" : city.trim().toLowerCase(Locale.ROOT);
    }
}
