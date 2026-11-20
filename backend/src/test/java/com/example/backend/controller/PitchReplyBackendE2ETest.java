package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.brain.BrainClientService;
import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.service.PitchReplyService;
import com.example.backend.service.WhatsAppMessageProcessingService;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** Réponse WhatsApp du client à une proposition, puis planification de la visite. */
@BackendE2ETest
@WithMockUser(
        username = "agent-1",
        roles = {"PRO"})
class PitchReplyBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";

    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceDossierMatchRepository matchRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private WhatsAppMessageProcessingService processingService;
    @Autowired private PitchReplyService replyService;
    @Autowired private MessageRepository messageRepository;
    @MockitoBean private BrainClientService brainClientService;

    private Long annonceId;
    private Long dossierId;
    private Long matchId;
    private LocalDateTime slot;

    @BeforeEach
    void setUp() {
        Annonce a = new Annonce();
        a.setOrgId(ORG1);
        a.setTitle("Villa Achakar");
        a.setCity("Tanger");
        a.setAddress("Route d'Achakar");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        annonceId = annonceRepository.save(a).getId();

        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadName("Youssef");
        d.setLeadPhone("+212600000002"); // saisi avec « + » ; WhatsApp l'envoie sans
        d.setStatus(DossierStatus.QUALIFIED);
        dossierId = dossierRepository.save(d).getId();

        AnnonceDossierMatch m = new AnnonceDossierMatch();
        m.setOrgId(ORG1);
        m.setAnnonceId(annonceId);
        m.setDossierId(dossierId);
        m.setScore(90);
        m.setReasons(List.of());
        m.setAlerts(List.of());
        m.setStatus(AnnonceDossierMatch.STATUS_SEEN);
        m.setPitchedAt(LocalDateTime.now().minusHours(1));
        m.setPitchChannel("WHATSAPP");
        matchId = matchRepository.save(m).getId();

        slot = LocalDateTime.now().plusDays(3).withHour(10).truncatedTo(ChronoUnit.HOURS);
        when(brainClientService.analyseReply(any()))
                .thenReturn(
                        Optional.of(
                                Map.of(
                                        "intention",
                                        "VISITE",
                                        "disponibilites",
                                        List.of(
                                                Map.of(
                                                        "debut", slot.toString(),
                                                        "fin", slot.plusHours(2).toString())))));
    }

    private WhatsAppWebhookPayload inbound(String text) throws Exception {
        String json =
                """
                {"object":"whatsapp_business_account","entry":[{"id":"1","changes":[{"field":"messages",
                 "value":{"messaging_product":"whatsapp",
                  "contacts":[{"profile":{"name":"Youssef"},"wa_id":"212600000002"}],
                  "messages":[{"from":"212600000002","id":"wamid.REPLY1","timestamp":"%d","type":"text",
                   "text":{"body":"%s"}}]}}]}]}
                """
                        .formatted(System.currentTimeMillis() / 1000, text);
        return objectMapper.readValue(json, WhatsAppWebhookPayload.class);
    }

    @Test
    void reponse_whatsapp_creneau_puis_visite_planifiee() throws Exception {
        long dossiersBefore = dossierRepository.count();

        processingService.processInboundMessage(
                inbound("On peut visiter dans 3 jours a 10h ?"), ORG1);

        // le message est rangé dans le dossier existant malgré le « + » manquant
        assertThat(dossierRepository.count()).isEqualTo(dossiersBefore);
        var saved =
                messageRepository.findAll().stream()
                        .filter(x -> "wamid.REPLY1".equals(x.getProviderMessageId()))
                        .findFirst()
                        .orElseThrow();
        assertThat(saved.getDossier().getId()).isEqualTo(dossierId);

        // analyse (déclenchée après validation en production ; ici directement, le test étant
        // transactionnel — voir PitchReplyTriggerTest pour le déclenchement réel)
        replyService.onInboundMessage(
                ORG1, dossierId, saved.getId(), saved.getContent(), LocalDateTime.now());
        AnnonceDossierMatch m = matchRepository.findById(matchId).orElseThrow();
        assertThat(m.getReplyIntent()).isEqualTo("VISITE");
        assertThat(m.getReplyExcerpt()).isEqualTo("On peut visiter dans 3 jours a 10h ?");
        assertThat(m.getProposedStart()).isEqualTo(slot);
        assertThat(m.getProposedEnd()).isEqualTo(slot.plusMinutes(45));

        String base = "/api/v1/annonces/" + annonceId + "/buyer-matches";
        mockMvc.perform(withTenantHeaders(get(base), ORG1))
                .andExpect(jsonPath("$[0].replyIntent").value("VISITE"))
                .andExpect(jsonPath("$[0].proposedStart").exists())
                .andExpect(jsonPath("$[0].visitAppointmentId").doesNotExist());

        String body =
                "{\"startTime\":\"" + slot + "\",\"endTime\":\"" + slot.plusMinutes(45) + "\"}";
        mockMvc.perform(
                        withTenantHeaders(post(base + "/" + matchId + "/visit"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").isNumber());

        AnnonceDossierMatch planned = matchRepository.findById(matchId).orElseThrow();
        AppointmentEntity appt =
                appointmentRepository.findById(planned.getVisitAppointmentId()).orElseThrow();
        assertThat(appt.getDossier().getId()).isEqualTo(dossierId);
        assertThat(appt.getStartTime()).isEqualTo(slot);
        assertThat(appt.getAssignedTo())
                .isEqualTo("test-user"); // utilisateur du jeton de la requête
        assertThat(appt.getLocation()).isEqualTo("Route d'Achakar, Tanger");
        assertThat(appt.getNotes()).contains("Visite : Villa Achakar").contains("dans 3 jours");

        // deuxième planification refusée
        mockMvc.perform(
                        withTenantHeaders(post(base + "/" + matchId + "/visit"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isConflict());

        // visite annulée : on peut en replanifier une
        appt.setStatus(com.example.backend.entity.enums.AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt);
        mockMvc.perform(
                        withTenantHeaders(post(base + "/" + matchId + "/visit"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void visite_dans_le_passe_ou_inversee_refusee() throws Exception {
        String base = "/api/v1/annonces/" + annonceId + "/buyer-matches/" + matchId + "/visit";
        LocalDateTime past = LocalDateTime.now().minusDays(1);
        mockMvc.perform(
                        withTenantHeaders(post(base), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"startTime\":\""
                                                + past
                                                + "\",\"endTime\":\""
                                                + past.plusHours(1)
                                                + "\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        withTenantHeaders(post(base), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"startTime\":\""
                                                + slot
                                                + "\",\"endTime\":\""
                                                + slot.minusHours(1)
                                                + "\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        withTenantHeaders(post(base), "ORG2")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"startTime\":\""
                                                + slot
                                                + "\",\"endTime\":\""
                                                + slot.plusHours(1)
                                                + "\"}"))
                .andExpect(status().isNotFound());
    }
}
