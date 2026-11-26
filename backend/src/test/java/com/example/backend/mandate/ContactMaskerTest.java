package com.example.backend.mandate;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ContactMaskerTest {

    @Test
    void masksPhonesEmailsAndMessagingLinks() {
        assertThat(ContactMasker.mask("Appelez le 06 61 00 03 33 ou le +212-661-000-333"))
                .isEqualTo("Appelez le " + ContactMasker.MASK + " ou le " + ContactMasker.MASK);
        assertThat(ContactMasker.mask("nadia.i@gmail.com ou nadia (at) gmail.com"))
                .doesNotContain("gmail");
        assertThat(ContactMasker.mask("wa.me/212661000333 et https://t.me/nadia"))
                .doesNotContain("wa.me")
                .doesNotContain("t.me");
    }

    @Test
    void keepsDatesPricesAndSurfaces() {
        String text = "Visite le 28/11/2026 ou le 28.11.2026, prix 1 450 000 MAD, 92 m², 3 pièces";
        assertThat(ContactMasker.mask(text)).isEqualTo(text);
        assertThat(ContactMasker.mask(null)).isNull();
    }
}
