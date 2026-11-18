package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.MatchRequest;
import com.example.backend.brain.dto.MatchResponse;
import com.example.backend.dto.CriteriaSuggestionResponse;
import com.example.backend.dto.DossierMatchesResponse;
import com.example.backend.dto.DossierSearchCriteria;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
class DossierMatchingServiceTest {

    private static final String ORG = "org123";

    @Autowired private DossierMatchingService service;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MessageRepository messageRepository;

    @MockitoBean private BrainClientService brainClientService;

    private Long dossierId;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        dossierRepository.deleteAll();
        annonceRepository.deleteAll();
        TenantContext.setOrgId(ORG);
        Dossier d = new Dossier();
        d.setOrgId(ORG);
        d.setLeadPhone("+212600000000");
        d.setLeadName("Acheteur");
        d.setStatus(DossierStatus.NEW);
        dossierId = dossierRepository.save(d).getId();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private static DossierSearchCriteria criteria() {
        return new DossierSearchCriteria(
                List.of("sale", "SALE"),
                List.of("APARTMENT"),
                List.of(" Tanger ", ""),
                new BigDecimal("800000"),
                new BigDecimal("1200000"),
                80.0,
                null,
                true,
                List.of("piscine"),
                List.of("neuf", "bon_etat"));
    }

    private Annonce annonce(String title, AnnonceStatus status, String org) {
        Annonce a = new Annonce();
        a.setOrgId(org);
        a.setTitle(title);
        a.setCity("Tanger");
        a.setCategory("APARTMENT");
        a.setType(AnnonceType.SALE);
        a.setPrice(new BigDecimal("1000000"));
        a.setSurface(90.0);
        a.setStatus(status);
        return annonceRepository.save(a);
    }

    @Test
    void la_requete_brain_est_en_snake_case() throws Exception {
        MatchRequest req = new MatchRequest();
        req.setClientId(7L);
        req.setCriteres(Map.of("budget_max", 1));
        req.setBiens(List.of());
        String json = objectMapper.writeValueAsString(req);
        assertThat(json)
                .contains("\"client_id\":7")
                .contains("\"criteres\"")
                .doesNotContain("clientId");
    }

    @Test
    void criteres_normalises_et_persistes() {
        DossierSearchCriteria saved = service.saveCriteria(dossierId, criteria());

        assertThat(saved.transactionTypes()).containsExactly("SALE");
        assertThat(saved.cities()).containsExactly("Tanger");
        assertThat(service.getCriteria(dossierId)).contains(saved);
        assertThat(dossierRepository.findById(dossierId).orElseThrow().getSearchCriteriaUpdatedAt())
                .isNotNull();
    }

    @Test
    void criteres_invalides_refuses() {
        assertThatThrownBy(
                        () ->
                                service.saveCriteria(
                                        dossierId,
                                        new DossierSearchCriteria(
                                                null, null, null, null, null, null, null, null,
                                                null, null)))
                .hasMessageContaining("au moins un critère");
        assertThatThrownBy(
                        () ->
                                service.saveCriteria(
                                        dossierId,
                                        new DossierSearchCriteria(
                                                null,
                                                null,
                                                null,
                                                new BigDecimal("2"),
                                                new BigDecimal("1"),
                                                null,
                                                null,
                                                null,
                                                null,
                                                null)))
                .hasMessageContaining("budget minimum");
        assertThatThrownBy(
                        () ->
                                service.saveCriteria(
                                        dossierId,
                                        new DossierSearchCriteria(
                                                null,
                                                null,
                                                null,
                                                null,
                                                null,
                                                null,
                                                null,
                                                null,
                                                null,
                                                List.of("magnifique"))))
                .hasMessageContaining("État inconnu");
    }

