package com.example.backend.service;

import com.example.backend.dto.MessageCreateRequest;
import com.example.backend.dto.MessageResponse;
import com.example.backend.dto.WhatsAppReplyResponse;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Réponse de l'agent dans la conversation WhatsApp d'un dossier.
 *
 * <p>Un message libre n'est livré par WhatsApp que dans les 24 h qui suivent le dernier message du
 * client, et Atlas exige l'accord « suivi du dossier » (TRANSACTIONNEL) sur WhatsApp. Le message
 * part par la file des messages sortants et apparaît aussi dans le fil du dossier.
 */
@Service
public class DossierWhatsAppService {

    static final int MAX_LENGTH = 4096;

    private final DossierRepository dossierRepository;
    private final ConsentementRepository consentementRepository;
    private final WhatsAppSessionWindowService sessionWindowService;
    private final OutboundMessageService outboundMessageService;
    private final MessageService messageService;

    public DossierWhatsAppService(
            DossierRepository dossierRepository,
            ConsentementRepository consentementRepository,
            WhatsAppSessionWindowService sessionWindowService,
            OutboundMessageService outboundMessageService,
            MessageService messageService) {
        this.dossierRepository = dossierRepository;
        this.consentementRepository = consentementRepository;
        this.sessionWindowService = sessionWindowService;
        this.outboundMessageService = outboundMessageService;
        this.messageService = messageService;
    }

    @Transactional
    public WhatsAppReplyResponse reply(Long dossierId, String rawMessage) {
        String orgId = TenantContext.getOrgId();
        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .filter(d -> orgId != null && orgId.equals(d.getOrgId()))
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Dossier introuvable."));

        String message = rawMessage == null ? "" : rawMessage.strip();
        if (message.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le message est vide.");
        }
        if (message.length() > MAX_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Message trop long pour WhatsApp (" + MAX_LENGTH + " caractères maximum).");
        }
        String phone = dossier.getLeadPhone();
        if (phone == null || phone.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Ce dossier n'a pas de numéro de téléphone.");
        }
        // Fenêtre de service WhatsApp : un message libre n'est livré que si le client a écrit
        // dans les 24 dernières heures. Dans cette fenêtre, répondre au client ne demande pas
        // d'opt-in (politique WhatsApp) : on ne bloque que sur un refus ou un retrait explicite.
        if (!sessionWindowService.isWithinSessionWindow(orgId, phone)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Le client ne vous a pas écrit depuis plus de 24 h : WhatsApp n'accepte plus"
                            + " de message libre. Attendez qu'il vous écrive, ou appelez-le.");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("body", message);
        payload.put("kind", "AGENT_REPLY");
        payload.put(
                "legalBasis",
                hasFollowUpConsent(dossierId) ? "CONSENT" : "CUSTOMER_SERVICE_WINDOW");
        OutboundMessageEntity outbound =
                outboundMessageService.createCustomerServiceReply(
                        dossierId,
                        MessageChannel.WHATSAPP,
                        phone,
                        payload,
                        "reply-" + dossierId + "-" + UUID.randomUUID());

        MessageCreateRequest thread = new MessageCreateRequest();
        thread.setDossierId(dossierId);
        thread.setChannel(MessageChannel.WHATSAPP);
        thread.setDirection(MessageDirection.OUTBOUND);
        thread.setContent(message);
        thread.setTimestamp(LocalDateTime.now());
        MessageResponse saved = messageService.create(thread);

        return new WhatsAppReplyResponse(
                outbound.getId(), saved.getId(), outbound.getStatus().name());
    }

    private boolean hasFollowUpConsent(Long dossierId) {
        List<ConsentementEntity> consents =
                consentementRepository.findByDossierIdAndChannelAndConsentTypeOrderByUpdatedAtDesc(
                        dossierId, ConsentementChannel.WHATSAPP, ConsentementType.TRANSACTIONNEL);
        if (consents.isEmpty()) {
            return false;
        }
        ConsentementEntity latest = consents.get(0);
        return latest.getStatus() == ConsentementStatus.GRANTED
                && (latest.getExpiresAt() == null
                        || latest.getExpiresAt().isAfter(LocalDateTime.now()));
    }
}
