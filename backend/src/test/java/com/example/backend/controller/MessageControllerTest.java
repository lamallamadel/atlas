package com.example.backend.controller;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.dto.MessageCreateRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MessageControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String ORG_ID = "org123";
    private static final String ORG_ID_2 = "org456";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @Autowired private MessageRepository messageRepository;

    @Autowired private DossierRepository dossierRepository;

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder>
            T withHeaders(T builder) {
        return (T)
                builder.header(ORG_ID_HEADER, ORG_ID).header(CORRELATION_ID_HEADER, CORRELATION_ID)
                        .header("Authorization", "Bearer mock-token");
    }

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder>
            T withHeaders(T builder, String orgId) {
        return (T)
                builder.header(ORG_ID_HEADER, orgId).header(CORRELATION_ID_HEADER, CORRELATION_ID)
                    .header("Authorization", "Bearer mock-token");
    }

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_ValidRequest_Returns201WithCreatedMessage() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.EMAIL);
        request.setDirection(MessageDirection.INBOUND);
        request.setContent("Test message content");
        request.setTimestamp(LocalDateTime.now());

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/messages")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.channel").value("EMAIL"))
                .andExpect(jsonPath("$.direction").value("INBOUND"))
                .andExpect(jsonPath("$.content").value("Test message content"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_MissingRequiredFields_Returns400() throws Exception {
        MessageCreateRequest request = new MessageCreateRequest();

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/messages")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_InvalidEnumValue_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        String invalidRequest =
                String.format(
                        "{\"dossierId\":%d,\"channel\":\"INVALID_CHANNEL\",\"direction\":\"INBOUND\",\"content\":\"Test\",\"timestamp\":\"2024-01-01T12:00:00\"}",
                        dossier.getId());

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/messages")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_NonExistentDossier_Returns404() throws Exception {
        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(99999L);
        request.setChannel(MessageChannel.EMAIL);
        request.setDirection(MessageDirection.INBOUND);
        request.setContent("Test message content");
        request.setTimestamp(LocalDateTime.now());

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/messages")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void create_WithAdminRole_Returns201() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.SMS);
        request.setDirection(MessageDirection.OUTBOUND);
        request.setContent("Admin message");
        request.setTimestamp(LocalDateTime.now());

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/messages")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void create_WithUserRole_Returns403() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        MessageCreateRequest request = new MessageCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(MessageChannel.EMAIL);
        request.setDirection(MessageDirection.INBOUND);
        request.setContent("Test");
        request.setTimestamp(LocalDateTime.now());

        mockMvc.perform(
                        post("/api/v1/messages")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                                .header(ORG_ID_HEADER, ORG_ID)
                                .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                                .header("Authorization", "Bearer mock-role-user-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_ExistingMessage_Returns200() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        MessageEntity message =
                createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND);

        mockMvc.perform(withHeaders(get("/api/v1/messages/" + message.getId())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(message.getId()))
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.channel").value("EMAIL"))
                .andExpect(jsonPath("$.direction").value("INBOUND"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_NonExistentMessage_Returns404() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/messages/99999")))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_DifferentTenant_Returns404() throws Exception {
        Dossier dossier = createDossier(ORG_ID_2);
        MessageEntity message =
                createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND);

        mockMvc.perform(withHeaders(get("/api/v1/messages/" + message.getId())))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_WithPagination_ReturnsPagedResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        for (int i = 0; i < 25; i++) {
            createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND);
        }

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("page", "0")
                                        .param("size", "10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0));

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("page", "1")
                                        .param("size", "10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.number").value(1));

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("page", "2")
                                        .param("size", "10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.number").value(2));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByChannel_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND);
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND);
        createMessage(dossier, MessageChannel.WHATSAPP, MessageDirection.INBOUND);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("channel", "EMAIL")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].channel", everyItem(is("EMAIL"))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByDirection_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND);
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.OUTBOUND);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("direction", "INBOUND")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].direction", everyItem(is("INBOUND"))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByChannelAndDirection_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.INBOUND);
        createMessage(dossier, MessageChannel.EMAIL, MessageDirection.OUTBOUND);
        createMessage(dossier, MessageChannel.SMS, MessageDirection.INBOUND);
        createMessage(dossier, MessageChannel.SMS, MessageDirection.OUTBOUND);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("channel", "EMAIL")
                                        .param("direction", "INBOUND")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].channel").value("EMAIL"))
                .andExpect(jsonPath("$.content[0].direction").value("INBOUND"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_SortByTimestampDesc_ReturnsSortedResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        MessageEntity msg1 =
                createMessageWithTimestamp(dossier, LocalDateTime.of(2024, 1, 1, 10, 0));
        MessageEntity msg2 =
                createMessageWithTimestamp(dossier, LocalDateTime.of(2024, 1, 2, 10, 0));
        MessageEntity msg3 =
                createMessageWithTimestamp(dossier, LocalDateTime.of(2024, 1, 3, 10, 0));

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("sort", "timestamp,desc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].id").value(msg3.getId()))
                .andExpect(jsonPath("$.content[1].id").value(msg2.getId()))
                .andExpect(jsonPath("$.content[2].id").value(msg1.getId()));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_SortByTimestampAsc_ReturnsSortedResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        MessageEntity msg1 =
                createMessageWithTimestamp(dossier, LocalDateTime.of(2024, 1, 3, 10, 0));
        MessageEntity msg2 =
                createMessageWithTimestamp(dossier, LocalDateTime.of(2024, 1, 1, 10, 0));
        MessageEntity msg3 =
                createMessageWithTimestamp(dossier, LocalDateTime.of(2024, 1, 2, 10, 0));

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("sort", "timestamp,asc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].id").value(msg2.getId()))
                .andExpect(jsonPath("$.content[1].id").value(msg3.getId()))
                .andExpect(jsonPath("$.content[2].id").value(msg1.getId()));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_MultiTenantIsolation_OnlyReturnsSameTenant() throws Exception {
        Dossier dossier1 = createDossier(ORG_ID);
        Dossier dossier2 = createDossier(ORG_ID_2);

        createMessage(dossier1, MessageChannel.EMAIL, MessageDirection.INBOUND);
        createMessage(dossier1, MessageChannel.SMS, MessageDirection.INBOUND);
        createMessage(dossier2, MessageChannel.EMAIL, MessageDirection.INBOUND);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier1.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].orgId", everyItem(is(ORG_ID))));

        mockMvc.perform(
                        withHeaders(get("/api/v1/messages"), ORG_ID_2)
                                .param("dossierId", dossier2.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[*].orgId", everyItem(is(ORG_ID_2))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_InvalidChannelEnum_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("channel", "INVALID_CHANNEL")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_InvalidDirectionEnum_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("direction", "INVALID_DIRECTION")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_EmptyResults_ReturnsEmptyPage() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/messages")
                                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    private Dossier createDossier(String orgId) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("Test User");
        dossier.setStatus(DossierStatus.NEW);
        return dossierRepository.save(dossier);
    }

    private MessageEntity createMessage(
            Dossier dossier, MessageChannel channel, MessageDirection direction) {
        MessageEntity message = new MessageEntity();
        message.setOrgId(dossier.getOrgId());
        message.setDossier(dossier);
        message.setChannel(channel);
        message.setDirection(direction);
        message.setContent("Test message content");
        message.setTimestamp(LocalDateTime.now());
        return messageRepository.save(message);
    }

    private MessageEntity createMessageWithTimestamp(Dossier dossier, LocalDateTime timestamp) {
        MessageEntity message = new MessageEntity();
        message.setOrgId(dossier.getOrgId());
        message.setDossier(dossier);
        message.setChannel(MessageChannel.EMAIL);
        message.setDirection(MessageDirection.INBOUND);
        message.setContent("Test message content");
        message.setTimestamp(timestamp);
        return messageRepository.save(message);
    }
}
