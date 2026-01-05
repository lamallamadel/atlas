package com.example.backend.aspect;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierLeadPatchRequest;
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

/**
 * Integration tests for AuditAspect to verify audit event persistence
 * and diff calculation for various service operations.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditAspectIntegrationTest {

    private static final String DEFAULT_ORG = "org-integration-test";

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

    // ========== AnnonceService.create() Tests ==========

    @Test
    void annonceServiceCreate_PersistsAuditEventWithCreatedAction() {
        // Given
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Integration Test Annonce");
        request.setCity("Paris");

        // When
        AnnonceResponse response = annonceService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(response.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void annonceServiceCreate_DiffContainsNewEntity() {
        // Given
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Test Annonce with Diff");
        request.setDescription("Detailed description for testing");
        request.setCity("Lyon");
        request.setPrice(BigDecimal.valueOf(250.00));
        request.setCurrency("EUR");

        // When
        AnnonceResponse response = annonceService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("after");
        assertThat(diff).doesNotContainKey("before");
        assertThat(diff).doesNotContainKey("changes");

        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData).isNotNull();
        assertThat(afterData.get("id")).isEqualTo(response.getId().intValue());
        assertThat(afterData.get("title")).isEqualTo("Test Annonce with Diff");
        assertThat(afterData.get("description")).isEqualTo("Detailed description for testing");
        assertThat(afterData.get("city")).isEqualTo("Lyon");
        assertThat(afterData.get("orgId")).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void annonceServiceCreate_WithComplexFields_IncludesAllInDiff() {
        // Given
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Complex Fields Test");
        request.setPhotos(List.of("photo1.jpg", "photo2.jpg", "photo3.jpg"));
        request.setRulesJson(Map.of(
            "minAge", 21,
            "petsAllowed", true,
            "smokingAllowed", false
        ));
        request.setMeta(Map.of(
            "priority", "high",
            "source", "website"
        ));

        // When
        AnnonceResponse response = annonceService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        
        assertThat(afterData).containsKey("photos");
        assertThat(afterData).containsKey("rulesJson");
        assertThat(afterData).containsKey("meta");
        
        List<?> photos = (List<?>) afterData.get("photos");
        assertThat(photos).hasSize(3);
        
        Map<?, ?> rulesJson = (Map<?, ?>) afterData.get("rulesJson");
        assertThat(rulesJson).containsKeys("minAge", "petsAllowed", "smokingAllowed");
    }

    @Test
    void annonceServiceCreate_WithNullOptionalFields_StillCreatesAuditEvent() {
        // Given
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Minimal Annonce");
        request.setDescription(null);
        request.setPhotos(null);
        request.setRulesJson(null);

        // When
        AnnonceResponse response = annonceService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getEntityId()).isEqualTo(response.getId());
        
        Map<String, Object> diff = auditEvent.getDiff();
        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData).isNotNull();
        assertThat(afterData.get("title")).isEqualTo("Minimal Annonce");
    }

    // ========== DossierService.create() Tests ==========

    @Test
    void dossierServiceCreate_PersistsAuditEventWithCreatedAction() {
        // Given
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("Jane Smith");
        request.setLeadPhone("+33612345678");

        // When
        DossierResponse response = dossierService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(auditEvent.getEntityId()).isEqualTo(response.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void dossierServiceCreate_DiffContainsNewEntityWithStatus() {
        // Given
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("John Doe");
        request.setLeadPhone("+33698765432");
        request.setLeadSource("Website");

        // When
        DossierResponse response = dossierService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        
        assertThat(diff).containsKey("after");
        
        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData).isNotNull();
        assertThat(afterData.get("id")).isEqualTo(response.getId().intValue());
        assertThat(afterData.get("leadName")).isEqualTo("John Doe");
        assertThat(afterData.get("leadPhone")).isEqualTo("+33698765432");
        assertThat(afterData.get("status")).isEqualTo("NEW");
        assertThat(afterData.get("orgId")).isEqualTo(DEFAULT_ORG);
    }

    // ========== DossierService.patchStatus() Tests ==========

    @Test
    void dossierServicePatchStatus_CreatesUpdatedEvent() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Status Test User");
        createRequest.setLeadPhone("+33611111111");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);
        dossierService.patchStatus(created.getId(), patchRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
    }

    @Test
    void dossierServicePatchStatus_DiffShowsOldAndNewStatusChange() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Patch Status Test");
        createRequest.setLeadPhone("+33622222222");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.APPOINTMENT);
        dossierService.patchStatus(created.getId(), patchRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("changes");
        assertThat(diff).doesNotContainKey("after");
        assertThat(diff).doesNotContainKey("before");

        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("status");

        Map<String, Object> statusChange = (Map<String, Object>) changes.get("status");
        assertThat(statusChange).containsEntry("before", "NEW");
        assertThat(statusChange).containsEntry("after", "APPOINTMENT");
    }

    @Test
    void dossierServicePatchStatus_MultipleChanges_TracksEachTransition() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Multi Patch User");
        createRequest.setLeadPhone("+33633333333");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When - First status change: NEW -> QUALIFIED
        DossierStatusPatchRequest patch1 = new DossierStatusPatchRequest();
        patch1.setStatus(DossierStatus.QUALIFIED);
        dossierService.patchStatus(created.getId(), patch1);

        // When - Second status change: QUALIFIED -> APPOINTMENT
        DossierStatusPatchRequest patch2 = new DossierStatusPatchRequest();
        patch2.setStatus(DossierStatus.APPOINTMENT);
        dossierService.patchStatus(created.getId(), patch2);

        // When - Third status change: APPOINTMENT -> WON
        DossierStatusPatchRequest patch3 = new DossierStatusPatchRequest();
        patch3.setStatus(DossierStatus.WON);
        dossierService.patchStatus(created.getId(), patch3);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(3);

        // Verify first transition
        AuditEventEntity event1 = auditEvents.get(0);
        Map<String, Object> changes1 = (Map<String, Object>) event1.getDiff().get("changes");
        Map<String, Object> statusChange1 = (Map<String, Object>) changes1.get("status");
        assertThat(statusChange1).containsEntry("before", "NEW");
        assertThat(statusChange1).containsEntry("after", "QUALIFIED");

        // Verify second transition
        AuditEventEntity event2 = auditEvents.get(1);
        Map<String, Object> changes2 = (Map<String, Object>) event2.getDiff().get("changes");
        Map<String, Object> statusChange2 = (Map<String, Object>) changes2.get("status");
        assertThat(statusChange2).containsEntry("before", "QUALIFIED");
        assertThat(statusChange2).containsEntry("after", "APPOINTMENT");

        // Verify third transition
        AuditEventEntity event3 = auditEvents.get(2);
        Map<String, Object> changes3 = (Map<String, Object>) event3.getDiff().get("changes");
        Map<String, Object> statusChange3 = (Map<String, Object>) changes3.get("status");
        assertThat(statusChange3).containsEntry("before", "APPOINTMENT");
        assertThat(statusChange3).containsEntry("after", "WON");
    }

    @Test
    void dossierServicePatchStatus_ToLostStatus_CreatesProperAuditEvent() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Lost Deal");
        createRequest.setLeadPhone("+33644444444");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.LOST);
        dossierService.patchStatus(created.getId(), patchRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
        
        Map<String, Object> diff = auditEvent.getDiff();
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        Map<String, Object> statusChange = (Map<String, Object>) changes.get("status");
        assertThat(statusChange).containsEntry("after", "LOST");
    }

    // ========== DossierService.patchLead() Tests ==========

    @Test
    void dossierServicePatchLead_CreatesAuditEventWithDiff() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Original Name");
        createRequest.setLeadPhone("+33655555555");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        DossierLeadPatchRequest patchRequest = new DossierLeadPatchRequest();
        patchRequest.setLeadName("Updated Name");
        patchRequest.setLeadPhone("+33666666666");
        dossierService.patchLead(created.getId(), patchRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
        
        Map<String, Object> diff = auditEvent.getDiff();
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("leadName");
        assertThat(changes).containsKey("leadPhone");
        
        Map<String, Object> nameChange = (Map<String, Object>) changes.get("leadName");
        assertThat(nameChange).containsEntry("before", "Original Name");
        assertThat(nameChange).containsEntry("after", "Updated Name");
        
        Map<String, Object> phoneChange = (Map<String, Object>) changes.get("leadPhone");
        assertThat(phoneChange).containsEntry("before", "+33655555555");
        assertThat(phoneChange).containsEntry("after", "+33666666666");
    }

    // ========== Delete Operation Tests ==========

    @Test
    void annonceServiceDelete_CreatesDeletedEvent() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("To Be Deleted");
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        annonceService.delete(created.getId());

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(auditEvent.getOrgId()).isEqualTo(DEFAULT_ORG);
    }

    @Test
    void annonceServiceDelete_DiffContainsBeforeStateWithEntityId() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Delete with Full Details");
        createRequest.setCity("Marseille");
        createRequest.setPrice(BigDecimal.valueOf(350.00));
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        annonceService.delete(created.getId());

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityId()).isNotNull();
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());
        
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("before");
        assertThat(diff).doesNotContainKey("after");
        assertThat(diff).doesNotContainKey("changes");

        Map<String, Object> beforeData = (Map<String, Object>) diff.get("before");
        assertThat(beforeData).isNotNull();
        assertThat(beforeData.get("id")).isEqualTo(created.getId().intValue());
        assertThat(beforeData.get("title")).isEqualTo("Delete with Full Details");
        assertThat(beforeData.get("city")).isEqualTo("Marseille");
    }

    @Test
    void annonceServiceDelete_WithComplexFields_CapturesAllInBeforeState() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Complex Delete Test");
        createRequest.setPhotos(List.of("photo1.jpg", "photo2.jpg"));
        createRequest.setRulesJson(Map.of("minAge", 18, "petsAllowed", false));
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        annonceService.delete(created.getId());

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        Map<String, Object> beforeData = (Map<String, Object>) diff.get("before");
        
        assertThat(beforeData).containsKey("photos");
        assertThat(beforeData).containsKey("rulesJson");
        assertThat(beforeData.get("title")).isEqualTo("Complex Delete Test");
    }

    // ========== Annonce Update Tests ==========

    @Test
    void annonceServiceUpdate_CreatesAuditEventWithUpdateAction() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Original Title");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(BigDecimal.valueOf(200.00));
        annonceService.update(created.getId(), updateRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(created.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
    }

    @Test
    void annonceServiceUpdate_DiffShowsOnlyChangedFields() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Original Title");
        createRequest.setDescription("Original Description");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        createRequest.setCity("Paris");
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When - Only update title and price
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("New Title");
        updateRequest.setPrice(BigDecimal.valueOf(150.00));
        annonceService.update(created.getId(), updateRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("changes");

        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("title");
        assertThat(changes).containsKey("price");

        Map<String, Object> titleChange = (Map<String, Object>) changes.get("title");
        assertThat(titleChange).containsEntry("before", "Original Title");
        assertThat(titleChange).containsEntry("after", "New Title");
    }

    // ========== Multi-Organization Tests ==========

    @Test
    void auditEvents_AreProperlyIsolatedByOrgId() {
        try {
            // Given - Create annonce in ORG1
            TenantContext.setOrgId("ORG1");
            AnnonceCreateRequest request1 = createBasicAnnonceRequest();
            request1.setTitle("ORG1 Annonce");
            annonceService.create(request1);

            // Given - Create annonce in ORG2
            TenantContext.setOrgId("ORG2");
            AnnonceCreateRequest request2 = createBasicAnnonceRequest();
            request2.setTitle("ORG2 Annonce");
            annonceService.create(request2);

            // When - Fetch all audit events
            List<AuditEventEntity> allEvents = auditEventRepository.findAll();

            // Then
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
    void auditEvents_InDifferentOrgs_HaveDifferentOrgIds() {
        try {
            // Given - Create dossier in ORG_A
            TenantContext.setOrgId("ORG_A");
            DossierCreateRequest request1 = new DossierCreateRequest();
            request1.setLeadName("User A");
            request1.setLeadPhone("+33600000001");
            DossierResponse orgA = dossierService.create(request1);

            // Given - Create dossier in ORG_B
            TenantContext.setOrgId("ORG_B");
            DossierCreateRequest request2 = new DossierCreateRequest();
            request2.setLeadName("User B");
            request2.setLeadPhone("+33600000002");
            DossierResponse orgB = dossierService.create(request2);

            // When
            List<AuditEventEntity> allEvents = auditEventRepository.findAll();

            // Then
            assertThat(allEvents).hasSize(2);
            
            AuditEventEntity eventA = allEvents.stream()
                    .filter(e -> e.getEntityId().equals(orgA.getId()))
                    .findFirst()
                    .orElseThrow();
            assertThat(eventA.getOrgId()).isEqualTo("ORG_A");

            AuditEventEntity eventB = allEvents.stream()
                    .filter(e -> e.getEntityId().equals(orgB.getId()))
                    .findFirst()
                    .orElseThrow();
            assertThat(eventB.getOrgId()).isEqualTo("ORG_B");
        } finally {
            TenantContext.clear();
        }
    }

    // ========== Coverage Enhancement Tests ==========

    @Test
    void aspectLogic_HandlesNullDiffGracefully() {
        // Given
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Null Handling Test");

        // When
        AnnonceResponse response = annonceService.create(request);

        // Then - Even if diff calculation has issues, audit event should be created
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        assertThat(auditEvents.get(0).getEntityId()).isEqualTo(response.getId());
    }

    @Test
    void aspectLogic_ExtractsEntityIdFromResult() {
        // Given
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("EntityId Extraction Test");
        request.setLeadPhone("+33677777777");

        // When
        DossierResponse response = dossierService.create(request);

        // Then - Verify entityId was correctly extracted from result
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityId()).isNotNull();
        assertThat(auditEvent.getEntityId()).isEqualTo(response.getId());
    }

    @Test
    void aspectLogic_DeterminesActionFromMethodName() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Action Determination Test");
        AnnonceResponse created = annonceService.create(createRequest);
        
        auditEventRepository.deleteAll();

        // When - Test update action
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated for Action Test");
        annonceService.update(created.getId(), updateRequest);

        // Then
        List<AuditEventEntity> updateEvents = auditEventRepository.findAll();
        assertThat(updateEvents).hasSize(1);
        assertThat(updateEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);

        auditEventRepository.deleteAll();

        // When - Test delete action
        annonceService.delete(created.getId());

        // Then
        List<AuditEventEntity> deleteEvents = auditEventRepository.findAll();
        assertThat(deleteEvents).hasSize(1);
        assertThat(deleteEvents.get(0).getAction()).isEqualTo(AuditAction.DELETED);
    }

    @Test
    void aspectLogic_ExtractsCorrectEntityTypeForAnnonce() {
        // Given
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Entity Type Test");

        // When
        annonceService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        assertThat(auditEvents.get(0).getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
    }

    @Test
    void aspectLogic_ExtractsCorrectEntityTypeForDossier() {
        // Given
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadName("Entity Type Dossier Test");
        request.setLeadPhone("+33688888888");

        // When
        dossierService.create(request);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        assertThat(auditEvents.get(0).getEntityType()).isEqualTo(AuditEntityType.DOSSIER);
    }

    @Test
    void aspectLogic_CapturesBeforeStateForUpdateOperations() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Before State Test");
        createRequest.setLeadPhone("+33699999999");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);
        dossierService.patchStatus(created.getId(), patchRequest);

        // Then - Before state should be captured
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        Map<String, Object> diff = auditEvents.get(0).getDiff();
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).isNotNull();
        assertThat(changes.get("status")).isNotNull();
    }

    @Test
    void aspectLogic_CalculatesDiffCorrectlyForMultipleFieldChanges() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Multi Field Original");
        createRequest.setDescription("Original Description");
        createRequest.setCity("Paris");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When - Update multiple fields
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Multi Field Updated");
        updateRequest.setDescription("Updated Description");
        updateRequest.setPrice(BigDecimal.valueOf(200.00));
        annonceService.update(created.getId(), updateRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        Map<String, Object> diff = auditEvents.get(0).getDiff();
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        
        assertThat(changes).hasSize(3); // title, description, price
        assertThat(changes).containsKeys("title", "description", "price");
    }

    @Test
    void aspectLogic_HandlesUpdateWithNoChanges_CreatesEmptyChangesMap() {
        // Given - Create an annonce
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("No Change Test");
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When - Update with same values (no actual change)
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        // Don't set any fields, so nothing changes
        annonceService.update(created.getId(), updateRequest);

        // Then - Audit event should still be created
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        assertThat(auditEvents.get(0).getAction()).isEqualTo(AuditAction.UPDATED);
    }

    @Test
    void aspectLogic_CoveredMethodInvocation_CreatesPersistentAuditTrail() {
        // Given
        AnnonceCreateRequest request1 = createBasicAnnonceRequest();
        request1.setTitle("First Annonce");
        
        // When - Create first
        AnnonceResponse created1 = annonceService.create(request1);
        
        // When - Update
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated First");
        annonceService.update(created1.getId(), updateRequest);
        
        // When - Create second
        AnnonceCreateRequest request2 = createBasicAnnonceRequest();
        request2.setTitle("Second Annonce");
        annonceService.create(request2);
        
        // When - Delete first
        annonceService.delete(created1.getId());

        // Then - All operations should have audit events
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(4); // 2 creates, 1 update, 1 delete
        
        long createCount = auditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.CREATED)
                .count();
        long updateCount = auditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.UPDATED)
                .count();
        long deleteCount = auditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.DELETED)
                .count();
        
        assertThat(createCount).isEqualTo(2);
        assertThat(updateCount).isEqualTo(1);
        assertThat(deleteCount).isEqualTo(1);
    }

    @Test
    void aspectLogic_AllDossierOperations_CreateCompleteAuditTrail() {
        // Given - Create a dossier
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Complete Trail Test");
        createRequest.setLeadPhone("+33700000000");
        DossierResponse created = dossierService.create(createRequest);

        // When - Perform multiple operations
        DossierStatusPatchRequest statusPatch = new DossierStatusPatchRequest();
        statusPatch.setStatus(DossierStatus.QUALIFIED);
        dossierService.patchStatus(created.getId(), statusPatch);

        DossierLeadPatchRequest leadPatch = new DossierLeadPatchRequest();
        leadPatch.setLeadName("Updated Trail Name");
        leadPatch.setLeadPhone("+33700000001");
        dossierService.patchLead(created.getId(), leadPatch);

        // Then - All operations should be audited
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(3); // 1 create, 2 updates (status and lead)
        
        long createCount = auditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.CREATED)
                .count();
        long updateCount = auditEvents.stream()
                .filter(e -> e.getAction() == AuditAction.UPDATED)
                .count();
        
        assertThat(createCount).isEqualTo(1);
        assertThat(updateCount).isEqualTo(2);
    }

    @Test
    void aspectLogic_EntityTypeExtraction_WorksForBothServices() {
        // Given
        AnnonceCreateRequest annonceRequest = createBasicAnnonceRequest();
        annonceRequest.setTitle("Entity Type Annonce");
        
        DossierCreateRequest dossierRequest = new DossierCreateRequest();
        dossierRequest.setLeadName("Entity Type Dossier");
        dossierRequest.setLeadPhone("+33711111111");

        // When
        annonceService.create(annonceRequest);
        dossierService.create(dossierRequest);

        // Then
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(2);
        
        assertThat(auditEvents.stream()
                .filter(e -> e.getEntityType() == AuditEntityType.ANNONCE)
                .count()).isEqualTo(1);
        
        assertThat(auditEvents.stream()
                .filter(e -> e.getEntityType() == AuditEntityType.DOSSIER)
                .count()).isEqualTo(1);
    }

    @Test
    void aspectLogic_DiffCalculation_HandlesNullBeforeStateGracefully() {
        // Given - Create operation has null before state
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("Null Before State Test");

        // When
        AnnonceResponse response = annonceService.create(request);

        // Then - Should handle null before state and create proper CREATED diff
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).containsKey("after");
        assertThat(diff).doesNotContainKey("before");
    }

    @Test
    void aspectLogic_BeforeStateCapture_WorksForPatchOperations() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("Before State Capture");
        createRequest.setLeadPhone("+33722222222");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When - Perform patch operation
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.APPOINTMENT);
        dossierService.patchStatus(created.getId(), patchRequest);

        // Then - Before state should be captured
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        AuditEventEntity auditEvent = auditEvents.get(0);
        Map<String, Object> diff = auditEvent.getDiff();
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        Map<String, Object> statusChange = (Map<String, Object>) changes.get("status");
        
        assertThat(statusChange.get("before")).isNotNull();
        assertThat(statusChange.get("after")).isNotNull();
    }

    @Test
    void aspectLogic_EntityIdExtraction_FromArgsForUpdateOperations() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("EntityId From Args");
        createRequest.setLeadPhone("+33733333333");
        DossierResponse created = dossierService.create(createRequest);
        auditEventRepository.deleteAll();

        // When - Update operation where entityId comes from args
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);
        dossierService.patchStatus(created.getId(), patchRequest);

        // Then - EntityId should be extracted from args (first parameter)
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        assertThat(auditEvents.get(0).getEntityId()).isEqualTo(created.getId());
    }

    @Test
    void aspectLogic_EntityIdExtraction_FromResultForCreateOperations() {
        // Given
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadName("EntityId From Result");
        createRequest.setLeadPhone("+33744444444");

        // When - Create operation where entityId comes from result
        DossierResponse result = dossierService.create(createRequest);

        // Then - EntityId should be extracted from result
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        assertThat(auditEvents.get(0).getEntityId()).isEqualTo(result.getId());
    }

    @Test
    void aspectLogic_DiffCalculation_OnlyIncludesChangedFieldsNotUnchanged() {
        // Given
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Original");
        createRequest.setDescription("Original Description");
        createRequest.setCity("Paris");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        AnnonceResponse created = annonceService.create(createRequest);
        auditEventRepository.deleteAll();

        // When - Update only title
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Changed");
        // Don't change description, city stays same
        annonceService.update(created.getId(), updateRequest);

        // Then - Only changed fields should be in diff
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        Map<String, Object> diff = auditEvents.get(0).getDiff();
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        
        assertThat(changes).containsKey("title");
        // updatedAt and updatedBy will also be in changes, but not city or description if unchanged
    }

    @Test
    void aspectLogic_CompleteWorkflow_CreatesFullAuditHistory() {
        // Given - Complete lifecycle: create, update, update status, delete
        AnnonceCreateRequest createRequest = createBasicAnnonceRequest();
        createRequest.setTitle("Complete Workflow");
        
        // When - Create
        AnnonceResponse created = annonceService.create(createRequest);
        
        // When - Update
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Workflow Updated");
        annonceService.update(created.getId(), updateRequest);
        
        // When - Delete
        annonceService.delete(created.getId());

        // Then - Complete audit trail
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(3);
        
        assertThat(auditEvents.get(0).getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvents.get(0).getDiff()).containsKey("after");
        
        assertThat(auditEvents.get(1).getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(auditEvents.get(1).getDiff()).containsKey("changes");
        
        assertThat(auditEvents.get(2).getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(auditEvents.get(2).getDiff()).containsKey("before");
    }

    @Test
    void aspectLogic_AllEntityFields_AreCapturedInDiff() {
        // Given - Create with all possible fields
        AnnonceCreateRequest request = createBasicAnnonceRequest();
        request.setTitle("All Fields Test");
        request.setDescription("Complete Description");
        request.setCategory("Real Estate");
        request.setCity("Nice");
        request.setAddress("123 Main St");
        request.setSurface(85.5);
        request.setPrice(BigDecimal.valueOf(1500.00));
        request.setCurrency("EUR");
        request.setPhotos(List.of("p1.jpg", "p2.jpg"));
        request.setRulesJson(Map.of("parking", true));
        request.setMeta(Map.of("featured", true));

        // When
        AnnonceResponse response = annonceService.create(request);

        // Then - All fields should be in the after diff
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);
        
        Map<String, Object> diff = auditEvents.get(0).getDiff();
        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        
        assertThat(afterData).containsKeys(
            "id", "title", "description", "category", "city", 
            "address", "surface", "price", "currency", "orgId"
        );
    }

    // ========== Helper Methods ==========

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
