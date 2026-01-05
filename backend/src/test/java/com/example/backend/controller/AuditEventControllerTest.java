package com.example.backend.controller;

import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.DossierRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(roles = {"PRO"})
class AuditEventControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String ORG_ID = "org123";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private DossierRepository dossierRepository;

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder> T withHeaders(T builder) {
        return (T) builder
                .header(ORG_ID_HEADER, ORG_ID)
                .header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }

    @BeforeEach
    void setUp() {
        auditEventRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @Test
    void list_ByEntityTypeAndId_ReturnsCorrectEvents() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        AuditEventEntity event1 = new AuditEventEntity();
        event1.setOrgId(ORG_ID);
        event1.setEntityType(AuditEntityType.DOSSIER);
        event1.setEntityId(dossier.getId());
        event1.setAction(AuditAction.CREATED);
        event1.setUserId("user-123");
        auditEventRepository.save(event1);

        AuditEventEntity event2 = new AuditEventEntity();
        event2.setOrgId(ORG_ID);
        event2.setEntityType(AuditEntityType.DOSSIER);
        event2.setEntityId(dossier.getId());
        event2.setAction(AuditAction.UPDATED);
        event2.setUserId("user-456");
        Map<String, Object> diff = new HashMap<>();
        diff.put("status", Map.of("old", "NEW", "new", "QUALIFIED"));
        event2.setDiff(diff);
        auditEventRepository.save(event2);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("entityType", "DOSSIER")
                        .param("entityId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].entityType").value("DOSSIER"))
                .andExpect(jsonPath("$.content[0].entityId").value(dossier.getId()))
                .andExpect(jsonPath("$.content[0].action").value("UPDATED"))
                .andExpect(jsonPath("$.content[1].action").value("CREATED"))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void list_ByDossierId_ReturnsCorrectEvents() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        AuditEventEntity event1 = new AuditEventEntity();
        event1.setOrgId(ORG_ID);
        event1.setEntityType(AuditEntityType.DOSSIER);
        event1.setEntityId(dossier.getId());
        event1.setAction(AuditAction.CREATED);
        event1.setUserId("user-123");
        auditEventRepository.save(event1);

        AuditEventEntity event2 = new AuditEventEntity();
        event2.setOrgId(ORG_ID);
        event2.setEntityType(AuditEntityType.DOSSIER);
        event2.setEntityId(dossier.getId());
        event2.setAction(AuditAction.UPDATED);
        event2.setUserId("user-456");
        auditEventRepository.save(event2);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].entityType").value("DOSSIER"))
                .andExpect(jsonPath("$.content[0].entityId").value(dossier.getId()))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void list_WithPagination_ReturnsCorrectPage() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        for (int i = 0; i < 5; i++) {
            AuditEventEntity event = new AuditEventEntity();
            event.setOrgId(ORG_ID);
            event.setEntityType(AuditEntityType.DOSSIER);
            event.setEntityId(dossier.getId());
            event.setAction(AuditAction.UPDATED);
            event.setUserId("user-" + i);
            auditEventRepository.save(event);
        }

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())
                        .param("page", "0")
                        .param("size", "2")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(2));

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())
                        .param("page", "1")
                        .param("size", "2")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.number").value(1));
    }

    @Test
    void list_WithSortDescending_ReturnsNewestFirst() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        AuditEventEntity event1 = new AuditEventEntity();
        event1.setOrgId(ORG_ID);
        event1.setEntityType(AuditEntityType.DOSSIER);
        event1.setEntityId(dossier.getId());
        event1.setAction(AuditAction.CREATED);
        event1.setUserId("user-1");
        event1 = auditEventRepository.save(event1);

        Thread.sleep(10);

        AuditEventEntity event2 = new AuditEventEntity();
        event2.setOrgId(ORG_ID);
        event2.setEntityType(AuditEntityType.DOSSIER);
        event2.setEntityId(dossier.getId());
        event2.setAction(AuditAction.UPDATED);
        event2.setUserId("user-2");
        event2 = auditEventRepository.save(event2);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())
                        .param("sort", "createdAt,desc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].id").value(event2.getId()))
                .andExpect(jsonPath("$.content[1].id").value(event1.getId()));
    }

    @Test
    void list_WithSortAscending_ReturnsOldestFirst() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        AuditEventEntity event1 = new AuditEventEntity();
        event1.setOrgId(ORG_ID);
        event1.setEntityType(AuditEntityType.DOSSIER);
        event1.setEntityId(dossier.getId());
        event1.setAction(AuditAction.CREATED);
        event1.setUserId("user-1");
        event1 = auditEventRepository.save(event1);

        Thread.sleep(10);

        AuditEventEntity event2 = new AuditEventEntity();
        event2.setOrgId(ORG_ID);
        event2.setEntityType(AuditEntityType.DOSSIER);
        event2.setEntityId(dossier.getId());
        event2.setAction(AuditAction.UPDATED);
        event2.setUserId("user-2");
        event2 = auditEventRepository.save(event2);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())
                        .param("sort", "createdAt,asc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].id").value(event1.getId()))
                .andExpect(jsonPath("$.content[1].id").value(event2.getId()));
    }

    @Test
    void list_WithDiffData_ReturnsDiffCorrectly() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        Map<String, Object> diff = new HashMap<>();
        diff.put("status", Map.of("old", "NEW", "new", "QUALIFIED"));
        diff.put("score", Map.of("old", 10, "new", 20));

        AuditEventEntity event = new AuditEventEntity();
        event.setOrgId(ORG_ID);
        event.setEntityType(AuditEntityType.DOSSIER);
        event.setEntityId(dossier.getId());
        event.setAction(AuditAction.UPDATED);
        event.setUserId("user-123");
        event.setDiff(diff);
        auditEventRepository.save(event);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].diff").exists())
                .andExpect(jsonPath("$.content[0].diff.status.old").value("NEW"))
                .andExpect(jsonPath("$.content[0].diff.status.new").value("QUALIFIED"))
                .andExpect(jsonPath("$.content[0].diff.score.old").value(10))
                .andExpect(jsonPath("$.content[0].diff.score.new").value(20));
    }

    @Test
    void list_FiltersByOrgId_ReturnsOnlyOrgEvents() throws Exception {
        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID);
        dossier1.setLeadPhone("+33612345678");
        dossier1.setStatus(DossierStatus.NEW);
        dossier1 = dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId("other-org");
        dossier2.setLeadPhone("+33698765432");
        dossier2.setStatus(DossierStatus.NEW);
        dossier2 = dossierRepository.save(dossier2);

        AuditEventEntity event1 = new AuditEventEntity();
        event1.setOrgId(ORG_ID);
        event1.setEntityType(AuditEntityType.DOSSIER);
        event1.setEntityId(dossier1.getId());
        event1.setAction(AuditAction.CREATED);
        event1.setUserId("user-123");
        auditEventRepository.save(event1);

        AuditEventEntity event2 = new AuditEventEntity();
        event2.setOrgId("other-org");
        event2.setEntityType(AuditEntityType.DOSSIER);
        event2.setEntityId(dossier2.getId());
        event2.setAction(AuditAction.CREATED);
        event2.setUserId("user-456");
        auditEventRepository.save(event2);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier1.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].entityId").value(dossier1.getId()));
    }

    @Test
    void list_WithoutDossierIdOrEntity_Returns400() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/audit-events")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_WithEntityTypeButNoEntityId_Returns400() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("entityType", "DOSSIER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_WithEntityIdButNoEntityType_Returns400() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("entityId", "123")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_EmptyResult_Returns200WithEmptyPage() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void list_MissingTenantHeader_Returns400() throws Exception {
        mockMvc.perform(get("/api/v1/audit-events")
                        .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                        .param("dossierId", "123"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_WithoutAuthentication_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/audit-events")
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                        .param("dossierId", "123"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_WithValidAuthentication_Returns200() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        AuditEventEntity event = new AuditEventEntity();
        event.setOrgId(ORG_ID);
        event.setEntityType(AuditEntityType.DOSSIER);
        event.setEntityId(dossier.getId());
        event.setAction(AuditAction.CREATED);
        event.setUserId("user-123");
        auditEventRepository.save(event);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    void list_MultipleEntityTypes_ReturnsOnlyMatchingType() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        AuditEventEntity dossierEvent = new AuditEventEntity();
        dossierEvent.setOrgId(ORG_ID);
        dossierEvent.setEntityType(AuditEntityType.DOSSIER);
        dossierEvent.setEntityId(dossier.getId());
        dossierEvent.setAction(AuditAction.CREATED);
        dossierEvent.setUserId("user-123");
        auditEventRepository.save(dossierEvent);

        AuditEventEntity consentementEvent = new AuditEventEntity();
        consentementEvent.setOrgId(ORG_ID);
        consentementEvent.setEntityType(AuditEntityType.CONSENTEMENT);
        consentementEvent.setEntityId(999L);
        consentementEvent.setAction(AuditAction.CREATED);
        consentementEvent.setUserId("user-123");
        auditEventRepository.save(consentementEvent);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("entityType", "DOSSIER")
                        .param("entityId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].entityType").value("DOSSIER"))
                .andExpect(jsonPath("$.content[0].entityId").value(dossier.getId()));
    }

    @Test
    void list_ConsentementEntity_ReturnsConsentementEvents() throws Exception {
        Long consentementId = 123L;

        AuditEventEntity event1 = new AuditEventEntity();
        event1.setOrgId(ORG_ID);
        event1.setEntityType(AuditEntityType.CONSENTEMENT);
        event1.setEntityId(consentementId);
        event1.setAction(AuditAction.CREATED);
        event1.setUserId("user-123");
        auditEventRepository.save(event1);

        AuditEventEntity event2 = new AuditEventEntity();
        event2.setOrgId(ORG_ID);
        event2.setEntityType(AuditEntityType.CONSENTEMENT);
        event2.setEntityId(consentementId);
        event2.setAction(AuditAction.UPDATED);
        event2.setUserId("user-456");
        Map<String, Object> diff = new HashMap<>();
        diff.put("status", Map.of("old", "PENDING", "new", "GRANTED"));
        event2.setDiff(diff);
        auditEventRepository.save(event2);

        mockMvc.perform(withHeaders(get("/api/v1/audit-events")
                        .param("entityType", "CONSENTEMENT")
                        .param("entityId", consentementId.toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].entityType").value("CONSENTEMENT"))
                .andExpect(jsonPath("$.content[0].entityId").value(consentementId))
                .andExpect(jsonPath("$.content[0].action").value("UPDATED"))
                .andExpect(jsonPath("$.content[0].diff.status.old").value("PENDING"))
                .andExpect(jsonPath("$.content[0].diff.status.new").value("GRANTED"))
                .andExpect(jsonPath("$.content[1].action").value("CREATED"));
    }
}
