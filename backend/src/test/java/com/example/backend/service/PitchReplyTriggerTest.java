package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.brain.BrainClientService;
import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceDossierMatchRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
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
 * Sans @Transactional : un message WhatsApp entrant déclenche bien l'analyse de la réponse APRÈS la
 * validation de sa transaction (sinon l'analyse, dans un autre thread, ne verrait pas le message).
 */
@SpringBootTest
@ActiveProfiles("test")
class PitchReplyTriggerTest {

    private static final String ORG = "org-reply-trigger";

    @Autowired private WhatsAppMessageProcessingService processingService;
    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceDossierMatchRepository matchRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private BrainClientService brainClientService;
    @MockitoBean private NotificationService notificationService;

    @AfterEach
    void tearDown() {
        matchRepository.findAll().stream()
                .filter(m -> ORG.equals(m.getOrgId()))
                .forEach(matchRepository::delete);
        messageRepository.findAll().stream()
                .filter(m -> ORG.equals(m.getOrgId()))
                .forEach(messageRepository::delete);
        annonceRepository.findAll().stream()
                .filter(a -> ORG.equals(a.getOrgId()))
                .forEach(annonceRepository::delete);
        dossierRepository.findAll().stream()
                .filter(d -> ORG.equals(d.getOrgId()))
                .forEach(dossierRepository::delete);
        TenantContext.clear();
    }

    @Test
    void message_entrant_analyse_apres_validation() throws Exception {
        Annonce a = new Annonce();
        a.setOrgId(ORG);
        a.setTitle("Appartement Malabata");
        a.setCity("Tanger");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        Long annonceId = annonceRepository.save(a).getId();
        Dossier d = new Dossier();
        d.setOrgId(ORG);
        d.setLeadName("Salma");
        d.setLeadPhone("0600000009"); // format local ; WhatsApp enverra 212600000009
        d.setStatus(DossierStatus.QUALIFIED);
        Long dossierId = dossierRepository.save(d).getId();
        AnnonceDossierMatch m = new AnnonceDossierMatch();
        m.setOrgId(ORG);
        m.setAnnonceId(annonceId);
        m.setDossierId(dossierId);
        m.setScore(80);
        m.setReasons(List.of());
        m.setAlerts(List.of());
        m.setStatus(AnnonceDossierMatch.STATUS_SEEN);
        m.setPitchedAt(LocalDateTime.now().minusHours(2));
        Long matchId = matchRepository.save(m).getId();

        when(brainClientService.analyseReply(any()))
                .thenReturn(Optional.of(Map.of("intention", "NEGOCIATION")));

        String json =
                """
                {"object":"whatsapp_business_account","entry":[{"id":"1","changes":[{"field":"messages",
                 "value":{"messaging_product":"whatsapp",
                  "contacts":[{"profile":{"name":"Salma"},"wa_id":"212600000009"}],
                  "messages":[{"from":"212600000009","id":"wamid.TRIGGER1","timestamp":"%d","type":"text",
                   "text":{"body":"Le prix est négociable ?"}}]}}]}]}
                """
                        .formatted(System.currentTimeMillis() / 1000);
        processingService.processInboundMessage(
                objectMapper.readValue(json, WhatsAppWebhookPayload.class), ORG);

        verify(brainClientService, timeout(5000)).analyseReply(any());
        AnnonceDossierMatch updated = null;
        for (int i = 0; i < 50; i++) {
            updated = matchRepository.findById(matchId).orElseThrow();
            if (updated.getReplyIntent() != null) {
                break;
            }
            Thread.sleep(100);
        }
        assertThat(updated.getReplyIntent()).isEqualTo("NEGOCIATION");
        assertThat(updated.getReplyExcerpt()).isEqualTo("Le prix est négociable ?");
        assertThat(updated.getReplyMessageId()).isNotNull();
    }
}
