package com.example.backend.dto;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Annonce telle que le portail public la montre : ni agence, ni scores de fraude ou de doublon, ni
 * auteur, ni métadonnées internes. Seules quelques clés d'affichage de {@code meta} passent.
 */
public record PublicAnnonceResponse(
        Long id,
        String title,
        String description,
        String category,
        AnnonceType type,
        String address,
        Double surface,
        String city,
        BigDecimal price,
        String currency,
        List<String> photos,
        Map<String, Object> meta,
        LocalDateTime createdAt,
        String publisherKind,
        List<Publisher> publishers,
        boolean propertyVerified,
        String agencyName,
        Integer rooms) {

    /**
     * Annonceur d'un bien publié par plusieurs (mandats simples, R-PROP-06) : la fiche du portail
     * les liste tous.
     */
    public record Publisher(Long annonceId, String kind, String name) {}

    public PublicAnnonceResponse withPublishers(List<Publisher> list) {
        return new PublicAnnonceResponse(
                id,
                title,
                description,
                category,
                type,
                address,
                surface,
                city,
                price,
                currency,
                photos,
                meta,
                createdAt,
                publisherKind,
                List.copyOf(list),
                propertyVerified,
                agencyName,
                rooms);
    }

    /** Lot C : badge « Bien vérifié » (titre foncier contrôlé par la plateforme). */
    public PublicAnnonceResponse withPropertyVerified(boolean verified) {
        return new PublicAnnonceResponse(
                id,
                title,
                description,
                category,
                type,
                address,
                surface,
                city,
                price,
                currency,
                photos,
                meta,
                createdAt,
                publisherKind,
                publishers,
                verified,
                agencyName,
                rooms);
    }

    /**
     * Carte du portail : nom de l'agence qui publie (null pour un particulier) et nombre de pièces
     * connu (méta de l'annonce, sinon fiche du bien ; null si inconnu, jamais 0 par défaut).
     */
    public PublicAnnonceResponse withListingInfo(String agency, Integer roomCount) {
        return new PublicAnnonceResponse(
                id,
                title,
                description,
                category,
                type,
                address,
                surface,
                city,
                price,
                currency,
                photos,
                meta,
                createdAt,
                publisherKind,
                publishers,
                propertyVerified,
                agency,
                roomCount != null ? roomCount : rooms);
    }

    /** Clés de {@code meta} affichables publiquement. */
    static final Set<String> PUBLIC_META_KEYS =
            Set.of("slug", "pieces", "rooms", "bedrooms", "bathrooms", "verified");

    public static PublicAnnonceResponse from(Annonce a) {
        return from(a, List.of());
    }

    /**
     * {@code uploadedPhotoIds} : photos importées (stockage), servies par le portail à {@code
     * /api/v1/portal/annonces/{id}/media/{mediaId}}, après les liens externes.
     */
    public static PublicAnnonceResponse from(Annonce a, List<Long> uploadedPhotoIds) {
        List<String> photos = new java.util.ArrayList<>();
        if (a.getPhotos() != null) {
            a.getPhotos().stream().filter(p -> p != null && !p.isBlank()).forEach(photos::add);
        }
        for (Long mediaId : uploadedPhotoIds) {
            photos.add("/api/v1/portal/annonces/" + a.getId() + "/media/" + mediaId);
        }
        Map<String, Object> publicMeta = new LinkedHashMap<>();
        if (a.getMeta() != null) {
            a.getMeta()
                    .forEach(
                            (k, v) -> {
                                if (PUBLIC_META_KEYS.contains(k) && v != null) {
                                    publicMeta.put(k, v);
                                }
                            });
        }
        return new PublicAnnonceResponse(
                a.getId(),
                a.getTitle(),
                a.getDescription(),
                a.getCategory(),
                a.getType(),
                a.getAddress(),
                a.getSurface(),
                a.getCity(),
                a.getPrice(),
                a.getCurrency(),
                List.copyOf(photos),
                publicMeta,
                a.getCreatedAt(),
                "OWNER".equals(a.getPublisherKind()) ? "OWNER" : "AGENCY",
                List.of(),
                false,
                null,
                roomsFromMeta(a.getMeta()));
    }

    /** Nombre de pièces porté par la méta (« rooms » ou « pieces »), null si absent ou nul. */
    static Integer roomsFromMeta(Map<String, Object> meta) {
        if (meta == null) {
            return null;
        }
        for (String key : List.of("rooms", "pieces")) {
            Object v = meta.get(key);
            if (v instanceof Number n && n.intValue() > 0) {
                return n.intValue();
            }
            if (v instanceof String str) {
                try {
                    int parsed = Integer.parseInt(str.trim());
                    if (parsed > 0) {
                        return parsed;
                    }
                } catch (NumberFormatException ignored) {
                    // valeur libre non numérique : inconnue
                }
            }
        }
        return null;
    }
}
