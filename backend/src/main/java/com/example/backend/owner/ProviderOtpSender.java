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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Envoi du code par les fournisseurs de messages de l'organisation de la plateforme : WhatsApp
 * (modèle d'authentification approuvé par Meta) si un modèle est configuré, sinon SMS. En
 * développement seulement ({@code atlas.owner.otp.log-codes=true}), le code peut être écrit dans
 * les journaux quand aucun fournisseur ne répond.
 */
@Component
public class ProviderOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(ProviderOtpSender.class);

    private final List<OutboundMessageProvider> providers;
    private final String platformOrgId;
    private final String whatsappTemplate;
    private final String whatsappLanguage;
    private final boolean logCodes;

    public ProviderOtpSender(
            List<OutboundMessageProvider> providers,
            @Value("${atlas.portal.platform-org-id:ORG-001}") String platformOrgId,
            @Value("${atlas.owner.otp.whatsapp-template:}") String whatsappTemplate,
            @Value("${atlas.owner.otp.whatsapp-language:fr}") String whatsappLanguage,
            @Value("${atlas.owner.otp.log-codes:false}") boolean logCodes) {
        this.providers = providers;
        this.platformOrgId = platformOrgId;
        this.whatsappTemplate = whatsappTemplate;
        this.whatsappLanguage = whatsappLanguage;
        this.logCodes = logCodes;
    }

    @Override
    public String send(String phone, String code) {
        if (!whatsappTemplate.isBlank()
                && trySend(MessageChannel.WHATSAPP, whatsapp(phone, code))) {
            return MessageChannel.WHATSAPP.name();
        }
        if (trySend(MessageChannel.SMS, sms(phone, code))) {
            return MessageChannel.SMS.name();
        }
        if (logCodes) {
            log.warn(
                    "OTP pour {} (développement, aucun fournisseur) : {}",
                    PhoneNumbers.mask(phone),
                    code);
            return "LOG";
        }
        throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "OTP_UNAVAILABLE: impossible d'envoyer le code pour le moment, réessayez plus tard.");
    }

    private boolean trySend(MessageChannel channel, OutboundMessageEntity message) {
        for (OutboundMessageProvider provider : providers) {
            if (!provider.supports(channel.name())) {
                continue;
            }
            try {
                ProviderSendResult result = provider.send(message);
                if (result.isSuccess()) {
                    return true;
                }
                log.warn(
                        "OTP {} non envoyé à {} : {}",
                        channel,
                        PhoneNumbers.mask(message.getTo()),
                        result.getErrorCode());
            } catch (RuntimeException e) {
                log.warn(
                        "OTP {} en échec pour {} : {}",
                        channel,
                        PhoneNumbers.mask(message.getTo()),
                        e.getMessage());
            }
        }
        return false;
    }

    private OutboundMessageEntity whatsapp(String phone, String code) {
        OutboundMessageEntity m = base(phone, MessageChannel.WHATSAPP);
        m.setTemplateCode(whatsappTemplate);
        // Modèle de catégorie « authentification » : le code dans le corps et dans le bouton.
        m.setPayloadJson(
                Map.of(
                        "language",
                        whatsappLanguage,
                        "components",
                        List.of(
                                Map.of("type", "body", "parameters", List.of(text(code))),
                                Map.of(
                                        "type",
                                        "button",
                                        "sub_type",
                                        "url",
                                        "index",
                                        "0",
                                        "parameters",
                                        List.of(text(code))))));
        return m;
    }

    private OutboundMessageEntity sms(String phone, String code) {
        OutboundMessageEntity m = base(phone, MessageChannel.SMS);
        m.setPayloadJson(
                Map.of("body", "Atlas : votre code est " + code + ". Il expire dans 10 minutes."));
        return m;
    }

    private OutboundMessageEntity base(String phone, MessageChannel channel) {
        OutboundMessageEntity m = new OutboundMessageEntity();
        m.setOrgId(platformOrgId);
        m.setChannel(channel);
        m.setTo(phone);
        return m;
    }

    private static Map<String, Object> text(String value) {
        return Map.of("type", "text", "text", value);
    }
}
