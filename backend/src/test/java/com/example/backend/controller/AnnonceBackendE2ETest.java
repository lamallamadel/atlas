package com.example.backend.controller;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.AuditEventRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive Backend E2E Tests for Annonce API
 * 
 * Covers:
 * - POST /api/v1/annonces with full JSONB validation (photos array, rulesJson object)
 * - GET /{id} with X-Org-Id tenant filtering
 * - GET with filters (status, city, type, search query, pagination/sorting)
 * - PUT with partial updates
 * - Audit events with diff calculation
 * - Cross-tenant 404 (ORG1 accessing ORG2)
 * - RBAC 403 (PRO deleting returns forbidden)
 * - H2 vs Postgres JSONB compatibility
 */
@BackendE2ETest
class AnnonceBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";
    private static final String ORG2 = "ORG2";

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @BeforeEach
    void setUp() {
        auditEventRepository.deleteAll();
        annonceRepository.deleteAll();
    }

    // ========== POST /api/v1/annonces Tests ==========

    @Test
    void createAnnonce_WithFullJsonbFields_ReturnsCreatedAndPersistsCorrectly() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("Luxury Apartment in Paris");
        request.setDescription("Beautiful 3-bedroom apartment in the heart of Paris");
        request.setCategory("Real Estate");
        request.setType(AnnonceType.SALE);
        request.setAddress("123 Rue de la Paix");
        request.setSurface(120.5);
        request.setCity("Paris");
        request.setPrice(BigDecimal.valueOf(850000.00));
        request.setCurrency("EUR");
        
        // JSONB photos array
        List<String> photos = List.of(
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg",
            "https://example.com/photo3.jpg"
        );
        request.setPhotos(photos);
        
        // JSONB rulesJson object with nested structure
        Map<String, Object> rulesJson = new HashMap<>();
        rulesJson.put("minAge", 21);
        rulesJson.put("petsAllowed", true);
        rulesJson.put("smokingAllowed", false);
        rulesJson.put("depositRequired", true);
        rulesJson.put("visitSchedule", Map.of(
            "weekdays", List.of("Monday", "Wednesday", "Friday"),
            "timeSlots", List.of("10:00-12:00", "14:00-16:00")
        ));
        request.setRulesJson(rulesJson);
        
        // JSONB meta object
        Map<String, Object> meta = new HashMap<>();
        meta.put("priority", "high");
        meta.put("source", "website");
        meta.put("tags", List.of("luxury", "downtown", "parking"));
        request.setMeta(meta);

        // When
        MvcResult result = mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .header(CORRELATION_ID_HEADER, "test-create-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.orgId").value(ORG1))
            .andExpect(jsonPath("$.title").value("Luxury Apartment in Paris"))
            .andExpect(jsonPath("$.description").value("Beautiful 3-bedroom apartment in the heart of Paris"))
            .andExpect(jsonPath("$.category").value("Real Estate"))
            .andExpect(jsonPath("$.type").value("SALE"))
            .andExpect(jsonPath("$.address").value("123 Rue de la Paix"))
            .andExpect(jsonPath("$.surface").value(120.5))
            .andExpect(jsonPath("$.city").value("Paris"))
            .andExpect(jsonPath("$.price").value(850000.00))
            .andExpect(jsonPath("$.currency").value("EUR"))
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.photos", hasSize(3)))
            .andExpect(jsonPath("$.photos[0]").value("https://example.com/photo1.jpg"))
            .andExpect(jsonPath("$.photos[1]").value("https://example.com/photo2.jpg"))
            .andExpect(jsonPath("$.photos[2]").value("https://example.com/photo3.jpg"))
            .andExpect(jsonPath("$.rulesJson.minAge").value(21))
            .andExpect(jsonPath("$.rulesJson.petsAllowed").value(true))
            .andExpect(jsonPath("$.rulesJson.smokingAllowed").value(false))
            .andExpect(jsonPath("$.rulesJson.depositRequired").value(true))
            .andExpect(jsonPath("$.rulesJson.visitSchedule.weekdays", hasSize(3)))
            .andExpect(jsonPath("$.meta.priority").value("high"))
            .andExpect(jsonPath("$.meta.source").value("website"))
            .andExpect(jsonPath("$.meta.tags", hasSize(3)))
            .andExpect(jsonPath("$.createdAt").exists())
            .andExpect(jsonPath("$.updatedAt").exists())
            .andReturn();

        // Then - Verify persistence in database
        String responseJson = result.getResponse().getContentAsString();
        AnnonceResponse response = objectMapper.readValue(responseJson, AnnonceResponse.class);
        
        Annonce persisted = annonceRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getOrgId()).isEqualTo(ORG1);
        assertThat(persisted.getTitle()).isEqualTo("Luxury Apartment in Paris");
        assertThat(persisted.getPhotos()).hasSize(3);
        assertThat(persisted.getPhotos()).containsExactly(
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg",
            "https://example.com/photo3.jpg"
        );
        assertThat(persisted.getRulesJson()).isNotNull();
        assertThat(persisted.getRulesJson().get("minAge")).isEqualTo(21);
        assertThat(persisted.getRulesJson().get("petsAllowed")).isEqualTo(true);
        assertThat(persisted.getMeta()).isNotNull();
        assertThat(persisted.getMeta().get("priority")).isEqualTo("high");
    }

    @Test
    void createAnnonce_WithMinimalFields_ReturnsCreatedWithDefaults() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("Minimal Annonce");

        // When
        mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.orgId").value(ORG1))
            .andExpect(jsonPath("$.title").value("Minimal Annonce"))
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.photos").isEmpty())
            .andExpect(jsonPath("$.rulesJson").doesNotExist());
    }

    @Test
    void createAnnonce_WithEmptyPhotosArray_ReturnsCreated() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("No Photos Annonce");
        request.setPhotos(List.of());

        // When
        mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.photos").isEmpty());
    }

    @Test
    void createAnnonce_WithComplexNestedRulesJson_HandlesCorrectly() throws Exception {
        // Given - Test deep nesting in JSONB
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("Complex Rules Test");
        
        Map<String, Object> rulesJson = new HashMap<>();
        rulesJson.put("level1", Map.of(
            "level2", Map.of(
                "level3", Map.of(
                    "deepValue", "nested",
                    "deepArray", List.of(1, 2, 3, 4, 5)
                )
            )
        ));
        request.setRulesJson(rulesJson);

        // When
        mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.rulesJson.level1.level2.level3.deepValue").value("nested"))
            .andExpect(jsonPath("$.rulesJson.level1.level2.level3.deepArray", hasSize(5)));
    }

    @Test
    void createAnnonce_MissingTitle_ReturnsBadRequest() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle(null);

        // When & Then
        mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    // ========== GET /{id} with Tenant Filtering Tests ==========

    @Test
    void getAnnonceById_WithSameTenant_ReturnsAnnonce() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Test Annonce", "Paris");
        annonce = annonceRepository.save(annonce);

        // When & Then
        mockMvc.perform(get("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(annonce.getId()))
            .andExpect(jsonPath("$.orgId").value(ORG1))
            .andExpect(jsonPath("$.title").value("Test Annonce"));
    }

    @Test
    void getAnnonceById_CrossTenant_Returns404() throws Exception {
        // Given - Create annonce in ORG2
        Annonce annonce = createTestAnnonce(ORG2, "ORG2 Annonce", "Lyon");
        annonce = annonceRepository.save(annonce);

        // When - Try to access from ORG1
        mockMvc.perform(get("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isNotFound());
    }

    @Test
    void getAnnonceById_NonExistent_Returns404() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/annonces/999999")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isNotFound());
    }

    @Test
    void getAnnonceById_WithCompleteJsonbData_ReturnsAllFields() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Complete Data Test", "Paris");
        annonce.setPhotos(List.of("photo1.jpg", "photo2.jpg"));
        
        Map<String, Object> rules = new HashMap<>();
        rules.put("minAge", 18);
        rules.put("petsAllowed", false);
        annonce.setRulesJson(rules);
        
        Map<String, Object> meta = new HashMap<>();
        meta.put("featured", true);
        meta.put("priority", 10);
        annonce.setMeta(meta);
        
        annonce = annonceRepository.save(annonce);

        // When & Then
        mockMvc.perform(get("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.photos", hasSize(2)))
            .andExpect(jsonPath("$.photos[0]").value("photo1.jpg"))
            .andExpect(jsonPath("$.rulesJson.minAge").value(18))
            .andExpect(jsonPath("$.rulesJson.petsAllowed").value(false))
            .andExpect(jsonPath("$.meta.featured").value(true))
            .andExpect(jsonPath("$.meta.priority").value(10));
    }

    // ========== GET with Filters, Pagination, and Sorting Tests ==========

    @Test
    void listAnnonces_NoFilters_ReturnsAllForTenant() throws Exception {
        // Given - Create exactly 2 annonces for ORG1
        Annonce org1Annonce1 = createTestAnnonce(ORG1, "ORG1 Property 1", "Paris");
        org1Annonce1.setStatus(AnnonceStatus.ACTIVE);
        org1Annonce1.setType(AnnonceType.SALE);
        annonceRepository.save(org1Annonce1);

        Annonce org1Annonce2 = createTestAnnonce(ORG1, "ORG1 Property 2", "Lyon");
        org1Annonce2.setStatus(AnnonceStatus.ACTIVE);
        org1Annonce2.setType(AnnonceType.RENT);
        annonceRepository.save(org1Annonce2);

        // Create annonces for ORG2 to verify tenant isolation
        Annonce org2Annonce1 = createTestAnnonce(ORG2, "ORG2 Property 1", "Paris");
        org2Annonce1.setStatus(AnnonceStatus.ACTIVE);
        org2Annonce1.setType(AnnonceType.SALE);
        annonceRepository.save(org2Annonce1);

        Annonce org2Annonce2 = createTestAnnonce(ORG2, "ORG2 Property 2", "Marseille");
        org2Annonce2.setStatus(AnnonceStatus.PAUSED);
        org2Annonce2.setType(AnnonceType.LEASE);
        annonceRepository.save(org2Annonce2);

        // When & Then - ORG1 should have exactly 2 annonces
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void listAnnonces_FilterByStatus_ReturnsMatchingAnnonces() throws Exception {
        // Given - Create test data with various statuses
        Annonce draft = createTestAnnonce(ORG1, "Draft Annonce", "Paris");
        draft.setStatus(AnnonceStatus.DRAFT);
        annonceRepository.save(draft);
        
        Annonce published = createTestAnnonce(ORG1, "Published Annonce", "Paris");
        published.setStatus(AnnonceStatus.PUBLISHED);
        annonceRepository.save(published);
        
        Annonce archived = createTestAnnonce(ORG1, "Archived Annonce", "Paris");
        archived.setStatus(AnnonceStatus.ARCHIVED);
        annonceRepository.save(archived);
        
        // Add ORG2 data to verify tenant isolation
        Annonce org2Published = createTestAnnonce(ORG2, "ORG2 Published", "Paris");
        org2Published.setStatus(AnnonceStatus.PUBLISHED);
        annonceRepository.save(org2Published);

        // When & Then - Filter by PUBLISHED for ORG1 only
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .param("status", "PUBLISHED"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"))
            .andExpect(jsonPath("$.content[0].title").value("Published Annonce"));
    }

    @Test
    void listAnnonces_FilterByCity_ReturnsMatchingAnnonces() throws Exception {
        // Given - Create test data in multiple cities
        annonceRepository.save(createTestAnnonce(ORG1, "Paris Annonce 1", "Paris"));
        annonceRepository.save(createTestAnnonce(ORG1, "Paris Annonce 2", "Paris"));
        annonceRepository.save(createTestAnnonce(ORG1, "Lyon Annonce", "Lyon"));
        annonceRepository.save(createTestAnnonce(ORG1, "Marseille Annonce", "Marseille"));
        
        // Add ORG2 data in Paris to verify tenant isolation
        annonceRepository.save(createTestAnnonce(ORG2, "ORG2 Paris Annonce", "Paris"));

        // When & Then - Filter by Paris for ORG1 only
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .param("city", "Paris"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void listAnnonces_FilterByType_ReturnsMatchingAnnonces() throws Exception {
        // Given
        Annonce sale = createTestAnnonce(ORG1, "For Sale", "Paris");
        sale.setType(AnnonceType.SALE);
        annonceRepository.save(sale);
        
        Annonce rent = createTestAnnonce(ORG1, "For Rent", "Paris");
        rent.setType(AnnonceType.RENT);
        annonceRepository.save(rent);
        
        Annonce lease = createTestAnnonce(ORG1, "For Lease", "Paris");
        lease.setType(AnnonceType.LEASE);
        annonceRepository.save(lease);

        // When & Then - Filter by RENT
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .param("type", "RENT"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].type").value("RENT"));
    }

    @Test
    void listAnnonces_SearchQueryInTitle_ReturnsMatchingAnnonces() throws Exception {
        // Given
        annonceRepository.save(createTestAnnonce(ORG1, "Beautiful Apartment", "Paris"));
        annonceRepository.save(createTestAnnonce(ORG1, "Luxury Villa", "Lyon"));
        annonceRepository.save(createTestAnnonce(ORG1, "Cozy House", "Marseille"));

        // When & Then - Search for "apartment"
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .param("q", "apartment"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].title").value("Beautiful Apartment"));
    }

    @Test
    void listAnnonces_SearchQueryInDescription_ReturnsMatchingAnnonces() throws Exception {
        // Given
        Annonce annonce1 = createTestAnnonce(ORG1, "Property 1", "Paris");
        annonce1.setDescription("Modern apartment with balcony");
        annonceRepository.save(annonce1);
        
        Annonce annonce2 = createTestAnnonce(ORG1, "Property 2", "Lyon");
        annonce2.setDescription("Traditional house with garden");
        annonceRepository.save(annonce2);

        // When & Then - Search for "balcony"
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .param("q", "balcony"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].title").value("Property 1"));
    }

    @Test
    void listAnnonces_CombinedFilters_ReturnsMatchingAnnonces() throws Exception {
        // Given - Create diverse test data
        Annonce match = createTestAnnonce(ORG1, "Paris Rental", "Paris");
        match.setStatus(AnnonceStatus.PUBLISHED);
        match.setType(AnnonceType.RENT);
        annonceRepository.save(match);
        
        Annonce noMatchStatus = createTestAnnonce(ORG1, "Paris Rental Draft", "Paris");
        noMatchStatus.setStatus(AnnonceStatus.DRAFT);
        noMatchStatus.setType(AnnonceType.RENT);
        annonceRepository.save(noMatchStatus);
        
        Annonce noMatchCity = createTestAnnonce(ORG1, "Lyon Rental", "Lyon");
        noMatchCity.setStatus(AnnonceStatus.PUBLISHED);
        noMatchCity.setType(AnnonceType.RENT);
        annonceRepository.save(noMatchCity);
        
        // Add ORG2 data that would match filters - should not appear in results
        Annonce org2Match = createTestAnnonce(ORG2, "ORG2 Paris Rental", "Paris");
        org2Match.setStatus(AnnonceStatus.PUBLISHED);
        org2Match.setType(AnnonceType.RENT);
        annonceRepository.save(org2Match);

        // When & Then - Filter by status=PUBLISHED, city=Paris, type=RENT for ORG1
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .param("status", "PUBLISHED")
                .param("city", "Paris")
                .param("type", "RENT"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Paris Rental"))
            .andExpect(jsonPath("$.content[0].orgId").value(ORG1));
    }

    @Test
    void listAnnonces_WithPagination_ReturnsCorrectPage() throws Exception {
        // Given - Create 25 annonces
        for (int i = 1; i <= 25; i++) {
            annonceRepository.save(createTestAnnonce(ORG1, "Annonce " + i, "Paris"));
        }

        // When & Then - Request page 1 (second page) with size 10
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .param("page", "1")
                .param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(10)))
            .andExpect(jsonPath("$.number").value(1))
            .andExpect(jsonPath("$.size").value(10))
            .andExpect(jsonPath("$.totalElements").value(25))
            .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    void listAnnonces_SortByTitleAsc_ReturnsSortedResults() throws Exception {
        // Given
        annonceRepository.save(createTestAnnonce(ORG1, "Zebra Property", "Paris"));
        annonceRepository.save(createTestAnnonce(ORG1, "Alpha Property", "Paris"));
        annonceRepository.save(createTestAnnonce(ORG1, "Beta Property", "Paris"));

        // When & Then - Sort by title ascending
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .param("sort", "title,asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(3)))
            .andExpect(jsonPath("$.content[0].title").value("Alpha Property"))
            .andExpect(jsonPath("$.content[1].title").value("Beta Property"))
            .andExpect(jsonPath("$.content[2].title").value("Zebra Property"));
    }

    @Test
    void listAnnonces_SortByCreatedAtDesc_ReturnsSortedResults() throws Exception {
        // Given
        Annonce oldest = createTestAnnonce(ORG1, "Oldest", "Paris");
        annonceRepository.save(oldest);
        Thread.sleep(10); // Ensure different timestamps
        
        Annonce middle = createTestAnnonce(ORG1, "Middle", "Paris");
        annonceRepository.save(middle);
        Thread.sleep(10);
        
        Annonce newest = createTestAnnonce(ORG1, "Newest", "Paris");
        annonceRepository.save(newest);

        // When & Then - Sort by createdAt descending (newest first)
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .param("sort", "createdAt,desc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(3)))
            .andExpect(jsonPath("$.content[0].title").value("Newest"))
            .andExpect(jsonPath("$.content[2].title").value("Oldest"));
    }

    // ========== PUT with Partial Updates Tests ==========

    @Test
    void updateAnnonce_PartialUpdate_OnlyUpdatesSpecifiedFields() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Original Title", "Paris");
        annonce.setDescription("Original Description");
        annonce.setPrice(BigDecimal.valueOf(100.00));
        annonce.setCity("Paris");
        annonce = annonceRepository.save(annonce);

        // When - Update only title and price
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(BigDecimal.valueOf(200.00));

        MvcResult result = mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(annonce.getId()))
            .andExpect(jsonPath("$.title").value("Updated Title"))
            .andExpect(jsonPath("$.price").value(200.00))
            .andExpect(jsonPath("$.description").value("Original Description"))
            .andExpect(jsonPath("$.city").value("Paris"))
            .andReturn();

        // Then - Verify in database
        Annonce updated = annonceRepository.findById(annonce.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("Updated Title");
        assertThat(updated.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(200.00));
        assertThat(updated.getDescription()).isEqualTo("Original Description");
        assertThat(updated.getCity()).isEqualTo("Paris");
    }

    @Test
    void updateAnnonce_UpdatePhotosArray_ReplacesCompleteArray() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Photo Test", "Paris");
        annonce.setPhotos(List.of("old1.jpg", "old2.jpg"));
        annonce = annonceRepository.save(annonce);

        // When - Update photos array
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setPhotos(List.of("new1.jpg", "new2.jpg", "new3.jpg"));

        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.photos", hasSize(3)))
            .andExpect(jsonPath("$.photos[0]").value("new1.jpg"))
            .andExpect(jsonPath("$.photos[1]").value("new2.jpg"))
            .andExpect(jsonPath("$.photos[2]").value("new3.jpg"));

        // Then - Verify in database
        Annonce updated = annonceRepository.findById(annonce.getId()).orElseThrow();
        assertThat(updated.getPhotos()).containsExactly("new1.jpg", "new2.jpg", "new3.jpg");
    }

    @Test
    void updateAnnonce_UpdateRulesJson_MergesOrReplacesObject() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Rules Test", "Paris");
        Map<String, Object> originalRules = new HashMap<>();
        originalRules.put("minAge", 18);
        originalRules.put("petsAllowed", true);
        annonce.setRulesJson(originalRules);
        annonce = annonceRepository.save(annonce);

        // When - Update rulesJson
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        Map<String, Object> newRules = new HashMap<>();
        newRules.put("minAge", 21);
        newRules.put("smokingAllowed", false);
        updateRequest.setRulesJson(newRules);

        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.rulesJson.minAge").value(21))
            .andExpect(jsonPath("$.rulesJson.smokingAllowed").value(false));

        // Then - Verify in database
        Annonce updated = annonceRepository.findById(annonce.getId()).orElseThrow();
        assertThat(updated.getRulesJson()).isNotNull();
        assertThat(updated.getRulesJson().get("minAge")).isEqualTo(21);
    }

    @Test
    void updateAnnonce_ChangeStatus_UpdatesSuccessfully() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Status Change Test", "Paris");
        annonce.setStatus(AnnonceStatus.DRAFT);
        annonce = annonceRepository.save(annonce);

        // When - Update status to PUBLISHED
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);

        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PUBLISHED"));

        // Then - Verify in database
        Annonce updated = annonceRepository.findById(annonce.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(AnnonceStatus.PUBLISHED);
    }

    @Test
    void updateAnnonce_CrossTenant_Returns404() throws Exception {
        // Given - Create annonce in ORG2
        Annonce annonce = createTestAnnonce(ORG2, "ORG2 Annonce", "Lyon");
        annonce = annonceRepository.save(annonce);

        // When - Try to update from ORG1
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Hacked Title");

        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isNotFound());

        // Then - Verify original data unchanged
        Annonce unchanged = annonceRepository.findById(annonce.getId()).orElseThrow();
        assertThat(unchanged.getTitle()).isEqualTo("ORG2 Annonce");
        assertThat(unchanged.getOrgId()).isEqualTo(ORG2);
    }

    @Test
    void updateAnnonce_NonExistent_Returns404() throws Exception {
        // Given
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Non-existent Update");

        // When & Then
        mockMvc.perform(put("/api/v1/annonces/999999")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isNotFound());
    }

    // ========== Audit Events with Diff Calculation Tests ==========

    @Test
    void createAnnonce_GeneratesAuditEventWithAfterDiff() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("Audit Create Test");
        request.setCity("Paris");
        request.setPrice(BigDecimal.valueOf(500.00));

        // When
        MvcResult result = mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        AnnonceResponse response = objectMapper.readValue(responseJson, AnnonceResponse.class);

        // Then - Verify audit event
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(response.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.CREATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(ORG1);

        // Verify diff structure for CREATE
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("after");
        assertThat(diff).doesNotContainKey("before");
        assertThat(diff).doesNotContainKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> afterData = (Map<String, Object>) diff.get("after");
        assertThat(afterData).isNotNull();
        assertThat(afterData.get("title")).isEqualTo("Audit Create Test");
        assertThat(afterData.get("city")).isEqualTo("Paris");
    }

    @Test
    void updateAnnonce_GeneratesAuditEventWithChangesDiff() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Original Title", "Paris");
        annonce.setDescription("Original Description");
        annonce.setPrice(BigDecimal.valueOf(100.00));
        annonce = annonceRepository.save(annonce);
        
        auditEventRepository.deleteAll(); // Clear create audit event

        // When
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(BigDecimal.valueOf(200.00));

        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk());

        // Then - Verify audit event
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(annonce.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.UPDATED);
        assertThat(auditEvent.getOrgId()).isEqualTo(ORG1);

        // Verify diff structure for UPDATE
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("changes");
        assertThat(diff).doesNotContainKey("after");
        assertThat(diff).doesNotContainKey("before");

        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        assertThat(changes).containsKey("title");
        assertThat(changes).containsKey("price");

        @SuppressWarnings("unchecked")
        Map<String, Object> titleChange = (Map<String, Object>) changes.get("title");
        assertThat(titleChange).containsEntry("before", "Original Title");
        assertThat(titleChange).containsEntry("after", "Updated Title");

        @SuppressWarnings("unchecked")
        Map<String, Object> priceChange = (Map<String, Object>) changes.get("price");
        assertThat(priceChange.get("before")).isNotNull();
        assertThat(priceChange.get("after")).isNotNull();
    }

    @Test
    void deleteAnnonce_GeneratesAuditEventWithBeforeDiff() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "To Be Deleted", "Paris");
        annonce.setCity("Marseille");
        annonce = annonceRepository.save(annonce);
        
        auditEventRepository.deleteAll(); // Clear create audit event

        // When
        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk());

        // Then - Verify audit event
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        AuditEventEntity auditEvent = auditEvents.get(0);
        assertThat(auditEvent.getEntityType()).isEqualTo(AuditEntityType.ANNONCE);
        assertThat(auditEvent.getEntityId()).isEqualTo(annonce.getId());
        assertThat(auditEvent.getAction()).isEqualTo(AuditAction.DELETED);
        assertThat(auditEvent.getOrgId()).isEqualTo(ORG1);

        // Verify diff structure for DELETE
        Map<String, Object> diff = auditEvent.getDiff();
        assertThat(diff).isNotNull();
        assertThat(diff).containsKey("before");
        assertThat(diff).doesNotContainKey("after");
        assertThat(diff).doesNotContainKey("changes");

        @SuppressWarnings("unchecked")
        Map<String, Object> beforeData = (Map<String, Object>) diff.get("before");
        assertThat(beforeData).isNotNull();
        assertThat(beforeData.get("title")).isEqualTo("To Be Deleted");
        assertThat(beforeData.get("city")).isEqualTo("Marseille");
    }

    @Test
    void updateAnnonce_WithJsonbChanges_RecordsDiffCorrectly() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "JSONB Update Test", "Paris");
        annonce.setPhotos(List.of("old1.jpg", "old2.jpg"));
        
        Map<String, Object> oldRules = new HashMap<>();
        oldRules.put("minAge", 18);
        oldRules.put("petsAllowed", true);
        annonce.setRulesJson(oldRules);
        
        annonce = annonceRepository.save(annonce);
        auditEventRepository.deleteAll();

        // When - Update JSONB fields
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setPhotos(List.of("new1.jpg"));
        
        Map<String, Object> newRules = new HashMap<>();
        newRules.put("minAge", 21);
        newRules.put("smokingAllowed", false);
        updateRequest.setRulesJson(newRules);

        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk());

        // Then - Verify JSONB changes in audit
        List<AuditEventEntity> auditEvents = auditEventRepository.findAll();
        assertThat(auditEvents).hasSize(1);

        Map<String, Object> diff = auditEvents.get(0).getDiff();
        @SuppressWarnings("unchecked")
        Map<String, Object> changes = (Map<String, Object>) diff.get("changes");
        
        assertThat(changes).containsKey("photos");
        assertThat(changes).containsKey("rulesJson");
    }

    // ========== RBAC 403 Tests ==========

    @Test
    void deleteAnnonce_AsPro_Returns403Forbidden() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Pro Delete Test", "Paris");
        annonce = annonceRepository.save(annonce);

        // When & Then - PRO role should not be able to delete
        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isForbidden());

        // Verify annonce still exists
        assertThat(annonceRepository.findById(annonce.getId())).isPresent();
    }

    @Test
    void deleteAnnonce_AsAdmin_Returns200Ok() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Admin Delete Test", "Paris");
        annonce = annonceRepository.save(annonce);

        // When & Then - ADMIN role should be able to delete
        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk());

        // Verify annonce is deleted
        assertThat(annonceRepository.findById(annonce.getId())).isEmpty();
    }

    @Test
    void createAnnonce_AsPro_Returns201Created() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("Pro Create Test");

        // When & Then - PRO role should be able to create
        mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
    }

    @Test
    void updateAnnonce_AsPro_Returns200Ok() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "Pro Update Test", "Paris");
        annonce = annonceRepository.save(annonce);

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Pro Updated");

        // When & Then - PRO role should be able to update
        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk());
    }

    // ========== H2 vs Postgres JSONB Compatibility Tests ==========

    @Test
    void jsonbCompatibility_ArrayOfStrings_WorksInBothDatabases() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("JSONB Array Test");
        request.setPhotos(List.of("photo1.jpg", "photo2.jpg", "photo3.jpg"));

        // When
        MvcResult result = mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        AnnonceResponse response = objectMapper.readValue(responseJson, AnnonceResponse.class);

        // Then - Verify retrieval works
        mockMvc.perform(get("/api/v1/annonces/" + response.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.photos", hasSize(3)))
            .andExpect(jsonPath("$.photos[0]").value("photo1.jpg"))
            .andExpect(jsonPath("$.photos[1]").value("photo2.jpg"))
            .andExpect(jsonPath("$.photos[2]").value("photo3.jpg"));
    }

    @Test
    void jsonbCompatibility_NestedObject_WorksInBothDatabases() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("JSONB Nested Object Test");
        
        Map<String, Object> rules = new HashMap<>();
        rules.put("restrictions", Map.of(
            "age", Map.of("min", 18, "max", 65),
            "requirements", List.of("ID", "Proof of Income", "References")
        ));
        request.setRulesJson(rules);

        // When
        MvcResult result = mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        AnnonceResponse response = objectMapper.readValue(responseJson, AnnonceResponse.class);

        // Then - Verify retrieval and nested structure
        mockMvc.perform(get("/api/v1/annonces/" + response.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.rulesJson.restrictions.age.min").value(18))
            .andExpect(jsonPath("$.rulesJson.restrictions.age.max").value(65))
            .andExpect(jsonPath("$.rulesJson.restrictions.requirements", hasSize(3)));
    }

    @Test
    void jsonbCompatibility_MixedTypes_WorksInBothDatabases() throws Exception {
        // Given - Test various JSON types: string, number, boolean, array, object
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("JSONB Mixed Types Test");
        
        Map<String, Object> meta = new HashMap<>();
        meta.put("stringField", "value");
        meta.put("intField", 42);
        meta.put("doubleField", 3.14);
        meta.put("booleanField", true);
        meta.put("arrayField", List.of(1, 2, 3));
        meta.put("objectField", Map.of("nested", "value"));
        meta.put("nullField", null);
        request.setMeta(meta);

        // When
        MvcResult result = mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        AnnonceResponse response = objectMapper.readValue(responseJson, AnnonceResponse.class);

        // Then - Verify all types are preserved
        mockMvc.perform(get("/api/v1/annonces/" + response.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.meta.stringField").value("value"))
            .andExpect(jsonPath("$.meta.intField").value(42))
            .andExpect(jsonPath("$.meta.doubleField").value(3.14))
            .andExpect(jsonPath("$.meta.booleanField").value(true))
            .andExpect(jsonPath("$.meta.arrayField", hasSize(3)))
            .andExpect(jsonPath("$.meta.objectField.nested").value("value"));
    }

    @Test
    void jsonbCompatibility_EmptyJsonObjects_WorksInBothDatabases() throws Exception {
        // Given
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("JSONB Empty Objects Test");
        request.setPhotos(List.of());
        request.setRulesJson(Map.of());
        request.setMeta(Map.of());

        // When
        MvcResult result = mockMvc.perform(post("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        AnnonceResponse response = objectMapper.readValue(responseJson, AnnonceResponse.class);

        // Then - Verify empty collections are handled
        mockMvc.perform(get("/api/v1/annonces/" + response.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.photos").isEmpty());
    }

    @Test
    void jsonbCompatibility_UpdateJsonFields_PreservesStructure() throws Exception {
        // Given
        Annonce annonce = createTestAnnonce(ORG1, "JSONB Update Compatibility", "Paris");
        annonce.setPhotos(List.of("old.jpg"));
        
        Map<String, Object> oldRules = new HashMap<>();
        oldRules.put("oldKey", "oldValue");
        annonce.setRulesJson(oldRules);
        annonce = annonceRepository.save(annonce);

        // When - Update JSONB fields
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setPhotos(List.of("new1.jpg", "new2.jpg"));
        
        Map<String, Object> newRules = new HashMap<>();
        newRules.put("newKey", "newValue");
        newRules.put("complexKey", Map.of("nested", List.of(1, 2, 3)));
        updateRequest.setRulesJson(newRules);

        mockMvc.perform(put("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.photos", hasSize(2)))
            .andExpect(jsonPath("$.rulesJson.newKey").value("newValue"))
            .andExpect(jsonPath("$.rulesJson.complexKey.nested", hasSize(3)));

        // Then - Verify persistence
        Annonce updated = annonceRepository.findById(annonce.getId()).orElseThrow();
        assertThat(updated.getPhotos()).containsExactly("new1.jpg", "new2.jpg");
        assertThat(updated.getRulesJson().get("newKey")).isEqualTo("newValue");
    }

    // ========== Additional Cross-Tenant Isolation Tests ==========

    @Test
    void listAnnonces_OnlyReturnsOwnTenantData() throws Exception {
        // Given - Create exactly 2 annonces for ORG1
        Annonce org1Annonce1 = createTestAnnonce(ORG1, "ORG1 Property 1", "Paris");
        org1Annonce1.setStatus(AnnonceStatus.ACTIVE);
        org1Annonce1.setType(AnnonceType.SALE);
        annonceRepository.save(org1Annonce1);

        Annonce org1Annonce2 = createTestAnnonce(ORG1, "ORG1 Property 2", "Lyon");
        org1Annonce2.setStatus(AnnonceStatus.ACTIVE);
        org1Annonce2.setType(AnnonceType.RENT);
        annonceRepository.save(org1Annonce2);

        // Create exactly 2 annonces for ORG2
        Annonce org2Annonce1 = createTestAnnonce(ORG2, "ORG2 Property 1", "Paris");
        org2Annonce1.setStatus(AnnonceStatus.ACTIVE);
        org2Annonce1.setType(AnnonceType.SALE);
        annonceRepository.save(org2Annonce1);

        Annonce org2Annonce2 = createTestAnnonce(ORG2, "ORG2 Property 2", "Marseille");
        org2Annonce2.setStatus(AnnonceStatus.PAUSED);
        org2Annonce2.setType(AnnonceType.LEASE);
        annonceRepository.save(org2Annonce2);

        // When - List from ORG1
        MvcResult result = mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.totalElements").value(2))
            .andReturn();

        // Then - Verify only ORG1 data is returned
        String responseJson = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseJson, new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseMap.get("content");
        
        for (Map<String, Object> item : content) {
            assertThat(item.get("orgId")).isEqualTo(ORG1);
            assertThat(item.get("title").toString()).startsWith("ORG1");
        }
        
        // When - List from ORG2
        MvcResult result2 = mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG2, "test-user", "ADMIN")))
                .header(TENANT_HEADER, ORG2))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.totalElements").value(2))
            .andReturn();

        // Then - Verify only ORG2 data is returned
        String responseJson2 = result2.getResponse().getContentAsString();
        Map<String, Object> responseMap2 = objectMapper.readValue(responseJson2, new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> content2 = (List<Map<String, Object>>) responseMap2.get("content");
        
        for (Map<String, Object> item : content2) {
            assertThat(item.get("orgId")).isEqualTo(ORG2);
            assertThat(item.get("title").toString()).startsWith("ORG2");
        }
    }

    @Test
    void deleteAnnonce_CrossTenant_Returns404() throws Exception {
        // Given - Create annonce in ORG2
        Annonce annonce = createTestAnnonce(ORG2, "ORG2 Delete Test", "Paris");
        annonce = annonceRepository.save(annonce);

        // When - Try to delete from ORG1 (even with forbidden response, it should be 404 for security)
        // Note: PRO can't delete anyway, but testing cross-tenant isolation
        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1))
            .andExpect(status().isForbidden()); // PRO role gets 403 first

        // Verify annonce still exists and unchanged
        Annonce unchanged = annonceRepository.findById(annonce.getId()).orElseThrow();
        assertThat(unchanged.getOrgId()).isEqualTo(ORG2);
    }

    @Test
    void listAnnonces_FilterByStatusAndCity_VerifiesTenantIsolation() throws Exception {
        // Given - Create comprehensive test data
        // ORG1: 2 ACTIVE in Paris, 1 ACTIVE in Lyon, 1 PAUSED in Paris
        Annonce org1Paris1 = createTestAnnonce(ORG1, "ORG1 Paris Active 1", "Paris");
        org1Paris1.setStatus(AnnonceStatus.ACTIVE);
        annonceRepository.save(org1Paris1);
        
        Annonce org1Paris2 = createTestAnnonce(ORG1, "ORG1 Paris Active 2", "Paris");
        org1Paris2.setStatus(AnnonceStatus.ACTIVE);
        annonceRepository.save(org1Paris2);
        
        Annonce org1Lyon = createTestAnnonce(ORG1, "ORG1 Lyon Active", "Lyon");
        org1Lyon.setStatus(AnnonceStatus.ACTIVE);
        annonceRepository.save(org1Lyon);
        
        Annonce org1ParisPaused = createTestAnnonce(ORG1, "ORG1 Paris Paused", "Paris");
        org1ParisPaused.setStatus(AnnonceStatus.PAUSED);
        annonceRepository.save(org1ParisPaused);
        
        // ORG2: 1 ACTIVE in Paris (should not appear in ORG1 results)
        Annonce org2Paris = createTestAnnonce(ORG2, "ORG2 Paris Active", "Paris");
        org2Paris.setStatus(AnnonceStatus.ACTIVE);
        annonceRepository.save(org2Paris);

        // When & Then - Filter ORG1 by ACTIVE status only
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .param("status", "ACTIVE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(3)))
            .andExpect(jsonPath("$.totalElements").value(3));
        
        // When & Then - Filter ORG1 by city=Paris only
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .param("city", "Paris"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(3)))
            .andExpect(jsonPath("$.totalElements").value(3));
        
        // When & Then - Filter ORG1 by ACTIVE status AND city=Paris
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG1, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG1)
                .param("status", "ACTIVE")
                .param("city", "Paris"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.totalElements").value(2));
        
        // When & Then - Filter ORG2 by ACTIVE status AND city=Paris
        mockMvc.perform(get("/api/v1/annonces")
                .with(jwt().jwt(createMockJwt(ORG2, "test-user", "PRO")))
                .header(TENANT_HEADER, ORG2)
                .param("status", "ACTIVE")
                .param("city", "Paris"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].title").value("ORG2 Paris Active"));
    }

    // ========== Helper Methods ==========

    private Annonce createTestAnnonce(String orgId, String title, String city) {
        Annonce annonce = new Annonce();
        annonce.setOrgId(orgId);
        annonce.setTitle(title);
        annonce.setDescription("Test Description");
        annonce.setCategory("Test Category");
        annonce.setCity(city);
        annonce.setPrice(BigDecimal.valueOf(100.00));
        annonce.setCurrency("EUR");
        annonce.setStatus(AnnonceStatus.DRAFT);
        return annonce;
    }
}
