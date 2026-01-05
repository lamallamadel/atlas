package com.example.backend.aspect;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.service.AnnonceService;
import com.example.backend.service.DossierService;
import com.example.backend.util.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditAspectTest {

    private static final String DEFAULT_ORG = "org123";

    @Autowired
    private AnnonceService annonceService;

    @Autowired
    private DossierService dossierService;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @BeforeEach
    void setUp() {
        auditEventRepository.deleteAll();
        TenantContext.setOrgId(DEFAULT_ORG);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void annonceServiceCreate_PersistsAuditEventWithCreateAction() {
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Test Annonce Title");
        request.setDescription("Test Description");
        request.setCity("Paris");
        request.setPrice(BigDecimal.valueOf(150.00));

        AnnonceResponse response = annonceService.create(request);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(response.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void annonceServiceCreate_AuditDiffContainsNewEntityFields() {
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Audit Test Annonce");
        request.setDescription("Audit Test Description");
        request.setCity("Lyon");
        request.setPrice(BigDecimal.valueOf(200.00));
        request.setCurrency("EUR");

        AnnonceResponse response = annonceService.create(request);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("after");

        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData).isNotNull();
        assertThat(afterData.get("id")).isEqualTo(response.getId().intValue());
        assertThat(afterData.get("title")).isEqualTo("Audit Test Annonce");
        assertThat(afterData.get("description")).isEqualTo("Audit Test Description");
        assertThat(afterData.get("city")).isEqualTo("Lyon");
        assertThat(afterData.get("orgId")).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void annonceServiceCreate_WithComplexFields_PersistsDiffCorrectly() {
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Complex Annonce");
        request.setPhotos(List.of("photo1.jpg", "photo2.jpg"));
        request.setRulesJson(Map.of("minAge", 18, "petsAllowed", false));

        AnnonceResponse response = annonceService.create(request);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("after");

        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData).containsKey("photos");
        assertThat(afterData).containsKey("rulesJson");
    }

    @Test
    void dossierServiceCreate_PersistsAuditEventWithCreateAction() {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("John Doe");
        request.setLeadPhone("+33612345678");

        DossierResponse response = dossierService.create(request);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(auditEvent.getEntityId()).isEqualTo(response.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void dossierServicePatchStatus_CreatesAuditWithUpdateAction() {
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Jane Smith");
        createRequest.setLeadPhone("+33698765432");
        DossierResponse created = dossierService.create(createRequest);

        auditEventRepository.deleteAll();

        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        dossierService.patchStatus(created.getId(), patchRequest);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void dossierServicePatchStatus_DiffShowsOldAndNewStatus() {
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Test User");
        createRequest.setLeadPhone("+33611111111");
        DossierResponse created = dossierService.create(createRequest);

        auditEventRepository.deleteAll();

        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.APPOINTMENT);

        dossierService.patchStatus(created.getId(), patchRequest);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("changes");

        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("status");

        Map<String, Object> statusChange = (Map<String, Object>) changes.get("status");
        assertThat(statusChange).containsEntry("before", "NEW");
        assertThat(statusChange).containsEntry("after", "APPOINTMENT");
    }

    @Test
    void dossierServicePatchStatus_MultipleStatusChanges_EachCreatesAuditEvent() {
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Multi Status Test");
        createRequest.setLeadPhone("+33622222222");
        DossierResponse created = dossierService.create(createRequest);

        auditEventRepository.deleteAll();

        DossierStatusPatchRequest patchRequest1 = new DossierStatusPatchRequest();
        patchRequest1.setStatus(DossierStatus.QUALIFIED);
        dossierService.patchStatus(created.getId(), patchRequest1);

        DossierStatusPatchRequest patchRequest2 = new DossierStatusPatchRequest();
        patchRequest2.setStatus(DossierStatus.APPOINTMENT);
        dossierService.patchStatus(created.getId(), patchRequest2);

        DossierStatusPatchRequest patchRequest3 = new DossierStatusPatchRequest();
        patchRequest3.setStatus(DossierStatus.WON);
        dossierService.patchStatus(created.getId(), patchRequest3);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(3);

        assertThat(auditEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(auditEvents.get(1).getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(auditEvents.get(2).getAction()).isEqualTo(AuditAction.UPDATED);

        Map<String, Object> firstChanges = (Map<String, Object>) auditEvents.get(0).getDiff().get("changes");
        Map<String, Object> firstStatusChange = (Map<String, Object>) firstChanges.get("status");
        assertThat(firstStatusChange).containsEntry("before", "NEW");
        assertThat(firstStatusChange).containsEntry("after", "QUALIFIED");

        Map<String, Object> secondChanges = (Map<String, Object>) auditEvents.get(1).getDiff().get("changes");
        Map<String, Object> secondStatusChange = (Map<String, Object>) secondChanges.get("status");
        assertThat(secondStatusChange).containsEntry("before", "QUALIFIED");
        assertThat(secondStatusChange).containsEntry("after", "APPOINTMENT");

        Map<String, Object> thirdChanges = (Map<String, Object>) auditEvents.get(2).getDiff().get("changes");
        Map<String, Object> thirdStatusChange = (Map<String, Object>) thirdChanges.get("status");
        assertThat(thirdStatusChange).containsEntry("before", "APPOINTMENT");
        assertThat(thirdStatusChange).containsEntry("after", "WON");
    }

    @Test
    void annonceServiceDelete_CreatesAuditEventWithDeleteAction() {
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("To Be Deleted");
        AnnonceResponse created = annonceService.create(createRequest);

        auditEventRepository.deleteAll();

        annonceService.delete(created.getId());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(auditEvent.getOrgId()).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void annonceServiceDelete_DiffContainsBeforeStateButNoAfter() {
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Delete Test Annonce");
        createRequest.setCity("Marseille");
        AnnonceResponse created = annonceService.create(createRequest);

        auditEventRepository.deleteAll();

        annonceService.delete(created.getId());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("before");
        assertThat(diff).doesNotContainKey("after");

        Map<String, Object> beforeData = (Map<String, Object>) diff.get("before");
        assertThat(beforeData).isNotNull();
        assertThat(beforeData.get("title")).isEqualTo("Delete Test Annonce");
        assertThat(beforeData.get("city")).isEqualTo("Marseille");
    }

    @Test
    void deleteOperation_HasEntityIdAndMinimalDiff() {
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Minimal Diff Test");
        AnnonceResponse created = annonceService.create(createRequest);

        auditEventRepository.deleteAll();

        annonceService.delete(created.getId());

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityId()).isNotNull();
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());

        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff.keySet()).containsOnly("before");
    }

    @Test
    void auditEvents_AreIsolatedByOrgId() {
        try {
            TenantContext.setOrgId("ORG1");
            AnnonceCreateRequest request1 = createBasicAnnonceRequest();
            request1.setTitle("ORG1 Annonce");
            annonceService.create(request1);

            TenantContext.setOrgId("ORG2");
            AnnonceCreateRequest request2 = createBasicAnnonceRequest();
            request2.setTitle("ORG2 Annonce");
            annonceService.create(request2);

            List<AuditEventEntity> allEvents = auditEventRepository.findAll();
            assertThat(allEvents).hasSize(2);

            long org1Count = allEvents.stream()
                    .filter(event -> "ORG1".equals(event.getOrgId()))
                    .count();
            long org2Count = allEvents.stream()
                    .filter(event -> "ORG2".equals(event.getOrgId()))
                    .count();

            assertThat(org1Count).isEqualTo(1);
            assertThat(org2Count).isEqualTo(1);
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void annonceUpdate_CreatesAuditEventWithUpdateAction() {
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Original Title");
        AnnonceResponse created = annonceService.create(createRequest);

        auditEventRepository.deleteAll();

        com.example.backend.dto.AnnonceUpdateRequest updateRequest = new com.example.backend.dto.AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");

        annonceService.update(created.getId(), updateRequest);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
    }

    @Test
    void annonceUpdate_DiffShowsChangedFields() {
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Original Title");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        AnnonceResponse created = annonceService.create(createRequest);

        auditEventRepository.deleteAll();

        com.example.backend.dto.AnnonceUpdateRequest updateRequest = new com.example.backend.dto.AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(BigDecimal.valueOf(150.00));

        annonceService.update(created.getId(), updateRequest);

        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("changes");

        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("title");
        assertThat(changes).containsKey("price");

        Map<String, Object> titleChange = (Map<String, Object>) changes.get("title");
        assertThat(titleChange).containsEntry("before", "Original Title");
        assertThat(titleChange).containsEntry("after", "Updated Title");
    }

    private AnnonceCreateRequest createBasicAnnonceRequest() {
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("Test Annonce");
        request.setDescription("Test Description");
        request.setCategory("Test Category");
        request.setCity("Paris");
        request.setPrice(BigDecimal.valueOf(100.00));
        request.setCurrency("EUR");
        return request;
    }
}
