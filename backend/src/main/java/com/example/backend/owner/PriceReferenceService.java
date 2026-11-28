package com.example.backend.owner;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.PropertyEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.mandate.OrgScope;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.PropertyRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repère de prix d'un bien : fourchette tirée des <b>prix affichés</b> des annonces publiées
 * comparables (même type de bien, même transaction), toutes agences confondues. D'abord dans le
 * quartier, sinon dans la ville, à partir de {@value #MIN_COMPARABLES} références ; en dessous,
 * aucun chiffre plutôt qu'un chiffre trompeur.
 *
 * <p>Ce n'est pas une estimation de prix vendu : Atlas ne dispose pas des actes. Le libellé côté
 * propriétaire le dit.
 */
@Service
public class PriceReferenceService {

    static final int MIN_COMPARABLES = 3;

    private final OwnerPropertyService ownerProperties;
    private final AnnonceRepository annonces;
    private final PropertyRepository properties;
    private final OrgScope orgScope;

    public PriceReferenceService(
            OwnerPropertyService ownerProperties,
            AnnonceRepository annonces,
            PropertyRepository properties,
            OrgScope orgScope) {
        this.ownerProperties = ownerProperties;
        this.annonces = annonces;
        this.properties = properties;
        this.orgScope = orgScope;
    }

    /**
     * {@code scope} : {@code DISTRICT} ou {@code CITY} ; {@code area} : le quartier ou la ville
     * retenus. Prix au m² (quartiles) et fourchette pour la surface du bien. {@code available =
     * false} quand il manque la ville, la surface ou des références.
     */
    public record PriceReference(
            boolean available,
            String scope,
            String area,
            int comparables,
            BigDecimal perM2Low,
            BigDecimal perM2Median,
            BigDecimal perM2High,
            BigDecimal low,
            BigDecimal mid,
            BigDecimal high,
            String currency,
            String basis) {

        static PriceReference unavailable(int comparables) {
            return new PriceReference(
                    false,
                    null,
                    null,
                    comparables,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "MAD",
                    "ASKING_PRICES");
        }
    }

    @Transactional(readOnly = true)
    public PriceReference forOwnerProperty(Long propertyId) {
        return compute(ownerProperties.get(propertyId));
    }

    PriceReference compute(PropertyEntity p) {
        if (p.getCity() == null || p.getSurface() == null || p.getSurface() <= 0) {
            return PriceReference.unavailable(0);
        }
        boolean rent = "RENT".equalsIgnoreCase(p.getTransactionType());
        Collection<AnnonceType> types =
                rent
                        ? List.of(AnnonceType.RENT, AnnonceType.RENTAL, AnnonceType.LEASE)
                        : List.of(AnnonceType.SALE);
        // Lecture inter-agences : les annonces publiées de toutes les organisations.
        List<Annonce> city =
                orgScope.unfiltered(
                        () ->
                                annonces.findPublishedPricedInCity(
                                        AnnonceStatus.PUBLISHED, p.getCity(), types));
        Map<Long, String> districts = districtsOf(city);
        List<Annonce> sameType =
                city.stream()
                        .filter(a -> !Objects.equals(a.getPropertyId(), p.getId()))
                        .filter(a -> sameCategory(p.getPropertyType(), a.getCategory()))
                        .toList();
        sameType = onePerProperty(sameType);

        if (p.getDistrict() != null && !p.getDistrict().isBlank()) {
            List<Annonce> district =
                    sameType.stream()
                            .filter(
                                    a ->
                                            p.getDistrict()
                                                    .trim()
                                                    .equalsIgnoreCase(districtOf(a, districts)))
                            .toList();
            if (district.size() >= MIN_COMPARABLES) {
                return reference("DISTRICT", p.getDistrict().trim(), district, p, rent);
            }
        }
        if (sameType.size() >= MIN_COMPARABLES) {
            return reference("CITY", p.getCity(), sameType, p, rent);
        }
        return PriceReference.unavailable(sameType.size());
    }

    private PriceReference reference(
            String scope, String area, List<Annonce> refs, PropertyEntity p, boolean rent) {
        List<Double> perM2 =
                refs.stream()
                        .map(a -> a.getPrice().doubleValue() / a.getSurface())
                        .sorted()
                        .toList();
        double q1 = quantile(perM2, 0.25);
        double q2 = quantile(perM2, 0.5);
        double q3 = quantile(perM2, 0.75);
        double surface = p.getSurface();
        int step = rent ? 100 : 10_000;
        return new PriceReference(
                true,
                scope,
                area,
                refs.size(),
                round(q1, 1),
                round(q2, 1),
                round(q3, 1),
                round(q1 * surface, step),
                round(q2 * surface, step),
                round(q3 * surface, step),
                "MAD",
                "ASKING_PRICES");
    }

    /** Quantile par interpolation linéaire sur une liste triée. */
    static double quantile(List<Double> sorted, double q) {
        double pos = q * (sorted.size() - 1);
        int lo = (int) Math.floor(pos);
        int hi = (int) Math.ceil(pos);
        return sorted.get(lo) + (sorted.get(hi) - sorted.get(lo)) * (pos - lo);
    }

    static BigDecimal round(double value, int step) {
        return BigDecimal.valueOf(Math.round(value / step) * (long) step)
                .setScale(0, RoundingMode.HALF_UP);
    }

    /** Type de bien comparable ; un bien sans type se compare à tout. */
    static boolean sameCategory(String propertyType, String category) {
        if (propertyType == null || propertyType.isBlank()) {
            return true;
        }
        return category != null && propertyType.trim().equalsIgnoreCase(category.trim());
    }

    /** Un bien publié par plusieurs agences (mandats simples) ne compte qu'une fois. */
    private static List<Annonce> onePerProperty(List<Annonce> list) {
        Set<Long> seen = new HashSet<>();
        List<Annonce> out = new ArrayList<>();
        for (Annonce a : list) {
            if (a.getPropertyId() == null || seen.add(a.getPropertyId())) {
                out.add(a);
            }
        }
        return out;
    }

    private Map<Long, String> districtsOf(List<Annonce> list) {
        List<Long> ids =
                list.stream().map(Annonce::getPropertyId).filter(Objects::nonNull).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return orgScope.unfiltered(
                () ->
                        properties.findAllById(ids).stream()
                                .filter(x -> x.getDistrict() != null)
                                .collect(
                                        Collectors.toMap(
                                                PropertyEntity::getId,
                                                PropertyEntity::getDistrict,
                                                (a, b) -> a)));
    }

    /** Quartier d'une annonce : celui de la fiche du bien, sinon l'adresse saisie. */
    private static String districtOf(Annonce a, Map<Long, String> districts) {
        String d = a.getPropertyId() == null ? null : districts.get(a.getPropertyId());
        String v = d != null ? d : a.getAddress();
        return v == null ? "" : v.trim();
    }
}
