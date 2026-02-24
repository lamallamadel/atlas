package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.WhatsAppWebhookPayload;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.example.backend.service.*;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
@TestPropertySource(properties = {
    "outbound.worker.enabled=false"
})
class WhatsAppWebhookIntegrationTest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-whatsapp-webhook-test";
    private static final String TEST_PHONE = "+33612345678";
    private static final String WEBHOOK_ENDPOINT = "/api/v1/webhooks/whatsapp/inbound";
    private static final String WEBHOOK_SECRET = "test-webhook-secret-12345";

    @Autowired
    private OutboundMessageRepository outboundMessageRepository;

    @Autowired
    private OutboundAttemptRepository outboundAttemptRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private WhatsAppProviderConfigRepository whatsAppProviderConfigRepository;

    @Autowired
    private WhatsAppSessionWindowRepository sessionWindowRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WhatsAppWebhookSignatureValidator signatureValidator;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
        
        outboundAttemptRepository.deleteAll();
        outboundMessageRepository.deleteAll();
        messageRepository.deleteAll();
        activityRepository.deleteAll();
        auditEventRepository.deleteAll();
        sessionWindowRepository.deleteAll();
        dossierRepository.deleteAll();
        whatsAppProviderConfigRepository.deleteAll();

        createWhatsAppProviderConfig();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        
        if (redisTemplate != null) {
            try {
                Set<String> keys = redisTemplate.keys("whatsapp:*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                }
            } catch (Exception e) {
            }
        }
    }

    private void createWhatsAppProviderConfig() {
        createWhatsAppProviderConfig(TENANT_1);
    }

    private void createWhatsAppProviderConfig(String orgId) {
        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setOrgId(orgId);
        config.setPhoneNumberId("123456789");
        config.setApiKeyEncrypted("test-api-key");
        config.setApiSecretEncrypted("test-api-secret");
        config.setWebhookSecretEncrypted(WEBHOOK_SECRET);
        config.setEnabled(true);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        whatsAppProviderConfigRepository.save(config);
    }

    @Test
    @WithMockUser
    @DisplayName("Webhook verification - should return challenge when valid token provided")
    void testWebhookVerification_Success() throws Exception {
        String challenge = "test-challenge-" + UUID.randomUUID();

        mockMvc.perform(get(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .param("hub.mode", "subscribe")
                .param("hub.verify_token", "any-token")
                .param("hub.challenge", challenge))
            .andExpect(status().isOk())
            .andExpect(content().string(challenge));
    }

    @Test
    @WithMockUser
    @DisplayName("Webhook verification - should return forbidden when invalid mode")
    void testWebhookVerification_InvalidMode() throws Exception {
        mockMvc.perform(get(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .param("hub.mode", "invalid")
                .param("hub.verify_token", "any-token")
                .param("hub.challenge", "challenge"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser
    @DisplayName("Inbound message - should create dossier and message")
    void testInboundMessage_CreatesNewDossier() throws Exception {
        String payload = createInboundMessagePayload("+33612345678", "Hello, I'm interested");
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk())
            .andExpect(content().string("OK"));

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(1);
        assertThat(dossiers.get(0).getLeadPhone()).isEqualTo("+33612345678");
        assertThat(dossiers.get(0).getLeadName()).isEqualTo("John Doe");
        assertThat(dossiers.get(0).getLeadSource()).isEqualTo("WhatsApp");
        assertThat(dossiers.get(0).getStatus()).isEqualTo(DossierStatus.NEW);

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(messages.get(0).getDirection()).isEqualTo(MessageDirection.INBOUND);
        assertThat(messages.get(0).getContent()).isEqualTo("Hello, I'm interested");

        List<WhatsAppSessionWindow> sessions = sessionWindowRepository.findAll();
        assertThat(sessions).hasSize(1);
        assertThat(sessions.get(0).getPhoneNumber()).isEqualTo("+33612345678");
        assertThat(sessions.get(0).isWithinWindow()).isTrue();
    }

    @Test
    @WithMockUser
    @DisplayName("Inbound message - should update existing dossier")
    void testInboundMessage_UpdatesExistingDossier() throws Exception {
        Dossier existingDossier = new Dossier();
        existingDossier.setOrgId(TENANT_1);
        existingDossier.setLeadPhone("+33612345678");
        existingDossier.setLeadName(null);
        existingDossier.setStatus(DossierStatus.NEW);
        existingDossier.setCreatedAt(LocalDateTime.now());
        existingDossier.setUpdatedAt(LocalDateTime.now());
        dossierRepository.save(existingDossier);

        String payload = createInboundMessagePayload("+33612345678", "Follow-up message");
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(1);
        assertThat(dossiers.get(0).getLeadName()).isEqualTo("John Doe");

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getDossier().getId()).isEqualTo(existingDossier.getId());
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - sent")
    void testDeliveryStatus_Sent() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.test123", OutboundMessageStatus.SENDING);

        String payload = createDeliveryStatusPayload("wamid.test123", "sent", null);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(updated.getErrorCode()).isNull();
        assertThat(updated.getErrorMessage()).isNull();
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - delivered")
    void testDeliveryStatus_Delivered() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.test456", OutboundMessageStatus.SENT);

        String payload = createDeliveryStatusPayload("wamid.test456", "delivered", null);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);
        assertThat(updated.getErrorCode()).isNull();
        assertThat(updated.getErrorMessage()).isNull();
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - read (treated as delivered)")
    void testDeliveryStatus_Read() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.test789", OutboundMessageStatus.DELIVERED);

        String payload = createDeliveryStatusPayload("wamid.test789", "read", null);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - failed with error code 131021 (recipient not on WhatsApp)")
    void testDeliveryStatus_Failed_RecipientNotOnWhatsApp() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.fail131021", OutboundMessageStatus.SENDING);

        WhatsAppWebhookPayload.StatusError error = new WhatsAppWebhookPayload.StatusError();
        error.setCode(131021);
        error.setTitle("Recipient not on WhatsApp");
        error.setMessage("The recipient phone number is not registered on WhatsApp");

        String payload = createDeliveryStatusPayload("wamid.fail131021", "failed", error);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("131021");
        assertThat(updated.getErrorMessage()).contains("not registered on WhatsApp");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - failed with error code 132015 (outside 24h window)")
    void testDeliveryStatus_Failed_OutsideWindow() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.fail132015", OutboundMessageStatus.SENDING);

        WhatsAppWebhookPayload.StatusError error = new WhatsAppWebhookPayload.StatusError();
        error.setCode(132015);
        error.setTitle("Cannot send message");
        error.setMessage("Cannot send message after 24 hour window");

        String payload = createDeliveryStatusPayload("wamid.fail132015", "failed", error);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("132015");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - failed with error code 132016 (template required)")
    void testDeliveryStatus_Failed_TemplateRequired() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.fail132016", OutboundMessageStatus.SENDING);

        WhatsAppWebhookPayload.StatusError error = new WhatsAppWebhookPayload.StatusError();
        error.setCode(132016);
        error.setTitle("Template required");
        error.setMessage("Out of session window - template required");

        String payload = createDeliveryStatusPayload("wamid.fail132016", "failed", error);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("132016");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - failed with error code 130 (rate limit)")
    void testDeliveryStatus_Failed_RateLimit() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.fail130", OutboundMessageStatus.SENDING);

        WhatsAppWebhookPayload.StatusError error = new WhatsAppWebhookPayload.StatusError();
        error.setCode(130);
        error.setTitle("Rate limit hit");
        error.setMessage("Rate limit exceeded");

        String payload = createDeliveryStatusPayload("wamid.fail130", "failed", error);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("130");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - failed with error code 131042 (invalid phone format)")
    void testDeliveryStatus_Failed_InvalidPhoneFormat() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.fail131042", OutboundMessageStatus.SENDING);

        WhatsAppWebhookPayload.StatusError error = new WhatsAppWebhookPayload.StatusError();
        error.setCode(131042);
        error.setTitle("Invalid phone number");
        error.setMessage("Phone number format invalid");

        String payload = createDeliveryStatusPayload("wamid.fail131042", "failed", error);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("131042");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - failed with error code 133004 (template not found)")
    void testDeliveryStatus_Failed_TemplateNotFound() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.fail133004", OutboundMessageStatus.SENDING);

        WhatsAppWebhookPayload.StatusError error = new WhatsAppWebhookPayload.StatusError();
        error.setCode(133004);
        error.setTitle("Template not found");
        error.setMessage("The requested template does not exist");

        String payload = createDeliveryStatusPayload("wamid.fail133004", "failed", error);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("133004");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - failed with error code 132068 (account blocked)")
    void testDeliveryStatus_Failed_AccountBlocked() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.fail132068", OutboundMessageStatus.SENDING);

        WhatsAppWebhookPayload.StatusError error = new WhatsAppWebhookPayload.StatusError();
        error.setCode(132068);
        error.setTitle("Account blocked");
        error.setMessage("Business account blocked from sending messages");

        String payload = createDeliveryStatusPayload("wamid.fail132068", "failed", error);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("132068");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - should not update if already failed")
    void testDeliveryStatus_NoUpdateWhenAlreadyFailed() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.alreadyfailed", OutboundMessageStatus.FAILED);
        message.setErrorCode("131021");
        message.setErrorMessage("Already failed");
        outboundMessageRepository.save(message);

        String payload = createDeliveryStatusPayload("wamid.alreadyfailed", "delivered", null);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.FAILED);
        assertThat(updated.getErrorCode()).isEqualTo("131021");
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - should not update if already delivered")
    void testDeliveryStatus_NoUpdateWhenAlreadyDelivered() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.alreadydelivered", OutboundMessageStatus.DELIVERED);

        String payload = createDeliveryStatusPayload("wamid.alreadydelivered", "sent", null);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);
    }

    @Test
    @WithMockUser
    @DisplayName("Webhook - should reject invalid signature")
    void testWebhook_InvalidSignature() throws Exception {
        String payload = createInboundMessagePayload("+33612345678", "Test message");
        String invalidSignature = "sha256=invalid";

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", invalidSignature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isUnauthorized());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).isEmpty();
    }

    @Test
    @WithMockUser
    @DisplayName("Webhook - should accept request without signature")
    void testWebhook_NoSignature() throws Exception {
        String payload = createInboundMessagePayload("+33612345678", "Test message");

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
    }

    @Test
    @WithMockUser
    @DisplayName("Webhook - should reject when org ID missing")
    void testWebhook_MissingOrgId() throws Exception {
        String payload = createInboundMessagePayload("+33612345678", "Test message");

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - should ignore unknown provider message ID")
    void testDeliveryStatus_UnknownMessageId() throws Exception {
        String payload = createDeliveryStatusPayload("wamid.unknown999", "delivered", null);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Delivery status - should handle organization mismatch")
    void testDeliveryStatus_OrgMismatch() throws Exception {
        OutboundMessageEntity message = createOutboundMessage("wamid.orgmismatch", OutboundMessageStatus.SENDING);
        createWhatsAppProviderConfig("different-org");

        String payload = createDeliveryStatusPayload("wamid.orgmismatch", "delivered", null);
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        // Webhook is permitAll(); call without @WithMockUser so request is anonymous (like real WhatsApp callbacks)
        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", "different-org")
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated = outboundMessageRepository.findById(message.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OutboundMessageStatus.SENDING);
    }

    @Test
    @WithMockUser
    @DisplayName("Delivery status - multiple status updates in one webhook")
    void testDeliveryStatus_MultipleStatuses() throws Exception {
        OutboundMessageEntity message1 = createOutboundMessage("wamid.multi1", OutboundMessageStatus.SENDING);
        OutboundMessageEntity message2 = createOutboundMessage("wamid.multi2", OutboundMessageStatus.SENT);

        String payload = createMultipleDeliveryStatusPayload(
            List.of("wamid.multi1", "wamid.multi2"),
            List.of("sent", "delivered")
        );
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        OutboundMessageEntity updated1 = outboundMessageRepository.findById(message1.getId()).orElseThrow();
        assertThat(updated1.getStatus()).isEqualTo(OutboundMessageStatus.SENT);

        OutboundMessageEntity updated2 = outboundMessageRepository.findById(message2.getId()).orElseThrow();
        assertThat(updated2.getStatus()).isEqualTo(OutboundMessageStatus.DELIVERED);
    }

    @Test
    @WithMockUser
    @DisplayName("Inbound message - duplicate message should be ignored")
    void testInboundMessage_DuplicateIgnored() throws Exception {
        String messageId = "wamid.inbound123";
        
        MessageEntity existingMessage = new MessageEntity();
        existingMessage.setOrgId(TENANT_1);
        existingMessage.setChannel(MessageChannel.WHATSAPP);
        existingMessage.setDirection(MessageDirection.INBOUND);
        existingMessage.setContent("Original message");
        existingMessage.setProviderMessageId(messageId);
        existingMessage.setTimestamp(LocalDateTime.now());
        existingMessage.setCreatedAt(LocalDateTime.now());
        existingMessage.setUpdatedAt(LocalDateTime.now());
        
        Dossier dossier = new Dossier();
        dossier.setOrgId(TENANT_1);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier.setCreatedAt(LocalDateTime.now());
        dossier.setUpdatedAt(LocalDateTime.now());
        dossier = dossierRepository.save(dossier);
        
        existingMessage.setDossier(dossier);
        messageRepository.save(existingMessage);

        String payload = createInboundMessagePayloadWithId(messageId, "+33612345678", "Duplicate message");
        String signature = signatureValidator.computeSignature(payload, WEBHOOK_SECRET);

        mockMvc.perform(post(WEBHOOK_ENDPOINT)
                .header("X-Org-Id", TENANT_1)
                .header("X-Hub-Signature-256", signature)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());

        List<MessageEntity> messages = messageRepository.findAll();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getContent()).isEqualTo("Original message");
    }

    private OutboundMessageEntity createOutboundMessage(String providerMessageId, OutboundMessageStatus status) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(TENANT_1);
        dossier.setLeadPhone(TEST_PHONE);
        dossier.setStatus(DossierStatus.NEW);
        dossier.setCreatedAt(LocalDateTime.now());
        dossier.setUpdatedAt(LocalDateTime.now());
        dossier = dossierRepository.save(dossier);

        OutboundMessageEntity message = new OutboundMessageEntity();
        message.setOrgId(TENANT_1);
        message.setDossierId(dossier.getId());
        message.setChannel(MessageChannel.WHATSAPP);
        message.setTo(TEST_PHONE);
        message.setStatus(status);
        message.setProviderMessageId(providerMessageId);
        message.setIdempotencyKey(UUID.randomUUID().toString());
        message.setAttemptCount(1);
        message.setMaxAttempts(5);
        message.setCreatedAt(LocalDateTime.now());
        message.setUpdatedAt(LocalDateTime.now());
        return outboundMessageRepository.save(message);
    }

    private String createInboundMessagePayload(String from, String messageBody) throws Exception {
        return createInboundMessagePayloadWithId("wamid.inbound" + System.currentTimeMillis(), from, messageBody);
    }

    private String createInboundMessagePayloadWithId(String messageId, String from, String messageBody) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("object", "whatsapp_business_account");

        Map<String, Object> entry = new HashMap<>();
        entry.put("id", "123456789");

        Map<String, Object> change = new HashMap<>();
        change.put("field", "messages");

        Map<String, Object> value = new HashMap<>();
        value.put("messaging_product", "whatsapp");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("display_phone_number", "15551234567");
        metadata.put("phone_number_id", "123456789");
        value.put("metadata", metadata);

        Map<String, Object> contact = new HashMap<>();
        Map<String, Object> profile = new HashMap<>();
        profile.put("name", "John Doe");
        contact.put("profile", profile);
        contact.put("wa_id", from);
        value.put("contacts", List.of(contact));

        Map<String, Object> message = new HashMap<>();
        message.put("from", from);
        message.put("id", messageId);
        message.put("timestamp", String.valueOf(System.currentTimeMillis() / 1000));
        message.put("type", "text");
        
        Map<String, Object> text = new HashMap<>();
        text.put("body", messageBody);
        message.put("text", text);
        
        value.put("messages", List.of(message));

        change.put("value", value);
        entry.put("changes", List.of(change));
        payload.put("entry", List.of(entry));

        return objectMapper.writeValueAsString(payload);
    }

    private String createDeliveryStatusPayload(String messageId, String status, WhatsAppWebhookPayload.StatusError error) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("object", "whatsapp_business_account");

        Map<String, Object> entry = new HashMap<>();
        entry.put("id", "123456789");

        Map<String, Object> change = new HashMap<>();
        change.put("field", "messages");

        Map<String, Object> value = new HashMap<>();
        value.put("messaging_product", "whatsapp");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("display_phone_number", "15551234567");
        metadata.put("phone_number_id", "123456789");
        value.put("metadata", metadata);

        Map<String, Object> statusObj = new HashMap<>();
        statusObj.put("id", messageId);
        statusObj.put("status", status);
        statusObj.put("timestamp", String.valueOf(System.currentTimeMillis() / 1000));
        statusObj.put("recipient_id", TEST_PHONE);

        if (error != null) {
            Map<String, Object> errorObj = new HashMap<>();
            errorObj.put("code", error.getCode());
            errorObj.put("title", error.getTitle());
            errorObj.put("message", error.getMessage());
            statusObj.put("errors", List.of(errorObj));
        }

        value.put("statuses", List.of(statusObj));

        change.put("value", value);
        entry.put("changes", List.of(change));
        payload.put("entry", List.of(entry));

        return objectMapper.writeValueAsString(payload);
    }

    private String createMultipleDeliveryStatusPayload(List<String> messageIds, List<String> statuses) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("object", "whatsapp_business_account");

        Map<String, Object> entry = new HashMap<>();
        entry.put("id", "123456789");

        Map<String, Object> change = new HashMap<>();
        change.put("field", "messages");

        Map<String, Object> value = new HashMap<>();
        value.put("messaging_product", "whatsapp");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("display_phone_number", "15551234567");
        metadata.put("phone_number_id", "123456789");
        value.put("metadata", metadata);

        List<Map<String, Object>> statusList = new ArrayList<>();
        for (int i = 0; i < messageIds.size(); i++) {
            Map<String, Object> statusObj = new HashMap<>();
            statusObj.put("id", messageIds.get(i));
            statusObj.put("status", statuses.get(i));
            statusObj.put("timestamp", String.valueOf(System.currentTimeMillis() / 1000));
            statusObj.put("recipient_id", TEST_PHONE);
            statusList.add(statusObj);
        }

        value.put("statuses", statusList);

        change.put("value", value);
        entry.put("changes", List.of(change));
        payload.put("entry", List.of(entry));

        return objectMapper.writeValueAsString(payload);
    }
}
