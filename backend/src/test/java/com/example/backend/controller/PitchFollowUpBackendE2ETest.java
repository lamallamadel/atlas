package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.brain.BrainClientService;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.service.NotificationService;
import com.example.backend.service.PitchFollowUpService;
import com.example.backend.service.PitchReplyService;
import com.example.backend.service.WhatsAppSessionWindowService;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** Relances : client sans réponse de l'agent depuis 24 h, client silencieux depuis 3 jours. */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class PitchFollowUpBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";

    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceDossierMatchRepository matchRepository;
    @Autowired private OutboundMessageRepository outboundMessageRepository;
    @Autowired private ConsentementRepository consentementRepository;
    @Autowired private PitchFollowUpService followUpService;
    @Autowired private PitchReplyService replyService;
    @MockitoBean private BrainClientService brainClientService;
    @MockitoBean private NotificationService notificationService;
    @MockitoBean private WhatsAppSessionWindowService sessionWindowService;

    private Long annonceId;
    private Dossier dossier;
    private final LocalDateTime now = LocalDateTime.now();

    @BeforeEach
    void setUp() {
        Annonce a = new Annonce();
        a.setOrgId(ORG1);
        a.setTitle("Villa Achakar");
        a.setCity("Tanger");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        annonceId = annonceRepository.save(a).getId();
        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadName("Youssef");
        d.setLeadPhone("+212600000002");
        d.setStatus(DossierStatus.QUALIFIED);
        dossier = dossierRepository.save(d);
        when(sessionWindowService.isWithinSessionWindow(anyString(), anyString())).thenReturn(true);
    }

    private AnnonceDossierMatch match(
            LocalDateTime pitchedAt, String intent, LocalDateTime replyAt) {
        return match(dossier, pitchedAt, intent, replyAt);
    }

    private Dossier otherBuyer(String name) {
        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadName(name);
        d.setLeadPhone("+2126000000" + (10 + name.length()));
        d.setStatus(DossierStatus.QUALIFIED);
        return dossierRepository.save(d);
    }

    private AnnonceDossierMatch match(
            Dossier d, LocalDateTime pitchedAt, String intent, LocalDateTime replyAt) {
        AnnonceDossierMatch m = new AnnonceDossierMatch();
        m.setOrgId(ORG1);
        m.setAnnonceId(annonceId);
        m.setDossierId(d.getId());
        m.setScore(85);
        m.setReasons(List.of());
        m.setAlerts(List.of());
        m.setStatus(AnnonceDossierMatch.STATUS_SEEN);
        m.setPitchedAt(pitchedAt);
        m.setPitchChannel("WHATSAPP");
        m.setReplyIntent(intent);
        m.setReplyAt(replyAt);
        m.setReplyExcerpt(intent != null ? "On peut visiter samedi ?" : null);
        return matchRepository.save(m);
    }

    private String base(Long matchId) {
        return "/api/v1/annonces/" + annonceId + "/buyer-matches/" + matchId;
    }

    @Test
    @SuppressWarnings("unchecked")
    void client_sans_reponse_relance_brouillon_puis_envoi() throws Exception {
        LocalDateTime slot = now.plusDays(2).withHour(10).truncatedTo(ChronoUnit.HOURS);
        AnnonceDossierMatch m = match(now.minusDays(2), "VISITE", now.minusHours(25));
        m.setProposedStart(slot);
        m.setProposedEnd(slot.plusMinutes(45));
        matchRepository.save(m);

        assertThat(followUpService.scan(now)).isEqualTo(1);
        verify(notificationService)
                .createInAppNotification(
                        eq(ORG1),
                        eq(dossier.getId()),
                        anyString(),
                        eq("Youssef attend votre réponse depuis 24 h — Villa Achakar"),
                        startsWith("Sa réponse sur « Villa Achakar »"),
                        eq("/annonces/" + annonceId));
        assertThat(followUpService.scan(now)).isZero(); // signalée une seule fois

        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/annonces/" + annonceId + "/buyer-matches"), ORG1))
                .andExpect(jsonPath("$[0].followUpKind").value("AGENT_REPLY_DUE"));

        when(brainClientService.generatePitch(any()))
                .thenReturn(
                        Optional.of(
                                Map.of(
                                        "message",
                                        "Bonjour Youssef, samedi 10h ?",
                                        "moteur",
                                        "openai")));
        mockMvc.perform(
                        withTenantHeaders(
                                post(base(m.getId()) + "/pitch/draft?purpose=FOLLOW_UP"), ORG1))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.warnings").isEmpty()); // pas « déjà proposé » pour une relance
        ArgumentCaptor<Map<String, Object>> body = ArgumentCaptor.forClass(Map.class);
        verify(brainClientService).generatePitch(body.capture());
        assertThat(body.getValue())
                .containsEntry("objet", "relance")
                .containsEntry("reponse_client", "On peut visiter samedi ?")
                .containsEntry("intention_client", "VISITE")
                .containsEntry("creneau", slot.toString());

        ConsentementEntity c = new ConsentementEntity();
        c.setOrgId(ORG1);
        c.setDossier(dossier);
        c.setChannel(ConsentementChannel.WHATSAPP);
        c.setConsentType(ConsentementType.MARKETING);
        c.setStatus(ConsentementStatus.GRANTED);
        c.setMeta(
                Map.of(
                        "optInTimestamp",
                        Instant.now().toString(),
                        "ipAddress",
                        "192.0.2.10",
                        "doubleOptInConfirmed",
                        true));
        consentementRepository.save(c);
        mockMvc.perform(
                        withTenantHeaders(post(base(m.getId()) + "/pitch/send"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"message\":\"Bonjour Youssef, samedi 10h ?\",\"channel\":\"WHATSAPP\",\"purpose\":\"FOLLOW_UP\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/annonces/" + annonceId + "/buyer-matches"), ORG1))
                .andExpect(jsonPath("$[0].followUpKind").doesNotExist());
    }

    @Test
    void agent_deja_repondu_pas_de_relance() {
        AnnonceDossierMatch m = match(now.minusDays(2), "QUESTION", now.minusHours(30));
        OutboundMessageEntity o = new OutboundMessageEntity();
        o.setOrgId(ORG1);
        o.setDossierId(dossier.getId());
        o.setChannel(MessageChannel.WHATSAPP);
        o.setTo("+212600000002");
        o.setStatus(OutboundMessageStatus.SENT);
        o.setIdempotencyKey("reply-" + m.getId());
        o.setPayloadJson(Map.of("body", "Oui, il y a un parking."));
        outboundMessageRepository.saveAndFlush(o); // créé maintenant, après la réponse du client

        assertThat(followUpService.scan(now)).isZero();
        verifyNoInteractions(notificationService);
        assertThat(matchRepository.findById(m.getId()).orElseThrow().isFollowUpPending()).isFalse();
    }

    @Test
    void pas_de_relance_trop_tot_refus_ou_ecarte() {
        match(now.minusDays(1), "VISITE", now.minusHours(10)); // pas encore 24 h
        match(
                otherBuyer("Salma"),
                now.minusDays(2),
                "PAS_INTERESSE",
                now.minusHours(30)); // a refusé
        AnnonceDossierMatch dismissed = match(otherBuyer("Karim"), now.minusDays(5), null, null);
        dismissed.setStatus(AnnonceDossierMatch.STATUS_DISMISSED);
        matchRepository.save(dismissed);
        match(otherBuyer("Nadia B."), now.minusDays(40), null, null); // trop ancien

        assertThat(followUpService.scan(now)).isZero();
        verifyNoInteractions(notificationService);
    }

    @Test
    void client_silencieux_relance_unique_puis_reponse_qui_la_ferme() throws Exception {
        AnnonceDossierMatch m = match(now.minusDays(4), null, null);

        assertThat(followUpService.scan(now)).isEqualTo(1);
        verify(notificationService)
                .createInAppNotification(
                        eq(ORG1),
                        eq(dossier.getId()),
                        anyString(),
                        eq("Youssef n'a pas répondu à la proposition — Villa Achakar"),
                        anyString(),
                        anyString());
        assertThat(matchRepository.findById(m.getId()).orElseThrow().getFollowUpKind())
                .isEqualTo("CLIENT_SILENT");

        when(brainClientService.analyseReply(any()))
                .thenReturn(Optional.of(Map.of("intention", "INTERESSE")));
        replyService.onInboundMessage(
                ORG1, dossier.getId(), 1L, "oui envoyez des photos", now.plusMinutes(1));

        AnnonceDossierMatch after = matchRepository.findById(m.getId()).orElseThrow();
        assertThat(after.isFollowUpPending()).isFalse();
        assertThat(followUpService.scan(now.plusMinutes(2)))
                .isZero(); // nouvelle réponse : 24 h de délai
        assertThat(followUpService.scan(now.plusHours(25))).isEqualTo(1);
        assertThat(matchRepository.findById(m.getId()).orElseThrow().getFollowUpKind())
                .isEqualTo("AGENT_REPLY_DUE");
    }

    @Test
    void relance_faite_ailleurs() throws Exception {
        AnnonceDossierMatch m = match(now.minusDays(4), null, null);
        followUpService.scan(now);

        mockMvc.perform(withTenantHeaders(post(base(m.getId()) + "/follow-up/done"), ORG1))
                .andExpect(status().isNoContent());
        assertThat(matchRepository.findById(m.getId()).orElseThrow().isFollowUpPending()).isFalse();
        mockMvc.perform(withTenantHeaders(post(base(m.getId()) + "/follow-up/done"), ORG1))
                .andExpect(status().isConflict());
        mockMvc.perform(withTenantHeaders(post(base(m.getId()) + "/follow-up/done"), "ORG2"))
                .andExpect(status().isNotFound());
        assertThat(followUpService.scan(now.plusDays(1)))
                .isZero(); // pas de deuxième relance « silence »
    }
}
