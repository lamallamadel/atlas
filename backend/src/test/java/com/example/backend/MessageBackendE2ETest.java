package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.MessageCreateRequest;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
class MessageBackendE2ETest extends BaseBackendE2ETest {

    private static final String TENANT_1 = "org-tenant-1";
    private static final String TENANT_2 = "org-tenant-2";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        messageRepository.deleteAll();
        auditEventRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Clear tenant context to prevent tenant ID leakage between tests
        com.example.backend.util.TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_WithEmailChannel_Returns201AndCreatesAuditLog() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        LocalDateTime timestamp = LocalDateTime.of(2024, 1, 15, 10, 30, 0);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.EMAIL);
        request.setDirection(MessageDirection.INBOUND);
        request.setContent("Test email message content");
        request.setTimestamp(timestamp);

        MvcResult result = mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)), TENANT_1))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value(TENANT_1))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.channel").value("EMAIL"))
                .andExpect(jsonPath("$.direction").value("INBOUND"))
                .andExpect(jsonPath("$.content").value("Test email message content"))
                .andExpect(jsonPath("$.timestamp").value(startsWith("2024-01-15T10:30")))
                .andExpect(jsonPath("$.createdAt").exists())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseJson, Map.class);
        Long messageId = ((Number) responseMap.get("id")).longValue();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getOrgId()).isEqualTo(TENANT_1);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.MESSAGE);
        assertThat(auditEvent.getEntityId()).isEqualTo(messageId);
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getDiff()).isNotNull();
        assertThat(auditEvent.getDiff()).containsKey("after");
        
        Map<String, Object> after = (Map<String, Object>) auditEvent.getDiff().get("after");
        assertThat(after).containsEntry("content", "Test email message content");
        assertThat(after).containsEntry("channel", "EMAIL");
        assertThat(after).containsEntry("direction", "INBOUND");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_WithSmsChannel_Returns201() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        LocalDateTime timestamp = LocalDateTime.of(2024, 1, 15, 11, 0, 0);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.SMS);
        request.setDirection(MessageDirection.OUTBOUND);
        request.setContent("Test SMS message");
        request.setTimestamp(timestamp);

        mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)), TENANT_1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.channel").value("SMS"))
                .andExpect(jsonPath("$.direction").value("OUTBOUND"))
                .andExpect(jsonPath("$.timestamp").value(startsWith("2024-01-15T11:00")));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_WithWhatsappChannel_Returns201() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        LocalDateTime timestamp = LocalDateTime.of(2024, 1, 15, 12, 0, 0);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.WHATSAPP);
        request.setDirection(MessageDirection.INBOUND);
        request.setContent("Test WhatsApp message");
        request.setTimestamp(timestamp);

        mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)), TENANT_1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.channel").value("WHATSAPP"))
                .andExpect(jsonPath("$.direction").value("INBOUND"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_WithPhoneChannel_Returns201() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        LocalDateTime timestamp = LocalDateTime.of(2024, 1, 15, 13, 0, 0);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.PHONE);
        request.setDirection(MessageDirection.OUTBOUND);
        request.setContent("Test phone call notes");
        request.setTimestamp(timestamp);

        mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)), TENANT_1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.channel").value("PHONE"))
                .andExpect(jsonPath("$.direction").value("OUTBOUND"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_AllChannelsAndDirectionsCombinations_Returns201() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        MessageChannel[] channels = {MessageChannel.EMAIL, MessageChannel.SMS, MessageChannel.WHATSAPP, MessageChannel.PHONE};
        MessageDirection[] directions = {MessageDirection.INBOUND, MessageDirection.OUTBOUND};

        int messageCount = 0;
        for (MessageChannel channel : channels) {
            for (MessageDirection direction : directions) {
                messageCount++;
                LocalDateTime timestamp = LocalDateTime.of(2024, 1, 15, 10, messageCount, 0);

                MessageCreateRequest request = new MessageCreateRequest();
                request.setDossierId(dossier.getId());
                request.setChannel(channel);
                request.setDirection(direction);
                request.setContent(String.format("Message %s %s", channel, direction));
                request.setTimestamp(timestamp);

                mockMvc.perform(withTenantHeaders(
                                post("/api/v1/messages")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)), TENANT_1))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.channel").value(channel.name()))
                        .andExpect(jsonPath("$.direction").value(direction.name()));
            }
        }

        assertThat(messageRepository.count()).isEqualTo(8);
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_ValidatesTimestamp() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        LocalDateTime pastTimestamp = LocalDateTime.of(2020, 1, 1, 0, 0, 0);
        LocalDateTime futureTimestamp = LocalDateTime.of(2030, 12, 31, 23, 59, 59);

        MessageCreateRequest request1 = new MessageCreateRequest();
        request1.setDossierId(dossier.getId());
        request1.setChannel(MessageChannel.EMAIL);
        request1.setDirection(MessageDirection.INBOUND);
        request1.setContent("Past message");
        request1.setTimestamp(pastTimestamp);

        mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request1)), TENANT_1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.timestamp").value(startsWith("2020-01-01T00:00")));

        MessageCreateRequest request2 = new MessageCreateRequest();
        request2.setDossierId(dossier.getId());
        request2.setChannel(MessageChannel.EMAIL);
        request2.setDirection(MessageDirection.INBOUND);
        request2.setContent("Future message");
        request2.setTimestamp(futureTimestamp);

        mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request2)), TENANT_1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.timestamp").value(startsWith("2030-12-31T23:59")));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByChannel_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 11, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 12, 0));
        createMessage(dossier, MessageChannel.WHATSAPP, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 13, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("channel", "EMAIL"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].channel", everyItem(is("EMAIL"))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByDirection_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 11, 0));
        createMessage(dossier, MessageChannel.WHATSAPP, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 12, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("direction", "INBOUND"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].direction", everyItem(is("INBOUND"))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByChannelAndDirection_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 11, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 12, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 13, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("channel", "EMAIL")
                                .param("direction", "INBOUND"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].channel").value("EMAIL"))
                .andExpect(jsonPath("$.content[0].direction").value("INBOUND"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_SortByTimestampDesc_ReturnsSortedResults() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        Long msg1Id = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        Long msg2Id = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 2, 10, 0));
        Long msg3Id = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 3, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("sort", "timestamp,desc"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].id").value(msg3Id))
                .andExpect(jsonPath("$.content[1].id").value(msg2Id))
                .andExpect(jsonPath("$.content[2].id").value(msg1Id));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_DefaultSortIsTimestampDesc() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        Long msg1Id = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        Long msg2Id = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 2, 10, 0));
        Long msg3Id = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 3, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString()), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].id").value(msg3Id))
                .andExpect(jsonPath("$.content[1].id").value(msg2Id))
                .andExpect(jsonPath("$.content[2].id").value(msg1Id));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_Pagination_ReturnsCorrectPages() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        for (int i = 0; i < 25; i++) {
            createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, i));
        }

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("page", "0")
                                .param("size", "10"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("page", "1")
                                .param("size", "10"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.number").value(1));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("page", "2")
                                .param("size", "10"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.number").value(2));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_CrossTenantIsolation_OnlyReturnsSameTenant() throws Exception {
        Dossier dossier1 = createDossier(TENANT_1);
        Dossier dossier2 = createDossier(TENANT_2);

        createMessage(dossier1, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier1, MessageChannel.SMS, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 11, 0));
        createMessage(dossier2, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 12, 0));
        createMessage(dossier2, MessageChannel.WHATSAPP, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 13, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier1.getId().toString()), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].orgId", everyItem(is(TENANT_1))));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier2.getId().toString()), TENANT_2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].orgId", everyItem(is(TENANT_2))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_CrossTenantIsolation_CannotAccessOtherTenantDossier() throws Exception {
        Dossier dossier2 = createDossier(TENANT_2);
        createMessage(dossier2, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier2.getId().toString()), TENANT_1))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_AuditLog_ContainsContentInDiff() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        String messageContent = "Sensitive customer information about property inquiry";
        LocalDateTime timestamp = LocalDateTime.of(2024, 1, 15, 10, 30, 0);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.EMAIL);
        request.setDirection(MessageDirection.INBOUND);
        request.setContent(messageContent);
        request.setTimestamp(timestamp);

        MvcResult result = mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)), TENANT_1))
                .andExpect(status().isCreated())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseJson, Map.class);
        Long messageId = ((Number) responseMap.get("id")).longValue();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        assertThat(auditEvents).hasSizeGreaterThanOrEqualTo(1);

        AuditEventEntity messageAudit = auditEvents.stream()
                .filter(a -> a.getEntityType() == AuditEntityType.MESSAGE && a.getEntityId().equals(messageId))
                .findFirst()
                .orElseThrow();

        assertThat(messageAudit.getDiff()).isNotNull();
        assertThat(messageAudit.getDiff()).containsKey("after");
        
        Map<String, Object> after = (Map<String, Object>) messageAudit.getDiff().get("after");
        assertThat(after).containsEntry("content", messageContent);
        assertThat(after).containsEntry("channel", "EMAIL");
        assertThat(after).containsEntry("direction", "INBOUND");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_AuditLog_PersistsAcrossMultipleMessages() throws Exception {
        Dossier dossier = createDossier(TENANT_1);

        for (int i = 0; i < 5; i++) {
            MessageCreateRequest request = new MessageCreateRequest();
            request.setDossierId(dossier.getId());
            request.setChannel(MessageChannel.EMAIL);
            request.setDirection(MessageDirection.INBOUND);
            request.setContent("Message content " + i);
            request.setTimestamp(LocalDateTime.of(2024, 1, 1, 10, i));

            mockMvc.perform(withTenantHeaders(
                            post("/api/v1/messages")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)), TENANT_1))
                    .andExpect(status().isCreated());
        }

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        long messageAudits = auditEvents.stream()
                .filter(a -> a.getEntityType() == AuditEntityType.MESSAGE)
                .count();
        
        assertThat(messageAudits).isEqualTo(5);

        for (int i = 0; i < 5; i++) {
            int finalI = i;
            AuditEventEntity audit = auditEvents.stream()
                    .filter(a -> a.getEntityType() == AuditEntityType.MESSAGE)
                    .filter(a -> {
                        Map<String, Object> diff = a.getDiff();
                        if (diff != null && diff.containsKey("after")) {
                            Map<String, Object> after = (Map<String, Object>) diff.get("after");
                            return after.get("content").equals("Message content " + finalI);
                        }
                        return false;
                    })
                    .findFirst()
                    .orElseThrow();

            assertThat(audit.getAction()).isEqualTo(AuditAction.CREATED);
        }
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void createMessage_AuditLog_IsolatedByTenant() throws Exception {
        Dossier dossier1 = createDossier(TENANT_1);
        Dossier dossier2 = createDossier(TENANT_2);

        MessageCreateRequest request1 = new MessageCreateRequest();
        request1.setDossierId(dossier1.getId());
        request1.setChannel(MessageChannel.EMAIL);
        request1.setDirection(MessageDirection.INBOUND);
        request1.setContent("Tenant 1 message");
        request1.setTimestamp(LocalDateTime.of(2024, 1, 1, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request1)), TENANT_1))
                .andExpect(status().isCreated());

        MessageCreateRequest request2 = new MessageCreateRequest();
        request2.setDossierId(dossier2.getId());
        request2.setChannel(MessageChannel.SMS);
        request2.setDirection(MessageDirection.OUTBOUND);
        request2.setContent("Tenant 2 message");
        request2.setTimestamp(LocalDateTime.of(2024, 1, 1, 11, 0));

        mockMvc.perform(withTenantHeaders(
                        post("/api/v1/messages")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request2)), TENANT_2))
                .andExpect(status().isCreated());

        List<AuditEventEntity> allAudits = auditEventRepository.findAll();
        
        List<AuditEventEntity> tenant1Audits = allAudits.stream()
                .filter(a -> a.getOrgId().equals(TENANT_1))
                .filter(a -> a.getEntityType() == AuditEntityType.MESSAGE)
                .toList();
        
        List<AuditEventEntity> tenant2Audits = allAudits.stream()
                .filter(a -> a.getOrgId().equals(TENANT_2))
                .filter(a -> a.getEntityType() == AuditEntityType.MESSAGE)
                .toList();

        assertThat(tenant1Audits).hasSize(1);
        assertThat(tenant2Audits).hasSize(1);

        Map<String, Object> tenant1After = (Map<String, Object>) tenant1Audits.get(0).getDiff().get("after");
        assertThat(tenant1After.get("content")).isEqualTo("Tenant 1 message");

        Map<String, Object> tenant2After = (Map<String, Object>) tenant2Audits.get(0).getDiff().get("after");
        assertThat(tenant2After.get("content")).isEqualTo("Tenant 2 message");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_EmptyResults_ReturnsEmptyPage() throws Exception {
        Dossier dossier = createDossier(TENANT_1);

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString()), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.totalPages").value(0));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_NonExistentDossier_Returns404() throws Exception {
        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", "99999"), TENANT_1))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_MultipleChannelsAndDirections_FiltersCorrectly() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 11, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 12, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 13, 0));
        createMessage(dossier, MessageChannel.WHATSAPP, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 14, 0));
        createMessage(dossier, MessageChannel.WHATSAPP, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 15, 0));
        createMessage(dossier, MessageChannel.PHONE, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 16, 0));
        createMessage(dossier, MessageChannel.PHONE, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 1, 17, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("channel", "EMAIL"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("direction", "INBOUND"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(4)));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("channel", "WHATSAPP")
                                .param("direction", "OUTBOUND"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByDateRange_ReturnsMessagesInRange() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 5, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 10, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 15, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 20, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("startDate", "2024-01-05T00:00:00")
                                .param("endDate", "2024-01-15T23:59:59"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByStartDateOnly_ReturnsMessagesAfterDate() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 5, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 10, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 15, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("startDate", "2024-01-10T00:00:00"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByEndDateOnly_ReturnsMessagesBeforeDate() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        
        Long msg1 = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        Long msg2 = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 5, 10, 0));
        Long msg3 = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 10, 10, 0));
        Long msg4 = createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 15, 10, 0));
        
        assertThat(msg1).isNotNull();
        assertThat(msg2).isNotNull();
        assertThat(msg3).isNotNull();
        assertThat(msg4).isNotNull();
        assertThat(messageRepository.count()).isEqualTo(4);

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("endDate", "2024-01-10T10:00:00"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByDateRangeAndChannel_ReturnsCombinedFilter() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 1, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 10, 10, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 10, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 20, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("channel", "EMAIL")
                                .param("startDate", "2024-01-05T00:00:00")
                                .param("endDate", "2024-01-15T23:59:59"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].channel").value("EMAIL"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listMessages_FilterByDateRangeChannelAndDirection_ReturnsCombinedFilter() throws Exception {
        Dossier dossier = createDossier(TENANT_1);
        
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 10, 10, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.OUTBOUND, LocalDateTime.of(2024, 1, 10, 11, 0));
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 10, 12, 0));
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND, LocalDateTime.of(2024, 1, 20, 10, 0));

        mockMvc.perform(withTenantHeaders(
                        get("/api/v1/messages")
                                .param("dossierId", dossier.getId().toString())
                                .param("channel", "EMAIL")
                                .param("direction", "INBOUND")
                                .param("startDate", "2024-01-01T00:00:00")
                                .param("endDate", "2024-01-15T23:59:59"), TENANT_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].channel").value("EMAIL"))
                .andExpect(jsonPath("$.content[0].direction").value("INBOUND"));
    }

    private Dossier createDossier(String orgId) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("Test Lead");
        dossier.setStatus(DossierStatus.NEW);
        return dossierRepository.save(dossier);
    }

    private Long createMessage(Dossier dossier, MessageChannel channel, MessageDirection direction, LocalDateTime timestamp) {
        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(channel);
        request.setDirection(direction);
        request.setContent(String.format("Test %s %s message", channel, direction));
        request.setTimestamp(timestamp);

        try {
            MvcResult result = mockMvc.perform(withTenantHeaders(
                            post("/api/v1/messages")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)), dossier.getOrgId()))
                    .andExpect(status().isCreated())
                    .andReturn();

            String responseJson = result.getResponse().getContentAsString();
            Map<String, Object> responseMap = objectMapper.readValue(responseJson, Map.class);
            return ((Number) responseMap.get("id")).longValue();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create message", e);
        }
    }
}
