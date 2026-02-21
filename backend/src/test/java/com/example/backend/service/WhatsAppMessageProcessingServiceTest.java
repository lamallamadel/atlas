package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.dto.WhatsAppWebhookPayload;
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
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class WhatsAppMessageProcessingServiceTest {

    private static final String ORG_ID = "org123";
    private static final String WEBHOOK_SECRET = "test-webhook-secret";

    @Autowired private WhatsAppMessageProcessingService service;

    @Autowired private MessageRepository messageRepository;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private WhatsAppProviderConfigRepository configRepository;

    @Autowired private ObjectMapper objectMapper;

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
    void processInboundMessage_CreatesNewDossierAndMessage() throws Exception {
        String payloadJson =
                """
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
                          "id": "wamid.test123",
                          "timestamp": "1234567890",
                          "text": {
                            "body": "Hello from WhatsApp"
                          },
                          "type": "text"
                        }]
                      },
                      "field": "messages"
                    }]
                  }]
                }
                """;

        WhatsAppWebhookPayload payload =
                objectMapper.readValue(payloadJson, WhatsAppWebhookPayload.class);

        service.processInboundMessage(payload, ORG_ID);

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);

        MessageEntity message = messages.get(0);
        assertThat(message.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(message.getDirection()).isEqualTo(MessageDirection.INBOUND);
        assertThat(message.getContent()).isEqualTo("Hello from WhatsApp");
        assertThat(message.getProviderMessageId()).isEqualTo("wamid.test123");

        Dossier dossier = message.getDossier();
        assertThat(dossier).isNotNull();
        assertThat(dossier.getLeadPhone()).isEqualTo("+33612345678");
        assertThat(dossier.getLeadName()).isEqualTo("John Doe");
        assertThat(dossier.getLeadSource()).isEqualTo("WhatsApp");
        assertThat(dossier.getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void processInboundMessage_IdempotencyCheck_IgnoresDuplicates() throws Exception {
        String payloadJson =
                """
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
                          "id": "wamid.duplicate",
                          "timestamp": "1234567890",
                          "text": {
                            "body": "First message"
                          },
                          "type": "text"
                        }]
                      },
                      "field": "messages"
                    }]
                  }]
                }
                """;

        WhatsAppWebhookPayload payload =
                objectMapper.readValue(payloadJson, WhatsAppWebhookPayload.class);

        service.processInboundMessage(payload, ORG_ID);
        assertThat(messageRepository.findAll()).hasSize(1);

        service.processInboundMessage(payload, ORG_ID);
        assertThat(messageRepository.findAll()).hasSize(1);
    }

    @Test
    void processInboundMessage_ExistingDossier_UsesExisting() throws Exception {
        Dossier existingDossier = new Dossier();
        existingDossier.setOrgId(ORG_ID);
        existingDossier.setLeadPhone("+33612345678");
        existingDossier.setLeadName("Existing User");
        existingDossier.setStatus(DossierStatus.QUALIFIED);
        dossierRepository.save(existingDossier);

        String payloadJson =
                """
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
                          "id": "wamid.existing",
                          "timestamp": "1234567890",
                          "text": {
                            "body": "Follow-up message"
                          },
                          "type": "text"
                        }]
                      },
                      "field": "messages"
                    }]
                  }]
                }
                """;

        WhatsAppWebhookPayload payload =
                objectMapper.readValue(payloadJson, WhatsAppWebhookPayload.class);

        service.processInboundMessage(payload, ORG_ID);

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(1);
        assertThat(dossiers.get(0).getId()).isEqualTo(existingDossier.getId());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getDossier().getId()).isEqualTo(existingDossier.getId());
    }

    @Test
    void getWebhookSecret_ReturnsSecret() {
        String secret = service.getWebhookSecret(ORG_ID);
        assertThat(secret).isEqualTo(WEBHOOK_SECRET);
    }

    @Test
    void getWebhookSecret_UnknownOrg_ReturnsNull() {
        String secret = service.getWebhookSecret("unknown-org");
        assertThat(secret).isNull();
    }
}
