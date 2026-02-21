package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@BackendE2ETest
@WithMockUser(username = "test-user", roles = "ADMIN")
public class MultiTenantBackendE2ETest extends BaseBackendE2ETest {

    @Autowired private DossierRepository dossierRepository;

    @Autowired private AuditEventRepository auditEventRepository;

    @Autowired private EntityManager entityManager;

    @Autowired private ObjectMapper objectMapper;

    private static final String ORG_001 = "ORG-001";
    private static final String ORG_002 = "ORG-002";

    @BeforeEach
    public void setUp() {
        // Delete all seed data and test data for fresh state
        auditEventRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() {
        // Clear tenant context to prevent tenant ID leakage between tests
        com.example.backend.util.TenantContext.clear();
    }

    @Test
    public void testCreateIdenticalEntitiesInDifferentOrgs() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("John Doe");
        request.setLeadPhone("+33612345678");
        request.setLeadSource("Web");
        request.setNotes("Test dossier");

        MvcResult result1 =
                mockMvc.perform(
                                post("/api/v1/dossiers")
                                        .header(TENANT_HEADER, ORG_001)
                                        .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.orgId").value(ORG_001))
                        .andExpect(jsonPath("$.leadName").value("John Doe"))
                        .andReturn();

        DossierResponse response1 =
                objectMapper.readValue(
                        result1.getResponse().getContentAsString(), DossierResponse.class);

        MvcResult result2 =
                mockMvc.perform(
                                post("/api/v1/dossiers")
                                        .header(TENANT_HEADER, ORG_002)
                                        .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.orgId").value(ORG_002))
                        .andExpect(jsonPath("$.leadName").value("John Doe"))
                        .andReturn();

        DossierResponse response2 =
                objectMapper.readValue(
                        result2.getResponse().getContentAsString(), DossierResponse.class);

        assertThat(response1.getId()).isNotNull();
        assertThat(response2.getId()).isNotNull();
        assertThat(response1.getId()).isNotEqualTo(response2.getId());
        assertThat(response1.getOrgId()).isEqualTo(ORG_001);
        assertThat(response2.getOrgId()).isEqualTo(ORG_002);
    }

    @Test
    public void testGetWithWrongOrgIdReturns404() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("Jane Smith");
        request.setLeadPhone("+33687654321");

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/v1/dossiers")
                                        .header(TENANT_HEADER, ORG_001)
                                        .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isCreated())
                        .andReturn();

        DossierResponse created =
                objectMapper.readValue(
                        createResult.getResponse().getContentAsString(), DossierResponse.class);

        mockMvc.perform(
                        get("/api/v1/dossiers/" + created.getId())
                                .header(TENANT_HEADER, ORG_002)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id"))
                .andExpect(status().isNotFound());

        mockMvc.perform(
                        get("/api/v1/dossiers/" + created.getId())
                                .header(TENANT_HEADER, ORG_001)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(created.getId()))
                .andExpect(jsonPath("$.orgId").value(ORG_001));
    }

    @Test
    public void testMissingOrgIdHeaderReturns400WithProblemDetails() throws Exception {
        mockMvc.perform(
                        get("/api/v1/dossiers/1")
                                .header(CORRELATION_ID_HEADER, "test-correlation-id"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Missing required header: X-Org-Id"))
                .andExpect(jsonPath("$.title").value("Bad Request"));
    }

    @Test
    public void testTenantContextThreadLocalInjectionAndCleanup() throws Exception {
        assertThat(TenantContext.getOrgId()).isNull();

        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("Test User");
        request.setLeadPhone("+33600000000");

        mockMvc.perform(
                        post("/api/v1/dossiers")
                                .header(TENANT_HEADER, ORG_001)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        assertThat(TenantContext.getOrgId()).isNull();

        mockMvc.perform(
                        get("/api/v1/dossiers")
                                .header(TENANT_HEADER, ORG_002)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id"))
                .andExpect(status().isOk());

        assertThat(TenantContext.getOrgId()).isNull();
    }

    @Test
    @Transactional
    public void testRepositoryWhereClauseFiltering() throws Exception {
        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_001);
        dossier1.setLeadName("Dossier 1 Org 001");
        dossier1.setLeadPhone("+33600000001");
        dossier1.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_002);
        dossier2.setLeadName("Dossier 2 Org 002");
        dossier2.setLeadPhone("+33600000002");
        dossier2.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier2);

        Dossier dossier3 = new Dossier();
        dossier3.setOrgId(ORG_001);
        dossier3.setLeadName("Dossier 3 Org 001");
        dossier3.setLeadPhone("+33600000003");
        dossier3.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier3);

        entityManager.flush();
        entityManager.clear();

        TenantContext.setOrgId(ORG_001);
        try {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_001);

            List<Dossier> org001Dossiers = dossierRepository.findAll();
            assertThat(org001Dossiers).hasSize(2);
            assertThat(org001Dossiers).extracting(Dossier::getOrgId).containsOnly(ORG_001);
            assertThat(org001Dossiers)
                    .extracting(Dossier::getLeadName)
                    .containsExactlyInAnyOrder("Dossier 1 Org 001", "Dossier 3 Org 001");

            session.disableFilter("orgIdFilter");
        } finally {
            TenantContext.clear();
        }

        TenantContext.setOrgId(ORG_002);
        try {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_002);

            List<Dossier> org002Dossiers = dossierRepository.findAll();
            assertThat(org002Dossiers).hasSize(1);
            assertThat(org002Dossiers).extracting(Dossier::getOrgId).containsOnly(ORG_002);
            assertThat(org002Dossiers)
                    .extracting(Dossier::getLeadName)
                    .containsExactly("Dossier 2 Org 002");

            session.disableFilter("orgIdFilter");
        } finally {
            TenantContext.clear();
        }

