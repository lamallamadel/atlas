package com.example.backend.service;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AnnonceServiceTest {

    private static final String DEFAULT_ORG = "org123";

    @Autowired
    private AnnonceService annonceService;

    @Autowired
    private AnnonceRepository annonceRepository;

    @BeforeEach
    void setUp() {
        annonceRepository.deleteAll();
        TenantContext.setOrgId(DEFAULT_ORG);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_WithPhotos_PersistsCorrectly() {
        AnnonceCreateRequest request = createBasicRequest();
        List<String> photos = Arrays.asList(
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg",
            "https://example.com/photo3.jpg"
        );
        request.setPhotos(photos);

        AnnonceResponse response = annonceService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getPhotos()).isNotNull();
        assertThat(response.getPhotos()).hasSize(3);
        assertThat(response.getPhotos()).containsExactlyInAnyOrder(
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg",
            "https://example.com/photo3.jpg"
        );

        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getPhotos()).isNotNull();
        assertThat(persisted.getPhotos()).hasSize(3);
        assertThat(persisted.getPhotos()).containsExactlyInAnyOrder(
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg",
            "https://example.com/photo3.jpg"
        );
    }

    @Test
    void create_WithRulesJson_PersistsCorrectly() {
        AnnonceCreateRequest request = createBasicRequest();
        Map<String, Object> rules = new HashMap<>();
        rules.put("minAge", 18);
        rules.put("petsAllowed", false);
        rules.put("smokingAllowed", false);
        rules.put("maxOccupants", 4);
        rules.put("depositAmount", 1000.0);
        request.setRulesJson(rules);

        AnnonceResponse response = annonceService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getRulesJson()).isNotNull();
        assertThat(response.getRulesJson()).hasSize(5);
        assertThat(response.getRulesJson().get("minAge")).isEqualTo(18);
        assertThat(response.getRulesJson().get("petsAllowed")).isEqualTo(false);
        assertThat(response.getRulesJson().get("smokingAllowed")).isEqualTo(false);
        assertThat(response.getRulesJson().get("maxOccupants")).isEqualTo(4);
        assertThat(response.getRulesJson().get("depositAmount")).isEqualTo(1000.0);

        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getRulesJson()).isNotNull();
        assertThat(persisted.getRulesJson()).hasSize(5);
        assertThat(persisted.getRulesJson().get("minAge")).isEqualTo(18);
        assertThat(persisted.getRulesJson().get("petsAllowed")).isEqualTo(false);
    }

    @Test
    void create_WithComplexRulesJson_PersistsCorrectly() {
        AnnonceCreateRequest request = createBasicRequest();
        Map<String, Object> rules = new HashMap<>();
        rules.put("visitingHours", Map.of("start", "09:00", "end", "18:00"));
        rules.put("allowedPets", Arrays.asList("cat", "dog"));
        rules.put("amenities", Map.of(
            "wifi", true,
            "parking", true,
            "pool", false
        ));
        request.setRulesJson(rules);

        AnnonceResponse response = annonceService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getRulesJson()).isNotNull();
        assertThat(response.getRulesJson()).hasSize(3);
        assertThat(response.getRulesJson().get("allowedPets")).isInstanceOf(List.class);
        assertThat(response.getRulesJson().get("visitingHours")).isInstanceOf(Map.class);
        assertThat(response.getRulesJson().get("amenities")).isInstanceOf(Map.class);

        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getRulesJson()).isNotNull();
        assertThat(persisted.getRulesJson()).containsKeys("visitingHours", "allowedPets", "amenities");
    }

    @Test
    void create_WithBothPhotosAndRules_PersistsBothCorrectly() {
        AnnonceCreateRequest request = createBasicRequest();
        request.setPhotos(Arrays.asList(
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg"
        ));

        Map<String, Object> rules = new HashMap<>();
        rules.put("minAge", 21);
        rules.put("petsAllowed", true);
        request.setRulesJson(rules);

        AnnonceResponse response = annonceService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getPhotos()).hasSize(2);
        assertThat(response.getRulesJson()).hasSize(2);

        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getPhotos()).hasSize(2);
        assertThat(persisted.getRulesJson()).hasSize(2);
    }

    @Test
    void create_WithEmptyPhotos_PersistsEmpty() {
        AnnonceCreateRequest request = createBasicRequest();
        request.setPhotos(Collections.emptyList());

        AnnonceResponse response = annonceService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getPhotos()).isEmpty();

        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getPhotos()).isEmpty();
    }

    @Test
    void create_WithNullPhotosAndRules_PersistsNull() {
        AnnonceCreateRequest request = createBasicRequest();
        request.setPhotos(null);
        request.setRulesJson(null);

        AnnonceResponse response = annonceService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getPhotos()).isNull();
        assertThat(response.getRulesJson()).isNull();

        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getPhotos()).isNull();
        assertThat(persisted.getRulesJson()).isNull();
    }

    @Test
    void update_WithNewPhotos_UpdatesPersistence() {
        AnnonceCreateRequest createRequest = createBasicRequest();
        createRequest.setPhotos(List.of("https://example.com/old1.jpg"));
        AnnonceResponse created = annonceService.create(createRequest);

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setPhotos(Arrays.asList(
            "https://example.com/new1.jpg",
            "https://example.com/new2.jpg"
        ));

        AnnonceResponse updated = annonceService.update(created.getId(), updateRequest);

        assertThat(updated.getPhotos()).hasSize(2);

        Annonce persisted = annonceRepository.findById(updated.getId()).orElseThrow();
        assertThat(persisted.getPhotos()).hasSize(2);
    }

    @Test
    void update_WithNewRulesJson_UpdatesPersistence() {
        AnnonceCreateRequest createRequest = createBasicRequest();
        Map<String, Object> originalRules = new HashMap<>();
        originalRules.put("minAge", 18);
        createRequest.setRulesJson(originalRules);
        AnnonceResponse created = annonceService.create(createRequest);

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        Map<String, Object> newRules = new HashMap<>();
        newRules.put("minAge", 25);
        newRules.put("petsAllowed", true);
        updateRequest.setRulesJson(newRules);

        AnnonceResponse updated = annonceService.update(created.getId(), updateRequest);

        assertThat(updated.getRulesJson()).hasSize(2);
        assertThat(updated.getRulesJson().get("minAge")).isEqualTo(25);

        Annonce persisted = annonceRepository.findById(updated.getId()).orElseThrow();
        assertThat(persisted.getRulesJson()).hasSize(2);
        assertThat(persisted.getRulesJson().get("minAge")).isEqualTo(25);
    }

    @Test
    void create_HappyPath_ReturnsCreatedAnnonce() {
        AnnonceCreateRequest request = createBasicRequest();

        AnnonceResponse result = annonceService.create(request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isNotNull();
        assertThat(result.getOrgId()).isEqualTo(DEFAULT_ORG);
        assertThat(result.getTitle()).isEqualTo("Test Annonce");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getCategory()).isEqualTo("Electronics");
        assertThat(result.getCity()).isEqualTo("Paris");
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(result.getCurrency()).isEqualTo("EUR");
        assertThat(result.getStatus()).isEqualTo(AnnonceStatus.DRAFT);
    }

    @Test
    void getById_HappyPath_ReturnsAnnonce() {
        AnnonceResponse created = annonceService.create(createBasicRequest());

        AnnonceResponse result = annonceService.getById(created.getId());

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(created.getId());
        assertThat(result.getTitle()).isEqualTo("Test Annonce");
    }

    @Test
    void getById_NotFound_ThrowsEntityNotFoundException() {
        assertThatThrownBy(() -> annonceService.getById(999L))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining("Annonce not found with id: 999");
    }

    @Test
    void update_HappyPath_ReturnsUpdatedAnnonce() {
        AnnonceResponse created = annonceService.create(createBasicRequest());

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);

        AnnonceResponse result = annonceService.update(created.getId(), updateRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(created.getId());
        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getStatus()).isEqualTo(AnnonceStatus.PUBLISHED);
    }

    @Test
    void update_NotFound_ThrowsEntityNotFoundException() {
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");

        assertThatThrownBy(() -> annonceService.update(999L, updateRequest))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining("Annonce not found with id: 999");
    }

    @Test
    void list_NoFilters_ReturnsAllAnnonces() {
        annonceService.create(createBasicRequest());
        annonceService.create(createBasicRequest());

        Pageable pageable = PageRequest.of(0, 20);
        Page<AnnonceResponse> result = annonceService.list(null, null, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    void list_WithStatusFilter_ReturnsFilteredAnnonces() {
        annonceService.create(createBasicRequest());

        AnnonceResponse published = annonceService.create(createBasicRequest());
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);
        annonceService.update(published.getId(), updateRequest);

        Pageable pageable = PageRequest.of(0, 20);
        Page<AnnonceResponse> result = annonceService.list(AnnonceStatus.DRAFT, null, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(AnnonceStatus.DRAFT);
    }

    @Test
    void list_WithSearchQuery_ReturnsMatchingAnnonces() {
        AnnonceCreateRequest request1 = createBasicRequest();
        request1.setTitle("Electronics Sale");
        annonceService.create(request1);

        AnnonceCreateRequest request2 = createBasicRequest();
        request2.setTitle("Furniture Sale");
        request2.setCategory("Furniture");
        annonceService.create(request2);

        Pageable pageable = PageRequest.of(0, 20);
        Page<AnnonceResponse> result = annonceService.list(null, "Electronics", null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).contains("Electronics");
    }

    @Test
    void update_ArchivedAnnonce_ThrowsIllegalStateException() {
        AnnonceResponse created = annonceService.create(createBasicRequest());

        AnnonceUpdateRequest archiveRequest = new AnnonceUpdateRequest();
        archiveRequest.setStatus(AnnonceStatus.ARCHIVED);
        annonceService.update(created.getId(), archiveRequest);

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("New Title");

        assertThatThrownBy(() -> annonceService.update(created.getId(), updateRequest))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot update an archived annonce");
    }

    @Test
    void create_WithMeta_PersistsCorrectly() {
        AnnonceCreateRequest request = createBasicRequest();
        request.setMeta(Map.of("priority", "high", "flags", List.of("NEW", "HOT")));

        AnnonceResponse response = annonceService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getMeta()).isNotNull();
        assertThat(response.getMeta().get("priority")).isEqualTo("high");
        assertThat(response.getMeta().get("flags")).isInstanceOf(List.class);

        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getMeta()).isNotNull();
        assertThat(persisted.getMeta().get("priority")).isEqualTo("high");
    }

    @Test
    void crossTenantIsolation_createInOrg1AndOrg2_org1CannotAccessOrg2() {
        try {
            TenantContext.setOrgId("ORG1");
            AnnonceCreateRequest request1 = createBasicRequest();
            request1.setTitle("ORG1 Annonce");
            AnnonceResponse org1Response = annonceService.create(request1);

            TenantContext.setOrgId("ORG2");
            AnnonceCreateRequest request2 = createBasicRequest();
            request2.setTitle("ORG2 Annonce");
            AnnonceResponse org2Response = annonceService.create(request2);

            TenantContext.setOrgId("ORG1");
            assertThatThrownBy(() -> annonceService.getById(org2Response.getId()))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Annonce not found with id: " + org2Response.getId());

            AnnonceResponse org1Retrieved = annonceService.getById(org1Response.getId());
            assertThat(org1Retrieved.getId()).isEqualTo(org1Response.getId());
            assertThat(org1Retrieved.getTitle()).isEqualTo("ORG1 Annonce");
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void crossTenantIsolation_org2CannotAccessOrg1Resources() {
        try {
            TenantContext.setOrgId("ORG1");
            AnnonceCreateRequest request = createBasicRequest();
            request.setTitle("ORG1 Private Annonce");
            AnnonceResponse org1Response = annonceService.create(request);

            TenantContext.setOrgId("ORG2");
            assertThatThrownBy(() -> annonceService.getById(org1Response.getId()))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Annonce not found with id: " + org1Response.getId());
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void crossTenantIsolation_updateAttemptFromWrongTenant_returns404() {
        try {
            TenantContext.setOrgId("ORG1");
            AnnonceCreateRequest createRequest = createBasicRequest();
            AnnonceResponse org1Response = annonceService.create(createRequest);

            TenantContext.setOrgId("ORG2");
            AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
            updateRequest.setTitle("Hacked Title");

            assertThatThrownBy(() -> annonceService.update(org1Response.getId(), updateRequest))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Annonce not found with id: " + org1Response.getId());
        } finally {
            TenantContext.clear();
        }
    }

    private AnnonceCreateRequest createBasicRequest() {
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        // orgId comes from TenantContext / header, so DO NOT set it in the DTO
        request.setTitle("Test Annonce");
        request.setDescription("Test Description");
        request.setCategory("Electronics");
        request.setCity("Paris");
        request.setPrice(BigDecimal.valueOf(100.00));
        request.setCurrency("EUR");
        return request;
    }
}
