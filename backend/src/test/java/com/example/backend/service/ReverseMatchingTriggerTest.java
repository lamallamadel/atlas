package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.brain.BrainClientService;
import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * Sans @Transactional : vérifie que la création d'une annonce déclenche bien le matching inverse
 * APRÈS la validation de la transaction (sinon le calcul ne verrait pas l'annonce).
 */
@SpringBootTest
@ActiveProfiles("test")
class ReverseMatchingTriggerTest {

    private static final String ORG = "org-trigger";

    @Autowired private AnnonceService annonceService;
    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceDossierMatchRepository matchRepository;

    @MockitoBean private BrainClientService brainClientService;
    @MockitoBean private NotificationService notificationService;

    @AfterEach
    void tearDown() {
        matchRepository.deleteAll();
        annonceRepository.findAll().stream()
                .filter(a -> ORG.equals(a.getOrgId()))
                .forEach(annonceRepository::delete);
        dossierRepository.findAll().stream()
                .filter(d -> ORG.equals(d.getOrgId()))
                .forEach(dossierRepository::delete);
        TenantContext.clear();
    }

    @Test
    void creer_une_annonce_trouve_les_acheteurs() {
        TenantContext.setOrgId(ORG);
        Dossier d = new Dossier();
        d.setOrgId(ORG);
        d.setLeadName("Karim");
        d.setLeadPhone("+212600000001");
        d.setStatus(DossierStatus.NEW);
        d.setSearchCriteria(Map.of("cities", List.of("Tanger")));
        Long buyer = dossierRepository.save(d).getId();
        when(brainClientService.matchBuyers(any()))
                .thenReturn(
                        Optional.of(
                                Map.of(
                                        "resultats",
                                        List.of(
                                                Map.of(
                                                        "client_id",
                                                        buyer,
                                                        "score_match",
                                                        88,
                                                        "raisons",
                                                        List.of(),
                                                        "alertes",
                                                        List.of())))));

        AnnonceCreateRequest req = new AnnonceCreateRequest();
        req.setTitle("Appartement Malabata");
        req.setCity("Tanger");
        req.setType(AnnonceType.SALE);
        req.setPrice(new BigDecimal("900000"));
        AnnonceResponse created = annonceService.create(req);

        verify(brainClientService, timeout(5000)).matchBuyers(any());
        // le calcul tourne en arrière-plan : on attend qu'il ait enregistré son résultat
        long deadline = System.currentTimeMillis() + 5000;
        while (matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(created.getId()).isEmpty()
                && System.currentTimeMillis() < deadline) {
            Thread.onSpinWait();
        }
        assertThat(matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(created.getId()))
                .singleElement()
                .satisfies(m -> assertThat(m.getDossierId()).isEqualTo(buyer));
    }
}
