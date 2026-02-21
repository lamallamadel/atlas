package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.PartiePrenanteCreateRequest;
import com.example.backend.dto.PartiePrenanteUpdateRequest;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.PartiePrenanteRole;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.PartiePrenanteRepository;
import com.example.backend.util.TenantContext;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

@BackendE2ETest
@WithMockUser(username = "test-user", roles = "PRO")
class PartiesPrenanteBackendE2ETest extends BaseBackendE2ETest {

    private static final String BASE_URL = "/api/v1/parties-prenantes";
    private static final String TENANT_ID = "e2e-org-123";
    private static final String OTHER_TENANT_ID = "e2e-org-456";
    private static final String CORRELATION_ID = "e2e-correlation-id";

    @Autowired private PartiePrenanteRepository partiePrenanteRepository;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private AuditEventRepository auditEventRepository;

    @BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        partiePrenanteRepository.deleteAll();
        dossierRepository.deleteAll();
        auditEventRepository.deleteAll();
        // Set tenant context for tests
        TenantContext.setOrgId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        // Clear tenant context to prevent tenant ID leakage between tests
        TenantContext.clear();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_WithValidRole_Returns201AndAuditEvent() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("BUYER");
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane.doe@example.com");
        request.setPhone("+33612345678");

        String responseContent =
                mockMvc.perform(
                                withTenantHeaders(
                                        post(BASE_URL)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(objectMapper.writeValueAsString(request)),
                                        TENANT_ID,
                                        CORRELATION_ID))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.id").exists())
                        .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                        .andExpect(jsonPath("$.role").value("BUYER"))
                        .andExpect(jsonPath("$.firstName").value("Jane"))
                        .andExpect(jsonPath("$.lastName").value("Doe"))
                        .andExpect(jsonPath("$.email").value("jane.doe@example.com"))
                        .andExpect(jsonPath("$.phone").value("+33612345678"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        Map<String, Object> response = objectMapper.readValue(responseContent, Map.class);
        Long createdId = ((Number) response.get("id")).longValue();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.PARTIE_PRENANTE);
        assertThat(auditEvent.getEntityId()).isEqualTo(createdId);
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(TENANT_ID);

        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("after");
        assertThat(diff).doesNotContainKey("before");
        assertThat(diff).doesNotContainKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData.get("id")).isEqualTo(createdId.intValue());
        assertThat(afterData.get("role")).isEqualTo("BUYER");
        assertThat(afterData.get("firstName")).isEqualTo("Jane");
        assertThat(afterData.get("lastName")).isEqualTo("Doe");
        assertThat(afterData.get("email")).isEqualTo("jane.doe@example.com");
        assertThat(afterData.get("phone")).isEqualTo("+33612345678");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_WithInvalidRole_Returns400() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("INVALID_ROLE");
        request.setFirstName("John");
        request.setLastName("Smith");

        mockMvc.perform(
                        withTenantHeaders(
                                post(BASE_URL)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isBadRequest());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).isEmpty();
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void postCreate_WithInvalidEmail_Returns400() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("SELLER");
        request.setEmail("invalid-email-format");

