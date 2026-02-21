package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

@BackendE2ETest
class WhatsAppIntegrationBackendE2ETest extends BaseBackendE2ETest {

    private static final String WEBHOOK_ENDPOINT = "/api/v1/webhooks/whatsapp/inbound";
    private static final String ORG_ID_1 = "org-e2e-test-1";
    private static final String ORG_ID_2 = "org-e2e-test-2";
    private static final String WEBHOOK_SECRET_1 = "webhook-secret-org1";
    private static final String WEBHOOK_SECRET_2 = "webhook-secret-org2";

    @Autowired private MessageRepository messageRepository;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private WhatsAppProviderConfigRepository configRepository;

    @BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        messageRepository.deleteAll();
        dossierRepository.deleteAll();
        configRepository.deleteAll();

        // Create fresh known test data
        WhatsAppProviderConfig config1 = new WhatsAppProviderConfig();
        config1.setOrgId(ORG_ID_1);
        config1.setApiKeyEncrypted("encrypted-api-key-1");
        config1.setApiSecretEncrypted("encrypted-api-secret-1");
        config1.setWebhookSecretEncrypted(WEBHOOK_SECRET_1);
        config1.setPhoneNumberId("phone-number-id-1");
        config1.setBusinessAccountId("business-account-id-1");
        config1.setEnabled(true);
        configRepository.save(config1);

