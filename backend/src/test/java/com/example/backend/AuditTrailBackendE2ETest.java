package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.*;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.enums.*;
import com.example.backend.repository.*;
import com.example.backend.service.*;
import com.example.backend.util.TenantContext;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class AuditTrailBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG_1 = "org-audit-e2e-1";
    private static final String ORG_2 = "org-audit-e2e-2";

    @Autowired
    private DossierService dossierService;

    @Autowired
    private PartiePrenanteService partiePrenanteService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AnnonceService annonceService;

    @Autowired
    private ConsentementService consentementService;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private PartiePrenanteRepository partiePrenanteRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private ConsentementRepository consentementRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Autowired
    private BackendE2ETestDataBuilder testDataBuilder;

    @BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        auditEventRepository.deleteAll();
        activityRepository.deleteAll();
        consentementRepository.deleteAll();
        appointmentRepository.deleteAll();
        messageRepository.deleteAll();
        partiePrenanteRepository.deleteAll();
        annonceRepository.deleteAll();
        dossierRepository.deleteAll();
        testDataBuilder.deleteAllTestData();
    }

    @AfterEach
    void tearDown() {
        // Clear tenant context to prevent tenant ID leakage between tests
        TenantContext.clear();
        testDataBuilder.deleteAllTestData();
    }

    // ========== Dossier CRUD Tests ==========

    @Test
    void dossierCreate_CreatesAuditEventWithCorrectEntityTypeAndAction() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("John Doe");
        request.setLeadPhone("+33612345678");
        request.setLeadSource("Website");

        DossierResponse dossier = dossierService.create(request);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(auditEvent.getEntityId()).isEqualTo(dossier.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(ORG_1);

        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("after");
        assertThat(diff).doesNotContainKey("before");
        assertThat(diff).doesNotContainKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData.get("id")).isEqualTo(dossier.getId().intValue());
        assertThat(afterData.get("leadName")).isEqualTo("John Doe");
        assertThat(afterData.get("leadPhone")).isEqualTo("+33612345678");
        assertThat(afterData.get("status")).isEqualTo("NEW");
    }

    @Test
    void dossierUpdate_CreatesAuditEventWithDiffCalculation() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Original Name");
        createRequest.setLeadPhone("+33600000001");
        DossierResponse dossier = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        DossierLeadPatchRequest updateRequest = new DossierLeadPatchRequest();
        updateRequest.setLeadName("Updated Name");
        updateRequest.setLeadPhone("+33600000002");
        dossierService.patchLead(dossier.getId(), updateRequest);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(auditEvent.getEntityId()).isEqualTo(dossier.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);

        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("changes");
        assertThat(diff).doesNotContainKey("after");
        assertThat(diff).doesNotContainKey("before");

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("leadName");
        assertThat(changes).containsKey("leadPhone");

        @SuppressWarnings("unchecked")
        Map<String, Object> nameChange = (Map<String, Object>) changes.get("leadName");
        assertThat(nameChange.get("before")).isEqualTo("Original Name");
        assertThat(nameChange.get("after")).isEqualTo("Updated Name");

        @SuppressWarnings("unchecked")
        Map<String, Object> phoneChange = (Map<String, Object>) changes.get("leadPhone");
        assertThat(phoneChange.get("before")).isEqualTo("+33600000001");
        assertThat(phoneChange.get("after")).isEqualTo("+33600000002");
    }

    @Test
    void dossierDelete_CreatesAuditEventWithBeforeState() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("To Be Deleted");
        createRequest.setLeadPhone("+33611111111");
        DossierResponse dossier = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        dossierService.delete(dossier.getId());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(auditEvent.getEntityId()).isEqualTo(dossier.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.DELETED);

        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("before");
        assertThat(diff).doesNotContainKey("after");
        assertThat(diff).doesNotContainKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> beforeData = (Map<String, Object>) diff.get("before");
        assertThat(beforeData.get("id")).isEqualTo(dossier.getId().intValue());
        assertThat(beforeData.get("leadName")).isEqualTo("To Be Deleted");
    }

    // ========== PartiePrenanteEntity CRUD Tests ==========

    @Test
    void partiePrenante_CRUDOperations_CreateProperAuditEvents() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Test Dossier");
        DossierResponse dossier = dossierService.create(dossierRequest);
        auditEventRepository.deleteAll();

        PartiePrenanteCreateRequest createRequest = new PartiePrenanteCreateRequest();
        createRequest.setDossierId(dossier.getId());
        createRequest.setRole("BUYER");
        createRequest.setFirstName("Jane");
        createRequest.setLastName("Smith");
        createRequest.setEmail("jane@example.com");
        PartiePrenanteResponse party = partiePrenanteService.create(createRequest);

        List<AuditEventEntity> createEvents = auditEventRepository.findAll();
        assertThat(createEvents).hasSize(1);
        assertThat(createEvents.get(0).getEntityType()).isEqualTo(AuditEntityType.PARTIE_PRENANTE);
        assertThat(createEvents.get(0).getEntityId()).isEqualTo(party.getId());
        assertThat(createEvents.get(0).getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(createEvents.get(0).getDiff()).containsKey("after");

        auditEventRepository.deleteAll();

        PartiePrenanteUpdateRequest updateRequest = new PartiePrenanteUpdateRequest();
        updateRequest.setFirstName("Janet");
        updateRequest.setLastName("Smith");
        updateRequest.setPhone("123456789");
        updateRequest.setEmail("janet@example.com");
        partiePrenanteService.update(party.getId(), updateRequest);

        List<AuditEventEntity> updateEvents = auditEventRepository.findAll();
        assertThat(updateEvents).hasSize(1);
        assertThat(updateEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) updateEvents.get(0).getDiff().get("changes");
        assertThat(changes).containsKey("firstName");
        assertThat(changes).containsKey("email");

        auditEventRepository.deleteAll();

        partiePrenanteService.delete(party.getId());

        List<AuditEventEntity> deleteEvents = auditEventRepository.findAll();
        assertThat(deleteEvents).hasSize(1);
        assertThat(deleteEvents.get(0).getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(deleteEvents.get(0).getDiff()).containsKey("before");
    }

    // ========== MessageEntity CRUD Tests ==========

    @Test
    void message_CRUDOperations_CreateProperAuditEvents() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Test Dossier");
        DossierResponse dossier = dossierService.create(dossierRequest);
        auditEventRepository.deleteAll();

        MessageCreateRequest createRequest = new MessageCreateRequest();
        createRequest.setDossierId(dossier.getId());
        createRequest.setChannel(MessageChannel.EMAIL);
        createRequest.setDirection(MessageDirection.INBOUND);
        createRequest.setContent("Hello, I'm interested");
        createRequest.setTimestamp(LocalDateTime.now());
        MessageResponse message = messageService.create(createRequest);

        List<AuditEventEntity> createEvents = auditEventRepository.findAll();
        assertThat(createEvents).hasSize(1);
        assertThat(createEvents.get(0).getEntityType()).isEqualTo(AuditEntityType.MESSAGE);
        assertThat(createEvents.get(0).getEntityId()).isEqualTo(message.getId());
        assertThat(createEvents.get(0).getAction()).isEqualTo(AuditAction.CREATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) createEvents.get(0).getDiff().get("after");
        assertThat(afterData.get("content")).isEqualTo("Hello, I'm interested");
        assertThat(afterData.get("channel")).isEqualTo("EMAIL");
        assertThat(afterData.get("direction")).isEqualTo("INBOUND");

        auditEventRepository.deleteAll();

        messageService.delete(message.getId());

        List<AuditEventEntity> deleteEvents = auditEventRepository.findAll();
        assertThat(deleteEvents).hasSize(1);
        assertThat(deleteEvents.get(0).getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(deleteEvents.get(0).getDiff()).containsKey("before");
    }

    // ========== AppointmentEntity CRUD Tests ==========

    @Test
    void appointment_CRUDOperations_CreateProperAuditEvents() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Test Dossier");
        DossierResponse dossier = dossierService.create(dossierRequest);
        auditEventRepository.deleteAll();

        AppointmentCreateRequest createRequest = new AppointmentCreateRequest();
        createRequest.setDossierId(dossier.getId());
        createRequest.setStartTime(LocalDateTime.now().plusDays(1));
        createRequest.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        createRequest.setLocation("123 Main Street");
        createRequest.setStatus(AppointmentStatus.SCHEDULED);
        AppointmentResponse appointment = appointmentService.create(createRequest);

        List<AuditEventEntity> createEvents = auditEventRepository.findAll();
        assertThat(createEvents).hasSize(1);
        assertThat(createEvents.get(0).getEntityType()).isEqualTo(AuditEntityType.APPOINTMENT);
        assertThat(createEvents.get(0).getEntityId()).isEqualTo(appointment.getId());
        assertThat(createEvents.get(0).getAction()).isEqualTo(AuditAction.CREATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) createEvents.get(0).getDiff().get("after");
        assertThat(afterData.get("location")).isEqualTo("123 Main Street");
        assertThat(afterData.get("status")).isEqualTo("SCHEDULED");

        auditEventRepository.deleteAll();

        AppointmentUpdateRequest updateRequest = new AppointmentUpdateRequest();
        updateRequest.setLocation("456 Oak Avenue");
        updateRequest.setStatus(AppointmentStatus.COMPLETED);
        appointmentService.update(appointment.getId(), updateRequest);

        List<AuditEventEntity> updateEvents = auditEventRepository.findAll();
        assertThat(updateEvents).hasSize(1);
        assertThat(updateEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) updateEvents.get(0).getDiff().get("changes");
        assertThat(changes).containsKey("location");
        assertThat(changes).containsKey("status");

        @SuppressWarnings("unchecked")
        Map<String, Object> statusChange = (Map<String, Object>) changes.get("status");
        assertThat(statusChange.get("before")).isEqualTo("SCHEDULED");
        assertThat(statusChange.get("after")).isEqualTo("COMPLETED");

        auditEventRepository.deleteAll();

        appointmentService.delete(appointment.getId());

        List<AuditEventEntity> deleteEvents = auditEventRepository.findAll();
        assertThat(deleteEvents).hasSize(1);
        assertThat(deleteEvents.get(0).getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(deleteEvents.get(0).getDiff()).containsKey("before");
    }

    // ========== Annonce CRUD Tests ==========

    @Test
    void annonce_CRUDOperations_CreateProperAuditEvents() {
        TenantContext.setOrgId(ORG_1);

        AnnonceCreateRequest createRequest = new AnnonceCreateRequest();
        createRequest.setTitle("Beautiful Apartment");
        createRequest.setDescription("2 bedroom apartment in downtown");
        createRequest.setType(AnnonceType.SALE);
        createRequest.setCity("Paris");
        createRequest.setAddress("123 Rue de Rivoli");
        createRequest.setPrice(new BigDecimal("250000"));
        createRequest.setCurrency("EUR");
        createRequest.setSurface(75.5);
        AnnonceResponse annonce = annonceService.create(createRequest);

        List<AuditEventEntity> createEvents = auditEventRepository.findAll();
        assertThat(createEvents).hasSize(1);
        assertThat(createEvents.get(0).getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(createEvents.get(0).getEntityId()).isEqualTo(annonce.getId());
        assertThat(createEvents.get(0).getAction()).isEqualTo(AuditAction.CREATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) createEvents.get(0).getDiff().get("after");
        assertThat(afterData.get("title")).isEqualTo("Beautiful Apartment");
        assertThat(afterData.get("city")).isEqualTo("Paris");
        assertThat(afterData.get("type")).isEqualTo("SALE");

        auditEventRepository.deleteAll();

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Stunning Apartment");
        updateRequest.setPrice(new BigDecimal("260000"));
        annonceService.update(annonce.getId(), updateRequest);

        List<AuditEventEntity> updateEvents = auditEventRepository.findAll();
        assertThat(updateEvents).hasSize(1);
        assertThat(updateEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) updateEvents.get(0).getDiff().get("changes");
        assertThat(changes).containsKey("title");
        assertThat(changes).containsKey("price");

        @SuppressWarnings("unchecked")
        Map<String, Object> titleChange = (Map<String, Object>) changes.get("title");
        assertThat(titleChange.get("before")).isEqualTo("Beautiful Apartment");
        assertThat(titleChange.get("after")).isEqualTo("Stunning Apartment");

        auditEventRepository.deleteAll();

        annonceService.delete(annonce.getId());

        List<AuditEventEntity> deleteEvents = auditEventRepository.findAll();
        assertThat(deleteEvents).hasSize(1);
        assertThat(deleteEvents.get(0).getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(deleteEvents.get(0).getDiff()).containsKey("before");
    }

    // ========== Consentement CRUD Tests ==========

    @Test
    void consentement_CRUDOperations_CreateProperAuditEvents() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Test Dossier");
        DossierResponse dossier = dossierService.create(dossierRequest);
        auditEventRepository.deleteAll();

        ConsentementCreateRequest createRequest = new ConsentementCreateRequest();
        createRequest.setDossierId(dossier.getId());
        createRequest.setChannel(ConsentementChannel.EMAIL);
        createRequest.setConsentType(ConsentementType.MARKETING);
        createRequest.setStatus(ConsentementStatus.GRANTED);
        ConsentementResponse consentement = consentementService.create(createRequest);

        List<AuditEventEntity> createEvents = auditEventRepository.findAll();
        assertThat(createEvents).hasSize(1);
        assertThat(createEvents.get(0).getEntityType()).isEqualTo(AuditEntityType.CONSENTEMENT);
        assertThat(createEvents.get(0).getEntityId()).isEqualTo(consentement.getId());
        assertThat(createEvents.get(0).getAction()).isEqualTo(AuditAction.CREATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) createEvents.get(0).getDiff().get("after");
        assertThat(afterData.get("channel")).isEqualTo("EMAIL");
        assertThat(afterData.get("status")).isEqualTo("GRANTED");

        auditEventRepository.deleteAll();

        ConsentementUpdateRequest updateRequest = new ConsentementUpdateRequest();
        updateRequest.setChannel(ConsentementChannel.SMS);
        updateRequest.setStatus(ConsentementStatus.REVOKED);
        consentementService.update(consentement.getId(), updateRequest);

        List<AuditEventEntity> updateEvents = auditEventRepository.findAll();
        assertThat(updateEvents).hasSize(1);
        assertThat(updateEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) updateEvents.get(0).getDiff().get("changes");
        assertThat(changes).containsKey("channel");
        assertThat(changes).containsKey("status");

        @SuppressWarnings("unchecked")
        Map<String, Object> statusChange = (Map<String, Object>) changes.get("status");
        assertThat(statusChange.get("before")).isEqualTo("GRANTED");
        assertThat(statusChange.get("after")).isEqualTo("REVOKED");
    }

    // ========== Activity CRUD Tests ==========

    @Test
    void activity_CRUDOperations_CreateProperAuditEvents() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Test Dossier");
        DossierResponse dossier = dossierService.create(dossierRequest);
        auditEventRepository.deleteAll();

        ActivityCreateRequest createRequest = new ActivityCreateRequest();
        createRequest.setDossierId(dossier.getId());
        createRequest.setType(ActivityType.NOTE);
        createRequest.setContent("Follow-up call scheduled");
        createRequest.setVisibility(ActivityVisibility.INTERNAL);
        ActivityResponse activity = activityService.create(createRequest);
        entityManager.flush();
        entityManager.clear();

        List<AuditEventEntity> createEvents = auditEventRepository.findAll();
        assertThat(createEvents).hasSize(1);

        auditEventRepository.deleteAll();

        ActivityUpdateRequest updateRequest = new ActivityUpdateRequest();
        updateRequest.setContent("Follow-up call completed");
        updateRequest.setVisibility(ActivityVisibility.CLIENT_VISIBLE);
        activityService.update(activity.getId(), updateRequest);
        entityManager.flush();
        entityManager.clear();

        List<AuditEventEntity> updateEvents = auditEventRepository.findAll();
        assertThat(updateEvents).hasSize(1);
        assertThat(updateEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);

        auditEventRepository.deleteAll();

        activityService.delete(activity.getId());
        entityManager.flush();
        entityManager.clear();

        List<AuditEventEntity> deleteEvents = auditEventRepository.findAll();
        assertThat(deleteEvents).hasSize(1);
        assertThat(deleteEvents.get(0).getAction()).isEqualTo(AuditAction.DELETED);
    }

    // ========== GET /api/v1/audit-events with entityType & entityId ==========

    @Test
    void getAuditEvents_FilterByEntityTypeAndId_ReturnsPaginatedResults() throws Exception {
        TenantContext.setOrgId(ORG_1);
        testDataBuilder.withOrgId(ORG_1);
        com.example.backend.entity.Dossier dossier = testDataBuilder.createDossierWithoutWorkflow();

        DossierStatusPatchRequest statusPatch = new DossierStatusPatchRequest();
        statusPatch.setStatus(DossierStatus.QUALIFIED);
        statusPatch.setStatusCode("CRM_QUALIFIED");
        dossierService.patchStatus(dossier.getId(), statusPatch);

        MvcResult result = mockMvc.perform(withTenantHeaders(get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", dossier.getId().toString())
                                .param("page", "0")
                                .param("size", "10") , ORG_1  ) )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        assertThat(content).contains("CREATED");
        assertThat(content).contains("UPDATED");
    }

    @Test
    void getAuditEvents_WithPagination_ReturnsCorrectPage() throws Exception {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Test Dossier");
        DossierResponse dossier = dossierService.create(createRequest);

        for (int i = 0; i < 5; i++) {
            DossierLeadPatchRequest patchRequest = new DossierLeadPatchRequest();
            patchRequest.setLeadName("Name Update " + i);
            dossierService.patchLead(dossier.getId(), patchRequest);
        }

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", dossier.getId().toString())
                                .param("page", "0")
                                .param("size", "2")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0));

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", dossier.getId().toString())
                                .param("page", "1")
                                .param("size", "2")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.number").value(1));
    }

    // ========== GET /api/v1/audit-events?dossierId aggregation ==========

    @Test
    void getAuditEvents_ByDossierId_AggregatesAllRelatedEntities() throws Exception {
        TenantContext.setOrgId(ORG_1);

        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Aggregation Test");
        DossierResponse dossier = dossierService.create(dossierRequest);

        PartiePrenanteCreateRequest partyRequest = new PartiePrenanteCreateRequest();
        partyRequest.setDossierId(dossier.getId());
        partyRequest.setRole("BUYER");
        partyRequest.setFirstName("John");
        partyRequest.setLastName("Doe");
        partyRequest.setPhone("123456789");
        partyRequest.setEmail("john.doe@example.com");
        PartiePrenanteResponse party = partiePrenanteService.create(partyRequest);

        MessageCreateRequest messageRequest = new MessageCreateRequest();
        messageRequest.setDossierId(dossier.getId());
        messageRequest.setChannel(MessageChannel.EMAIL);
        messageRequest.setDirection(MessageDirection.INBOUND);
        messageRequest.setContent("Test message");
        messageRequest.setTimestamp(LocalDateTime.now());
        MessageResponse message = messageService.create(messageRequest);

        AppointmentCreateRequest appointmentRequest = new AppointmentCreateRequest();
        appointmentRequest.setDossierId(dossier.getId());
        appointmentRequest.setStartTime(LocalDateTime.now().plusDays(1));
        appointmentRequest.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        appointmentRequest.setStatus(AppointmentStatus.SCHEDULED);
        AppointmentResponse appointment = appointmentService.create(appointmentRequest);

        MvcResult result = mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("dossierId", dossier.getId().toString())
                                .param("page", "0")
                                .param("size", "20")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        assertThat(content).contains("DOSSIER");
        assertThat(content).contains("PARTIE_PRENANTE");
        assertThat(content).contains("MESSAGE");
        assertThat(content).contains("APPOINTMENT");

        assertThat(content).contains(String.valueOf(dossier.getId()));
        assertThat(content).contains(String.valueOf(party.getId()));
        assertThat(content).contains(String.valueOf(message.getId()));
        assertThat(content).contains(String.valueOf(appointment.getId()));
    }

    @Test
    void getAuditEvents_ByDossierId_OnlyIncludesRelatedEntities() throws Exception {
        TenantContext.setOrgId(ORG_1);

        DossierCreateRequest dossier1Request = new DossierCreateRequest();
        dossier1Request.setLeadName("Dossier 1");
        DossierResponse dossier1 = dossierService.create(dossier1Request);

        DossierCreateRequest dossier2Request = new DossierCreateRequest();
        dossier2Request.setLeadName("Dossier 2");
        DossierResponse dossier2 = dossierService.create(dossier2Request);

        PartiePrenanteCreateRequest party1Request = new PartiePrenanteCreateRequest();
        party1Request.setDossierId(dossier1.getId());
        party1Request.setRole("BUYER");
        party1Request.setFirstName("Party1");
        party1Request.setLastName("Party1");
        party1Request.setPhone("123456789");
        party1Request.setEmail("party1@example.com");
        partiePrenanteService.create(party1Request);

        PartiePrenanteCreateRequest party2Request = new PartiePrenanteCreateRequest();
        party2Request.setDossierId(dossier2.getId());
        party2Request.setRole("SELLER");
        party2Request.setFirstName("Party2");
        party2Request.setLastName("Party2");
        party2Request.setPhone("123456789");
        party2Request.setEmail("party2@example.com");
        partiePrenanteService.create(party2Request);

        MvcResult result = mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("dossierId", dossier1.getId().toString())
                                .param("page", "0")
                                .param("size", "20")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        assertThat(content).contains("Dossier 1");
        assertThat(content).contains("Party1");
        assertThat(content).doesNotContain("Dossier 2");
        assertThat(content).doesNotContain("Party2");
    }

    // ========== Tenant Isolation Tests ==========

    @Test
    void getAuditEvents_IsolatesByOrgId_OnlyReturnsOwnData() throws Exception {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest org1Request = new DossierCreateRequest();
        org1Request.setLeadName("ORG1 Dossier");
        DossierResponse org1Dossier = dossierService.create(org1Request);

        TenantContext.setOrgId(ORG_2);
        DossierCreateRequest org2Request = new DossierCreateRequest();
        org2Request.setLeadName("ORG2 Dossier");
        DossierResponse org2Dossier = dossierService.create(org2Request);

        MvcResult org1Result = mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", org1Dossier.getId().toString())
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andReturn();

        String org1Content = org1Result.getResponse().getContentAsString();
        assertThat(org1Content).contains("ORG1 Dossier");
        assertThat(org1Content).doesNotContain("ORG2 Dossier");

        MvcResult org2Result = mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", org2Dossier.getId().toString())
                                ,
                        ORG_2
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andReturn();

        String org2Content = org2Result.getResponse().getContentAsString();
        assertThat(org2Content).contains("ORG2 Dossier");
        assertThat(org2Content).doesNotContain("ORG1 Dossier");
    }

    @Test
    void getAuditEvents_CrossTenantQuery_ReturnsEmpty() throws Exception {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest org1Request = new DossierCreateRequest();
        org1Request.setLeadName("ORG1 Dossier");
        DossierResponse org1Dossier = dossierService.create(org1Request);

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", org1Dossier.getId().toString())
                                ,
                        ORG_2
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void getAuditEvents_DossierIdQuery_IsolatesByOrgId() throws Exception {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("ORG1 Dossier");
        DossierResponse dossier = dossierService.create(dossierRequest);

        PartiePrenanteCreateRequest partyRequest = new PartiePrenanteCreateRequest();
        partyRequest.setDossierId(dossier.getId());
        partyRequest.setRole("BUYER");
        partyRequest.setFirstName("John");
        partyRequest.setLastName("Doe");
        partyRequest.setPhone("123456789");
        partyRequest.setEmail("john.doe@example.com");
        partiePrenanteService.create(partyRequest);

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("dossierId", dossier.getId().toString())
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("dossierId", dossier.getId().toString())
                                ,
                        ORG_2
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    // ========== Diff Accuracy Tests ==========

    @Test
    void auditDiff_ForUpdate_AccuratelyTracksChanges() {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Original");
        createRequest.setLeadPhone("+33600000000");
        createRequest.setLeadSource("Web");
        createRequest.setScore(50);
        DossierResponse dossier = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        DossierLeadPatchRequest updateRequest = new DossierLeadPatchRequest();
        updateRequest.setLeadName("Updated");
        updateRequest.setLeadPhone("+33611111111");
        dossierService.patchLead(dossier.getId(), updateRequest);

        List<AuditEventEntity> events = auditEventRepository.findAll();
        assertThat(events).hasSize(1);

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) events.get(0).getDiff().get("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> nameChange = (Map<String, Object>) changes.get("leadName");
        assertThat(nameChange.get("before")).isEqualTo("Original");
        assertThat(nameChange.get("after")).isEqualTo("Updated");

        @SuppressWarnings("unchecked")
        Map<String, Object> phoneChange = (Map<String, Object>) changes.get("leadPhone");
        assertThat(phoneChange.get("before")).isEqualTo("+33600000000");
        assertThat(phoneChange.get("after")).isEqualTo("+33611111111");

        assertThat(changes).doesNotContainKey("leadSource");
        assertThat(changes).doesNotContainKey("score");
    }

    @Test
    void auditDiff_ForCreate_ContainsCompleteAfterSnapshot() {
        TenantContext.setOrgId(ORG_1);
        PartiePrenanteCreateRequest createRequest = new PartiePrenanteCreateRequest();
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Test");
        DossierResponse dossier = dossierService.create(dossierRequest);
        auditEventRepository.deleteAll();

        createRequest.setDossierId(dossier.getId());
        createRequest.setRole("BUYER");
        createRequest.setFirstName("John");
        createRequest.setLastName("Doe");
        createRequest.setEmail("john@example.com");
        createRequest.setPhone("+33612345678");

        PartiePrenanteResponse party = partiePrenanteService.create(createRequest);

        List<AuditEventEntity> events = auditEventRepository.findAll();
        assertThat(events).hasSize(1);

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) events.get(0).getDiff().get("after");

        assertThat(afterData.get("id")).isEqualTo(party.getId().intValue());
        assertThat(afterData.get("firstName")).isEqualTo("John");
        assertThat(afterData.get("lastName")).isEqualTo("Doe");
        assertThat(afterData.get("email")).isEqualTo("john@example.com");
        assertThat(afterData.get("phone")).isEqualTo("+33612345678");
        assertThat(afterData.get("role")).isEqualTo("BUYER");
    }

    @Test
    void auditDiff_ForDelete_ContainsCompleteBeforeSnapshot() {
        TenantContext.setOrgId(ORG_1);
        AppointmentCreateRequest createRequest = new AppointmentCreateRequest();
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Test");
        DossierResponse dossier = dossierService.create(dossierRequest);

        createRequest.setDossierId(dossier.getId());
        createRequest.setStartTime(LocalDateTime.now().plusDays(1));
        createRequest.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));
        createRequest.setLocation("Office Building");
        createRequest.setNotes("Important meeting");
        createRequest.setStatus(AppointmentStatus.SCHEDULED);
        AppointmentResponse appointment = appointmentService.create(createRequest);
        auditEventRepository.deleteAll();

        appointmentService.delete(appointment.getId());

        List<AuditEventEntity> events = auditEventRepository.findAll();
        assertThat(events).hasSize(1);

        @SuppressWarnings("unchecked")
        Map<String, Object> beforeData = (Map<String, Object>) events.get(0).getDiff().get("before");

        assertThat(beforeData.get("id")).isEqualTo(appointment.getId().intValue());
        assertThat(beforeData.get("location")).isEqualTo("Office Building");
        assertThat(beforeData.get("notes")).isEqualTo("Important meeting");
        assertThat(beforeData.get("status")).isEqualTo("SCHEDULED");
    }

    @Test
    void auditDiff_MultipleFieldChanges_AccuratelyTracksAllChanges() {
        TenantContext.setOrgId(ORG_1);

        AnnonceCreateRequest createRequest = new AnnonceCreateRequest();
        createRequest.setTitle("Original Title");
        createRequest.setDescription("Original Description");
        createRequest.setType(AnnonceType.SALE);
        createRequest.setCity("Paris");
        createRequest.setPrice(new BigDecimal("100000"));
        createRequest.setSurface(50.0);
        AnnonceResponse annonce = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(new BigDecimal("120000"));
        updateRequest.setSurface(55.0);
        annonceService.update(annonce.getId(), updateRequest);

        List<AuditEventEntity> events = auditEventRepository.findAll();
        assertThat(events).hasSize(1);

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) events.get(0).getDiff().get("changes");

        assertThat(changes).containsKey("title");
        assertThat(changes).containsKey("price");
        assertThat(changes).containsKey("surface");
        assertThat(changes).doesNotContainKey("description");
        assertThat(changes).doesNotContainKey("city");

        @SuppressWarnings("unchecked")
        Map<String, Object> titleChange = (Map<String, Object>) changes.get("title");
        assertThat(titleChange.get("before")).isEqualTo("Original Title");
        assertThat(titleChange.get("after")).isEqualTo("Updated Title");
    }

    // ========== Sorting Tests ==========

    @Test
    void getAuditEvents_DefaultSorting_OrdersByCreatedAtDesc() throws Exception {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Test");
        DossierResponse dossier = dossierService.create(createRequest);

        for (int i = 0; i < 3; i++) {
            DossierLeadPatchRequest patchRequest = new DossierLeadPatchRequest();
            patchRequest.setLeadName("Update " + i);
            dossierService.patchLead(dossier.getId(), patchRequest);
            Thread.sleep(10);
        }

        MvcResult result = mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", dossier.getId().toString())
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].action").value("UPDATED"))
                .andExpect(jsonPath("$.content[3].action").value("CREATED"))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        int firstUpdateIndex = content.indexOf("Update 2");
        int lastUpdateIndex = content.lastIndexOf("Update 0");
        assertThat(firstUpdateIndex).isLessThan(lastUpdateIndex);
    }

    @Test
    void getAuditEvents_WithCustomSorting_RespectsParameter() throws Exception {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Test");
        DossierResponse dossier = dossierService.create(createRequest);

        for (int i = 0; i < 2; i++) {
            DossierLeadPatchRequest patchRequest = new DossierLeadPatchRequest();
            patchRequest.setLeadName("Update " + i);
            dossierService.patchLead(dossier.getId(), patchRequest);
        }

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", dossier.getId().toString())
                                .param("sort", "createdAt,asc")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].action").value("CREATED"));
    }

    // ========== Error Cases ==========

    @Test
    void getAuditEvents_WithoutRequiredParams_ReturnsBadRequest() throws Exception {
        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAuditEvents_WithOnlyEntityType_ReturnsBadRequest() throws Exception {
        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAuditEvents_WithOnlyEntityId_ReturnsBadRequest() throws Exception {
        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityId", "123")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isBadRequest());
    }

    // ========== All Entity Types CRUD Coverage ==========

    @Test
    void allEntityTypes_CRUD_GenerateCorrectAuditEvents() {
        TenantContext.setOrgId(ORG_1);

        DossierCreateRequest dossierReq = new DossierCreateRequest();
        dossierReq.setLeadName("Test");
        DossierResponse dossier = dossierService.create(dossierReq);

        PartiePrenanteCreateRequest partyReq = new PartiePrenanteCreateRequest();
        partyReq.setDossierId(dossier.getId());
        partyReq.setRole("BUYER");
        partyReq.setFirstName("Test");
        partyReq.setLastName("Test");
        partyReq.setPhone("123456789");
        partyReq.setEmail("test@example.com");
        partiePrenanteService.create(partyReq);

        MessageCreateRequest msgReq = new MessageCreateRequest();
        msgReq.setDossierId(dossier.getId());
        msgReq.setChannel(MessageChannel.EMAIL);
        msgReq.setDirection(MessageDirection.INBOUND);
        msgReq.setContent("Test");
        msgReq.setTimestamp(LocalDateTime.now());
        messageService.create(msgReq);

        AppointmentCreateRequest apptReq = new AppointmentCreateRequest();
        apptReq.setDossierId(dossier.getId());
        apptReq.setStartTime(LocalDateTime.now().plusDays(1));
        apptReq.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        apptReq.setStatus(AppointmentStatus.SCHEDULED);
        appointmentService.create(apptReq);

        AnnonceCreateRequest annonceReq = new AnnonceCreateRequest();
        annonceReq.setTitle("Test Annonce");
        annonceReq.setType(AnnonceType.SALE);
        annonceReq.setCity("Paris");
        annonceService.create(annonceReq);

        ConsentementCreateRequest consentReq = new ConsentementCreateRequest();
        consentReq.setDossierId(dossier.getId());
        consentReq.setChannel(ConsentementChannel.EMAIL);
        consentReq.setConsentType(ConsentementType.MARKETING);
        consentReq.setStatus(ConsentementStatus.GRANTED);
        consentementService.create(consentReq);

        List<AuditEventEntity> allEvents = auditEventRepository.findAll();
        assertThat(allEvents).hasSizeGreaterThanOrEqualTo(6);

        List<AuditEntityType> entityTypes = allEvents.stream()
                .map(AuditEventEntity::getEntityType)
                .distinct()
                .toList();

        assertThat(entityTypes).contains(
                AuditEntityType.DOSSIER,
                AuditEntityType.PARTIE_PRENANTE,
                AuditEntityType.MESSAGE,
                AuditEntityType.APPOINTMENT,
                AuditEntityType.ANNONCE,
                AuditEntityType.CONSENTEMENT
        );

        for (AuditEventEntity event : allEvents) {
            assertThat(event.getEntityType()).isNotNull();
            assertThat(event.getEntityId()).isNotNull();
            assertThat(event.getAction()).isIn(AuditAction.CREATED, AuditAction.UPDATED, AuditAction.DELETED);
            assertThat(event.getOrgId()).isEqualTo(ORG_1);
            assertThat(event.getDiff()).isNotNull();
        }
    }

    @Test
    void dossierWithAllRelatedEntities_AggregatesCorrectly() throws Exception {
        TenantContext.setOrgId(ORG_1);

        DossierCreateRequest dossierReq = new DossierCreateRequest();
        dossierReq.setLeadName("Complete Dossier");
        DossierResponse dossier = dossierService.create(dossierReq);

        PartiePrenanteCreateRequest partyReq = new PartiePrenanteCreateRequest();
        partyReq.setDossierId(dossier.getId());
        partyReq.setRole("BUYER");
        partyReq.setFirstName("Buyer");
        partyReq.setLastName("Buyer");
        partyReq.setPhone("123456789");
        partyReq.setEmail("buyer@example.com");
        partiePrenanteService.create(partyReq);

        MessageCreateRequest msgReq = new MessageCreateRequest();
        msgReq.setDossierId(dossier.getId());
        msgReq.setChannel(MessageChannel.WHATSAPP);
        msgReq.setDirection(MessageDirection.OUTBOUND);
        msgReq.setContent("Hello");
        msgReq.setTimestamp(LocalDateTime.now());
        messageService.create(msgReq);

        AppointmentCreateRequest apptReq = new AppointmentCreateRequest();
        apptReq.setDossierId(dossier.getId());
        apptReq.setStartTime(LocalDateTime.now().plusDays(2));
        apptReq.setEndTime(LocalDateTime.now().plusDays(2).plusHours(1));
        apptReq.setStatus(AppointmentStatus.SCHEDULED);
        appointmentService.create(apptReq);

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("dossierId", dossier.getId().toString())
                                .param("page", "0")
                                .param("size", "50")
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.content[?(@.entityType == 'DOSSIER')]").exists())
                .andExpect(jsonPath("$.content[?(@.entityType == 'PARTIE_PRENANTE')]").exists())
                .andExpect(jsonPath("$.content[?(@.entityType == 'MESSAGE')]").exists())
                .andExpect(jsonPath("$.content[?(@.entityType == 'APPOINTMENT')]").exists());
    }

    @Test
    void tenantIsolation_VerifiedAcrossAllQueries() throws Exception {
        TenantContext.setOrgId(ORG_1);
        DossierCreateRequest org1DossierReq = new DossierCreateRequest();
        org1DossierReq.setLeadName("ORG1 Dossier");
        DossierResponse org1Dossier = dossierService.create(org1DossierReq);

        AnnonceCreateRequest org1AnnonceReq = new AnnonceCreateRequest();
        org1AnnonceReq.setTitle("ORG1 Annonce");
        org1AnnonceReq.setType(AnnonceType.RENT);
        org1AnnonceReq.setCity("Lyon");
        AnnonceResponse org1Annonce = annonceService.create(org1AnnonceReq);

        TenantContext.setOrgId(ORG_2);
        DossierCreateRequest org2DossierReq = new DossierCreateRequest();
        org2DossierReq.setLeadName("ORG2 Dossier");
        DossierResponse org2Dossier = dossierService.create(org2DossierReq);

        AnnonceCreateRequest org2AnnonceReq = new AnnonceCreateRequest();
        org2AnnonceReq.setTitle("ORG2 Annonce");
        org2AnnonceReq.setType(AnnonceType.SALE);
        org2AnnonceReq.setCity("Marseille");
        AnnonceResponse org2Annonce = annonceService.create(org2AnnonceReq);

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", org1Dossier.getId().toString())
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "ANNONCE")
                                .param("entityId", org2Annonce.getId().toString())
                               ,
                        ORG_1
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(
                withTenantHeaders(
                        get("/api/v1/audit-events")
                                .param("entityType", "DOSSIER")
                                .param("entityId", org2Dossier.getId().toString())
                                ,
                        ORG_2
                )
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }
}
