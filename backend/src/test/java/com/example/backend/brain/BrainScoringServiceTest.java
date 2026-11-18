package com.example.backend.brain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.brain.dto.DoublonResultDto;
import com.example.backend.brain.dto.FraudResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.repository.AnnonceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BrainScoringServiceTest {

    @Mock private BrainClientService brainClientService;
    @Mock private AnnonceRepository annonceRepository;

    private BrainScoringService service;

    @BeforeEach
    void setUp() {
        service =
                new BrainScoringService(brainClientService, annonceRepository, new ObjectMapper());
    }

    private static Annonce annonce(long id) {
        Annonce a = new Annonce();
        a.setId(id);
        a.setOrgId("org-1");
        a.setTitle("Appartement " + id);
        a.setDescription("Bel appartement");
        return a;
    }

    private static DoublonResultDto doublon(long a1, long a2, double similarite, String statut) {
        DoublonResultDto d = new DoublonResultDto();
        d.setAnnonce1(a1);
        d.setAnnonce2(a2);
        d.setSimilarite(similarite);
        d.setStatut(statut);
        return d;
    }

    @Test
    void applyDuplicateResult_keepsClosestDuplicate() {
        Annonce a = annonce(10);

        BrainScoringService.applyDuplicateResult(
                a,
                List.of(
                        doublon(10, 3, 88.0, "DOUBLON_PROBABLE"),
                        doublon(7, 10, 97.5, "DOUBLON_CERTAIN"),
                        doublon(3, 7, 99.0, "DOUBLON_CERTAIN"))); // ne concerne pas l'annonce 10

        assertThat(a.getDuplicateOfId()).isEqualTo(7L);
        assertThat(a.getDuplicateSimilarity()).isEqualTo(97.5);
        assertThat(a.getDuplicateStatut()).isEqualTo("DOUBLON_CERTAIN");
    }

    @Test
    void applyDuplicateResult_clearsFlagWhenNoLongerDuplicate() {
        Annonce a = annonce(10);
        a.setDuplicateOfId(7L);
        a.setDuplicateSimilarity(97.5);
        a.setDuplicateStatut("DOUBLON_CERTAIN");

        BrainScoringService.applyDuplicateResult(
                a, List.of(doublon(3, 7, 99.0, "DOUBLON_CERTAIN")));

        assertThat(a.getDuplicateOfId()).isNull();
        assertThat(a.getDuplicateSimilarity()).isNull();
        assertThat(a.getDuplicateStatut()).isNull();
    }

    @Test
    void applyDuplicateResult_doesNotTouchFraudFields() {
        Annonce a = annonce(10);
        a.setFraudStatut("SAIN");
        a.setFraudScore(5);

        BrainScoringService.applyDuplicateResult(
                a, List.of(doublon(10, 7, 97.5, "DOUBLON_CERTAIN")));

        assertThat(a.getFraudStatut()).isEqualTo("SAIN");
        assertThat(a.getFraudScore()).isEqualTo(5);
    }

    @Test
    void duplicateCheck_brainDown_keepsPreviousResult() {
        Annonce a = annonce(10);
        a.setDuplicateOfId(7L);
        a.setDuplicateStatut("DOUBLON_CERTAIN");
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(a));
        when(annonceRepository.findTop50ByOrgIdOrderByCreatedAtDesc("org-1"))
                .thenReturn(List.of(a, annonce(7)));
        when(brainClientService.tryDetectDuplicates(anyList())).thenReturn(Optional.empty());

        service.triggerDuplicateCheckAsync(10L);

        verify(annonceRepository, never()).save(any());
        assertThat(a.getDuplicateOfId()).isEqualTo(7L);
        assertThat(a.getDuplicateStatut()).isEqualTo("DOUBLON_CERTAIN");
    }

    @Test
    void duplicateCheck_savesDetectedDuplicate() {
        Annonce a = annonce(10);
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(a));
        when(annonceRepository.findTop50ByOrgIdOrderByCreatedAtDesc("org-1"))
                .thenReturn(List.of(a, annonce(7)));
        when(brainClientService.tryDetectDuplicates(anyList()))
                .thenReturn(Optional.of(List.of(doublon(10, 7, 91.0, "DOUBLON_PROBABLE"))));

        service.triggerDuplicateCheckAsync(10L);

        verify(annonceRepository).save(a);
        assertThat(a.getDuplicateOfId()).isEqualTo(7L);
        assertThat(a.getDuplicateStatut()).isEqualTo("DOUBLON_PROBABLE");
    }

    @Test
    void fraudAnalysis_storesAlertes() {
        Annonce a = annonce(10);
        a.setPrice(new BigDecimal("100000"));
        a.setSurface(100.0);
        a.setCity("Tanger");
        when(annonceRepository.findById(10L)).thenReturn(Optional.of(a));

        FraudResponse response = new FraudResponse();
        response.setStatut("SUSPECT");
        response.setScoreFraude(35);
        response.setAlertes(List.of("Prix/m² très bas (1000 MAD/m²)"));
        when(brainClientService.analyzeFraud(any())).thenReturn(Optional.of(response));

        service.triggerFraudAsync(10L);

        verify(annonceRepository).save(a);
        assertThat(a.getFraudStatut()).isEqualTo("SUSPECT");
        assertThat(a.getFraudAlertes()).containsExactly("Prix/m² très bas (1000 MAD/m²)");
    }
}