        mockMvc.perform(
                        withTenantHeaders(
                                post(BASE_URL)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_WithInvalidPhone_Returns400() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("BUYER");
        request.setPhone("invalid phone format!!!!");

        mockMvc.perform(
                        withTenantHeaders(
                                post(BASE_URL)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_ExistingEntity_Returns200() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, TENANT_ID, PartiePrenanteRole.BUYER);

        mockMvc.perform(
                        withTenantHeaders(
                                get(BASE_URL + "/" + entity.getId()), TENANT_ID, CORRELATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(entity.getId()))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.role").value("BUYER"))
                .andExpect(jsonPath("$.firstName").value("Test"))
                .andExpect(jsonPath("$.lastName").value("User"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.phone").value("+33600000000"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_NonExistingEntity_Returns404() throws Exception {
        mockMvc.perform(withTenantHeaders(get(BASE_URL + "/99999"), TENANT_ID, CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_CrossTenantIsolation_Returns404() throws Exception {
        Dossier dossier = createDossier(OTHER_TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, OTHER_TENANT_ID, PartiePrenanteRole.SELLER);

        mockMvc.perform(
                        withTenantHeaders(
                                get(BASE_URL + "/" + entity.getId()), TENANT_ID, CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void putUpdate_WithContactInfoChanges_Returns200AndAuditEvent() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, TENANT_ID, PartiePrenanteRole.BUYER);
        auditEventRepository.deleteAll();

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("BUYER");
        request.setFirstName("Updated");
        request.setLastName("Name");
        request.setEmail("updated@example.com");
        request.setPhone("+33611111111");
        request.setAddress("123 New Street");

        mockMvc.perform(
                        withTenantHeaders(
                                put(BASE_URL + "/" + entity.getId())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(entity.getId()))
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.lastName").value("Name"))
                .andExpect(jsonPath("$.email").value("updated@example.com"))
                .andExpect(jsonPath("$.phone").value("+33611111111"))
                .andExpect(jsonPath("$.address").value("123 New Street"));

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.PARTIE_PRENANTE);
        assertThat(auditEvent.getEntityId()).isEqualTo(entity.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);

        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("changes");
        assertThat(diff).doesNotContainKey("before");
        assertThat(diff).doesNotContainKey("after");

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("firstName");
        assertThat(changes).containsKey("lastName");
        assertThat(changes).containsKey("email");
        assertThat(changes).containsKey("phone");
        assertThat(changes).containsKey("address");

        @SuppressWarnings("unchecked")
        Map<String, Object> firstNameChange = (Map<String, Object>) changes.get("firstName");
        assertThat(firstNameChange.get("before")).isEqualTo("Test");
        assertThat(firstNameChange.get("after")).isEqualTo("Updated");

        @SuppressWarnings("unchecked")
        Map<String, Object> emailChange = (Map<String, Object>) changes.get("email");
        assertThat(emailChange.get("before")).isEqualTo("test@example.com");
        assertThat(emailChange.get("after")).isEqualTo("updated@example.com");

        @SuppressWarnings("unchecked")
        Map<String, Object> phoneChange = (Map<String, Object>) changes.get("phone");
        assertThat(phoneChange.get("before")).isEqualTo("+33600000000");
        assertThat(phoneChange.get("after")).isEqualTo("+33611111111");
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void deleteById_AsAdmin_Returns204AndAuditEvent() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, TENANT_ID, PartiePrenanteRole.NOTARY);
        auditEventRepository.deleteAll();

        mockMvc.perform(
                        withTenantHeaders(
                                delete(BASE_URL + "/" + entity.getId()), TENANT_ID, CORRELATION_ID))
                .andExpect(status().isNoContent());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.PARTIE_PRENANTE);
        assertThat(auditEvent.getEntityId()).isEqualTo(entity.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(auditEvent.getOrgId()).isEqualTo(TENANT_ID);

        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("before");
        assertThat(diff).doesNotContainKey("after");
        assertThat(diff).doesNotContainKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> beforeData = (Map<String, Object>) diff.get("before");
        assertThat(beforeData.get("id")).isEqualTo(entity.getId().intValue());
        assertThat(beforeData.get("firstName")).isEqualTo("Test");
        assertThat(beforeData.get("lastName")).isEqualTo("User");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void deleteById_AsPro_Returns403() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, TENANT_ID, PartiePrenanteRole.BUYER);

        mockMvc.perform(
                        withTenantHeaders(
                                delete(BASE_URL + "/" + entity.getId()), TENANT_ID, CORRELATION_ID))
                .andExpect(status().isForbidden());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).isEmpty();
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void deleteById_CrossTenantIsolation_Returns404() throws Exception {
        Dossier dossier = createDossier(OTHER_TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, OTHER_TENANT_ID, PartiePrenanteRole.AGENT);

        mockMvc.perform(
                        withTenantHeaders(
                                delete(BASE_URL + "/" + entity.getId()), TENANT_ID, CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getListByDossier_WithPagination_ReturnsFilteredResults() throws Exception {
        Dossier dossier1 = createDossier(TENANT_ID);
        Dossier dossier2 = createDossier(TENANT_ID);

        createPartiePrenanteEntity(dossier1, TENANT_ID, PartiePrenanteRole.BUYER);
        createPartiePrenanteEntity(dossier1, TENANT_ID, PartiePrenanteRole.SELLER);
        createPartiePrenanteEntity(dossier1, TENANT_ID, PartiePrenanteRole.NOTARY);
        createPartiePrenanteEntity(dossier2, TENANT_ID, PartiePrenanteRole.AGENT);

        mockMvc.perform(
                        withTenantHeaders(
                                get(BASE_URL).param("dossierId", dossier1.getId().toString()),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].dossierId").value(dossier1.getId()))
                .andExpect(jsonPath("$[1].dossierId").value(dossier1.getId()))
                .andExpect(jsonPath("$[2].dossierId").value(dossier1.getId()));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getListByDossier_CrossTenantDossier_Returns404() throws Exception {
        Dossier dossier = createDossier(OTHER_TENANT_ID);
        createPartiePrenanteEntity(dossier, OTHER_TENANT_ID, PartiePrenanteRole.BUYER);

        mockMvc.perform(
                        withTenantHeaders(
                                get(BASE_URL).param("dossierId", dossier.getId().toString()),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_AllValidRoles_Returns201() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        String[] validRoles = {
            "OWNER", "BUYER", "SELLER", "TENANT", "LANDLORD", "AGENT", "NOTARY", "BANK", "ATTORNEY"
        };

        for (String role : validRoles) {
            PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
            request.setDossierId(dossier.getId());
            request.setRole(role);
            request.setFirstName("Test");
            request.setLastName("User");

            mockMvc.perform(
                            withTenantHeaders(
                                    post(BASE_URL)
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(objectMapper.writeValueAsString(request)),
                                    TENANT_ID,
                                    CORRELATION_ID))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.role").value(role));
        }
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void postCreate_WithValidPhoneFormats_Returns201() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        String[] validPhones = {
            "+33612345678", "0612345678", "+1 (555) 123-4567", "+44 20 1234 5678"
        };

        for (String phone : validPhones) {
            PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
            request.setDossierId(dossier.getId());
            request.setRole("BUYER");
            request.setPhone(phone);
            request.setFirstName("Test");
            request.setLastName("User");
            request.setAddress("123 Main St");

            mockMvc.perform(
                            withTenantHeaders(
                                    post(BASE_URL)
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(objectMapper.writeValueAsString(request)),
                                    TENANT_ID,
                                    CORRELATION_ID))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.phone").value(phone));
        }
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void putUpdate_WithInvalidEmail_Returns400() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, TENANT_ID, PartiePrenanteRole.BUYER);

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("BUYER");
        request.setEmail("invalid-email");

        mockMvc.perform(
                        withTenantHeaders(
                                put(BASE_URL + "/" + entity.getId())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void putUpdate_WithInvalidPhone_Returns400() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, TENANT_ID, PartiePrenanteRole.BUYER);

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("BUYER");
        request.setPhone("invalid!!!phone");

        mockMvc.perform(
                        withTenantHeaders(
                                put(BASE_URL + "/" + entity.getId())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void completeWorkflow_CreateUpdateDelete_CreatesFullAuditTrail() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        PartiePrenanteCreateRequest createRequest = new PartiePrenanteCreateRequest();
        createRequest.setDossierId(dossier.getId());
        createRequest.setRole("BUYER");
        createRequest.setFirstName("John");
        createRequest.setLastName("Doe");
        createRequest.setEmail("john@example.com");
        createRequest.setPhone("+33612345678");

        String createResponse =
                mockMvc.perform(
                                withTenantHeaders(
                                        post(BASE_URL)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(
                                                        objectMapper.writeValueAsString(
                                                                createRequest)),
                                        TENANT_ID,
                                        CORRELATION_ID))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        Map<String, Object> created = objectMapper.readValue(createResponse, Map.class);
        Long entityId = ((Number) created.get("id")).longValue();

        PartiePrenanteUpdateRequest updateRequest = new PartiePrenanteUpdateRequest();
        updateRequest.setRole("SELLER");

        mockMvc.perform(
                        withTenantHeaders(
                                put(BASE_URL + "/" + entityId)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(updateRequest)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isOk());

        mockMvc.perform(
                        withTenantHeaders(
                                delete(BASE_URL + "/" + entityId), TENANT_ID, CORRELATION_ID))
                .andExpect(status().isNoContent());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(3);

        AuditEventEntity createEvent = auditEvents.get(0);
        assertThat(createEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(createEvent.getDiff()).containsKey("after");

        AuditEventEntity updateEvent = auditEvents.get(1);
        assertThat(updateEvent.getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(updateEvent.getDiff()).containsKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> updateChanges =
                (Map<String, Object>) updateEvent.getDiff().get("changes");
        assertThat(updateChanges).containsKey("role");
        assertThat(updateChanges).containsKey("firstName");
        assertThat(updateChanges).containsKey("lastName");
        assertThat(updateChanges).containsKey("email");
        assertThat(updateChanges).containsKey("phone");

        AuditEventEntity deleteEvent = auditEvents.get(2);
        assertThat(deleteEvent.getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(deleteEvent.getDiff()).containsKey("before");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_WithMetadata_Returns201AndAuditEventWithMeta() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        Map<String, Object> meta = new HashMap<>();
        meta.put("priority", "high");
        meta.put("source", "referral");

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("AGENT");
        request.setFirstName("Agent");
        request.setLastName("Smith");
        request.setMeta(meta);

        String responseContent =
                mockMvc.perform(
                                withTenantHeaders(
                                        post(BASE_URL)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(objectMapper.writeValueAsString(request)),
                                        TENANT_ID,
                                        CORRELATION_ID))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.meta.priority").value("high"))
                        .andExpect(jsonPath("$.meta.source").value("referral"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        Map<String, Object> response = objectMapper.readValue(responseContent, Map.class);
        Long createdId = ((Number) response.get("id")).longValue();

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData =
                (Map<String, Object>) auditEvents.get(0).getDiff().get("after");
        assertThat(afterData).containsKey("meta");
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_MissingRequiredRole_Returns400() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setFirstName("Test");
        request.setLastName("Doe");

        mockMvc.perform(
                        withTenantHeaders(
                                post(BASE_URL)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_MissingDossierId_Returns400() throws Exception {
        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setRole("BUYER");
        request.setFirstName("Test");
        request.setLastName("Doe");
        request.setEmail("test@example.com");
        request.setPhone("1234567890");
        request.setAddress("123 Main St");

        mockMvc.perform(
                        withTenantHeaders(
                                post(BASE_URL)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_NonExistingDossier_Returns404() throws Exception {
        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(99999L);
        request.setRole("BUYER");
        request.setFirstName("Test");
        request.setLastName("Doe");
        request.setEmail("test@example.com");
        request.setPhone("1234567890");
        request.setAddress("123 Main St");

        mockMvc.perform(
                        withTenantHeaders(
                                post(BASE_URL)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void postCreate_CrossTenantDossier_Returns404() throws Exception {
        Dossier dossier = createDossier(OTHER_TENANT_ID);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setFirstName("Test");
        request.setLastName("Doe");
        request.setEmail("test@example.com");
        request.setPhone("1234567890");
        request.setAddress("123 Main St");
        request.setRole("BUYER");

        mockMvc.perform(
                        withTenantHeaders(post(BASE_URL), TENANT_ID, CORRELATION_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void putUpdate_NonExistingEntity_Returns404() throws Exception {
        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("BUYER");

        mockMvc.perform(
                        withTenantHeaders(
                                put(BASE_URL + "/99999")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void putUpdate_CrossTenantEntity_Returns404() throws Exception {
        Dossier dossier = createDossier(OTHER_TENANT_ID);
        PartiePrenanteEntity entity =
                createPartiePrenanteEntity(dossier, OTHER_TENANT_ID, PartiePrenanteRole.BUYER);

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("SELLER");

        mockMvc.perform(
                        withTenantHeaders(
                                put(BASE_URL + "/" + entity.getId())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getListByDossier_EmptyResult_Returns200WithEmptyArray() throws Exception {
        Dossier dossier = createDossier(TENANT_ID);

        mockMvc.perform(
                        withTenantHeaders(
                                get(BASE_URL).param("dossierId", dossier.getId().toString()),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getListByDossier_NonExistingDossier_Returns404() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(
                                get(BASE_URL).param("dossierId", "99999"),
                                TENANT_ID,
                                CORRELATION_ID))
                .andExpect(status().isNotFound());
    }

    private Dossier createDossier(String orgId) {
        TenantContext.setOrgId(orgId);
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone("+33600000000");
        dossier.setLeadName("Test Lead");
        dossier.setStatus(DossierStatus.NEW);
        return dossierRepository.save(dossier);
    }

    private PartiePrenanteEntity createPartiePrenanteEntity(
            Dossier dossier, String orgId, PartiePrenanteRole role) {
        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(orgId);
        entity.setDossier(dossier);
        entity.setRole(role);
        entity.setFirstName("Test");
        entity.setLastName("User");
        entity.setEmail("test@example.com");
        entity.setPhone("+33600000000");
        entity.setAddress("123 Test St");
        return partiePrenanteRepository.save(entity);
    }
}
