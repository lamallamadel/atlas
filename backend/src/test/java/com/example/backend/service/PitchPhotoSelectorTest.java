package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.entity.AnnonceMedia;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PitchPhotoSelectorTest {

    private static long ids = 1;

    private static AnnonceMedia upload(String type, long size, Map<String, Object> analysis) {
        AnnonceMedia m = new AnnonceMedia();
        m.setId(ids++);
        m.setMediaType(AnnonceMedia.TYPE_PHOTO);
        m.setSource(AnnonceMedia.SOURCE_UPLOAD);
        m.setStoragePath("org/annonces/1/x");
        m.setContentType(type);
        m.setFileSize(size);
        m.setPosition((int) m.getId().longValue());
        m.setAnalysis(analysis);
        return m;
    }

    private static Map<String, Object> room(String r, double confidence) {
        Map<String, Object> a = new HashMap<>();
        a.put("is_property_photo", true);
        a.put("room_type", r);
        a.put("confidence", confidence);
        return a;
    }

    @Test
    void eligibilite_whatsapp() {
        assertThat(PitchPhotoSelector.ineligibility(upload("image/jpeg", 1000, null))).isNull();
        assertThat(PitchPhotoSelector.ineligibility(upload("image/png", 1000, null))).isNull();
        assertThat(PitchPhotoSelector.ineligibility(upload("image/webp", 1000, null)))
                .contains("JPEG ou PNG");
        assertThat(PitchPhotoSelector.ineligibility(upload("image/jpeg", 6L * 1024 * 1024, null)))
                .contains("5 Mo");
        assertThat(
                        PitchPhotoSelector.ineligibility(
                                upload("image/jpeg", 1000, Map.of("is_property_photo", false))))
                .contains("ne montre pas le bien");

        AnnonceMedia ext = new AnnonceMedia();
        ext.setMediaType(AnnonceMedia.TYPE_PHOTO);
        ext.setSource(AnnonceMedia.SOURCE_URL);
        ext.setExternalUrl("https://cdn.example.ma/a.jpg");
        assertThat(PitchPhotoSelector.ineligibility(ext)).isNull();
        ext.setExternalUrl("http://cdn.example.ma/a.jpg");
        assertThat(PitchPhotoSelector.ineligibility(ext)).contains("https");
    }

    @Test
    void presélection_pieces_parlantes_sans_doublon() {
        AnnonceMedia sdb = upload("image/jpeg", 1, room("salle_de_bain", 0.9));
        AnnonceMedia salon1 = upload("image/jpeg", 1, room("salon", 0.6));
        AnnonceMedia salon2 = upload("image/jpeg", 1, room("salon", 0.9));
        AnnonceMedia facade = upload("image/jpeg", 1, room("facade", 0.8));
        assertThat(PitchPhotoSelector.suggest(List.of(sdb, salon1, salon2, facade)))
                .containsExactly(salon2.getId(), facade.getId());
    }

    @Test
    void presélection_sans_analyse_suit_l_ordre() {
        AnnonceMedia a = upload("image/jpeg", 1, null);
        AnnonceMedia b = upload("image/jpeg", 1, null);
        AnnonceMedia c = upload("image/jpeg", 1, null);
        assertThat(PitchPhotoSelector.suggest(List.of(c, a, b)))
                .containsExactly(a.getId(), b.getId());
    }
}
