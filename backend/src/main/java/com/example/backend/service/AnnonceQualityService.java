package com.example.backend.service;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceMedia;
import com.example.backend.repository.AnnonceMediaRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Qualité d'une annonce : score sur 100 et éléments manquants pour la publier.
 *
 * <p>Les éléments « bloquants » empêchent la publication ; les autres ne font que baisser le score.
 * Le minimum de photos est réglable ({@code atlas.annonce.publication.min-photos}).
 */
@Service
public class AnnonceQualityService {

    /** Élément évalué : code stable, libellé, poids dans le score, bloquant ou non. */
    public record Criterion(String code, String label, int weight, boolean blocking) {}

    /** Résultat de l'évaluation. */
    public record Quality(
            int score,
            List<Criterion> missing,
            List<Criterion> blockingMissing,
            int photoCount,
            int minPhotos) {
        public boolean publishable() {
            return blockingMissing.isEmpty();
        }
    }

    static final int MIN_TITLE_LENGTH = 10;
    static final int MIN_DESCRIPTION_LENGTH = 80;

    static final Criterion TITLE =
            new Criterion("TITLE", "Titre d'au moins 10 caractères", 15, true);
    static final Criterion DESCRIPTION =
            new Criterion("DESCRIPTION", "Description d'au moins 80 caractères", 15, true);
    static final Criterion TYPE = new Criterion("TYPE", "Type de transaction", 5, true);
    static final Criterion PRICE = new Criterion("PRICE", "Prix", 15, true);
    static final Criterion CITY = new Criterion("CITY", "Ville", 10, true);
    static final Criterion SURFACE = new Criterion("SURFACE", "Surface", 10, true);
    static final Criterion ADDRESS = new Criterion("ADDRESS", "Quartier ou adresse", 5, false);
    static final Criterion CATEGORY =
            new Criterion("CATEGORY", "Catégorie (appartement, villa…)", 5, false);
    // Libellé complété avec le minimum réglé ; poids 20.
    static final String PHOTOS_CODE = "PHOTOS";

    private final AnnonceMediaRepository annonceMediaRepository;
    private final int minPhotos;

    public AnnonceQualityService(
            AnnonceMediaRepository annonceMediaRepository,
            @Value("${atlas.annonce.publication.min-photos:3}") int minPhotos) {
        this.annonceMediaRepository = annonceMediaRepository;
        this.minPhotos = Math.max(0, minPhotos);
    }

    public int minPhotos() {
        return minPhotos;
    }

    public Quality evaluate(Annonce a) {
        int photos = photoCount(a);
        Criterion photosCriterion =
                new Criterion(
                        PHOTOS_CODE,
                        minPhotos <= 1 ? "Au moins une photo" : "Au moins " + minPhotos + " photos",
                        20,
                        minPhotos > 0);

        List<Criterion> missing = new ArrayList<>();
        int score = 100;

        if (length(a.getTitle()) < MIN_TITLE_LENGTH) {
            missing.add(TITLE);
        }
        if (length(a.getDescription()) < MIN_DESCRIPTION_LENGTH) {
            missing.add(DESCRIPTION);
        }
        if (a.getType() == null) {
            missing.add(TYPE);
        }
        if (a.getPrice() == null || a.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            missing.add(PRICE);
        }
        if (length(a.getCity()) == 0) {
            missing.add(CITY);
        }
        if (a.getSurface() == null || a.getSurface() <= 0) {
            missing.add(SURFACE);
        }
        if (length(a.getAddress()) == 0) {
            missing.add(ADDRESS);
        }
        if (length(a.getCategory()) == 0) {
            missing.add(CATEGORY);
        }
        for (Criterion c : missing) {
            score -= c.weight();
        }

        if (photos < minPhotos) {
            missing.add(photosCriterion);
            // Points proportionnels aux photos déjà présentes.
            score -= photosCriterion.weight() - (photosCriterion.weight() * photos / minPhotos);
        } else if (minPhotos == 0 && photos == 0) {
            score -= photosCriterion.weight();
        }

        List<Criterion> blocking = missing.stream().filter(Criterion::blocking).toList();
        return new Quality(Math.max(0, score), List.copyOf(missing), blocking, photos, minPhotos);
    }

    /** Photos de l'annonce : URL saisies ou photos téléversées, la plus grande des deux valeurs. */
    int photoCount(Annonce a) {
        int urls =
                a.getPhotos() == null
                        ? 0
                        : (int)
                                a.getPhotos().stream()
                                        .filter(p -> p != null && !p.isBlank())
                                        .count();
        long uploaded =
                a.getId() == null
                        ? 0
                        : annonceMediaRepository.countByAnnonceIdAndMediaType(
                                a.getId(), AnnonceMedia.TYPE_PHOTO);
        return (int) Math.max(urls, uploaded);
    }

    private static int length(String s) {
        return s == null ? 0 : s.trim().length();
    }
}
