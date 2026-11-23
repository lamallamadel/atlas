package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.repository.AnnonceMediaRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class AnnonceQualityServiceTest {

    private final AnnonceMediaRepository media = mock(AnnonceMediaRepository.class);
    private final AnnonceQualityService quality = new AnnonceQualityService(media, 3);
    private final AnnoncePublicationService publication = new AnnoncePublicationService(quality);

    static Annonce complete() {
        Annonce a = new Annonce();
        a.setId(10L);
        a.setTitle("Appartement lumineux à Malabata");
        a.setDescription(
                "Bel appartement de 3 pièces avec vue sur la baie, cuisine équipée, deux chambres,"
                        + " parking en sous-sol et ascenseur.");
        a.setType(AnnonceType.SALE);
        a.setPrice(new BigDecimal("1250000"));
        a.setCity("Tanger");
        a.setSurface(92.0);
        a.setAddress("Malabata");
        a.setCategory("Appartement");
        a.setPhotos(List.of("p1.jpg", "p2.jpg", "p3.jpg"));
        a.setStatus(AnnonceStatus.DRAFT);
        return a;
    }

    @Test
    void completeAnnonceScoresFullAndIsPublishable() {
        AnnonceQualityService.Quality q = quality.evaluate(complete());
        assertThat(q.score()).isEqualTo(100);
        assertThat(q.missing()).isEmpty();
        assertThat(q.publishable()).isTrue();
    }

    @Test
    void missingPhotosBlockAndCostPointsProportionally() {
        Annonce a = complete();
        a.setPhotos(List.of("p1.jpg"));
        AnnonceQualityService.Quality q = quality.evaluate(a);
        assertThat(q.photoCount()).isEqualTo(1);
        assertThat(q.publishable()).isFalse();
        assertThat(q.blockingMissing())
                .extracting(AnnonceQualityService.Criterion::code)
                .containsExactly("PHOTOS");
        assertThat(q.score()).isEqualTo(100 - 20 + 20 / 3);
    }

    @Test
    void uploadedPhotosCountToo() {
        Annonce a = complete();
        a.setPhotos(List.of());
        when(media.countByAnnonceIdAndMediaType(anyLong(), anyString())).thenReturn(4L);
        assertThat(quality.evaluate(a).photoCount()).isEqualTo(4);
        assertThat(quality.evaluate(a).publishable()).isTrue();
    }

    @Test
    void addressAndCategoryLowerTheScoreWithoutBlocking() {
        Annonce a = complete();
        a.setAddress(null);
        a.setCategory(" ");
        AnnonceQualityService.Quality q = quality.evaluate(a);
        assertThat(q.score()).isEqualTo(90);
        assertThat(q.publishable()).isTrue();
    }

    @Test
    void legacyStatusesAreNormalized() {
        Annonce a = complete();
        a.setStatus(AnnonceStatus.ACTIVE);
        assertThat(a.getStatus()).isEqualTo(AnnonceStatus.PUBLISHED);
        a.setStatus(AnnonceStatus.PAUSED);
        assertThat(a.getStatus()).isEqualTo(AnnonceStatus.SUSPENDED);
    }

    @Test
    void transitionsFollowTheLifecycle() {
        assertThat(
                        AnnoncePublicationService.transitionCode(
                                AnnonceStatus.DRAFT, AnnonceStatus.PUBLISHED))
                .isEqualTo(AnnoncePublicationService.T_PUBLISH);
        assertThat(
                        AnnoncePublicationService.transitionCode(
                                AnnonceStatus.SUSPENDED, AnnonceStatus.ACTIVE))
                .isEqualTo(AnnoncePublicationService.T_PUBLISH);
        assertThat(
                        AnnoncePublicationService.transitionCode(
                                AnnonceStatus.PUBLISHED, AnnonceStatus.PAUSED))
                .isEqualTo(AnnoncePublicationService.T_SUSPEND);
        assertThat(
                        AnnoncePublicationService.transitionCode(
                                AnnonceStatus.DRAFT, AnnonceStatus.SUSPENDED))
                .isNull();
        assertThat(
                        AnnoncePublicationService.transitionCode(
                                AnnonceStatus.ARCHIVED, AnnonceStatus.DRAFT))
                .isNull();
        assertThat(
                        AnnoncePublicationService.transitionCode(
                                AnnonceStatus.PUBLISHED, AnnonceStatus.DRAFT))
                .isNull();
    }

    @Test
    void certainDuplicateBlocksUntilOverrideForTheSameDuplicate() {
        Annonce a = complete();
        a.setDuplicateStatut("DOUBLON_CERTAIN");
        a.setDuplicateOfId(7L);
        assertThat(publication.publicationBlockers(a))
                .extracting(AnnoncePublicationService.Blocker::code)
                .containsExactly("DUPLICATE_CERTAIN");

        a.setMeta(
                new java.util.HashMap<>(
                        java.util.Map.of(
                                "trustOverride",
                                java.util.Map.of(
                                        "duplicateOfId",
                                        7L,
                                        "duplicateStatut",
                                        "DOUBLON_CERTAIN"))));
        assertThat(publication.publicationBlockers(a)).isEmpty();

        // Un autre doublon apparaît : la dérogation ne vaut plus.
        a.setDuplicateOfId(8L);
        assertThat(publication.publicationBlockers(a))
                .extracting(AnnoncePublicationService.Blocker::code)
                .containsExactly("DUPLICATE_CERTAIN");
    }

    @Test
    void probableDuplicateAndSuspectFraudDoNotBlock() {
        Annonce a = complete();
        a.setDuplicateStatut("DOUBLON_PROBABLE");
        a.setFraudStatut("SUSPECT");
        assertThat(publication.publicationBlockers(a)).isEmpty();
    }
}
