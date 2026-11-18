package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.MessageChannel;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class PropertyPitchServiceTest {

    private static Annonce annonce() {
        Annonce a = new Annonce();
        a.setId(7L);
        a.setTitle("Villa Achakar");
        a.setCity("Tanger");
        a.setAddress("12 rue secrète");
        a.setType(AnnonceType.SALE);
        a.setPrice(new BigDecimal("3500000"));
        a.setSurface(240.0);
        return a;
    }

    @Test
    void fiche_sans_adresse_precise() {
        Map<String, Object> f = PropertyPitchService.fiche(annonce());
        assertThat(f).containsEntry("ville", "Tanger").containsEntry("prix", 3_500_000.0);
        assertThat(f).containsEntry("devise", "MAD").containsEntry("type", "SALE");
        assertThat(f.values()).doesNotContain("12 rue secrète");
    }

    @Test
    void prenom() {
        assertThat(PropertyPitchService.firstName("  Youssef Alami ")).isEqualTo("Youssef");
        assertThat(PropertyPitchService.firstName(" ")).isNull();
        assertThat(PropertyPitchService.firstName(null)).isNull();
    }

    @Test
    void modele_de_secours() {
        String fr = PropertyPitchService.fallbackMessage(annonce(), "Youssef Alami", "fr");
        assertThat(fr)
                .startsWith("Bonjour Youssef,")
                .contains("à Tanger")
                .contains("240 m²")
                .contains("3 500 000 MAD")
                .endsWith("une visite ?");
        assertThat(PropertyPitchService.fallbackMessage(annonce(), null, "en"))
                .startsWith("Hello,");
        assertThat(PropertyPitchService.fallbackMessage(annonce(), "Salma", "ar"))
                .startsWith("السلام Salma");
    }

    @Test
    void langue_et_canal() {
        assertThat(PropertyPitchService.normalizeLanguage("AR")).isEqualTo("ar");
        assertThat(PropertyPitchService.normalizeLanguage("de")).isEqualTo("fr");
        assertThat(PropertyPitchService.parseChannel("sms")).isEqualTo(MessageChannel.SMS);
        assertThatThrownBy(() -> PropertyPitchService.parseChannel("EMAIL"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void cle_idempotence_stable_par_message() {
        String a = PropertyPitchService.idempotencyKey(3L, MessageChannel.SMS, "Bonjour");
        assertThat(a)
                .isEqualTo(PropertyPitchService.idempotencyKey(3L, MessageChannel.SMS, "Bonjour"));
        assertThat(a)
                .isNotEqualTo(
                        PropertyPitchService.idempotencyKey(3L, MessageChannel.SMS, "Bonjour !"));
        assertThat(a)
                .isNotEqualTo(
                        PropertyPitchService.idempotencyKey(
                                3L, MessageChannel.WHATSAPP, "Bonjour"));
    }
}
