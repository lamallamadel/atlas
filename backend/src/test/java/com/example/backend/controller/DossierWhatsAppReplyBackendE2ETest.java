package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.service.WhatsAppSessionWindowService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

/** Réponse de l'agent depuis l'onglet WhatsApp : vraie mise en file d'envoi. */
@BackendE2ETest
@WithMockUser(
        username = "agent-1",
        roles = {"PRO"})
class DossierWhatsAppReplyBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";
    private static final String PHONE = "+212600000031";

    @Autowired private DossierRepository dossierRepository;
    @Autowired private ConsentementRepository consentementRepository;
    @Autowired private OutboundMessageRepository outboundRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private WhatsAppSessionWindowService sessionWindowService;

    private Dossier dossier;

    @BeforeEach
    void setUp() {
        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadName("Salma Idrissi");
        d.setLeadPhone(PHONE);
        d.setStatus(DossierStatus.QUALIFIED);
        dossier = dossierRepository.save(d);
    }

    private String url() {
        return "/api/v1/dossiers/" + dossier.getId() + "/whatsapp/reply";
    }

    private void consent(ConsentementType type, ConsentementStatus status) {
        ConsentementEntity c = new ConsentementEntity();
        c.setOrgId(ORG1);
        c.setDossier(dossier);
        c.setChannel(ConsentementChannel.WHATSAPP);
        c.setConsentType(type);
        c.setStatus(status);
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        consentementRepository.save(c);
    }

    @Test
    void reponse_envoyee_et_visible_dans_le_fil() throws Exception {
        consent(ConsentementType.TRANSACTIONNEL, ConsentementStatus.GRANTED);
        sessionWindowService.updateSessionWindow(ORG1, PHONE, LocalDateTime.now().minusHours(1));

        mockMvc.perform(
                        withTenantHeaders(post(url()), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"message\":\"  Bonjour Salma, la visite est confirmée.  \"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.outboundMessageId").isNumber())
                .andExpect(jsonPath("$.status").value("QUEUED"));

        List<OutboundMessageEntity> out = outboundRepository.findByDossierId(dossier.getId());
        assertThat(out).hasSize(1);
        assertThat(out.get(0).getTo()).isEqualTo(PHONE);
        assertThat(out.get(0).getPayloadJson())
                .containsEntry("body", "Bonjour Salma, la visite est confirmée.")
                .containsEntry("kind", "AGENT_REPLY");

        List<MessageEntity> thread =
                messageRepository.findAll().stream()
                        .filter(m -> m.getDossier().getId().equals(dossier.getId()))
                        .toList();
        assertThat(thread).hasSize(1);
        assertThat(thread.get(0).getDirection()).isEqualTo(MessageDirection.OUTBOUND);
        assertThat(thread.get(0).getContent()).isEqualTo("Bonjour Salma, la visite est confirmée.");
    }

    @Test
    void sans_accord_suivi_refuse_meme_avec_accord_prospection() throws Exception {
        consent(ConsentementType.MARKETING, ConsentementStatus.GRANTED);
        sessionWindowService.updateSessionWindow(ORG1, PHONE, LocalDateTime.now());

        mockMvc.perform(
                        withTenantHeaders(post(url()), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"message\":\"Bonjour\"}"))
                .andExpect(status().isUnprocessableEntity());
        assertThat(outboundRepository.findByDossierId(dossier.getId())).isEmpty();
    }

    @Test
    void fenetre_de_24h_fermee_refuse() throws Exception {
        consent(ConsentementType.TRANSACTIONNEL, ConsentementStatus.GRANTED);
        sessionWindowService.updateSessionWindow(ORG1, PHONE, LocalDateTime.now().minusHours(30));

        mockMvc.perform(
                        withTenantHeaders(post(url()), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"message\":\"Bonjour\"}"))
                .andExpect(status().isConflict());
        assertThat(outboundRepository.findByDossierId(dossier.getId())).isEmpty();
    }

    @Test
    void message_vide_refuse() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(post(url()), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"message\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dossier_d_une_autre_agence_introuvable() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(post(url()), "ORG2")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"message\":\"Bonjour\"}"))
                .andExpect(status().isNotFound());
    }
}