    @Test
    void matches_envoie_les_criteres_et_le_profil_vision_puis_enrichit() {
        service.saveCriteria(dossierId, criteria());
        Annonce actif = annonce("Actif", AnnonceStatus.ACTIVE, ORG);
        actif.setAiVisionResult(
                Map.of(
                        "profile",
                        Map.of(
                                "meuble", true,
                                "etat_general", "bon_etat",
                                "equipements", List.of(Map.of("label", "piscine", "photos", 2)),
                                "vues", List.of("vue mer"),
                                "pieces", List.of(Map.of("room_type", "salon")))));
        actif.setPhotos(List.of("http://non-https.ma/a.jpg", "https://cdn.ma/a.jpg"));
        annonceRepository.save(actif);
        Annonce brouillon = annonce("Brouillon", AnnonceStatus.DRAFT, ORG);
        annonce("Archivé", AnnonceStatus.ARCHIVED, ORG);
        annonce("Autre org", AnnonceStatus.ACTIVE, "other-org");

        AtomicReference<MatchRequest> sent = new AtomicReference<>();
        MatchResponse brain = new MatchResponse();
        brain.setMatches(
                List.of(
                        Map.of(
                                "bien_id", brouillon.getId(),
                                "score_match", 90,
                                "raisons", List.of("Dans le budget"),
                                "alertes", List.of("Meublé : non vérifié")),
                        Map.of("bien_id", actif.getId(), "score_match", 80, "raisons", List.of()),
                        Map.of("bien_id", 999_999, "score_match", 70)));
        brain.setExclus(Map.of("ville", 0));
        when(brainClientService.calculateMatch(any()))
                .thenAnswer(
                        inv -> {
                            sent.set(inv.getArgument(0));
                            return Optional.of(brain);
                        });

        DossierMatchesResponse res =
                service.findMatches(dossierId, DossierMatchingService.Scope.ALL, 20).orElseThrow();

        MatchRequest req = sent.get();
        assertThat(req.getClientId()).isEqualTo(dossierId);
        assertThat(req.getCriteres())
                .containsEntry("budget_max", 1_200_000.0)
                .containsEntry("accepted_conditions", List.of("neuf", "bon_etat"));
        assertThat(req.getBiens())
                .extracting(b -> b.get("title"))
                .containsExactlyInAnyOrder("Actif", "Brouillon");
        Map<String, Object> actifSent =
                req.getBiens().stream()
                        .filter(b -> "Actif".equals(b.get("title")))
                        .findFirst()
                        .orElseThrow();
        assertThat(actifSent)
                .containsEntry("vision_meuble", true)
                .containsEntry("vision_etat", "bon_etat")
                .containsEntry("vision_equipements", List.of("piscine"))
                .containsEntry("vision_pieces", List.of("salon"));

        assertThat(res.totalCandidates()).isEqualTo(2);
        assertThat(res.matches())
                .extracting(DossierMatchesResponse.Match::title)
                .containsExactly("Brouillon", "Actif");
        DossierMatchesResponse.Match first = res.matches().get(0);
        assertThat(first.score()).isEqualTo(90);
        assertThat(first.photosAnalyzed()).isFalse();
        assertThat(first.alerts()).containsExactly("Meublé : non vérifié");
        assertThat(res.matches().get(1).photoUrl()).isEqualTo("https://cdn.ma/a.jpg");
        assertThat(res.matches().get(1).photosAnalyzed()).isTrue();
    }

    @Test
    void off_market_ne_propose_que_les_brouillons() {
        service.saveCriteria(dossierId, criteria());
        annonce("Actif", AnnonceStatus.ACTIVE, ORG);
        annonce("Brouillon", AnnonceStatus.DRAFT, ORG);
        AtomicReference<MatchRequest> sent = new AtomicReference<>();
        when(brainClientService.calculateMatch(any()))
                .thenAnswer(
                        inv -> {
                            sent.set(inv.getArgument(0));
                            return Optional.of(new MatchResponse());
                        });

        service.rawOffMarketMatch(dossierId);

        assertThat(sent.get().getBiens())
                .extracting(b -> b.get("title"))
                .containsExactly("Brouillon");
    }

    @Test
    void sans_critere_pas_d_appel_au_brain() {
        annonce("Actif", AnnonceStatus.ACTIVE, ORG);
        assertThatThrownBy(
                        () -> service.findMatches(dossierId, DossierMatchingService.Scope.ALL, 20))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(service.rawOffMarketMatch(dossierId)).isNull();
        verify(brainClientService, never()).calculateMatch(any());
    }

