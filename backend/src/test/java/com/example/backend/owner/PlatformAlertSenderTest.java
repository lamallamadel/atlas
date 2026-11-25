package com.example.backend.owner;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.service.OutboundMessageProvider;
import com.example.backend.service.ProviderSendResult;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PlatformAlertSenderTest {

    /** Fournisseur factice : enregistre les envois, réussit ou échoue selon le réglage. */
    static final class FakeProvider implements OutboundMessageProvider {
        final String channel;
        final boolean ok;
        final List<OutboundMessageEntity> sent = new ArrayList<>();

        FakeProvider(String channel, boolean ok) {
            this.channel = channel;
            this.ok = ok;
        }

        @Override
        public ProviderSendResult send(OutboundMessageEntity message) {
            sent.add(message);
            return ok
                    ? ProviderSendResult.success("id-" + sent.size(), Map.of())
                    : ProviderSendResult.failure("DOWN", "indisponible", true, Map.of());
        }

        @Override
        public boolean isRetryableError(String errorCode) {
            return false;
        }

        @Override
        public boolean supports(String c) {
            return channel.equalsIgnoreCase(c);
        }
    }

    private static PlatformAlert alert(boolean whatsappAllowed, String email) {
        return new PlatformAlert(
                PlatformAlert.Audience.PROSPECT,
                "+212611223344",
                email,
                "Nadia vous a répondu au sujet de « T2 <Malabata> ».",
                "Atlas : nouvelle réponse",
                "jeton",
                "https://afroware.app/contact/jeton",
                whatsappAllowed,
                email != null);
    }

    private static PlatformAlertSender sender(String template, OutboundMessageProvider... p) {
        return new PlatformAlertSender(List.of(p), "ORG-001", "", template, "fr", false);
    }

    @Test
    void whatsappTemplateFirst_fromThePlatformOrg() {
        FakeProvider wa = new FakeProvider("WHATSAPP", true);
        FakeProvider mail = new FakeProvider("EMAIL", true);
        assertThat(sender("atlas_reponse", wa, mail).send(alert(true, "y@ex.ma")))
                .isEqualTo("WHATSAPP");
        assertThat(wa.sent.get(0).getOrgId()).isEqualTo("ORG-001");
        assertThat(wa.sent.get(0).getTemplateCode()).isEqualTo("atlas_reponse");
        assertThat(mail.sent).isEmpty();
    }

    @Test
    void fallsBackToEscapedEmail_thenSms() {
        FakeProvider wa = new FakeProvider("WHATSAPP", false);
        FakeProvider mail = new FakeProvider("EMAIL", true);
        FakeProvider sms = new FakeProvider("SMS", true);
        assertThat(sender("atlas_reponse", wa, mail, sms).send(alert(true, "y@ex.ma")))
                .isEqualTo("EMAIL");
        String html = (String) mail.sent.get(0).getPayloadJson().get("htmlBody");
        assertThat(html).contains("&lt;Malabata&gt;").doesNotContain("<Malabata>");

        assertThat(sender("atlas_reponse", wa, sms).send(alert(true, null))).isEqualTo("SMS");
    }

    @Test
    void noWhatsappWithoutConsentOrTemplate_andNullWhenNothingWorks() {
        FakeProvider wa = new FakeProvider("WHATSAPP", true);
        FakeProvider sms = new FakeProvider("SMS", false);
        assertThat(sender("atlas_reponse", wa, sms).send(alert(false, null))).isNull();
        assertThat(sender("", wa, sms).send(alert(true, null))).isNull();
        assertThat(wa.sent).isEmpty();
    }
}
