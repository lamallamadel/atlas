package com.example.backend.service;

import com.example.backend.entity.AnnonceMedia;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Photos d'une annonce envoyables par WhatsApp, et présélection des plus parlantes. WhatsApp
 * n'accepte que le JPEG et le PNG, 5 Mo au plus.
 */
public final class PitchPhotoSelector {

    public static final long WHATSAPP_MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    public static final Set<String> WHATSAPP_IMAGE_TYPES = Set.of("image/jpeg", "image/png");
    public static final int MAX_PHOTOS = 3;
    public static final int SUGGESTED_PHOTOS = 2;

    /** Ordre de préférence des pièces pour donner envie (le reste vaut 1). */
    private static final Map<String, Integer> ROOM_PRIORITY =
            Map.ofEntries(
                    Map.entry("salon", 10),
                    Map.entry("facade", 9),
                    Map.entry("vue", 8),
                    Map.entry("terrasse", 7),
                    Map.entry("piscine", 7),
                    Map.entry("jardin", 7),
                    Map.entry("salle_a_manger", 6),
                    Map.entry("cuisine", 6),
                    Map.entry("chambre", 5),
                    Map.entry("balcon", 5),
                    Map.entry("salle_de_bain", 3));

    private PitchPhotoSelector() {}

    /** Raison pour laquelle la photo ne peut pas partir par WhatsApp, ou null si elle peut. */
    public static String ineligibility(AnnonceMedia m) {
        if (!AnnonceMedia.TYPE_PHOTO.equals(m.getMediaType())) {
            return "pas une photo";
        }
        Map<String, Object> a = m.getAnalysis();
        if (a != null && Boolean.FALSE.equals(a.get("is_property_photo"))) {
            return "ne montre pas le bien";
        }
        if (AnnonceMedia.SOURCE_URL.equals(m.getSource())) {
            String url = m.getExternalUrl();
            return url != null && url.toLowerCase(Locale.ROOT).startsWith("https://")
                    ? null
                    : "lien non sécurisé (https requis)";
        }
        if (m.getStoragePath() == null) {
            return "fichier absent";
        }
        String type = m.getContentType() != null ? m.getContentType().toLowerCase(Locale.ROOT) : "";
        if (!WHATSAPP_IMAGE_TYPES.contains(type)) {
            return "format non accepté par WhatsApp (JPEG ou PNG)";
        }
        if (m.getFileSize() != null && m.getFileSize() > WHATSAPP_MAX_IMAGE_BYTES) {
            return "plus de 5 Mo";
        }
        return null;
    }

    public static String roomType(AnnonceMedia m) {
        Map<String, Object> a = m.getAnalysis();
        Object r = a != null ? a.get("room_type") : null;
        return r instanceof String s ? s : null;
    }

    public static String caption(AnnonceMedia m) {
        Map<String, Object> a = m.getAnalysis();
        Object c = a != null ? a.get("caption") : null;
        return c instanceof String s && !s.isBlank() ? s : null;
    }

    private static double score(AnnonceMedia m) {
        String room = roomType(m);
        double base = room == null ? 2 : ROOM_PRIORITY.getOrDefault(room, 1);
        Map<String, Object> a = m.getAnalysis();
        if (a != null && a.get("confidence") instanceof Number n) {
            base += n.doubleValue();
        }
        if (a != null && "bonne".equals(a.get("natural_light"))) {
            base += 0.5;
        }
        return base;
    }

    /** Présélection : les meilleures photos, une seule par type de pièce. */
    public static List<Long> suggest(List<AnnonceMedia> eligible) {
        List<AnnonceMedia> sorted = new ArrayList<>(eligible);
        sorted.sort(
                Comparator.comparingDouble(PitchPhotoSelector::score)
                        .reversed()
                        .thenComparing(
                                m -> m.getPosition() != null ? m.getPosition() : Integer.MAX_VALUE)
                        .thenComparing(AnnonceMedia::getId));
        List<Long> out = new ArrayList<>();
        Set<String> rooms = new HashSet<>();
        for (AnnonceMedia m : sorted) {
            String room = roomType(m);
            if (room != null && !rooms.add(room)) {
                continue;
            }
            out.add(m.getId());
            if (out.size() == SUGGESTED_PHOTOS) {
                break;
            }
        }
        return out;
    }
}
