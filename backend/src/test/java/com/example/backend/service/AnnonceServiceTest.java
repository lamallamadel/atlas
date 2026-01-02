package com.example.backend.service;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import jakarta.persistence.EntityNotFoundException;
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
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AnnonceServiceTest {

    @Autowired
    private AnnonceService annonceService;

    @Autowired
    private AnnonceRepository annonceRepository;

    @BeforeEach
    void setUp() {
        annonceRepository.deleteAll();
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
        List<String> photos = Arrays.asList(
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg"
        );
        request.setPhotos(photos);

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
        request.setPhotos(Arrays.asList());

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
        List<String> originalPhotos = Arrays.asList("https://example.com/old1.jpg");
        createRequest.setPhotos(originalPhotos);
        AnnonceResponse created = annonceService.create(createRequest);

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        List<String> newPhotos = Arrays.asList(
            "https://example.com/new1.jpg",
            "https://example.com/new2.jpg"
        );
        updateRequest.setPhotos(newPhotos);

        AnnonceResponse updated = annonceService.update(created.getId(), updateRequest);

        assertThat(updated.getPhotos()).hasSize(2);
        assertThat(updated.getPhotos()).containsExactlyInAnyOrder(
            "https://example.com/new1.jpg",
            "https://example.com/new2.jpg"
        );

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
        assertThat(updated.getRulesJson().get("petsAllowed")).isEqualTo(true);

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
        assertThat(result.getOrgId()).isEqualTo("org123");
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
        AnnonceCreateRequest request = createBasicRequest();
        AnnonceResponse created = annonceService.create(request);

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
        AnnonceCreateRequest createRequest = createBasicRequest();
        AnnonceResponse created = annonceService.create(createRequest);

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
        Page<AnnonceResponse> result = annonceService.list(null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    void list_WithStatusFilter_ReturnsFilteredAnnonces() {
        AnnonceCreateRequest draftRequest = createBasicRequest();
        annonceService.create(draftRequest);

        AnnonceCreateRequest publishedRequest = createBasicRequest();
        AnnonceResponse published = annonceService.create(publishedRequest);
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);
        annonceService.update(published.getId(), updateRequest);

        Pageable pageable = PageRequest.of(0, 20);
        Page<AnnonceResponse> result = annonceService.list(AnnonceStatus.DRAFT, null, pageable);

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
        Page<AnnonceResponse> result = annonceService.list(null, "Electronics", pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).contains("Electronics");
    }

    @Test
    void update_ArchivedAnnonce_ThrowsIllegalStateException() {
        AnnonceCreateRequest createRequest = createBasicRequest();
        AnnonceResponse created = annonceService.create(createRequest);
        
        // Archive it
        AnnonceUpdateRequest archiveRequest = new AnnonceUpdateRequest();
        archiveRequest.setStatus(AnnonceStatus.ARCHIVED);
        annonceService.update(created.getId(), archiveRequest);

        // Try to update it while archived
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

    private AnnonceCreateRequest createBasicRequest() {
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setOrgId("org123");
        request.setTitle("Test Annonce");
        request.setDescription("Test Description");
        request.setCategory("Electronics");
        request.setCity("Paris");
        request.setPrice(BigDecimal.valueOf(100.00));
        request.setCurrency("EUR");
        return request;
    }
}
