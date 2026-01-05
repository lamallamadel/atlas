package com.example.backend.controller;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class WhatsAppWebhookControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String ORG_ID = "org123";
    private static final String WEBHOOK_SECRET = "test-webhook-secret";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private WhatsAppProviderConfigRepository configRepository;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        dossierRepository.deleteAll();
        configRepository.deleteAll();

        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setOrgId(ORG_ID);
        config.setApiKeyEncrypted("encrypted-api-key");
        config.setApiSecretEncrypted("encrypted-api-secret");
        config.setWebhookSecretEncrypted(WEBHOOK_SECRET);
        config.setPhoneNumberId("123456789");
        config.setBusinessAccountId("987654321");
        config.setEnabled(true);
        configRepository.save(config);
    }

    @Test
    void verifyWebhook_ValidChallenge_ReturnsChallenge() throws Exception {
        mockMvc.perform(get("/api/v1/webhooks/whatsapp/inbound")
                        .param("hub.mode", "subscribe")
                        .param("hub.verify_token", "test-token")
                        .param("hub.challenge", "challenge-value"))
                .andExpect(status().isOk())
                .andExpect(content().string("challenge-value"));
    }

    @Test
    void verifyWebhook_InvalidMode_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/webhooks/whatsapp/inbound")
                        .param("hub.mode", "invalid")
                        .param("hub.verify_token", "test-token")
                        .param("hub.challenge", "challenge-value"))
                .andExpect(status().isForbidden());
    }

    @Test
    void receiveInboundMessage_ValidPayload_CreatesMessageAndDossier() throws Exception {
        String payload = createWhatsAppWebhookPayload(
                "wamid.123456789",
                "+33612345678",
                "1234567890",
                "Hello, this is a test message",
                "John Doe"
        );

        String signature = generateSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);

        MessageEntity message = messages.get(0);
        assertThat(message.getOrgId()).isEqualTo(ORG_ID);
        assertThat(message.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(message.getDirection()).isEqualTo(MessageDirection.INBOUND);
        assertThat(message.getContent()).isEqualTo("Hello, this is a test message");
        assertThat(message.getProviderMessageId()).isEqualTo("wamid.123456789");
        assertThat(message.getDossier()).isNotNull();

        Dossier dossier = message.getDossier();
        assertThat(dossier.getOrgId()).isEqualTo(ORG_ID);
        assertThat(dossier.getLeadPhone()).isEqualTo("+33612345678");
        assertThat(dossier.getLeadName()).isEqualTo("John Doe");
        assertThat(dossier.getLeadSource()).isEqualTo("WhatsApp");
        assertThat(dossier.getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void receiveInboundMessage_DuplicateMessageId_IgnoresDuplicate() throws Exception {
        String payload = createWhatsAppWebhookPayload(
                "wamid.duplicate",
                "+33612345678",
                "1234567890",
                "First message",
                "John Doe"
        );

        String signature = generateSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        assertThat(messageRepository.findAll()).hasSize(1);

        String payload2 = createWhatsAppWebhookPayload(
                "wamid.duplicate",
                "+33612345678",
                "1234567890",
                "Second message",
                "John Doe"
        );

        String signature2 = generateSignature(payload2, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload2))
                .andExpect(status().isOk());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getContent()).isEqualTo("First message");
    }

    @Test
    void receiveInboundMessage_ExistingDossier_UsesExistingDossier() throws Exception {
        Dossier existingDossier = new Dossier();
        existingDossier.setOrgId(ORG_ID);
        existingDossier.setLeadPhone("+33612345678");
        existingDossier.setLeadName("Existing User");
        existingDossier.setStatus(DossierStatus.QUALIFIED);
        dossierRepository.save(existingDossier);

        String payload = createWhatsAppWebhookPayload(
                "wamid.existing",
                "+33612345678",
                "1234567890",
                "Message to existing dossier",
                "John Doe"
        );

        String signature = generateSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(1);
        assertThat(dossiers.get(0).getId()).isEqualTo(existingDossier.getId());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getDossier().getId()).isEqualTo(existingDossier.getId());
    }

    @Test
    void receiveInboundMessage_ExistingDossierWithoutName_UpdatesName() throws Exception {
        Dossier existingDossier = new Dossier();
        existingDossier.setOrgId(ORG_ID);
        existingDossier.setLeadPhone("+33612345678");
        existingDossier.setStatus(DossierStatus.NEW);
        dossierRepository.save(existingDossier);

        String payload = createWhatsAppWebhookPayload(
                "wamid.updatename",
                "+33612345678",
                "1234567890",
                "Test message",
                "John Updated"
        );

        String signature = generateSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        Dossier updatedDossier = dossierRepository.findById(existingDossier.getId()).orElseThrow();
        assertThat(updatedDossier.getLeadName()).isEqualTo("John Updated");
    }

    @Test
    void receiveInboundMessage_InvalidSignature_ReturnsUnauthorized() throws Exception {
        String payload = createWhatsAppWebhookPayload(
                "wamid.invalid",
                "+33612345678",
                "1234567890",
                "Test message",
                "John Doe"
        );

        String invalidSignature = "sha256=invalidsignature";

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", invalidSignature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid signature"));

        assertThat(messageRepository.findAll()).isEmpty();
    }

    @Test
    void receiveInboundMessage_NoSignature_ProcessesMessage() throws Exception {
        String payload = createWhatsAppWebhookPayload(
                "wamid.nosig",
                "+33612345678",
                "1234567890",
                "Test message",
                "John Doe"
        );

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        assertThat(messageRepository.findAll()).hasSize(1);
    }

    @Test
    void receiveInboundMessage_MissingOrgId_ReturnsBadRequest() throws Exception {
        String payload = createWhatsAppWebhookPayload(
                "wamid.noorg",
                "+33612345678",
                "1234567890",
                "Test message",
                "John Doe"
        );

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Missing organization context"));
    }

    @Test
    void receiveInboundMessage_MultipleMessages_ProcessesAll() throws Exception {
        String payload = createWhatsAppWebhookPayloadWithMultipleMessages();
        String signature = generateSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(2);
        assertThat(messages).extracting(MessageEntity::getProviderMessageId)
                .containsExactlyInAnyOrder("wamid.msg1", "wamid.msg2");
    }

    @Test
    void receiveInboundMessage_NonTextMessage_HandlesGracefully() throws Exception {
        String payload = """
                {
                  "object": "whatsapp_business_account",
                  "entry": [{
                    "id": "123456789",
                    "changes": [{
                      "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                          "display_phone_number": "+1234567890",
                          "phone_number_id": "123456789"
                        },
                        "contacts": [{
                          "profile": {
                            "name": "John Doe"
                          },
                          "wa_id": "+33612345678"
                        }],
                        "messages": [{
                          "from": "+33612345678",
                          "id": "wamid.image123",
                          "timestamp": "1234567890",
                          "type": "image"
                        }]
                      },
                      "field": "messages"
                    }]
                  }]
                }
                """;

        String signature = generateSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getContent()).isEqualTo("[image message]");
    }

    @Test
    void receiveInboundMessage_IgnoresClosedDossiers_CreatesNewDossier() throws Exception {
        Dossier closedDossier = new Dossier();
        closedDossier.setOrgId(ORG_ID);
        closedDossier.setLeadPhone("+33612345678");
        closedDossier.setLeadName("Closed User");
        closedDossier.setStatus(DossierStatus.WON);
        dossierRepository.save(closedDossier);

        String payload = createWhatsAppWebhookPayload(
                "wamid.newdossier",
                "+33612345678",
                "1234567890",
                "New message after closed",
                "John Doe"
        );

        String signature = generateSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post("/api/v1/webhooks/whatsapp/inbound")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header("X-Hub-Signature-256", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(2);

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getDossier().getId()).isNotEqualTo(closedDossier.getId());
        assertThat(messages.get(0).getDossier().getStatus()).isEqualTo(DossierStatus.NEW);
    }

    private String createWhatsAppWebhookPayload(String messageId, String from, String timestamp, String messageText, String contactName) {
        return String.format("""
                {
                  "object": "whatsapp_business_account",
                  "entry": [{
                    "id": "123456789",
                    "changes": [{
                      "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                          "display_phone_number": "+1234567890",
                          "phone_number_id": "123456789"
                        },
                        "contacts": [{
                          "profile": {
                            "name": "%s"
                          },
                          "wa_id": "%s"
                        }],
                        "messages": [{
                          "from": "%s",
                          "id": "%s",
                          "timestamp": "%s",
                          "text": {
                            "body": "%s"
                          },
                          "type": "text"
                        }]
                      },
                      "field": "messages"
                    }]
                  }]
                }
                """, contactName, from, from, messageId, timestamp, messageText);
    }

    private String createWhatsAppWebhookPayloadWithMultipleMessages() {
        return """
                {
                  "object": "whatsapp_business_account",
                  "entry": [{
                    "id": "123456789",
                    "changes": [{
                      "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                          "display_phone_number": "+1234567890",
                          "phone_number_id": "123456789"
                        },
                        "contacts": [{
                          "profile": {
                            "name": "John Doe"
                          },
                          "wa_id": "+33612345678"
                        }],
                        "messages": [
                          {
                            "from": "+33612345678",
                            "id": "wamid.msg1",
                            "timestamp": "1234567890",
                            "text": {
                              "body": "First message"
                            },
                            "type": "text"
                          },
                          {
                            "from": "+33612345678",
                            "id": "wamid.msg2",
                            "timestamp": "1234567891",
                            "text": {
                              "body": "Second message"
                            },
                            "type": "text"
                          }
                        ]
                      },
                      "field": "messages"
                    }]
                  }]
                }
                """;
    }

    private String generateSignature(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        return "sha256=" + HexFormat.of().formatHex(hash);
    }
}
