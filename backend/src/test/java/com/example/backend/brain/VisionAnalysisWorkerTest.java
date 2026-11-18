package com.example.backend.brain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceMedia;
import com.example.backend.repository.AnnonceMediaRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.service.AnnonceMediaService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VisionAnalysisWorkerTest {

    @Mock private AnnonceRepository annonceRepository;
    @Mock private AnnonceMediaRepository mediaRepository;
    @Mock private AnnonceMediaService mediaService;
    @Mock private BrainVisionClient visionClient;

    private VisionAnalysisWorker worker;
    private Annonce annonce;

    @BeforeEach
    void setUp() {
        worker =
                new VisionAnalysisWorker(
                        annonceRepository, mediaRepository, mediaService, visionClient);
        annonce = new Annonce();
        annonce.setId(1L);
        annonce.setOrgId("org-1");
        annonce.setTitle("Appartement");
        annonce.setCity("Tanger");
        annonce.setSurface(85.0);
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce));
    }

    private static AnnonceMedia media(long id, String source, String status) {
        AnnonceMedia m = new AnnonceMedia();
        m.setId(id);
        m.setAnnonceId(1L);
        m.setOrgId("org-1");
        m.setSource(source);
        m.setAnalysisStatus(status);
        m.setContentType("image/jpeg");
        if (AnnonceMedia.SOURCE_URL.equals(source)) {
            m.setExternalUrl("https://cdn.exemple.ma/photo" + id + ".png?w=800");
        } else {
            m.setStoragePath("org-1/annonces/1/media/x.jpg");
        }
        return m;
    }

    private static BrainVisionClient.Result ok(Map<String, Object> body) {
        return new BrainVisionClient.Result(BrainVisionClient.Outcome.OK, body, null);
    }

    @Test
    void analyse_les_photos_en_attente_puis_construit_le_profil() throws Exception {
        AnnonceMedia upload = media(10, AnnonceMedia.SOURCE_UPLOAD, AnnonceMedia.STATUS_PENDING);
        AnnonceMedia link = media(11, AnnonceMedia.SOURCE_URL, AnnonceMedia.STATUS_PENDING);
        AnnonceMedia already = media(12, AnnonceMedia.SOURCE_UPLOAD, AnnonceMedia.STATUS_DONE);
        already.setAnalysis(Map.of("room_type", "salon"));
        when(mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(1L))
                .thenReturn(List.of(upload, link, already));
        when(mediaService.readBytes(upload)).thenReturn(new byte[] {1, 2, 3});
        when(visionClient.analyzePhoto(any(), any(), any(), anyMap()))
                .thenReturn(
                        ok(Map.of("analysis", Map.of("room_type", "cuisine"), "engine", "openai")));
        when(visionClient.buildProfile(anyList(), anyMap(), anyList()))
                .thenReturn(ok(Map.of("profile", Map.of(), "descriptions", Map.of("fr", "Texte"))));

        worker.analyze(1L);

        // Photo importée : envoyée en base64 ; lien : envoyé tel quel, type deviné depuis
        // l'extension
        verify(visionClient).analyzePhoto(isNull(), eq("AQID"), eq("image/jpeg"), anyMap());
        verify(visionClient)
                .analyzePhoto(eq(link.getExternalUrl()), isNull(), eq("image/png"), anyMap());
        verify(visionClient, times(2)).analyzePhoto(any(), any(), any(), anyMap());
        assertThat(upload.getAnalysisStatus()).isEqualTo(AnnonceMedia.STATUS_DONE);
        assertThat(upload.getAnalysisEngine()).isEqualTo("openai");
        assertThat(upload.getAnalysis()).containsEntry("room_type", "cuisine");
        assertThat(link.getAnalysisStatus()).isEqualTo(AnnonceMedia.STATUS_DONE);

        verify(visionClient).buildProfile(anyList(), anyMap(), eq(List.of("fr")));
        assertThat(annonce.getAiVisionResult()).containsKey("descriptions");
        assertThat(annonce.getAiVisionUpdatedAt()).isNotNull();
    }

    @Test
    void brain_indisponible_arrete_l_analyse_et_marque_les_photos_en_echec() {
        AnnonceMedia a = media(10, AnnonceMedia.SOURCE_URL, AnnonceMedia.STATUS_PENDING);
        AnnonceMedia b = media(11, AnnonceMedia.SOURCE_URL, AnnonceMedia.STATUS_PENDING);
        when(mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(1L)).thenReturn(List.of(a, b));
        when(visionClient.analyzePhoto(any(), any(), any(), anyMap()))
                .thenReturn(
                        new BrainVisionClient.Result(
                                BrainVisionClient.Outcome.UNAVAILABLE, null, "Aucun moteur"));

        worker.analyze(1L);

        verify(visionClient, times(1)).analyzePhoto(any(), any(), any(), anyMap());
        assertThat(a.getAnalysisStatus()).isEqualTo(AnnonceMedia.STATUS_FAILED);
        assertThat(b.getAnalysisStatus()).isEqualTo(AnnonceMedia.STATUS_FAILED);
        assertThat(b.getAnalysisError()).isEqualTo("Aucun moteur");
        verify(visionClient, never()).buildProfile(anyList(), anyMap(), anyList());
        verify(annonceRepository, never()).save(any());
    }

    @Test
    void photo_refusee_n_empeche_pas_les_suivantes() {
        AnnonceMedia a = media(10, AnnonceMedia.SOURCE_URL, AnnonceMedia.STATUS_PENDING);
        AnnonceMedia b = media(11, AnnonceMedia.SOURCE_URL, AnnonceMedia.STATUS_PENDING);
        when(mediaRepository.findByAnnonceIdOrderByPositionAscIdAsc(1L)).thenReturn(List.of(a, b));
        when(visionClient.analyzePhoto(eq(a.getExternalUrl()), any(), any(), anyMap()))
                .thenReturn(
                        new BrainVisionClient.Result(
                                BrainVisionClient.Outcome.REJECTED,
                                null,
                                "Format non pris en charge"));
        when(visionClient.analyzePhoto(eq(b.getExternalUrl()), any(), any(), anyMap()))
                .thenReturn(
                        ok(Map.of("analysis", Map.of("room_type", "chambre"), "engine", "ollama")));
        when(visionClient.buildProfile(anyList(), anyMap(), anyList()))
                .thenReturn(ok(Map.of("profile", Map.of())));

        worker.analyze(1L);

        assertThat(a.getAnalysisStatus()).isEqualTo(AnnonceMedia.STATUS_REJECTED);
        assertThat(a.getAnalysisError()).isEqualTo("Format non pris en charge");
        assertThat(b.getAnalysisStatus()).isEqualTo(AnnonceMedia.STATUS_DONE);
        verify(visionClient)
                .buildProfile(eq(List.of(Map.of("room_type", "chambre"))), anyMap(), anyList());
    }

    @Test
    void declared_n_envoie_que_les_champs_renseignes() {
        Map<String, Object> declared = VisionAnalysisWorker.declared(annonce);
        assertThat(declared)
                .containsOnlyKeys("title", "city", "surface")
                .containsEntry("surface", 85.0);
    }

    @Test
    void type_de_contenu_devine_depuis_l_url() {
        assertThat(VisionAnalysisWorker.guessContentType("https://x/a.WEBP"))
                .isEqualTo("image/webp");
        assertThat(VisionAnalysisWorker.guessContentType("https://x/a.png?v=2"))
                .isEqualTo("image/png");
        assertThat(VisionAnalysisWorker.guessContentType("https://x/a")).isEqualTo("image/jpeg");
    }
}
