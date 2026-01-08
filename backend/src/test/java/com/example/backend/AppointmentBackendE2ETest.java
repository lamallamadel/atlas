package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.AppointmentCreateRequest;
import com.example.backend.dto.AppointmentUpdateRequest;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class AppointmentBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG_ID = "org123";
    private static final String USER_ID = "user123";

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private BackendE2ETestDataBuilder testDataBuilder;

    private Dossier testDossier;

    @BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        appointmentRepository.deleteAll();
        auditEventRepository.deleteAll();
        dossierRepository.deleteAll();

        testDataBuilder.withOrgId(ORG_ID);

        // Create fresh known test data
        testDossier = testDataBuilder.dossierBuilder()
                .withOrgId(ORG_ID)
                .withLeadPhone("+33612345678")
                .withLeadName("Test User")
                .withStatus(DossierStatus.NEW)
                .persist();
    }

    @AfterEach
    void tearDown() {
        testDataBuilder.deleteAllTestData();
        // Clear tenant context to prevent tenant ID leakage between tests
        com.example.backend.util.TenantContext.clear();
    }

    // ========== POST /api/v1/appointments - Create Tests ==========

    @Test
    void create_ValidRequest_Returns201WithCreatedEntity() throws Exception {
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(testDossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 15, 10, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 15, 11, 0));
        request.setLocation("123 Main St");
        request.setAssignedTo("agent@example.com");
        request.setNotes("Initial consultation");
        request.setStatus(AppointmentStatus.SCHEDULED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/appointments"), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.dossierId").value(testDossier.getId()))
                .andExpect(jsonPath("$.startTime").value("2024-06-15T10:00:00"))
                .andExpect(jsonPath("$.endTime").value("2024-06-15T11:00:00"))
                .andExpect(jsonPath("$.location").value("123 Main St"))
                .andExpect(jsonPath("$.assignedTo").value("agent@example.com"))
                .andExpect(jsonPath("$.notes").value("Initial consultation"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.warnings").doesNotExist());
    }

    @Test
    void create_EndTimeBeforeStartTime_Returns400() throws Exception {
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(testDossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 15, 11, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 15, 10, 0));
        request.setStatus(AppointmentStatus.SCHEDULED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/appointments"), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("Start time must be before end time")));
    }

    @Test
    void create_OverlappingAppointment_ReturnsCreatedWithWarning() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        // Create first appointment using testDataBuilder
        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withAssignedTo("agent@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        // Create overlapping appointment via API
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(testDossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 15, 10, 30));
        request.setEndTime(LocalDateTime.of(2024, 6, 15, 11, 30));
        request.setAssignedTo("agent@example.com");
        request.setStatus(AppointmentStatus.SCHEDULED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/appointments"), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.warnings").exists())
                .andExpect(jsonPath("$.warnings").isArray())
                .andExpect(jsonPath("$.warnings[0]").value(containsString("overlaps")))
                .andExpect(jsonPath("$.warnings[0]").value(containsString("agent@example.com")));
    }

    @Test
    void create_OverlappingAppointmentDifferentAssignee_NoWarning() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        // Create first appointment using testDataBuilder
        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withAssignedTo("agent1@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        // Create overlapping appointment with different assignee
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(testDossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 15, 10, 30));
        request.setEndTime(LocalDateTime.of(2024, 6, 15, 11, 30));
        request.setAssignedTo("agent2@example.com");
        request.setStatus(AppointmentStatus.SCHEDULED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/appointments"), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.warnings").doesNotExist());
    }

    @Test
    void create_NoAssignedTo_NoOverlapWarning() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        // Create first appointment with assignee using testDataBuilder
        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withAssignedTo("agent@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        // Create overlapping appointment without assignee
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(testDossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 15, 10, 30));
        request.setEndTime(LocalDateTime.of(2024, 6, 15, 11, 30));
        request.setStatus(AppointmentStatus.SCHEDULED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/appointments"), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.warnings").doesNotExist());
    }

    @Test
    void create_CreatesAuditTrail() throws Exception {
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(testDossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 15, 10, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 15, 11, 0));
        request.setStatus(AppointmentStatus.SCHEDULED);

        String response = mockMvc.perform(withTenantHeaders(post("/api/v1/appointments"), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long appointmentId = objectMapper.readTree(response).get("id").asLong();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.APPOINTMENT);
        assertThat(auditEvent.getEntityId()).isEqualTo(appointmentId);
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(ORG_ID);
        assertThat(auditEvent.getDiff()).isNotNull();
        assertThat(auditEvent.getDiff().get("after")).isNotNull();
    }

    // ========== PUT /{id} - Update Tests ==========

    @Test
    void update_StatusTransition_ScheduledToCompleted_Success() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStatus(AppointmentStatus.COMPLETED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appointment.getId()))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void update_StatusTransition_CompletedToCancelled_Success() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.COMPLETED)
                .persist();

        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStatus(AppointmentStatus.CANCELLED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appointment.getId()))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void update_StatusTransition_CreatesAuditTrail() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        auditEventRepository.deleteAll(); // Clear any creation audit events

        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStatus(AppointmentStatus.COMPLETED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.APPOINTMENT);
        assertThat(auditEvent.getEntityId()).isEqualTo(appointment.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(ORG_ID);
        assertThat(auditEvent.getDiff()).isNotNull();
        assertThat(auditEvent.getDiff().get("changes")).isNotNull();
    }

    @Test
    void update_MultipleStatusTransitions_CreatesMultipleAuditTrails() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        auditEventRepository.deleteAll(); // Clear creation audit

        // Transition 1: SCHEDULED -> COMPLETED
        AppointmentUpdateRequest request1 = new AppointmentUpdateRequest();
        request1.setStatus(AppointmentStatus.COMPLETED);
        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Transition 2: COMPLETED -> CANCELLED
        AppointmentUpdateRequest request2 = new AppointmentUpdateRequest();
        request2.setStatus(AppointmentStatus.CANCELLED);
        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isOk());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(2);
	final Long expectedId = appointment.getId();
        assertThat(auditEvents).allMatch(event -> event.getAction() == AuditAction.UPDATED);
        assertThat(auditEvents).allMatch(event -> event.getEntityId().equals(expectedId));
    }

    @Test
    void update_WithOverlap_ReturnsWarning() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        // Create first appointment
        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 14, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 15, 0))
                .withAssignedTo("agent@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        // Create second appointment
        AppointmentEntity appointment2 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withAssignedTo("agent@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        // Update second appointment to overlap with first
        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStartTime(LocalDateTime.of(2024, 6, 15, 14, 30));
        request.setEndTime(LocalDateTime.of(2024, 6, 15, 15, 30));

        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment2.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.warnings").exists())
                .andExpect(jsonPath("$.warnings").isArray())
                .andExpect(jsonPath("$.warnings[0]").value(containsString("overlaps")));
    }

    // ========== GET /api/v1/appointments - Filter Tests ==========

    @Test
    void list_FilterByFromDate_ReturnsOnlyAppointmentsAfterDate() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        // Create appointments at different times
        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 10, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 10, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        AppointmentEntity appointment2 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 20, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 20, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("from", "2024-06-15T00:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(appointment2.getId()));
    }

    @Test
    void list_FilterByToDate_ReturnsOnlyAppointmentsBeforeDate() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment1 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 10, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 10, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 20, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 20, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("to", "2024-06-15T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(appointment1.getId()));
    }

    @Test
    void list_FilterByDateRange_ReturnsAppointmentsInRange() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 5, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 5, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        AppointmentEntity appointment2 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 25, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 25, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("from", "2024-06-10T00:00:00")
                        .param("to", "2024-06-20T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(appointment2.getId()));
    }

    @Test
    void list_FilterByStatus_ReturnsOnlyMatchingStatus() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity scheduled = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 16, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 16, 11, 0))
                .withStatus(AppointmentStatus.COMPLETED)
                .persist();

        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 17, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 17, 11, 0))
                .withStatus(AppointmentStatus.CANCELLED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("status", "SCHEDULED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(scheduled.getId()))
                .andExpect(jsonPath("$.content[0].status").value("SCHEDULED"));
    }

    @Test
    void list_FilterByAssignedTo_ReturnsOnlyMatchingAssignee() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment1 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withAssignedTo("agent1@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 16, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 16, 11, 0))
                .withAssignedTo("agent2@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("assignedTo", "agent1@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(appointment1.getId()))
                .andExpect(jsonPath("$.content[0].assignedTo").value("agent1@example.com"));
    }

    @Test
    void list_FilterByDossierId_ReturnsOnlyAppointmentsForDossier() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        Dossier dossier2 = testDataBuilder.dossierBuilder()
                .withOrgId(ORG_ID)
                .withLeadPhone("+33698765432")
                .withLeadName("Another User")
                .withStatus(DossierStatus.NEW)
                .persist();

        AppointmentEntity appointment1 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        testDataBuilder.appointmentBuilder()
                .withDossier(dossier2)
                .withStartTime(LocalDateTime.of(2024, 6, 16, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 16, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("dossierId", testDossier.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(appointment1.getId()));
    }

    @Test
    void list_WithPagination_ReturnsCorrectPage() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        // Create 5 appointments
        for (int i = 0; i < 5; i++) {
            testDataBuilder.appointmentBuilder()
                    .withDossier(testDossier)
                    .withStartTime(LocalDateTime.of(2024, 6, 15 + i, 10, 0))
                    .withEndTime(LocalDateTime.of(2024, 6, 15 + i, 11, 0))
                    .withStatus(AppointmentStatus.SCHEDULED)
                    .persist();
        }

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0));

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.number").value(1));
    }

    @Test
    void list_MultipleFilters_AppliesAllFilters() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        // Create various appointments
        AppointmentEntity target = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withAssignedTo("agent@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        // Different assignee
        testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 14, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 15, 0))
                .withAssignedTo("other@example.com")
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/appointments"), ORG_ID)
                        .param("assignedTo", "agent@example.com")
                        .param("status", "SCHEDULED")
                        .param("from", "2024-06-10T00:00:00")
                        .param("to", "2024-06-20T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(target.getId()));
    }

    // ========== DELETE /{id} - ADMIN only Tests ==========

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_AsAdmin_Returns204() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(delete("/api/v1/appointments/" + appointment.getId()), ORG_ID))
                .andExpect(status().isNoContent());

        assertThat(appointmentRepository.findById(appointment.getId())).isEmpty();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void delete_AsPro_Returns403() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        mockMvc.perform(withTenantHeaders(delete("/api/v1/appointments/" + appointment.getId()), ORG_ID))
                .andExpect(status().isForbidden());

        assertThat(appointmentRepository.findById(appointment.getId())).isPresent();
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_CreatesAuditTrail() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        auditEventRepository.deleteAll(); // Clear creation audit

        mockMvc.perform(withTenantHeaders(delete("/api/v1/appointments/" + appointment.getId()), ORG_ID))
                .andExpect(status().isNoContent());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.APPOINTMENT);
        assertThat(auditEvent.getEntityId()).isEqualTo(appointment.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(auditEvent.getOrgId()).isEqualTo(ORG_ID);
        assertThat(auditEvent.getDiff()).isNotNull();
        assertThat(auditEvent.getDiff().get("before")).isNotNull();
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_NonExistingAppointment_Returns404() throws Exception {
        mockMvc.perform(withTenantHeaders(delete("/api/v1/appointments/999999"), ORG_ID))
                .andExpect(status().isNotFound());
    }

    // ========== Audit Trail Tests ==========

    @Test
    void auditTrail_TracksAllStatusTransitions() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        auditEventRepository.deleteAll();

        // Transition 1: SCHEDULED -> COMPLETED
        AppointmentUpdateRequest request1 = new AppointmentUpdateRequest();
        request1.setStatus(AppointmentStatus.COMPLETED);
        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Transition 2: COMPLETED -> CANCELLED
        AppointmentUpdateRequest request2 = new AppointmentUpdateRequest();
        request2.setStatus(AppointmentStatus.CANCELLED);
        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isOk());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(2);

        // Verify both transitions are tracked
        assertThat(auditEvents).allMatch(event -> 
                event.getEntityType() == AuditEntityType.APPOINTMENT &&
                event.getEntityId().equals(appointment.getId()) &&
                event.getAction() == AuditAction.UPDATED
        );
    }

    @Test
    void auditTrail_DifferentAppointments_TrackedSeparately() throws Exception {
        testDataBuilder.withOrgId(ORG_ID);
        
        AppointmentEntity appointment1 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 15, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 15, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        AppointmentEntity appointment2 = testDataBuilder.appointmentBuilder()
                .withDossier(testDossier)
                .withStartTime(LocalDateTime.of(2024, 6, 16, 10, 0))
                .withEndTime(LocalDateTime.of(2024, 6, 16, 11, 0))
                .withStatus(AppointmentStatus.SCHEDULED)
                .persist();

        auditEventRepository.deleteAll();

        // Update both appointments
        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStatus(AppointmentStatus.COMPLETED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment1.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(withTenantHeaders(put("/api/v1/appointments/" + appointment2.getId()), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(2);

        // Verify each appointment has its own audit trail
        long count1 = auditEvents.stream()
                .filter(event -> event.getEntityId().equals(appointment1.getId()))
                .count();
        long count2 = auditEvents.stream()
                .filter(event -> event.getEntityId().equals(appointment2.getId()))
                .count();

        assertThat(count1).isEqualTo(1);
        assertThat(count2).isEqualTo(1);
    }
}
