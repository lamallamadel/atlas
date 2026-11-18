package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
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
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.service.WhatsAppSessionWindowService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** Proposition d'un bien à un acheteur : brouillon, contrôles, envoi. */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class AnnoncePitchBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";
    private static final String PHONE = "+212600000002";

    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceDossierMatchRepository matchRepository;
    @Autowired private ConsentementRepository consentementRepository;
    @Autowired private OutboundMessageRepository outboundMessageRepository;
    @MockitoBean private BrainClientService brainClientService;
    @MockitoBean private WhatsAppSessionWindowService sessionWindowService;

    private Long annonceId;
    private Dossier dossier;
    private Long matchId;

    @BeforeEach
    void setUp() {
        Annonce a = new Annonce();
        a.setOrgId(ORG1);
        a.setTitle("Appartement Malabata");
        a.setCity("Tanger");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        a.setPrice(new BigDecimal("1850000"));
        a.setSurface(95.0);
        annonceId = annonceRepository.save(a).getId();

        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadName("Youssef Alami");
        d.setLeadPhone(PHONE);
        d.setStatus(DossierStatus.QUALIFIED);
        dossier = dossierRepository.save(d);

        AnnonceDossierMatch m = new AnnonceDossierMatch();
        m.setOrgId(ORG1);
        m.setAnnonceId(annonceId);
        m.setDossierId(dossier.getId());
        m.setScore(88);
        m.setReasons(List.of("Ville recherchée (Tanger)"));
        m.setAlerts(List.of());
        m.setStatus(AnnonceDossierMatch.STATUS_NEW);
        matchId = matchRepository.save(m).getId();

        when(sessionWindowService.isWithinSessionWindow(anyString(), anyString())).thenReturn(true);
    }

    private void consent(ConsentementChannel channel, ConsentementStatus status) {
        ConsentementEntity c = new ConsentementEntity();
        c.setOrgId(ORG1);
        c.setDossier(dossier);
        c.setChannel(channel);
        c.setConsentType(ConsentementType.MARKETING);
        c.setStatus(status);
        c.setMeta(
                Map.of(
                        "optInTimestamp",
                        java.time.Instant.now().toString(),
                        "ipAddress",
                        "192.0.2.10",
                        "doubleOptInConfirmed",
                        true));
        consentementRepository.save(c);
    }

    private String base() {
        return "/api/v1/annonces/" + annonceId + "/buyer-matches/" + matchId + "/pitch";
    }

    @Test
    void brouillon_redige_par_le_brain_avec_controles() throws Exception {
        when(brainClientService.generatePitch(any()))
                .thenReturn(
                        Optional.of(
                                Map.of(
                                        "message", "Bonjour Youssef, 95 m² à Tanger. Une visite ?",
                                        "moteur", "openai")));
        consent(ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        mockMvc.perform(
                        withTenantHeaders(
                                post(base() + "/draft?language=fr&channel=WHATSAPP"), ORG1))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.message")
                                .value("Bonjour Youssef, 95 m² à Tanger. Une visite ?"))
                .andExpect(jsonPath("$.engine").value("openai"))
                .andExpect(jsonPath("$.to").value(PHONE))
                .andExpect(jsonPath("$.consentStatus").value("GRANTED"))
                .andExpect(jsonPath("$.whatsappWindowOpen").value(true))
                .andExpect(jsonPath("$.blockers").isEmpty())
                .andExpect(jsonPath("$.maxLength").value(1000));
    }

    @Test
    void brain_absent_modele_et_blocages() throws Exception {
        when(brainClientService.generatePitch(any())).thenReturn(Optional.empty());
        when(sessionWindowService.isWithinSessionWindow(anyString(), anyString()))
                .thenReturn(false);

        mockMvc.perform(withTenantHeaders(post(base() + "/draft?channel=WHATSAPP"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.engine").value("modele"))
                .andExpect(
                        jsonPath("$.message")
                                .value(org.hamcrest.Matchers.startsWith("Bonjour Youssef,")))
                .andExpect(jsonPath("$.consentStatus").value("MISSING"))
                .andExpect(jsonPath("$.whatsappWindowOpen").value(false))
                .andExpect(jsonPath("$.blockers.length()").value(2));

        // l'envoi WhatsApp hors fenêtre de 24 h est refusé
        mockMvc.perform(
                        withTenantHeaders(post(base() + "/send"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"message\":\"Bonjour\",\"channel\":\"WHATSAPP\"}"))
                .andExpect(status().isConflict());

        // SMS sans consentement : refusé par la file des messages sortants
        mockMvc.perform(
                        withTenantHeaders(post(base() + "/send"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"message\":\"Bonjour\",\"channel\":\"SMS\"}"))
                .andExpect(status().isUnprocessableEntity());
        assertThat(outboundMessageRepository.findAll()).isEmpty();
    }

    @Test
    void envoi_sms_puis_double_clic() throws Exception {
        consent(ConsentementChannel.SMS, ConsentementStatus.GRANTED);
        String body =
                "{\"message\":\"Bonjour Youssef, un appartement à Tanger.\",\"channel\":\"SMS\",\"language\":\"fr\"}";

        mockMvc.perform(
                        withTenantHeaders(post(base() + "/send"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("SMS"))
                .andExpect(jsonPath("$.outboundMessageId").isNumber());
        mockMvc.perform(
                        withTenantHeaders(post(base() + "/send"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk());

        List<OutboundMessageEntity> sent = outboundMessageRepository.findAll();
        assertThat(sent).hasSize(1);
        assertThat(sent.get(0).getChannel()).isEqualTo(MessageChannel.SMS);
        assertThat(sent.get(0).getTo()).isEqualTo(PHONE);
        assertThat(sent.get(0).getPayloadJson())
                .containsEntry("body", "Bonjour Youssef, un appartement à Tanger.")
                .containsEntry("kind", "PROPERTY_PITCH");

        AnnonceDossierMatch m = matchRepository.findById(matchId).orElseThrow();
        assertThat(m.getPitchedAt()).isNotNull();
        assertThat(m.getPitchChannel()).isEqualTo("SMS");
        assertThat(m.getStatus()).isEqualTo(AnnonceDossierMatch.STATUS_SEEN);

        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/annonces/" + annonceId + "/buyer-matches"), ORG1))
                .andExpect(jsonPath("$[0].pitchChannel").value("SMS"))
                .andExpect(jsonPath("$[0].pitchedAt").exists());
    }

    @Test
    void validations() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(post(base() + "/send"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"message\":\""
                                                + "x".repeat(700)
                                                + "\",\"channel\":\"SMS\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        withTenantHeaders(post(base() + "/send"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"message\":\"Bonjour\",\"channel\":\"EMAIL\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(withTenantHeaders(post(base() + "/draft"), "ORG2"))
                .andExpect(status().isNotFound());
    }
}
