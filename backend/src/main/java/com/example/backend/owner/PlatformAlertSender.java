package com.example.backend.owner;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.service.OutboundMessageProvider;
import com.example.backend.service.ProviderSendResult;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

/**
 * Envoie les {@link PlatformAlert} une fois la transaction validée, par les fournisseurs de
 * l'organisation de la plateforme (les organisations de propriétaires n'ont pas de numéro WhatsApp
 * à elles) : WhatsApp (modèle « utilitaire » approuvé par Meta), sinon e-mail, sinon SMS. Une
 * alerte qui ne part pas n'annule rien : le message reste dans la conversation. En développement
 * ({@code atlas.owner.alerts.log-links=true}), le lien est écrit dans les journaux à défaut de
 * fournisseur.
 */
@Component
public class PlatformAlertSender {

    private static final Logger log = LoggerFactory.getLogger(PlatformAlertSender.class);

    private final List<OutboundMessageProvider> providers;
    private final String platformOrgId;
    private final String ownerTemplate;
    private final String prospectTemplate;
    private final String language;
    private final boolean logLinks;

    public PlatformAlertSender(
            List<OutboundMessageProvider> providers,
            @Value("${atlas.portal.platform-org-id:ORG-001}") String platformOrgId,
            @Value("${atlas.owner.alerts.owner-whatsapp-template:}") String ownerTemplate,
            @Value("${atlas.owner.alerts.prospect-whatsapp-template:}") String prospectTemplate,
            @Value("${atlas.owner.alerts.whatsapp-language:fr}") String language,
            @Value("${atlas.owner.alerts.log-links:false}") boolean logLinks) {
        this.providers = providers;
        this.platformOrgId = platformOrgId;
        this.ownerTemplate = ownerTemplate;
        this.prospectTemplate = prospectTemplate;
        this.language = language;
        this.logLinks = logLinks;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAlert(PlatformAlert alert) {
        send(alert);
    }

    /** Renvoie le canal utilisé, ou {@code null} si l'alerte n'a pas pu partir. */
    String send(PlatformAlert alert) {
        String template =
                alert.audience() == PlatformAlert.Audience.OWNER ? ownerTemplate : prospectTemplate;
        if (alert.phone() != null
                && alert.whatsappAllowed()
                && !template.isBlank()
                && trySend(whatsapp(alert, template))) {
            return MessageChannel.WHATSAPP.name();
        }
        if (alert.email() != null && alert.emailAllowed() && trySend(email(alert))) {
            return MessageChannel.EMAIL.name();
        }
        if (alert.phone() != null && trySend(sms(alert))) {
            return MessageChannel.SMS.name();
        }
        if (logLinks) {
            log.warn(
                    "Alerte {} (développement, aucun fournisseur) : {} — {}",
                    alert.audience(),
                    alert.text(),
                    alert.linkUrl());
            return "LOG";
        }
        log.warn(
                "Alerte {} non envoyée (aucun canal disponible pour {})",
                alert.audience(),
                alert.phone() != null ? PhoneNumbers.mask(alert.phone()) : "un e-mail");
        return null;
    }

    private boolean trySend(OutboundMessageEntity message) {
        for (OutboundMessageProvider provider : providers) {
            if (!provider.supports(message.getChannel().name())) {
                continue;
            }
            try {
                ProviderSendResult result = provider.send(message);
                if (result.isSuccess()) {
                    return true;
                }
                log.warn("Alerte {} refusée : {}", message.getChannel(), result.getErrorCode());
            } catch (RuntimeException e) {
                log.warn("Alerte {} en échec : {}", message.getChannel(), e.getMessage());
            }
        }
        return false;
    }

    private OutboundMessageEntity whatsapp(PlatformAlert alert, String template) {
        OutboundMessageEntity m = base(MessageChannel.WHATSAPP, alert.phone());
        m.setTemplateCode(template);
        // Modèle : une variable dans le corps, une dans le bouton « lien » (fin de l'URL).
        m.setPayloadJson(
                Map.of(
                        "language",
                        language,
                        "components",
                        List.of(
                                Map.of("type", "body", "parameters", List.of(text(alert.text()))),
                                Map.of(
                                        "type",
                                        "button",
                                        "sub_type",
                                        "url",
                                        "index",
                                        "0",
                                        "parameters",
                                        List.of(text(alert.linkParam()))))));
        return m;
    }

    private OutboundMessageEntity email(PlatformAlert alert) {
        OutboundMessageEntity m = base(MessageChannel.EMAIL, alert.email());
        m.setSubject(alert.subject());
        String link = HtmlUtils.htmlEscape(alert.linkUrl());
        m.setPayloadJson(
                Map.of(
                        "htmlBody",
                        "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body>"
                                + "<p>"
                                + HtmlUtils.htmlEscape(alert.text())
                                + "</p><p><a href=\""
                                + link
                                + "\">Ouvrir la conversation</a></p>"
                                + "<p style=\"color:gray;font-size:12px\">Atlas Immobilier</p>"
                                + "</body></html>"));
        return m;
    }

    private OutboundMessageEntity sms(PlatformAlert alert) {
        OutboundMessageEntity m = base(MessageChannel.SMS, alert.phone());
        m.setPayloadJson(Map.of("body", "Atlas : " + alert.text() + " " + alert.linkUrl()));
        return m;
    }

    private OutboundMessageEntity base(MessageChannel channel, String to) {
        OutboundMessageEntity m = new OutboundMessageEntity();
        m.setOrgId(platformOrgId);
        m.setChannel(channel);
        m.setTo(to);
        return m;
    }

    private static Map<String, Object> text(String value) {
        return Map.of("type", "text", "text", value);
    }
}
