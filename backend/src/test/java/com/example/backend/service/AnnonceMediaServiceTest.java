package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class AnnonceMediaServiceTest {

    static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10};
    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    static final byte[] WEBP = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};

    @Test
    void signatures_reconnues() {
        assertThat(AnnonceMediaService.matchesSignature("image/jpeg", JPEG)).isTrue();
        assertThat(AnnonceMediaService.matchesSignature("image/png", PNG)).isTrue();
        assertThat(AnnonceMediaService.matchesSignature("image/webp", WEBP)).isTrue();
        assertThat(AnnonceMediaService.matchesSignature("image/png", JPEG)).isFalse();
        assertThat(AnnonceMediaService.matchesSignature("image/jpeg", new byte[] {1})).isFalse();
    }

    @Test
    void image_valide_acceptee() {
        AnnonceMediaService.validateImage(
                new MockMultipartFile("files", "a.jpg", "image/jpeg", JPEG));
    }

    @Test
    void faux_jpeg_refuse() {
        MockMultipartFile fake =
                new MockMultipartFile("files", "a.jpg", "image/jpeg", "<script>".getBytes());
        assertThatThrownBy(() -> AnnonceMediaService.validateImage(fake))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ne correspond pas");
    }

    @Test
    void format_non_accepte_refuse() {
        MockMultipartFile gif =
                new MockMultipartFile("files", "a.gif", "image/gif", new byte[] {'G', 'I', 'F'});
        assertThatThrownBy(() -> AnnonceMediaService.validateImage(gif))
                .hasMessageContaining("JPEG, PNG, WebP");
    }

    @Test
    void fichier_vide_refuse() {
        MockMultipartFile empty =
                new MockMultipartFile("files", "a.jpg", "image/jpeg", new byte[0]);
        assertThatThrownBy(() -> AnnonceMediaService.validateImage(empty))
                .hasMessageContaining("vide");
    }
}
