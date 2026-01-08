package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.ConsentementCreateRequest;
import com.example.backend.dto.ConsentementUpdateRequest;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class ConsentementBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG_ID = "org-e2e-test";
    private static final String CORRELATION_ID = "e2e-test-correlation-id";

    @Autowired
    private ConsentementRepository consentementRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @BeforeEach
    void setUp() {
        auditEventRepository.deleteAll();
        consentementRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @Test
    void postConsentement_withSmsChannel_createsConsentWithInitialStatus() throws Exception {
        Dossier dossier = createDossier("Lead One", "+33612345678");

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.SMS);
        request.setStatus(ConsentementStatus.PENDING);

        mockMvc.perform(withTenantHeaders(post("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.channel").value("SMS"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.meta.previousStatus").value(nullValue()))
                .andExpect(jsonPath("$.meta.changedBy").exists())
                .andExpect(jsonPath("$.meta.changedAt").exists());

        List<ConsentementEntity> consents = consentementRepository.findAll();
        assertThat(consents).hasSize(1);
        assertThat(consents.get(0).getChannel()).isEqualTo(ConsentementChannel.SMS);
        assertThat(consents.get(0).getStatus()).isEqualTo(ConsentementStatus.PENDING);
    }

    @Test
    void postConsentement_withEmailChannel_createsConsentWithInitialStatus() throws Exception {
        Dossier dossier = createDossier("Lead Two", "+33698765432");

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.channel").value("EMAIL"))
                .andExpect(jsonPath("$.status").value("GRANTED"));

        List<ConsentementEntity> consents = consentementRepository.findAll();
        assertThat(consents).hasSize(1);
        assertThat(consents.get(0).getChannel()).isEqualTo(ConsentementChannel.EMAIL);
        assertThat(consents.get(0).getStatus()).isEqualTo(ConsentementStatus.GRANTED);
    }

    @Test
    void postConsentement_withWhatsappChannel_createsConsentWithInitialStatus() throws Exception {
        Dossier dossier = createDossier("Lead Three", "+33687654321");

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.WHATSAPP);
        request.setStatus(ConsentementStatus.DENIED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.channel").value("WHATSAPP"))
                .andExpect(jsonPath("$.status").value("DENIED"));

        List<ConsentementEntity> consents = consentementRepository.findAll();
        assertThat(consents).hasSize(1);
        assertThat(consents.get(0).getChannel()).isEqualTo(ConsentementChannel.WHATSAPP);
        assertThat(consents.get(0).getStatus()).isEqualTo(ConsentementStatus.DENIED);
    }

    @Test
    void putConsentement_updatesStatusAndStoresPreviousStatusInMeta() throws Exception {
        Dossier dossier = createDossier("Lead Four", "+33611223344");
        ConsentementEntity consent = createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.PENDING);

        ConsentementUpdateRequest updateRequest = new ConsentementUpdateRequest();
        updateRequest.setChannel(ConsentementChannel.EMAIL);
        updateRequest.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(consent.getId()))
                .andExpect(jsonPath("$.status").value("GRANTED"))
                .andExpect(jsonPath("$.meta.previousStatus").value("PENDING"))
                .andExpect(jsonPath("$.meta.changedBy").exists())
                .andExpect(jsonPath("$.meta.changedAt").exists());

        ConsentementEntity updated = consentementRepository.findById(consent.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ConsentementStatus.GRANTED);
        assertThat(updated.getMeta()).containsEntry("previousStatus", "PENDING");
        assertThat(updated.getMeta()).containsKey("changedBy");
        assertThat(updated.getMeta()).containsKey("changedAt");
    }

    @Test
    void putConsentement_multipleUpdates_preservesLatestPreviousStatus() throws Exception {
        Dossier dossier = createDossier("Lead Five", "+33655443322");
        ConsentementEntity consent = createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.PENDING);

        ConsentementUpdateRequest firstUpdate = new ConsentementUpdateRequest();
        firstUpdate.setChannel(ConsentementChannel.SMS);
        firstUpdate.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.previousStatus").value("PENDING"));

        ConsentementUpdateRequest secondUpdate = new ConsentementUpdateRequest();
        secondUpdate.setChannel(ConsentementChannel.SMS);
        secondUpdate.setStatus(ConsentementStatus.REVOKED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.previousStatus").value("GRANTED"));

        ConsentementEntity updated = consentementRepository.findById(consent.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ConsentementStatus.REVOKED);
        assertThat(updated.getMeta()).containsEntry("previousStatus", "GRANTED");
    }

    @Test
    void getConsentements_withDossierId_returnsAllConsentsForDossier() throws Exception {
        Dossier dossier = createDossier("Lead Six", "+33699887766");
        createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.GRANTED);
        createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.PENDING);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.DENIED);

        Dossier otherDossier = createDossier("Lead Seven", "+33677665544");
        createConsent(otherDossier, ConsentementChannel.EMAIL, ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].dossierId", everyItem(is(dossier.getId().intValue()))));
    }

    @Test
    void getConsentements_withDossierIdAndChannel_returnsFilteredConsents() throws Exception {
        Dossier dossier = createDossier("Lead Eight", "+33644332211");
        createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.GRANTED);
        createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.DENIED);
        createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.PENDING);
        createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString())
                        .param("channel", "EMAIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].channel", everyItem(is("EMAIL"))));
    }

    @Test
    void getConsentements_sortedByUpdatedAtDesc_returnsMostRecentFirst() throws Exception {
        Dossier dossier = createDossier("Lead Nine", "+33633221100");

        ConsentementEntity oldest = createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.PENDING);
        Thread.sleep(10);
        ConsentementEntity middle = createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.GRANTED);
        Thread.sleep(10);
        ConsentementEntity newest = createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.DENIED);

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].id").value(newest.getId()))
                .andExpect(jsonPath("$[1].id").value(middle.getId()))
                .andExpect(jsonPath("$[2].id").value(oldest.getId()));
    }

    @Test
    void getConsentements_afterUpdate_maintainsDescendingOrder() throws Exception {
        Dossier dossier = createDossier("Lead Ten", "+33622110099");

        ConsentementEntity consent1 = createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.PENDING);
        Thread.sleep(10);
        ConsentementEntity consent2 = createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.GRANTED);
        Thread.sleep(10);

        ConsentementUpdateRequest updateRequest = new ConsentementUpdateRequest();
        updateRequest.setChannel(ConsentementChannel.EMAIL);
        updateRequest.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent1.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(consent1.getId()))
                .andExpect(jsonPath("$[1].id").value(consent2.getId()));
    }

    @Test
    void postConsentement_createsAuditEventWithAfterState() throws Exception {
        Dossier dossier = createDossier("Lead Eleven", "+33611009988");

        ConsentementCreateRequest request = new ConsentementCreateRequest();
        request.setDossierId(dossier.getId());
        request.setChannel(ConsentementChannel.EMAIL);
        request.setStatus(ConsentementStatus.GRANTED);

        MvcResult result = mockMvc.perform(withTenantHeaders(post("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseContent, Map.class);
        Long consentId = ((Number) responseMap.get("id")).longValue();

        List<AuditEventEntity> audits = auditEventRepository.findAll();
        assertThat(audits).hasSize(1);

        AuditEventEntity audit = audits.get(0);
        assertThat(audit.getEntityType()).isEqualTo(AuditEntityType.CONSENTEMENT);
        assertThat(audit.getEntityId()).isEqualTo(consentId);
        assertThat(audit.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(audit.getDiff()).containsKey("after");
        assertThat(audit.getDiff().get("after")).isInstanceOf(Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> afterState = (Map<String, Object>) audit.getDiff().get("after");
        assertThat(afterState).containsEntry("channel", "EMAIL");
        assertThat(afterState).containsEntry("status", "GRANTED");
    }

    @Test
    void putConsentement_createsAuditEventWithStatusChange() throws Exception {
        Dossier dossier = createDossier("Lead Twelve", "+33600998877");
        ConsentementEntity consent = createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.PENDING);

        auditEventRepository.deleteAll();

        ConsentementUpdateRequest updateRequest = new ConsentementUpdateRequest();
        updateRequest.setChannel(ConsentementChannel.SMS);
        updateRequest.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        List<AuditEventEntity> audits = auditEventRepository.findAll();
        assertThat(audits).hasSize(1);

        AuditEventEntity audit = audits.get(0);
        assertThat(audit.getEntityType()).isEqualTo(AuditEntityType.CONSENTEMENT);
        assertThat(audit.getEntityId()).isEqualTo(consent.getId());
        assertThat(audit.getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(audit.getDiff()).containsKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) audit.getDiff().get("changes");
        assertThat(changes).containsKey("status");

        @SuppressWarnings("unchecked")
        Map<String, Object> statusChange = (Map<String, Object>) changes.get("status");
        assertThat(statusChange).containsEntry("before", "PENDING");
        assertThat(statusChange).containsEntry("after", "GRANTED");
    }

    @Test
    void putConsentement_multipleStatusTransitions_createsMultipleAuditEvents() throws Exception {
        Dossier dossier = createDossier("Lead Thirteen", "+33688776655");
        ConsentementEntity consent = createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.PENDING);

        auditEventRepository.deleteAll();

        ConsentementUpdateRequest firstUpdate = new ConsentementUpdateRequest();
        firstUpdate.setChannel(ConsentementChannel.WHATSAPP);
        firstUpdate.setStatus(ConsentementStatus.GRANTED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstUpdate)))
                .andExpect(status().isOk());

        ConsentementUpdateRequest secondUpdate = new ConsentementUpdateRequest();
        secondUpdate.setChannel(ConsentementChannel.WHATSAPP);
        secondUpdate.setStatus(ConsentementStatus.REVOKED);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondUpdate)))
                .andExpect(status().isOk());

        List<AuditEventEntity> audits = auditEventRepository.findAll();
        assertThat(audits).hasSize(2);

        AuditEventEntity firstAudit = audits.get(0);
        @SuppressWarnings("unchecked")
        Map<String, Object> firstChanges = (Map<String, Object>) firstAudit.getDiff().get("changes");
        @SuppressWarnings("unchecked")
        Map<String, Object> firstStatusChange = (Map<String, Object>) firstChanges.get("status");
        assertThat(firstStatusChange).containsEntry("before", "PENDING");
        assertThat(firstStatusChange).containsEntry("after", "GRANTED");

        AuditEventEntity secondAudit = audits.get(1);
        @SuppressWarnings("unchecked")
        Map<String, Object> secondChanges = (Map<String, Object>) secondAudit.getDiff().get("changes");
        @SuppressWarnings("unchecked")
        Map<String, Object> secondStatusChange = (Map<String, Object>) secondChanges.get("status");
        assertThat(secondStatusChange).containsEntry("before", "GRANTED");
        assertThat(secondStatusChange).containsEntry("after", "REVOKED");
    }

    @Test
    void putConsentement_withCustomMeta_mergesWithTrackingMeta() throws Exception {
        Dossier dossier = createDossier("Lead Fourteen", "+33677665544");
        
        Map<String, Object> initialMeta = new HashMap<>();
        initialMeta.put("source", "web");
        initialMeta.put("ipAddress", "192.168.1.1");
        
        ConsentementEntity consent = createConsentWithMeta(dossier, ConsentementChannel.EMAIL, 
                ConsentementStatus.PENDING, initialMeta);

        Map<String, Object> updateMeta = new HashMap<>();
        updateMeta.put("updateReason", "user request");
        
        ConsentementUpdateRequest updateRequest = new ConsentementUpdateRequest();
        updateRequest.setChannel(ConsentementChannel.EMAIL);
        updateRequest.setStatus(ConsentementStatus.REVOKED);
        updateRequest.setMeta(updateMeta);

        mockMvc.perform(withTenantHeaders(put("/api/v1/consentements/" + consent.getId()), ORG_ID, CORRELATION_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.source").value("web"))
                .andExpect(jsonPath("$.meta.ipAddress").value("192.168.1.1"))
                .andExpect(jsonPath("$.meta.updateReason").value("user request"))
                .andExpect(jsonPath("$.meta.previousStatus").value("PENDING"))
                .andExpect(jsonPath("$.meta.changedBy").exists())
                .andExpect(jsonPath("$.meta.changedAt").exists());
    }

    @Test
    void getConsentements_withPagination_returnsPagedResults() throws Exception {
        Dossier dossier = createDossier("Lead Fifteen", "+33600112233");
        
        for (int i = 0; i < 15; i++) {
            createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.GRANTED);
            Thread.sleep(5);
        }

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.totalElements").value(15))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));
    }

    @Test
    void getConsentements_withPaginationSecondPage_returnsRemainingResults() throws Exception {
        Dossier dossier = createDossier("Lead Sixteen", "+33600223344");
        
        for (int i = 0; i < 15; i++) {
            createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.PENDING);
            Thread.sleep(5);
        }

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString())
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.totalElements").value(15))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(10));
    }

    @Test
    void getConsentements_withPaginationAndChannelFilter_returnsFilteredPagedResults() throws Exception {
        Dossier dossier = createDossier("Lead Seventeen", "+33600334455");
        
        for (int i = 0; i < 8; i++) {
            createConsent(dossier, ConsentementChannel.EMAIL, ConsentementStatus.GRANTED);
            Thread.sleep(5);
        }
        for (int i = 0; i < 7; i++) {
            createConsent(dossier, ConsentementChannel.SMS, ConsentementStatus.PENDING);
            Thread.sleep(5);
        }

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString())
                        .param("channel", "EMAIL")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.content[*].channel", everyItem(is("EMAIL"))))
                .andExpect(jsonPath("$.totalElements").value(8));
    }

    @Test
    void getConsentements_paginatedResults_maintainDescendingOrderByUpdatedAt() throws Exception {
        Dossier dossier = createDossier("Lead Eighteen", "+33600445566");
        
        for (int i = 0; i < 5; i++) {
            createConsent(dossier, ConsentementChannel.WHATSAPP, ConsentementStatus.GRANTED);
            Thread.sleep(10);
        }

        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(5)));

        List<ConsentementEntity> consents = consentementRepository.findByDossierIdOrderByUpdatedAtDesc(dossier.getId());
        
        mockMvc.perform(withTenantHeaders(get("/api/v1/consentements"), ORG_ID, CORRELATION_ID)
                        .param("dossierId", dossier.getId().toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(consents.get(0).getId()))
                .andExpect(jsonPath("$.content[1].id").value(consents.get(1).getId()))
                .andExpect(jsonPath("$.content[2].id").value(consents.get(2).getId()))
                .andExpect(jsonPath("$.content[3].id").value(consents.get(3).getId()))
                .andExpect(jsonPath("$.content[4].id").value(consents.get(4).getId()));
    }

    private Dossier createDossier(String leadName, String leadPhone) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadName(leadName);
        dossier.setLeadPhone(leadPhone);
        dossier.setStatus(DossierStatus.NEW);
        return dossierRepository.save(dossier);
    }

    private ConsentementEntity createConsent(Dossier dossier, ConsentementChannel channel, ConsentementStatus status) {
        return createConsentWithMeta(dossier, channel, status, null);
    }

    private ConsentementEntity createConsentWithMeta(Dossier dossier, ConsentementChannel channel, 
                                                     ConsentementStatus status, Map<String, Object> meta) {
        ConsentementEntity consent = new ConsentementEntity();
        consent.setOrgId(ORG_ID);
        consent.setDossier(dossier);
        consent.setChannel(channel);
        consent.setStatus(status);
        consent.setConsentType(ConsentementType.MARKETING);
        if (meta != null) {
            consent.setMeta(new HashMap<>(meta));
        }
        return consentementRepository.save(consent);
    }
}
