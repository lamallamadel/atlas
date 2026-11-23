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
        LocalDateTime createdAt) {

    /** Clés de {@code meta} affichables publiquement. */
    static final Set<String> PUBLIC_META_KEYS =
            Set.of("slug", "pieces", "rooms", "bedrooms", "bathrooms", "verified");

    public static PublicAnnonceResponse from(Annonce a) {
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
                a.getPhotos() == null ? List.of() : List.copyOf(a.getPhotos()),
                publicMeta,
                a.getCreatedAt());
    }
}
