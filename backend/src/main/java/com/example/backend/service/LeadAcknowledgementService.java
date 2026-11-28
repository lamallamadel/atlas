package com.example.backend.service;

import com.example.backend.entitlement.EntitlementService;
import com.example.backend.entitlement.Feature;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.event.PortalLeadCreatedEvent;
import com.example.backend.mandate.OrgScope;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Accusé de réception automatique d'un contact reçu par le portail : le prospect sait dans la
 * minute que sa demande est arrivée, même quand l'agent est en visite.
 *
 * <p>Par WhatsApp quand l'agence a configuré son numéro (modèle Meta {@value #TEMPLATE}, à faire
 * approuver dans son compte WhatsApp Business), sinon par e-mail si le prospect en a laissé un.
 * L'accord « suivi de la demande » (transactionnel) est recueilli par le formulaire du portail. Les
 * annonces de particuliers sont exclues : le propriétaire est prévenu par son propre fil. Module
 * {@code module.lead_auto_ack}, actif par défaut, désactivable agence par agence.
 *
 * <p>Après validation du lead, dans sa propre transaction : un échec d'envoi ne remet jamais en
 * cause le lead enregistré.
 */
@Service
public class LeadAcknowledgementService {

    private static final Logger log = LoggerFactory.getLogger(LeadAcknowledgementService.class);

    /** Nom du modèle WhatsApp (corps : {{1}} prénom, {{2}} bien, {{3}} agence). */
    public static final String TEMPLATE = "lead_acknowledgement";

    static final String EMAIL_SUBJECT = "Nous avons bien reçu votre demande";

    private final OrganizationRepository organizations;
    private final DossierRepository dossiers;
    private final AnnonceRepository annonces;
    private final WhatsAppProviderConfigRepository whatsAppConfigs;
    private final EntitlementService entitlements;
    private final OutboundMessageService outbound;
    private final OrgScope orgScope;
    private final TransactionTemplate newTransaction;

    public LeadAcknowledgementService(
            OrganizationRepository organizations,
            DossierRepository dossiers,
            AnnonceRepository annonces,
            WhatsAppProviderConfigRepository whatsAppConfigs,
            EntitlementService entitlements,
            OutboundMessageService outbound,
            OrgScope orgScope,
            PlatformTransactionManager transactionManager) {
        this.organizations = organizations;
        this.dossiers = dossiers;
        this.annonces = annonces;
        this.whatsAppConfigs = whatsAppConfigs;
        this.entitlements = entitlements;
        this.outbound = outbound;
        this.orgScope = orgScope;
        this.newTransaction = new TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPortalLead(PortalLeadCreatedEvent event) {
        try {
            newTransaction.executeWithoutResult(status -> acknowledge(event));
        } catch (RuntimeException e) {
            // Le lead est enregistré ; l'accusé est un plus, jamais une cause d'erreur.
            log.warn(
                    "Accusé de réception non envoyé pour le dossier {} : {}",
                    event.dossierId(),
                    e.getMessage());
        }
    }

    void acknowledge(PortalLeadCreatedEvent event) {
        OrganizationEntity org = organizations.findByOrgId(event.orgId()).orElse(null);
        if (org == null
                || org.isOwner()
                || !entitlements.isEnabled(event.orgId(), Feature.MODULE_LEAD_AUTO_ACK)) {
            return;
        }
        orgScope.run(
                event.orgId(),
                () ->
                        dossiers.findById(event.dossierId())
                                .ifPresent(dossier -> send(dossier, org.getDisplayName())));
    }

    private void send(Dossier dossier, String agency) {
        String firstName = firstName(dossier.getLeadName());
        String subject =
                dossier.getAnnonceId() == null
                        ? null
                        : annonces.findById(dossier.getAnnonceId())
                                .map(a -> a.getTitle())
                                .orElse(null);
        String text = message(firstName, subject, agency);
        String key = "lead_ack_" + dossier.getId();

        if (dossier.getLeadPhone() != null && whatsAppReady(dossier.getOrgId())) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("language", "fr");
            payload.put(
                    "components",
                    List.of(
                            Map.of(
                                    "type",
                                    "body",
                                    "parameters",
                                    List.of(
                                            textParam(firstName),
                                            textParam(subject != null ? subject : "votre projet"),
                                            textParam(agency)))));
            payload.put("body", text);
            outbound.createOutboundMessage(
                    dossier.getId(),
                    MessageChannel.WHATSAPP,
                    dossier.getLeadPhone(),
                    TEMPLATE,
                    null,
                    payload,
                    key,
                    ConsentementType.TRANSACTIONNEL);
        } else if (dossier.getLeadEmail() != null) {
            outbound.createOutboundMessage(
                    dossier.getId(),
                    MessageChannel.EMAIL,
                    dossier.getLeadEmail(),
                    null,
                    EMAIL_SUBJECT,
                    Map.of("body", text),
                    key,
                    ConsentementType.TRANSACTIONNEL);
        }
    }

    private boolean whatsAppReady(String orgId) {
        return whatsAppConfigs
                .findByOrgId(orgId)
                .map(c -> Boolean.TRUE.equals(c.getEnabled()))
                .orElse(false);
    }

    static String message(String firstName, String subject, String agency) {
        String about = subject != null ? " concernant « " + subject + " »" : "";
        return "Bonjour "
                + firstName
                + ", "
                + agency
                + " a bien reçu votre demande"
                + about
                + ". Un conseiller vous recontacte rapidement.";
    }

    static String firstName(String leadName) {
        if (leadName == null || leadName.isBlank()) {
            return "Madame, Monsieur";
        }
        return leadName.trim().split("\\s+")[0];
    }

    private static Map<String, Object> textParam(String value) {
        return Map.of("type", "text", "text", value);
    }
}
