package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.*;
import com.example.backend.entity.enums.*;
import com.fasterxml.jackson.core.type.TypeReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class CompleteWorkflowBackendE2ETest extends BaseBackendE2ETest {

    private static final String TENANT_ID = "org-e2e-test";

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        // This test creates its own data per test
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        // Clear tenant context to prevent tenant ID leakage between tests
        com.example.backend.util.TenantContext.clear();
    }

    @Test
    void fullPipeline_CreateAnnonceAndDossierWithMessagesAndAppointments_GeneratesAuditEvents() throws Exception {
        AnnonceCreateRequest annonceRequest = new AnnonceCreateRequest();
        annonceRequest.setTitle("Beautiful Apartment in Paris");
        annonceRequest.setDescription("3 bedroom apartment with great view");
        annonceRequest.setCategory("Apartment");
        annonceRequest.setType(AnnonceType.SALE);
        annonceRequest.setAddress("123 Rue de la Paix");
        annonceRequest.setCity("Paris");
        annonceRequest.setSurface(85.5);
        annonceRequest.setPrice(BigDecimal.valueOf(450000));
        annonceRequest.setCurrency("EUR");
        annonceRequest.setStatus(AnnonceStatus.ACTIVE);

        MvcResult annonceResult = mockMvc.perform(
                withTenantHeaders(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(annonceRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        AnnonceResponse annonceResponse = objectMapper.readValue(
                annonceResult.getResponse().getContentAsString(),
                AnnonceResponse.class);
        Long annonceId = annonceResponse.getId();

        assertThat(annonceId).isNotNull();
        assertThat(annonceResponse.getStatus()).isEqualTo(AnnonceStatus.ACTIVE);

        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setAnnonceId(annonceId);
        dossierRequest.setLeadPhone("+33612345678");
        dossierRequest.setLeadName("Jean Dupont");
        dossierRequest.setLeadSource("Website");
        dossierRequest.setScore(75);
        dossierRequest.setSource(DossierSource.WEB);

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setFirstName("Jean");
        initialParty.setLastName("Dupont");
        initialParty.setPhone("+33612345678");
        initialParty.setEmail("jean.dupont@example.com");
        dossierRequest.setInitialParty(initialParty);

        MvcResult dossierResult = mockMvc.perform(
                withTenantHeaders(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dossierRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.annonceId").value(annonceId))
                .andExpect(jsonPath("$.status").value("NEW"))
                .andReturn();

        DossierResponse dossierResponse = objectMapper.readValue(
                dossierResult.getResponse().getContentAsString(),
                DossierResponse.class);
        Long dossierId = dossierResponse.getId();

        assertThat(dossierId).isNotNull();
        assertThat(dossierResponse.getAnnonceId()).isEqualTo(annonceId);
        assertThat(dossierResponse.getStatus()).isEqualTo(DossierStatus.NEW);
        assertThat(dossierResponse.getParties()).hasSize(1);

        Long partyId = dossierResponse.getParties().get(0).getId();

        MessageCreateRequest messageRequest = new MessageCreateRequest();
        messageRequest.setDossierId(dossierId);
        messageRequest.setChannel(MessageChannel.EMAIL);
        messageRequest.setDirection(MessageDirection.INBOUND);
        messageRequest.setContent("I am interested in viewing this property");
        messageRequest.setTimestamp(LocalDateTime.now());

        MvcResult messageResult = mockMvc.perform(
                withTenantHeaders(post("/api/v1/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(messageRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.dossierId").value(dossierId))
                .andReturn();

        MessageResponse messageResponse = objectMapper.readValue(
                messageResult.getResponse().getContentAsString(),
                MessageResponse.class);
        Long messageId = messageResponse.getId();

        AppointmentCreateRequest appointmentRequest = new AppointmentCreateRequest();
        appointmentRequest.setDossierId(dossierId);
        appointmentRequest.setStartTime(LocalDateTime.now().plusDays(2));
        appointmentRequest.setEndTime(LocalDateTime.now().plusDays(2).plusHours(1));
        appointmentRequest.setLocation("Property Address");
        appointmentRequest.setAssignedTo("Agent Smith");
        appointmentRequest.setStatus(AppointmentStatus.SCHEDULED);

        mockMvc.perform(
                withTenantHeaders(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointmentRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.dossierId").value(dossierId));

        DossierStatusPatchRequest statusPatchToAppointment = new DossierStatusPatchRequest();
        statusPatchToAppointment.setStatus(DossierStatus.APPOINTMENT);
        statusPatchToAppointment.setUserId("agent-001");
        statusPatchToAppointment.setReason("Appointment scheduled");

        mockMvc.perform(
                withTenantHeaders(patch("/api/v1/dossiers/" + dossierId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusPatchToAppointment)), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dossierId))
                .andExpect(jsonPath("$.status").value("APPOINTMENT"));

        DossierStatusPatchRequest statusPatchToWon = new DossierStatusPatchRequest();
        statusPatchToWon.setStatus(DossierStatus.WON);
        statusPatchToWon.setUserId("agent-001");
        statusPatchToWon.setReason("Client signed the contract");

        mockMvc.perform(
                withTenantHeaders(patch("/api/v1/dossiers/" + dossierId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusPatchToWon)), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dossierId))
                .andExpect(jsonPath("$.status").value("WON"));

        MvcResult annonceAuditResult = mockMvc.perform(
                withTenantHeaders(get("/api/v1/audit-events")
                        .param("entityType", "ANNONCE")
                        .param("entityId", annonceId.toString())
                        .param("page", "0")
                        .param("size", "10"), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andReturn();

        String annonceAuditContent = annonceAuditResult.getResponse().getContentAsString();
        List<AuditEventResponse> annonceAuditEvents = objectMapper.readValue(
                objectMapper.readTree(annonceAuditContent).get("content").toString(),
                new TypeReference<List<AuditEventResponse>>() {});

        assertThat(annonceAuditEvents).hasSizeGreaterThanOrEqualTo(1);
        long annonceCreatedEvents = annonceAuditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.CREATED)
                .count();
        assertThat(annonceCreatedEvents).isEqualTo(1);

        MvcResult dossierAuditResult = mockMvc.perform(
                withTenantHeaders(get("/api/v1/audit-events")
                        .param("entityType", "DOSSIER")
                        .param("entityId", dossierId.toString())
                        .param("page", "0")
                        .param("size", "50"), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andReturn();

        String dossierAuditContent = dossierAuditResult.getResponse().getContentAsString();
        List<AuditEventResponse> dossierAuditEvents = objectMapper.readValue(
                objectMapper.readTree(dossierAuditContent).get("content").toString(),
                new TypeReference<List<AuditEventResponse>>() {});

        assertThat(dossierAuditEvents).hasSizeGreaterThanOrEqualTo(3);

        long dossierCreatedEvents = dossierAuditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.CREATED)
                .count();
        assertThat(dossierCreatedEvents).isGreaterThanOrEqualTo(1);

        long dossierUpdatedEvents = dossierAuditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.UPDATED)
                .count();
        assertThat(dossierUpdatedEvents).isGreaterThanOrEqualTo(2);

        boolean hasStatusChange = dossierAuditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.UPDATED)
                .anyMatch(e -> e.getDiff() != null && e.getDiff().containsKey("changes"));
        assertThat(hasStatusChange).isTrue();

        MvcResult partyAuditResult = mockMvc.perform(
                withTenantHeaders(get("/api/v1/audit-events")
                        .param("entityType", "PARTIE_PRENANTE")
                        .param("entityId", partyId.toString())
                        .param("page", "0")
                        .param("size", "10"), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andReturn();

        String partyAuditContent = partyAuditResult.getResponse().getContentAsString();
        List<AuditEventResponse> partyAuditEvents = objectMapper.readValue(
                objectMapper.readTree(partyAuditContent).get("content").toString(),
                new TypeReference<List<AuditEventResponse>>() {});

        assertThat(partyAuditEvents).hasSizeGreaterThanOrEqualTo(1);
        long partyCreatedEvents = partyAuditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.CREATED)
                .count();
        assertThat(partyCreatedEvents).isGreaterThanOrEqualTo(1);

        MvcResult messageAuditResult = mockMvc.perform(
                withTenantHeaders(get("/api/v1/audit-events")
                        .param("entityType", "MESSAGE")
                        .param("entityId", messageId.toString())
                        .param("page", "0")
                        .param("size", "10"), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andReturn();

        String messageAuditContent = messageAuditResult.getResponse().getContentAsString();
        List<AuditEventResponse> messageAuditEvents = objectMapper.readValue(
                objectMapper.readTree(messageAuditContent).get("content").toString(),
                new TypeReference<List<AuditEventResponse>>() {});

        assertThat(messageAuditEvents).hasSizeGreaterThanOrEqualTo(1);
        long messageCreatedEvents = messageAuditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.CREATED)
                .count();
        assertThat(messageCreatedEvents).isGreaterThanOrEqualTo(1);

        List<AuditEventResponse> allAuditEvents = new ArrayList<>();
        allAuditEvents.addAll(annonceAuditEvents);
        allAuditEvents.addAll(dossierAuditEvents);
        allAuditEvents.addAll(partyAuditEvents);
        allAuditEvents.addAll(messageAuditEvents);

        assertThat(allAuditEvents).hasSizeGreaterThanOrEqualTo(6);

        allAuditEvents.sort(Comparator.comparing(AuditEventResponse::getCreatedAt));

        LocalDateTime previousTimestamp = null;
        for (AuditEventResponse event : allAuditEvents) {
            if (previousTimestamp != null) {
                assertThat(event.getCreatedAt()).isAfterOrEqualTo(previousTimestamp);
            }
            previousTimestamp = event.getCreatedAt();
        }

        AuditEventResponse firstEvent = allAuditEvents.get(0);
        assertThat(firstEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(firstEvent.getAction()).isEqualTo(AuditAction.CREATED);

        AuditEventResponse lastEvent = allAuditEvents.get(allAuditEvents.size() - 1);
        assertThat(lastEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(lastEvent.getAction()).isEqualTo(AuditAction.UPDATED);
    }

    @Test
    void duplicateDetection_CreateDossierWithSamePhone_ReturnsExistingOpenDossierId() throws Exception {
        String duplicatePhone = "+33698765432";

        DossierCreateRequest firstDossierRequest = new DossierCreateRequest();
        firstDossierRequest.setLeadPhone(duplicatePhone);
        firstDossierRequest.setLeadName("First Contact");
        firstDossierRequest.setLeadSource("Phone Call");
        firstDossierRequest.setSource(DossierSource.PHONE);

        PartiePrenanteRequest firstParty = new PartiePrenanteRequest();
        firstParty.setRole(PartiePrenanteRole.BUYER);
        firstParty.setFirstName("First");
        firstParty.setLastName("Contact");
        firstParty.setPhone(duplicatePhone);
        firstDossierRequest.setInitialParty(firstParty);

        MvcResult firstResult = mockMvc.perform(
                withTenantHeaders(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstDossierRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.existingOpenDossierId").doesNotExist())
                .andReturn();

        DossierResponse firstDossierResponse = objectMapper.readValue(
                firstResult.getResponse().getContentAsString(),
                DossierResponse.class);
        Long firstDossierId = firstDossierResponse.getId();

        assertThat(firstDossierId).isNotNull();
        assertThat(firstDossierResponse.getExistingOpenDossierId()).isNull();

        DossierCreateRequest secondDossierRequest = new DossierCreateRequest();
        secondDossierRequest.setLeadPhone("+33611111111");
        secondDossierRequest.setLeadName("Second Contact");
        secondDossierRequest.setLeadSource("Email");
        secondDossierRequest.setSource(DossierSource.EMAIL);

        PartiePrenanteRequest secondParty = new PartiePrenanteRequest();
        secondParty.setRole(PartiePrenanteRole.BUYER);
        secondParty.setFirstName("Second");
        secondParty.setLastName("Contact");
        secondParty.setPhone(duplicatePhone);
        secondDossierRequest.setInitialParty(secondParty);

        MvcResult secondResult = mockMvc.perform(
                withTenantHeaders(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondDossierRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.existingOpenDossierId").value(firstDossierId))
                .andReturn();

        DossierResponse secondDossierResponse = objectMapper.readValue(
                secondResult.getResponse().getContentAsString(),
                DossierResponse.class);

        assertThat(secondDossierResponse.getId()).isNotNull();
        assertThat(secondDossierResponse.getExistingOpenDossierId()).isEqualTo(firstDossierId);
        assertThat(secondDossierResponse.getId()).isNotEqualTo(firstDossierId);
    }

    @Test
    void businessRuleValidation_CreateDossierWithArchivedAnnonce_Returns400() throws Exception {
        AnnonceCreateRequest annonceRequest = new AnnonceCreateRequest();
        annonceRequest.setTitle("Archived Property");
        annonceRequest.setDescription("This property is no longer available");
        annonceRequest.setCategory("House");
        annonceRequest.setType(AnnonceType.SALE);
        annonceRequest.setCity("Lyon");
        annonceRequest.setPrice(BigDecimal.valueOf(300000));
        annonceRequest.setCurrency("EUR");

        MvcResult annonceResult = mockMvc.perform(
                withTenantHeaders(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(annonceRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn();

        AnnonceResponse annonceResponse = objectMapper.readValue(
                annonceResult.getResponse().getContentAsString(),
                AnnonceResponse.class);
        Long annonceId = annonceResponse.getId();

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Archived Property");
        updateRequest.setDescription("This property is no longer available");
        updateRequest.setCategory("House");
        updateRequest.setType(AnnonceType.SALE);
        updateRequest.setCity("Lyon");
        updateRequest.setPrice(BigDecimal.valueOf(300000));
        updateRequest.setCurrency("EUR");
        updateRequest.setStatus(AnnonceStatus.ARCHIVED);

        mockMvc.perform(
                withTenantHeaders(put("/api/v1/annonces/" + annonceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setAnnonceId(annonceId);
        dossierRequest.setLeadPhone("+33677889900");
        dossierRequest.setLeadName("Test User");
        dossierRequest.setSource(DossierSource.WEB);

        mockMvc.perform(
                withTenantHeaders(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dossierRequest)), TENANT_ID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Cannot create dossier with ARCHIVED annonce"));
    }

    @Test
    void businessRuleValidation_CreateDossierWithDraftAnnonce_Returns400() throws Exception {
        AnnonceCreateRequest annonceRequest = new AnnonceCreateRequest();
        annonceRequest.setTitle("Draft Property");
        annonceRequest.setDescription("This property is still being prepared");
        annonceRequest.setCategory("Apartment");
        annonceRequest.setType(AnnonceType.RENT);
        annonceRequest.setCity("Marseille");
        annonceRequest.setPrice(BigDecimal.valueOf(1200));
        annonceRequest.setCurrency("EUR");

        MvcResult annonceResult = mockMvc.perform(
                withTenantHeaders(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(annonceRequest)), TENANT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn();

        AnnonceResponse annonceResponse = objectMapper.readValue(
                annonceResult.getResponse().getContentAsString(),
                AnnonceResponse.class);
        Long annonceId = annonceResponse.getId();

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Draft Property");
        updateRequest.setDescription("This property is still being prepared");
        updateRequest.setCategory("Apartment");
        updateRequest.setType(AnnonceType.RENT);
        updateRequest.setCity("Marseille");
        updateRequest.setPrice(BigDecimal.valueOf(1200));
        updateRequest.setCurrency("EUR");
        updateRequest.setStatus(AnnonceStatus.DRAFT);

        mockMvc.perform(
                withTenantHeaders(put("/api/v1/annonces/" + annonceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)), TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setAnnonceId(annonceId);
        dossierRequest.setLeadPhone("+33688990011");
        dossierRequest.setLeadName("Another Test User");
        dossierRequest.setSource(DossierSource.PHONE);

        mockMvc.perform(
                withTenantHeaders(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dossierRequest)), TENANT_ID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Cannot create dossier with DRAFT annonce"));
    }
}
