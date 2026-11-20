package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.brain.BrainClientService;
import com.example.backend.dto.BuyerMatchResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReverseMatchingServiceTest {

    private static final String ORG = "org-rm";

    @Autowired private ReverseMatchingService service;
    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceDossierMatchRepository matchRepository;

    @MockitoBean private BrainClientService brainClientService;
    @MockitoBean private NotificationService notificationService;

    private Long annonceId;
    private Long buyer1;
    private Long buyer2;

    @BeforeEach
    void setUp() {
        TenantContext.setOrgId(ORG);
        Annonce a = new Annonce();
        a.setOrgId(ORG);
        a.setTitle("Appartement vue mer");
        a.setCity("Tanger");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        a.setPrice(new BigDecimal("1000000"));
        a.setSurface(95.0);
        annonceId = annonceRepository.save(a).getId();
        buyer1 = buyer("Karim", DossierStatus.QUALIFIED, Map.of("cities", List.of("Tanger")));
        buyer2 = buyer("Salma", DossierStatus.NEW, Map.of("budgetMax", 1200000));
        buyer("Clos", DossierStatus.WON, Map.of("cities", List.of("Tanger")));
        buyer("Sans critère", DossierStatus.NEW, null);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Long buyer(String name, DossierStatus status, Map<String, Object> criteria) {
        Dossier d = new Dossier();
        d.setOrgId(ORG);
        d.setLeadName(name);
        d.setLeadPhone("+212600000000");
        d.setStatus(status);
        d.setSearchCriteria(criteria);
        return dossierRepository.save(d).getId();
    }

    private void brainReturns(Map<Long, Integer> scores) {
        when(brainClientService.matchBuyers(any()))
                .thenReturn(
                        Optional.of(
                                Map.of(
                                        "resultats",
                                        scores.entrySet().stream()
                                                .map(
                                                        e ->
                                                                Map.<String, Object>of(
                                                                        "client_id", e.getKey(),
                                                                        "score_match", e.getValue(),
                                                                        "raisons",
                                                                                List.of(
                                                                                        "Ville recherchée (Tanger)"),
                                                                        "alertes", List.of()))
                                                .toList())));
    }

    @Test
    @SuppressWarnings("unchecked")
    void envoie_seulement_les_acheteurs_en_cours_avec_criteres() {
        AtomicReference<Map<String, Object>> sent = new AtomicReference<>();
        when(brainClientService.matchBuyers(any()))
                .thenAnswer(
                        inv -> {
                            sent.set(inv.getArgument(0));
                            return Optional.of(Map.of("resultats", List.of()));
                        });

        assertThat(service.recompute(annonceId)).isTrue();

        List<Map<String, Object>> acheteurs =
                (List<Map<String, Object>>) sent.get().get("acheteurs");
        assertThat(acheteurs)
                .extracting(a -> a.get("client_id"))
                .containsExactlyInAnyOrder(buyer1, buyer2);
        assertThat(sent.get()).containsEntry("seuil", 70);
        assertThat((Map<String, Object>) sent.get().get("bien"))
                .containsEntry("title", "Appartement vue mer");
    }

    @Test
    void nouvelles_correspondances_enregistrees_et_notifiees_une_seule_fois() {
        brainReturns(Map.of(buyer1, 92));
        service.recompute(annonceId);

        List<AnnonceDossierMatch> matches =
                matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId);
        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getStatus()).isEqualTo(AnnonceDossierMatch.STATUS_NEW);
        assertThat(matches.get(0).getNotifiedAt()).isNotNull();
        // destinataire = créateur du dossier (renseigné par l'audit JPA)
        String owner = dossierRepository.findById(buyer1).orElseThrow().getCreatedBy();
        verify(notificationService)
                .createInAppNotification(
                        eq(ORG),
                        eq(buyer1),
                        eq(owner != null ? owner : "equipe"),
                        eq("Nouveau bien pour Karim (92/100)"),
                        anyString(),
                        eq("/annonces/" + annonceId));

        brainReturns(Map.of(buyer1, 80));
        service.recompute(annonceId);
        assertThat(
                        matchRepository
                                .findByAnnonceIdOrderByScoreDescIdAsc(annonceId)
                                .get(0)
                                .getScore())
                .isEqualTo(80);
        verify(notificationService, times(1))
                .createInAppNotification(any(), any(), any(), any(), any(), any());
    }

    @Test
    void deja_propose_garde_son_historique() {
        brainReturns(Map.of(buyer2, 75));
        service.recompute(annonceId);
        AnnonceDossierMatch m =
                matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId).get(0);
        m.setPitchedAt(java.time.LocalDateTime.now());
        m.setReplyIntent("VISITE");
        matchRepository.save(m);

        brainReturns(Map.of()); // l'annonce modifiée ne correspond plus
        service.recompute(annonceId);

        List<AnnonceDossierMatch> matches =
                matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId);
        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getReplyIntent()).isEqualTo("VISITE");
    }

    @Test
    void ecarte_reste_ecarte_et_disparus_supprimes() {
        brainReturns(Map.of(buyer1, 92, buyer2, 75));
        service.recompute(annonceId);
        Long m1 = matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId).get(0).getId();
        service.setDismissed(annonceId, m1, true);

        brainReturns(Map.of(buyer1, 95)); // buyer2 ne correspond plus
        service.recompute(annonceId);

        List<AnnonceDossierMatch> matches =
                matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId);
        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getDossierId()).isEqualTo(buyer1);
        assertThat(matches.get(0).getStatus()).isEqualTo(AnnonceDossierMatch.STATUS_DISMISSED);
        assertThat(matches.get(0).getScore()).isEqualTo(92); // pas remis en avant
    }

    @Test
    void annonce_archivee_plus_de_correspondance() {
        brainReturns(Map.of(buyer1, 92));
        service.recompute(annonceId);
        Annonce a = annonceRepository.findById(annonceId).orElseThrow();
        a.setStatus(AnnonceStatus.ARCHIVED);
        annonceRepository.save(a);

        service.recompute(annonceId);

        assertThat(matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId)).isEmpty();
        verify(brainClientService, times(1)).matchBuyers(any());
    }

    @Test
    void brain_indisponible_garde_l_existant() {
        brainReturns(Map.of(buyer1, 92));
        service.recompute(annonceId);
        when(brainClientService.matchBuyers(any())).thenReturn(Optional.empty());

        assertThat(service.recompute(annonceId)).isFalse();
        assertThat(matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId)).hasSize(1);
    }

    @Test
    void liste_marque_vu_et_met_les_ecartes_a_la_fin() {
        brainReturns(Map.of(buyer1, 92, buyer2, 75));
        service.recompute(annonceId);
        Long m1 = matchRepository.findByAnnonceIdOrderByScoreDescIdAsc(annonceId).get(0).getId();
        service.setDismissed(annonceId, m1, true);

        List<BuyerMatchResponse> list = service.list(annonceId, true);
        assertThat(list).extracting(BuyerMatchResponse::leadName).containsExactly("Salma", "Karim");
        assertThat(list.get(0).status())
                .isEqualTo(AnnonceDossierMatch.STATUS_NEW); // état au moment de la lecture
        assertThat(service.list(annonceId, false).get(0).status())
                .isEqualTo(AnnonceDossierMatch.STATUS_SEEN);
        assertThat(list.get(0).reasons()).containsExactly("Ville recherchée (Tanger)");
    }

    @Test
    void autre_organisation() {
        TenantContext.setOrgId("autre");
        assertThatThrownBy(() -> service.list(annonceId, true))
                .isInstanceOf(EntityNotFoundException.class);
        verify(brainClientService, never()).matchBuyers(any());
    }
}