        WhatsAppProviderConfig config2 = new WhatsAppProviderConfig();
        config2.setOrgId(ORG_ID_2);
        config2.setApiKeyEncrypted("encrypted-api-key-2");
        config2.setApiSecretEncrypted("encrypted-api-secret-2");
        config2.setWebhookSecretEncrypted(WEBHOOK_SECRET_2);
        config2.setPhoneNumberId("phone-number-id-2");
        config2.setBusinessAccountId("business-account-id-2");
        config2.setEnabled(true);
        configRepository.save(config2);
    }

    @AfterEach
    void tearDown() {
        // Clear tenant context to prevent tenant ID leakage between tests
        com.example.backend.util.TenantContext.clear();
    }

    @Test
    void receiveInboundMessage_WithValidHmacSignature_ProcessesMessage() throws Exception {
        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.valid-signature-test",
                        "+33612345678",
                        "1234567890",
                        "Test message with valid signature",
                        "John Doe");

        String signature = generateHmacSignature(payload, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signature)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);

        MessageEntity message = messages.get(0);
        assertThat(message.getOrgId()).isEqualTo(ORG_ID_1);
        assertThat(message.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(message.getDirection()).isEqualTo(MessageDirection.INBOUND);
        assertThat(message.getContent()).isEqualTo("Test message with valid signature");
        assertThat(message.getProviderMessageId()).isEqualTo("wamid.valid-signature-test");
    }

    @Test
    void receiveInboundMessage_WithInvalidHmacSignature_Returns401() throws Exception {
        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.invalid-signature-test",
                        "+33612345678",
                        "1234567890",
                        "Test message with invalid signature",
                        "Jane Doe");

        String invalidSignature = "sha256=invalidsignaturehash1234567890abcdef";

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", invalidSignature)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid signature"));

        assertThat(messageRepository.findAll()).isEmpty();
        assertThat(dossierRepository.findAll()).isEmpty();
    }

    @Test
    void receiveInboundMessage_PhoneNotFound_CreatesNewDossier() throws Exception {
        String newPhoneNumber = "+33698765432";
        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.new-dossier-test",
                        newPhoneNumber,
                        "1234567890",
                        "Message for new dossier",
                        "New Contact");

        String signature = generateHmacSignature(payload, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signature)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isOk());

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(1);

        Dossier dossier = dossiers.get(0);
        assertThat(dossier.getOrgId()).isEqualTo(ORG_ID_1);
        assertThat(dossier.getLeadPhone()).isEqualTo(newPhoneNumber);
        assertThat(dossier.getLeadName()).isEqualTo("New Contact");
        assertThat(dossier.getLeadSource()).isEqualTo("WhatsApp");
        assertThat(dossier.getStatus()).isEqualTo(DossierStatus.NEW);

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getDossier().getId()).isEqualTo(dossier.getId());
    }

    @Test
    void receiveInboundMessage_ExistingDossier_UpdatesExistingDossier() throws Exception {
        String existingPhoneNumber = "+33655443322";

        Dossier existingDossier = new Dossier();
        existingDossier.setOrgId(ORG_ID_1);
        existingDossier.setLeadPhone(existingPhoneNumber);
        existingDossier.setLeadName("Existing User");
        existingDossier.setStatus(DossierStatus.QUALIFIED);
        existingDossier.setLeadSource("Website");
        dossierRepository.save(existingDossier);

        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.existing-dossier-test",
                        existingPhoneNumber,
                        "1234567890",
                        "Message to existing dossier",
                        "Contact Name From WhatsApp");

        String signature = generateHmacSignature(payload, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signature)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isOk());

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(1);
        assertThat(dossiers.get(0).getId()).isEqualTo(existingDossier.getId());
        assertThat(dossiers.get(0).getStatus()).isEqualTo(DossierStatus.QUALIFIED);

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getDossier().getId()).isEqualTo(existingDossier.getId());
    }

    @Test
    void receiveInboundMessage_VerifyMessageEntityPersistedCorrectly() throws Exception {
        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.message-entity-test",
                        "+33611223344",
                        "1234567890",
                        "Testing message entity fields",
                        "Test User");

        String signature = generateHmacSignature(payload, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signature)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isOk());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);

        MessageEntity message = messages.get(0);
        assertThat(message.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(message.getDirection()).isEqualTo(MessageDirection.INBOUND);
        assertThat(message.getOrgId()).isEqualTo(ORG_ID_1);
        assertThat(message.getContent()).isEqualTo("Testing message entity fields");
        assertThat(message.getProviderMessageId()).isEqualTo("wamid.message-entity-test");
        assertThat(message.getTimestamp()).isNotNull();
        assertThat(message.getDossier()).isNotNull();
        assertThat(message.getCreatedAt()).isNotNull();
    }

    @Test
    void receiveInboundMessage_DuplicateProviderMessageId_DoesNotCreateSecondMessage()
            throws Exception {
        String duplicateMessageId = "wamid.duplicate-test";
        String payload1 =
                createWhatsAppWebhookPayload(
                        duplicateMessageId,
                        "+33677889900",
                        "1234567890",
                        "First message",
                        "Duplicate Test User");

        String signature1 = generateHmacSignature(payload1, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signature1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload1))
                .andExpect(status().isOk());

        assertThat(messageRepository.findAll()).hasSize(1);
        assertThat(messageRepository.findAll().get(0).getContent()).isEqualTo("First message");

        String payload2 =
                createWhatsAppWebhookPayload(
                        duplicateMessageId,
                        "+33677889900",
                        "1234567891",
                        "Second message (should be ignored)",
                        "Duplicate Test User");

        String signature2 = generateHmacSignature(payload2, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signature2)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload2))
                .andExpect(status().isOk());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getContent()).isEqualTo("First message");
        assertThat(messages.get(0).getProviderMessageId()).isEqualTo(duplicateMessageId);
    }

    @Test
    void receiveInboundMessage_CrossTenantRouting_ViaTenantHeader() throws Exception {
        String phoneNumber = "+33600111222";

        String payloadOrg1 =
                createWhatsAppWebhookPayload(
                        "wamid.org1-message",
                        phoneNumber,
                        "1234567890",
                        "Message for org1",
                        "User Org1");

        String signatureOrg1 = generateHmacSignature(payloadOrg1, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signatureOrg1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payloadOrg1))
                .andExpect(status().isOk());

        String payloadOrg2 =
                createWhatsAppWebhookPayload(
                        "wamid.org2-message",
                        phoneNumber,
                        "1234567891",
                        "Message for org2",
                        "User Org2");

        String signatureOrg2 = generateHmacSignature(payloadOrg2, WEBHOOK_SECRET_2);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_2)
                                .header("X-Hub-Signature-256", signatureOrg2)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payloadOrg2))
                .andExpect(status().isOk());

        List<MessageEntity> allMessages = messageRepository.findAll();
        assertThat(allMessages).hasSize(2);

        MessageEntity messageOrg1 =
                allMessages.stream()
                        .filter(m -> m.getProviderMessageId().equals("wamid.org1-message"))
                        .findFirst()
                        .orElseThrow();
        assertThat(messageOrg1.getOrgId()).isEqualTo(ORG_ID_1);
        assertThat(messageOrg1.getContent()).isEqualTo("Message for org1");

        MessageEntity messageOrg2 =
                allMessages.stream()
                        .filter(m -> m.getProviderMessageId().equals("wamid.org2-message"))
                        .findFirst()
                        .orElseThrow();
        assertThat(messageOrg2.getOrgId()).isEqualTo(ORG_ID_2);
        assertThat(messageOrg2.getContent()).isEqualTo("Message for org2");

        List<Dossier> allDossiers = dossierRepository.findAll();
        assertThat(allDossiers).hasSize(2);

        Dossier dossierOrg1 =
                allDossiers.stream()
                        .filter(d -> d.getOrgId().equals(ORG_ID_1))
                        .findFirst()
                        .orElseThrow();
        assertThat(dossierOrg1.getLeadPhone()).isEqualTo(phoneNumber);

        Dossier dossierOrg2 =
                allDossiers.stream()
                        .filter(d -> d.getOrgId().equals(ORG_ID_2))
                        .findFirst()
                        .orElseThrow();
        assertThat(dossierOrg2.getLeadPhone()).isEqualTo(phoneNumber);

        assertThat(messageOrg1.getDossier().getId()).isEqualTo(dossierOrg1.getId());
        assertThat(messageOrg2.getDossier().getId()).isEqualTo(dossierOrg2.getId());
    }

    @Test
    void receiveInboundMessage_CrossTenantIsolation_DossiersAreIsolated() throws Exception {
        String sharedPhoneNumber = "+33600333444";

        Dossier dossierOrg1 = new Dossier();
        dossierOrg1.setOrgId(ORG_ID_1);
        dossierOrg1.setLeadPhone(sharedPhoneNumber);
        dossierOrg1.setLeadName("User in Org1");
        dossierOrg1.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossierOrg1);

        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.org2-isolated-test",
                        sharedPhoneNumber,
                        "1234567890",
                        "Message for org2 should create new dossier",
                        "User in Org2");

        String signature = generateHmacSignature(payload, WEBHOOK_SECRET_2);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_2)
                                .header("X-Hub-Signature-256", signature)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isOk());

        List<Dossier> allDossiers = dossierRepository.findAll();
        assertThat(allDossiers).hasSize(2);

        long org1DossierCount =
                allDossiers.stream().filter(d -> d.getOrgId().equals(ORG_ID_1)).count();
        long org2DossierCount =
                allDossiers.stream().filter(d -> d.getOrgId().equals(ORG_ID_2)).count();

        assertThat(org1DossierCount).isEqualTo(1);
        assertThat(org2DossierCount).isEqualTo(1);

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getOrgId()).isEqualTo(ORG_ID_2);
        assertThat(messages.get(0).getDossier().getOrgId()).isEqualTo(ORG_ID_2);
    }

    @Test
    void receiveInboundMessage_WithClosedDossier_CreatesNewDossier() throws Exception {
        String phoneNumber = "+33600555666";

        Dossier closedDossier = new Dossier();
        closedDossier.setOrgId(ORG_ID_1);
        closedDossier.setLeadPhone(phoneNumber);
        closedDossier.setLeadName("Closed Deal User");
        closedDossier.setStatus(DossierStatus.WON);
        dossierRepository.save(closedDossier);

        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.after-closed-dossier",
                        phoneNumber,
                        "1234567890",
                        "Message after dossier was closed",
                        "Contact Returning");

        String signature = generateHmacSignature(payload, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
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

    @Test
    void receiveInboundMessage_ExistingDossierWithoutName_UpdatesWithContactName()
            throws Exception {
        String phoneNumber = "+33600777888";

        Dossier dossierWithoutName = new Dossier();
        dossierWithoutName.setOrgId(ORG_ID_1);
        dossierWithoutName.setLeadPhone(phoneNumber);
        dossierWithoutName.setLeadName(null);
        dossierWithoutName.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossierWithoutName);

        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.update-name-test",
                        phoneNumber,
                        "1234567890",
                        "Message with contact name",
                        "Contact Name to Update");

        String signature = generateHmacSignature(payload, WEBHOOK_SECRET_1);

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .header(TENANT_HEADER, ORG_ID_1)
                                .header("X-Hub-Signature-256", signature)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isOk());

        Dossier updatedDossier =
                dossierRepository.findById(dossierWithoutName.getId()).orElseThrow();
        assertThat(updatedDossier.getLeadName()).isEqualTo("Contact Name to Update");
    }

    @Test
    void receiveInboundMessage_MissingOrgId_Returns400() throws Exception {
        String payload =
                createWhatsAppWebhookPayload(
                        "wamid.missing-org-test",
                        "+33600999000",
                        "1234567890",
                        "Message without org",
                        "Test User");

        mockMvc.perform(
                        post(WEBHOOK_ENDPOINT)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Missing organization context"));

        assertThat(messageRepository.findAll()).isEmpty();
        assertThat(dossierRepository.findAll()).isEmpty();
    }

    private String createWhatsAppWebhookPayload(
            String messageId,
            String from,
            String timestamp,
            String messageText,
            String contactName) {
        return String.format(
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
                """,
                contactName, from, from, messageId, timestamp, messageText);
    }

    private String generateHmacSignature(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec =
                new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        return "sha256=" + HexFormat.of().formatHex(hash);
    }
}