    @Test
    void brain_indisponible() {
        service.saveCriteria(dossierId, criteria());
        annonce("Actif", AnnonceStatus.ACTIVE, ORG);
        when(brainClientService.calculateMatch(any())).thenReturn(Optional.empty());
        assertThat(service.findMatches(dossierId, DossierMatchingService.Scope.ALL, 20)).isEmpty();
    }

    @Test
    void dossier_d_une_autre_organisation_introuvable() {
        TenantContext.setOrgId("other-org");
        assertThatThrownBy(() -> service.getCriteria(dossierId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private void message(MessageDirection direction, String content, int minutesAgo) {
        MessageEntity m = new MessageEntity();
        m.setOrgId(ORG);
        m.setDossier(dossierRepository.findById(dossierId).orElseThrow());
        m.setDirection(direction);
        m.setChannel(MessageChannel.WHATSAPP);
        m.setContent(content);
        m.setTimestamp(LocalDateTime.now().minusMinutes(minutesAgo));
        messageRepository.save(m);
    }

    @Test
    @SuppressWarnings("unchecked")
    void suggestion_envoie_notes_et_messages_recus_dans_l_ordre() {
        Dossier d = dossierRepository.findById(dossierId).orElseThrow();
        d.setNotes("Client pressé, veut acheter avant l'été");
        dossierRepository.save(d);
        message(MessageDirection.INBOUND, "Je cherche à Tanger", 30);
        message(MessageDirection.OUTBOUND, "Avez-vous un budget ?", 20);
        message(MessageDirection.INBOUND, "120 millions max", 10);

        AtomicReference<Map<String, Object>> sent = new AtomicReference<>();
        when(brainClientService.extractCriteria(any()))
                .thenAnswer(
                        inv -> {
                            sent.set(inv.getArgument(0));
                            return Optional.of(
                                    Map.of(
                                            "criteres",
                                                    Map.of(
                                                            "cities", List.of("Tanger"),
                                                            "budget_max", 1_200_000.0,
                                                            "transaction_types", List.of("SALE")),
                                            "preuves",
                                                    Map.of(
                                                            "cities", "à Tanger",
                                                            "budget_max", "120 millions max",
                                                            "transaction_types", "veut acheter"),
                                            "moteur", "openai"));
                        });

        CriteriaSuggestionResponse res = service.suggestCriteria(dossierId).orElseThrow();

        List<Map<String, Object>> textes = (List<Map<String, Object>>) sent.get().get("textes");
        assertThat(textes)
                .extracting(t -> t.get("texte"))
                .containsExactly(
                        "Client pressé, veut acheter avant l'été",
                        "Je cherche à Tanger",
                        "120 millions max");
        assertThat(textes.get(1)).containsEntry("source", "whatsapp");
        assertThat(res.suggestion().cities()).containsExactly("Tanger");
        assertThat(res.suggestion().budgetMax()).isEqualByComparingTo("1200000");
        assertThat(res.suggestion().transactionTypes()).containsExactly("SALE");
        assertThat(res.evidence()).containsEntry("budgetMax", "120 millions max");
        assertThat(res.engine()).isEqualTo("openai");
        assertThat(res.notesUsed()).isEqualTo(1);
        assertThat(res.messagesUsed()).isEqualTo(2);
        // rien n'est enregistré
        assertThat(service.getCriteria(dossierId)).isEmpty();
    }

    @Test
    void suggestion_sans_texte_refusee() {
        message(MessageDirection.OUTBOUND, "Bonjour, je suis votre agent", 5);
        assertThatThrownBy(() -> service.suggestCriteria(dossierId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Aucune note ni message");
        verify(brainClientService, never()).extractCriteria(any());
    }

    @Test
    void conversion_snake_case() {
        assertThat(DossierMatchingService.toCamel("accepted_conditions"))
                .isEqualTo("acceptedConditions");
        assertThat(DossierMatchingService.toCamel("cities")).isEqualTo("cities");
    }
}
