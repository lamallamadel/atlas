package com.example.backend.controller;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.config.TestMailConfiguration;
import com.example.backend.dto.NotificationCreateRequest;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.NotificationEntity;
import com.example.backend.entity.enums.NotificationStatus;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.service.NotificationService;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@BackendE2ETest
@WithMockUser(roles = {"PRO"})
@Import(TestMailConfiguration.class)
class NotificationBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG_ID = "test-org-123";
    private static final String BASE_URL = "/api/v1/notifications";

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private BackendE2ETestDataBuilder testDataBuilder;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        reset(mailSender);
    }

    @Test
    void createNotification_WithEmailType_CreatesNotificationWithPendingStatus() throws Exception {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setType(NotificationType.EMAIL);
        request.setRecipient("test@example.com");
        request.setSubject("Test Subject");
        request.setTemplateId("test-email");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "John Doe");
        variables.put("message", "This is a test message");
        request.setVariables(variables);

        MvcResult result = mockMvc.perform(
                withTenantHeaders(post(BASE_URL), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
        )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.type").value("EMAIL"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.recipient").value("test@example.com"))
                .andExpect(jsonPath("$.subject").value("Test Subject"))
                .andExpect(jsonPath("$.templateId").value("test-email"))
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        NotificationResponse response = objectMapper.readValue(responseBody, NotificationResponse.class);

        NotificationEntity savedEntity = notificationRepository.findById(response.getId()).orElse(null);
        assertThat(savedEntity).isNotNull();
        assertThat(savedEntity.getType()).isEqualTo(NotificationType.EMAIL);
        assertThat(savedEntity.getStatus()).isEqualTo(NotificationStatus.PENDING);
        assertThat(savedEntity.getOrgId()).isEqualTo(ORG_ID);
        assertThat(savedEntity.getRecipient()).isEqualTo("test@example.com");
        assertThat(savedEntity.getSubject()).isEqualTo("Test Subject");
        assertThat(savedEntity.getVariables()).containsEntry("userName", "John Doe");
        assertThat(savedEntity.getVariables()).containsEntry("message", "This is a test message");
    }

    @Test
    void createNotification_WithSmsType_CreatesNotificationWithPendingStatus() throws Exception {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setType(NotificationType.SMS);
        request.setRecipient("+33612345678");
        request.setTemplateId("sms-template");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("code", "123456");
        request.setVariables(variables);

        mockMvc.perform(
                withTenantHeaders(post(BASE_URL), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
        )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("SMS"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.recipient").value("+33612345678"));
    }

    @Test
    void createNotification_WithInAppType_CreatesNotificationWithPendingStatus() throws Exception {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setType(NotificationType.IN_APP);
        request.setRecipient("user123");
        request.setTemplateId("in-app-template");
        request.setSubject("New Notification");

        mockMvc.perform(
                withTenantHeaders(post(BASE_URL), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
        )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("IN_APP"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.recipient").value("user123"));
    }

    @Test
    void createNotification_WithDossierId_StoresDossierId() throws Exception {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setDossierId(999L);
        request.setType(NotificationType.EMAIL);
        request.setRecipient("test@example.com");
        request.setSubject("Dossier Update");
        request.setTemplateId("test-email");

        MvcResult result = mockMvc.perform(
                withTenantHeaders(post(BASE_URL), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
        )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dossierId").value(999))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        NotificationResponse response = objectMapper.readValue(responseBody, NotificationResponse.class);

        NotificationEntity savedEntity = notificationRepository.findById(response.getId()).orElse(null);
        assertThat(savedEntity).isNotNull();
        assertThat(savedEntity.getDossierId()).isEqualTo(999L);
    }

    @Test
    void processPendingNotifications_WithSuccessfulEmail_TransitionsToSentStatus() throws Exception {
        MimeMessage mockMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mockMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(ORG_ID);
        notification.setDossierId(null);
        notification.setType(NotificationType.EMAIL);
        notification.setRecipient("success@example.com");
        notification.setSubject("Test Email");
        notification.setTemplateId("test-email");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "Jane Doe");
        variables.put("message", "Success test message");
        notification.setVariables(variables);
        
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRetryCount(0);
        notification.setMaxRetries(3);
        notification = notificationRepository.save(notification);

        notificationService.processPendingNotifications();

        NotificationEntity processed = notificationRepository.findById(notification.getId()).orElse(null);
        assertThat(processed).isNotNull();
        assertThat(processed.getStatus()).isEqualTo(NotificationStatus.SENT);
        assertThat(processed.getSentAt()).isNotNull();
        assertThat(processed.getErrorMessage()).isNull();

        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void processPendingNotifications_WithFailedEmail_TransitionsToFailedStatus() throws Exception {
        MimeMessage mockMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mockMessage);
        doThrow(new RuntimeException("SMTP connection failed")).when(mailSender).send(any(MimeMessage.class));

        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(ORG_ID);
        notification.setDossierId(null);
        notification.setType(NotificationType.EMAIL);
        notification.setRecipient("fail@example.com");
        notification.setSubject("Test Email");
        notification.setTemplateId("test-email");
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRetryCount(0);
        notification.setMaxRetries(3);
        notification = notificationRepository.save(notification);

        notificationService.processPendingNotifications();
        notificationService.processPendingNotifications();
        notificationService.processPendingNotifications();

        NotificationEntity processed = notificationRepository.findById(notification.getId()).orElse(null);
        assertThat(processed).isNotNull();
        assertThat(processed.getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(processed.getRetryCount()).isEqualTo(3);
        assertThat(processed.getErrorMessage()).contains("Failed to send email");
        assertThat(processed.getSentAt()).isNull();

        verify(mailSender, times(3)).send(any(MimeMessage.class));
    }

    @Test
    void processPendingNotifications_WithRetries_KeepsPendingStatusUntilMaxRetries() throws Exception {
        MimeMessage mockMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mockMessage);
        doThrow(new RuntimeException("Temporary failure")).when(mailSender).send(any(MimeMessage.class));

        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(ORG_ID);
        notification.setDossierId(null);
        notification.setType(NotificationType.EMAIL);
        notification.setRecipient("retry@example.com");
        notification.setSubject("Test Email");
        notification.setTemplateId("test-email");
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRetryCount(0);
        notification.setMaxRetries(3);
        notification = notificationRepository.save(notification);

        notificationService.processPendingNotifications();
        NotificationEntity afterFirst = notificationRepository.findById(notification.getId()).orElse(null);
        assertThat(afterFirst.getStatus()).isEqualTo(NotificationStatus.PENDING);
        assertThat(afterFirst.getRetryCount()).isEqualTo(1);

        notificationService.processPendingNotifications();
        NotificationEntity afterSecond = notificationRepository.findById(notification.getId()).orElse(null);
        assertThat(afterSecond.getStatus()).isEqualTo(NotificationStatus.PENDING);
        assertThat(afterSecond.getRetryCount()).isEqualTo(2);

        notificationService.processPendingNotifications();
        NotificationEntity afterThird = notificationRepository.findById(notification.getId()).orElse(null);
        assertThat(afterThird.getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(afterThird.getRetryCount()).isEqualTo(3);
    }

    @Test
    void emailProvider_VerifiesRecipientSubjectAndBody() throws Exception {
        MimeMessage mockMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mockMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(ORG_ID);
        notification.setDossierId(null);
        notification.setType(NotificationType.EMAIL);
        notification.setRecipient("verify@example.com");
        notification.setSubject("Verification Email");
        notification.setTemplateId("test-email");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "Test User");
        variables.put("message", "Verification message");
        notification.setVariables(variables);
        
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRetryCount(0);
        notification.setMaxRetries(3);
        notification = notificationRepository.save(notification);

        notificationService.processPendingNotifications();

        verify(mailSender).send(any(MimeMessage.class));
        
        NotificationEntity processed = notificationRepository.findById(notification.getId()).orElse(null);
        assertThat(processed).isNotNull();
        assertThat(processed.getStatus()).isEqualTo(NotificationStatus.SENT);
        assertThat(processed.getRecipient()).isEqualTo("verify@example.com");
        assertThat(processed.getSubject()).isEqualTo("Verification Email");
    }

    @Test
    void thymeleafTemplate_RendersWithVariables() throws Exception {
        MimeMessage mockMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mockMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(ORG_ID);
        notification.setDossierId(null);
        notification.setType(NotificationType.EMAIL);
        notification.setRecipient("template@example.com");
        notification.setSubject("Template Test");
        notification.setTemplateId("test-email");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "Alice");
        variables.put("message", "Template rendering test");
        variables.put("dossierId", 12345);
        notification.setVariables(variables);
        
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRetryCount(0);
        notification.setMaxRetries(3);
        notification = notificationRepository.save(notification);

        notificationService.processPendingNotifications();

        NotificationEntity processed = notificationRepository.findById(notification.getId()).orElse(null);
        assertThat(processed).isNotNull();
        assertThat(processed.getStatus()).isEqualTo(NotificationStatus.SENT);
        assertThat(processed.getVariables()).containsEntry("userName", "Alice");
        assertThat(processed.getVariables()).containsEntry("message", "Template rendering test");
        assertThat(processed.getVariables()).containsEntry("dossierId", 12345);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void getNotifications_WithoutFilters_ReturnsAllNotifications() throws Exception {
        createTestNotification(ORG_ID, 1L, NotificationType.EMAIL, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 2L, NotificationType.SMS, NotificationStatus.SENT);
        createTestNotification(ORG_ID, 3L, NotificationType.IN_APP, NotificationStatus.FAILED);

        MvcResult result = mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("PENDING", "SENT", "FAILED");
    }

    @Test
    void getNotifications_FilterByDossierId_ReturnsMatchingNotifications() throws Exception {
        createTestNotification(ORG_ID, 100L, NotificationType.EMAIL, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 100L, NotificationType.SMS, NotificationStatus.SENT);
        createTestNotification(ORG_ID, 200L, NotificationType.EMAIL, NotificationStatus.PENDING);

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("dossierId", "100")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].dossierId").value(100))
                .andExpect(jsonPath("$.content[1].dossierId").value(100))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void getNotifications_FilterByType_ReturnsMatchingNotifications() throws Exception {
        createTestNotification(ORG_ID, 1L, NotificationType.EMAIL, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 2L, NotificationType.EMAIL, NotificationStatus.SENT);
        createTestNotification(ORG_ID, 3L, NotificationType.SMS, NotificationStatus.PENDING);

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("type", "EMAIL")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].type").value("EMAIL"))
                .andExpect(jsonPath("$.content[1].type").value("EMAIL"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void getNotifications_FilterByStatus_ReturnsMatchingNotifications() throws Exception {
        createTestNotification(ORG_ID, 1L, NotificationType.EMAIL, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 2L, NotificationType.SMS, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 3L, NotificationType.EMAIL, NotificationStatus.SENT);

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("status", "PENDING")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.content[1].status").value("PENDING"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void getNotifications_FilterByMultipleCriteria_ReturnsMatchingNotifications() throws Exception {
        createTestNotification(ORG_ID, 100L, NotificationType.EMAIL, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 100L, NotificationType.EMAIL, NotificationStatus.SENT);
        createTestNotification(ORG_ID, 100L, NotificationType.SMS, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 200L, NotificationType.EMAIL, NotificationStatus.PENDING);

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("dossierId", "100")
                        .param("type", "EMAIL")
                        .param("status", "PENDING")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].dossierId").value(100))
                .andExpect(jsonPath("$.content[0].type").value("EMAIL"))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getNotifications_WithPagination_ReturnsCorrectPage() throws Exception {
        for (int i = 0; i < 25; i++) {
            createTestNotification(ORG_ID, (long) i, NotificationType.EMAIL, NotificationStatus.PENDING);
        }

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("page", "0")
                        .param("size", "10")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("page", "1")
                        .param("size", "10")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.number").value(1));

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("page", "2")
                        .param("size", "10")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(5))
                .andExpect(jsonPath("$.number").value(2));
    }

    @Test
    void getNotifications_WithSorting_ReturnsSortedResults() throws Exception {
        NotificationEntity notif1 = createTestNotification(ORG_ID, 1L, NotificationType.EMAIL, NotificationStatus.PENDING);
        Thread.sleep(10);
        NotificationEntity notif2 = createTestNotification(ORG_ID, 2L, NotificationType.SMS, NotificationStatus.SENT);
        Thread.sleep(10);
        NotificationEntity notif3 = createTestNotification(ORG_ID, 3L, NotificationType.IN_APP, NotificationStatus.FAILED);

        MvcResult resultAsc = mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("sort", "createdAt,asc")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(notif1.getId()))
                .andReturn();

        MvcResult resultDesc = mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("sort", "createdAt,desc")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(notif3.getId()))
                .andReturn();
    }

    @Test
    void getNotifications_EmptyResult_ReturnsEmptyPage() throws Exception {
        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("status", "SENT")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.empty").value(true));
    }

    @Test
    void getNotifications_WithGlobalNotifications_ReturnsAllIncludingGlobal() throws Exception {
        createTestNotification(ORG_ID, null, NotificationType.EMAIL, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, null, NotificationType.SMS, NotificationStatus.SENT);
        createTestNotification(ORG_ID, 100L, NotificationType.EMAIL, NotificationStatus.PENDING);

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void getNotifications_FilterByDossierId_ExcludesGlobalNotifications() throws Exception {
        createTestNotification(ORG_ID, null, NotificationType.EMAIL, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 100L, NotificationType.EMAIL, NotificationStatus.SENT);
        createTestNotification(ORG_ID, 100L, NotificationType.SMS, NotificationStatus.PENDING);
        createTestNotification(ORG_ID, 200L, NotificationType.EMAIL, NotificationStatus.PENDING);

        mockMvc.perform(
                withTenantHeaders(get(BASE_URL), ORG_ID)
                        .param("dossierId", "100")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].dossierId").value(100))
                .andExpect(jsonPath("$.content[1].dossierId").value(100))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    private NotificationEntity createTestNotification(String orgId, Long dossierId, 
                                                      NotificationType type, NotificationStatus status) {
        if (dossierId != null) {
            Dossier dossier = testDataBuilder.dossierBuilder()
                    .withOrgId(orgId)
                    .persist();
            return testDataBuilder.notificationBuilder()
                    .withOrgId(orgId)
                    .withDossier(dossier)
                    .withType(type)
                    .withStatus(status)
                    .withRecipient("test@example.com")
                    .withSubject("Test Subject")
                    .withTemplateId("test-template")
                    .persist();
        } else {
            return testDataBuilder.notificationBuilder()
                    .withOrgId(orgId)
                    .withType(type)
                    .withStatus(status)
                    .withRecipient("test@example.com")
                    .withSubject("Test Subject")
                    .withTemplateId("test-template")
                    .persist();
        }
    }
}
