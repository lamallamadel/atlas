package com.example.backend.controller;

import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(roles = {"PRO"})
class ConsentementControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String ORG_ID = "org123";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ConsentementRepository consentementRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder> T withHeaders(T builder) {
        return (T) builder
                .header(ORG_ID_HEADER, ORG_ID)
                .header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }

    @BeforeEach
    void setUp() {
        auditEventRepository.deleteAll();
        consentementRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @Test
    void create_ValidRequest_Returns201WithMetaTracking() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        Map<String, Object> customMeta = new HashMap<>();
        customMeta.put("ipAddress", "192.168.1.1");
        customMeta.put("userAgent", "Mozilla/5.0");

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);
        request.setMeta(customMeta);

        mockMvc.perform(withHeaders(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.channel").value("EMAIL"))
                .andExpect(jsonPath("$.status").value("GRANTED"))
                .andExpect(jsonPath("$.meta.ipAddress").value("192.168.1.1"))
                .andExpect(jsonPath("$.meta.userAgent").value("Mozilla/5.0"))
                .andExpect(jsonPath("$.meta.previousStatus").value(nullValue()))
                .andExpect(jsonPath("$.meta.changedBy").value(ORG_ID))
                .andExpect(jsonPath("$.meta.changedAt").exists())
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        List<ConsentementEntity> consentements = consentementRepository.findAll();
        assertEquals(1, consentements.size());
        ConsentementEntity saved = consentements.get(0);
        assertEquals(ORG_ID, saved.getOrgId());
        assertEquals(ConsentementChannel.EMAIL, saved.getChannel());
        assertEquals(ConsentementStatus.GRANTED, saved.getStatus());
        assertNotNull(saved.getMeta());
        assertEquals("192.168.1.1", saved.getMeta().get("ipAddress"));
        assertNull(saved.getMeta().get("previousStatus"));
        assertNotNull(saved.getMeta().get("changedBy"));
        assertNotNull(saved.getMeta().get("changedAt"));
    }

    @Test
    void create_WithoutCustomMeta_Returns201WithDefaultMetaTracking() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33698765432");
        dossier.setLeadName("Jane Smith");
        dossier.setStatus(DossierStatus.QUALIFIED);
        dossier = dossierRepository.save(dossier);

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.SMS);
        request.setStatus(ConsentementStatus.PENDING);

        mockMvc.perform(withHeaders(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.meta.previousStatus").value(nullValue()))
                .andExpect(jsonPath("$.meta.changedBy").exists())
                .andExpect(jsonPath("$.meta.changedAt").exists());
    }

    @Test
    void create_MissingDossierId_Returns400() throws Exception {
        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withHeaders(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_NonExistentDossier_Returns404() throws Exception {
        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(999L);
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withHeaders(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_MissingChannel_Returns400() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withHeaders(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_MissingStatus_Returns400() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.EMAIL);

        mockMvc.perform(withHeaders(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_MissingTenantHeader_Returns400() throws Exception {
        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(1L);
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_WithoutAuthentication_Returns401() throws Exception {
        // The class is annotated with @WithMockUser; force an anonymous request for this test.
        SecurityContextHolder.clearContext();
        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(1L);
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(post("/api/v1/consentements").with(anonymous())
                        .header(ORG_ID_HEADER, ORG_ID)
                        .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_WithValidAuthentication_Returns201() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withHeaders(post("/api/v1/consentements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated());
    }

    @Test
    void getById_ExistingId_Returns200() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        ConsentementEntity consentement = new ConsentementEntity();
        consentement.setOrgId(ORG_ID);
        consentement.setDossier(dossier);
        consentement.setChannel(ConsentementChannel.EMAIL);
        consentement.setStatus(ConsentementStatus.GRANTED);
        consentement = consentementRepository.save(consentement);

        mockMvc.perform(withHeaders(get("/api/v1/consentements/" + consentement.getId())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(consentement.getId()))
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.channel").value("EMAIL"))
                .andExpect(jsonPath("$.status").value("GRANTED"));
    }

    @Test
    void getById_NonExistingId_Returns404() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/consentements/999")))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_ByDossierId_ReturnsAllConsentements() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        ConsentementEntity consent1 = new ConsentementEntity();
        consent1.setOrgId(ORG_ID);
        consent1.setDossier(dossier);
        consent1.setChannel(ConsentementChannel.EMAIL);
        consent1.setStatus(ConsentementStatus.GRANTED);
        consentementRepository.save(consent1);

        ConsentementEntity consent2 = new ConsentementEntity();
        consent2.setOrgId(ORG_ID);
        consent2.setDossier(dossier);
        consent2.setChannel(ConsentementChannel.SMS);
        consent2.setStatus(ConsentementStatus.PENDING);
        consentementRepository.save(consent2);

        mockMvc.perform(withHeaders(get("/api/v1/consentements")
                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$[1].dossierId").value(dossier.getId()));
    }

    @Test
    void list_ByDossierIdAndChannel_ReturnsFilteredConsentements() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        ConsentementEntity consent1 = new ConsentementEntity();
        consent1.setOrgId(ORG_ID);
        consent1.setDossier(dossier);
        consent1.setChannel(ConsentementChannel.EMAIL);
        consent1.setStatus(ConsentementStatus.GRANTED);
        consentementRepository.save(consent1);

        ConsentementEntity consent2 = new ConsentementEntity();
        consent2.setOrgId(ORG_ID);
        consent2.setDossier(dossier);
        consent2.setChannel(ConsentementChannel.SMS);
        consent2.setStatus(ConsentementStatus.PENDING);
        consentementRepository.save(consent2);

        ConsentementEntity consent3 = new ConsentementEntity();
        consent3.setOrgId(ORG_ID);
        consent3.setDossier(dossier);
        consent3.setChannel(ConsentementChannel.EMAIL);
        consent3.setStatus(ConsentementStatus.DENIED);
        consentementRepository.save(consent3);

        mockMvc.perform(withHeaders(get("/api/v1/consentements")
                        .param("dossierId", dossier.getId().toString())
                        .param("channel", "EMAIL")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].channel").value("EMAIL"))
                .andExpect(jsonPath("$[1].channel").value("EMAIL"));
    }

    @Test
    void list_OrderedByUpdatedAtDesc_ReturnsMostRecentFirst() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        ConsentementEntity consent1 = new ConsentementEntity();
        consent1.setOrgId(ORG_ID);
        consent1.setDossier(dossier);
        consent1.setChannel(ConsentementChannel.EMAIL);
        consent1.setStatus(ConsentementStatus.GRANTED);
        consent1 = consentementRepository.save(consent1);

        Thread.sleep(10);

        ConsentementEntity consent2 = new ConsentementEntity();
        consent2.setOrgId(ORG_ID);
        consent2.setDossier(dossier);
        consent2.setChannel(ConsentementChannel.SMS);
        consent2.setStatus(ConsentementStatus.PENDING);
        consent2 = consentementRepository.save(consent2);

        mockMvc.perform(withHeaders(get("/api/v1/consentements")
                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(consent2.getId()))
                .andExpect(jsonPath("$[1].id").value(consent1.getId()));
    }

    @Test
    void list_NonExistentDossier_Returns404() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/consentements")
                        .param("dossierId", "999")))
                .andExpect(status().isNotFound());
    }
}