        List<Dossier> allDossiersUnfiltered = dossierRepository.findAll();
        assertThat(allDossiersUnfiltered).hasSize(3);
    }

    @Test
    public void testAuditEventsScopedToCorrectOrgId() throws Exception {
        DossierCreateRequest request1 = new DossierCreateRequest();
        request1.setLeadName("Audit Test User 1");
        request1.setLeadPhone("+33700000001");

        MvcResult result1 =
                mockMvc.perform(
                                post("/api/v1/dossiers")
                                        .header(TENANT_HEADER, ORG_001)
                                        .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request1)))
                        .andExpect(status().isCreated())
                        .andReturn();

        DossierResponse response1 =
                objectMapper.readValue(
                        result1.getResponse().getContentAsString(), DossierResponse.class);

        DossierCreateRequest request2 = new DossierCreateRequest();
        request2.setLeadName("Audit Test User 2");
        request2.setLeadPhone("+33700000002");

        MvcResult result2 =
                mockMvc.perform(
                                post("/api/v1/dossiers")
                                        .header(TENANT_HEADER, ORG_002)
                                        .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request2)))
                        .andExpect(status().isCreated())
                        .andReturn();

        DossierResponse response2 =
                objectMapper.readValue(
                        result2.getResponse().getContentAsString(), DossierResponse.class);

        entityManager.flush();
        entityManager.clear();

        List<AuditEventEntity> allAudits = auditEventRepository.findAll();
        assertThat(allAudits).hasSize(2);

        List<AuditEventEntity> org001Audits =
                allAudits.stream().filter(audit -> ORG_001.equals(audit.getOrgId())).toList();
        assertThat(org001Audits).hasSize(1);
        assertThat(org001Audits.get(0).getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(org001Audits.get(0).getEntityId()).isEqualTo(response1.getId());
        assertThat(org001Audits.get(0).getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(org001Audits.get(0).getOrgId()).isEqualTo(ORG_001);

        List<AuditEventEntity> org002Audits =
                allAudits.stream().filter(audit -> ORG_002.equals(audit.getOrgId())).toList();
        assertThat(org002Audits).hasSize(1);
        assertThat(org002Audits.get(0).getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(org002Audits.get(0).getEntityId()).isEqualTo(response2.getId());
        assertThat(org002Audits.get(0).getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(org002Audits.get(0).getOrgId()).isEqualTo(ORG_002);

        AuditEventEntity org001Audit = org001Audits.get(0);
        assertThat(org001Audit.getDiff()).isNotNull();
        assertThat(org001Audit.getDiff()).containsKey("after");

        AuditEventEntity org002Audit = org002Audits.get(0);
        assertThat(org002Audit.getDiff()).isNotNull();
        assertThat(org002Audit.getDiff()).containsKey("after");
    }

    @Test
    public void testAuditEventsIsolatedByOrgId() throws Exception {
        DossierCreateRequest request1 = new DossierCreateRequest();
        request1.setLeadName("Isolation Test 1");
        request1.setLeadPhone("+33800000001");

        MvcResult result1 =
                mockMvc.perform(
                                post("/api/v1/dossiers")
                                        .header(TENANT_HEADER, ORG_001)
                                        .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request1)))
                        .andExpect(status().isCreated())
                        .andReturn();

        DossierResponse response1 =
                objectMapper.readValue(
                        result1.getResponse().getContentAsString(), DossierResponse.class);

        DossierCreateRequest request2 = new DossierCreateRequest();
        request2.setLeadName("Isolation Test 2");
        request2.setLeadPhone("+33800000002");

        mockMvc.perform(
                        post("/api/v1/dossiers")
                                .header(TENANT_HEADER, ORG_002)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isCreated());

        entityManager.flush();
        entityManager.clear();

        TenantContext.setOrgId(ORG_001);
        try {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_001);

            List<AuditEventEntity> org001Audits = auditEventRepository.findAll();
            assertThat(org001Audits).hasSize(1);
            assertThat(org001Audits.get(0).getOrgId()).isEqualTo(ORG_001);
            assertThat(org001Audits.get(0).getEntityId()).isEqualTo(response1.getId());

            session.disableFilter("orgIdFilter");
        } finally {
            TenantContext.clear();
        }

        TenantContext.setOrgId(ORG_002);
        try {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("orgIdFilter");
            filter.setParameter("orgId", ORG_002);

            List<AuditEventEntity> org002Audits = auditEventRepository.findAll();
            assertThat(org002Audits).hasSize(1);
            assertThat(org002Audits.get(0).getOrgId()).isEqualTo(ORG_002);

            session.disableFilter("orgIdFilter");
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    public void testAntiEnumerationReturns404Not403() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("Secret User");
        request.setLeadPhone("+33900000000");

        MvcResult createResult =
                mockMvc.perform(
                                post("/api/v1/dossiers")
                                        .header(TENANT_HEADER, ORG_001)
                                        .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isCreated())
                        .andReturn();

        DossierResponse created =
                objectMapper.readValue(
                        createResult.getResponse().getContentAsString(), DossierResponse.class);

        mockMvc.perform(
                        get("/api/v1/dossiers/" + created.getId())
                                .header(TENANT_HEADER, ORG_002)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id"))
                .andExpect(status().isNotFound());

        mockMvc.perform(
                        get("/api/v1/dossiers/" + (created.getId() + 9999))
                                .header(TENANT_HEADER, ORG_001)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testTenantFilterInjectsAndCleansUpInFinallyBlock() throws Exception {
        assertThat(TenantContext.getOrgId()).isNull();

        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("Finally Block Test");
        request.setLeadPhone("+33100000000");

        mockMvc.perform(
                        post("/api/v1/dossiers")
                                .header(TENANT_HEADER, ORG_001)
                                .header(CORRELATION_ID_HEADER, "test-correlation-id")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        assertThat(TenantContext.getOrgId()).isNull();

        try {
            mockMvc.perform(
                            get("/api/v1/dossiers/99999")
                                    .header(TENANT_HEADER, ORG_002)
                                    .header(CORRELATION_ID_HEADER, "test-correlation-id"))
                    .andExpect(status().isNotFound());
        } catch (Exception e) {
        }

        assertThat(TenantContext.getOrgId()).isNull();
    }
}
