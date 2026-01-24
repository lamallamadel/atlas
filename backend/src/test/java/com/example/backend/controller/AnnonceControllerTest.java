package com.example.backend.controller;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
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

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(roles = "ADMIN")
class AnnonceControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String ORG_ID = "org123";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AnnonceRepository annonceRepository;

    private AnnonceCreateRequest createRequest;

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder> T withHeaders(T builder) {
        return (T) builder
                .header(ORG_ID_HEADER, ORG_ID)
                .header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }

    @BeforeEach
    void setUp() {
        annonceRepository.deleteAll();
        
        createRequest = new AnnonceCreateRequest();
        // orgId comes from tenant header (X-Org-Id) => DO NOT set in request
        createRequest.setTitle("Test Annonce");
        createRequest.setDescription("Test Description");
        createRequest.setCategory("Electronics");
        createRequest.setCity("Paris");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        createRequest.setCurrency("EUR");
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    @Test
    void create_ValidRequest_Returns201WithCreatedEntity() throws Exception {
        mockMvc.perform(withHeaders(post("/api/v1/annonces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))))
            .andExpect(status().isCreated())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.orgId").value(ORG_ID))
            .andExpect(jsonPath("$.title").value("Test Annonce"))
            .andExpect(jsonPath("$.description").value("Test Description"))
            .andExpect(jsonPath("$.category").value("Electronics"))
            .andExpect(jsonPath("$.city").value("Paris"))
            .andExpect(jsonPath("$.price").value(100.00))
            .andExpect(jsonPath("$.currency").value("EUR"))
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void create_MissingTitle_Returns400() throws Exception {
        createRequest.setTitle(null);

        mockMvc.perform(withHeaders(post("/api/v1/annonces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void create_BlankTitle_Returns400() throws Exception {
        createRequest.setTitle("");

        mockMvc.perform(withHeaders(post("/api/v1/annonces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void create_TitleTooLong_Returns400() throws Exception {
        createRequest.setTitle("A".repeat(501));

        mockMvc.perform(withHeaders(post("/api/v1/annonces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void create_NegativePrice_Returns400() throws Exception {
        createRequest.setPrice(BigDecimal.valueOf(-10.00));

        mockMvc.perform(withHeaders(post("/api/v1/annonces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void create_MissingTenantHeader_Returns400() throws Exception {
        mockMvc.perform(post("/api/v1/annonces")
                .contentType(MediaType.APPLICATION_JSON)
                .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                .content(objectMapper.writeValueAsString(createRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(header().string(CORRELATION_ID_HEADER, CORRELATION_ID));
    }

    // -------------------------------------------------------------------------
    // GET
    // -------------------------------------------------------------------------

    @Test
    void getById_ExistingId_Returns200WithEntity() throws Exception {
        Annonce annonce = createAnnonce(ORG_ID);

        mockMvc.perform(withHeaders(get("/api/v1/annonces/" + annonce.getId())))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(annonce.getId()))
            .andExpect(jsonPath("$.title").value("Test Annonce"))
            .andExpect(jsonPath("$.orgId").value(ORG_ID));
    }

    @Test
    void getById_NonExistingId_Returns404() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/annonces/999")))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    @Test
    void update_ValidRequest_Returns200() throws Exception {
        Annonce annonce = createAnnonce(ORG_ID);

        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);

        mockMvc.perform(withHeaders(put("/api/v1/annonces/" + annonce.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(annonce.getId()))
            .andExpect(jsonPath("$.title").value("Updated Title"))
            .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void update_NonExistingId_Returns404() throws Exception {
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");

        mockMvc.perform(withHeaders(put("/api/v1/annonces/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // LIST
    // -------------------------------------------------------------------------

    @Test
    void list_NoFilters_Returns200WithPagedResults() throws Exception {
        Annonce annonce1 = createAnnonce(ORG_ID, "Annonce 1", AnnonceStatus.PUBLISHED);
        Annonce annonce2 = createAnnonce(ORG_ID, "Annonce 2", AnnonceStatus.DRAFT);

        mockMvc.perform(withHeaders(get("/api/v1/annonces")))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    void list_WithStatusFilter_Returns200WithFilteredResults() throws Exception {
        createAnnonce(ORG_ID, "Published Annonce", AnnonceStatus.PUBLISHED);
        createAnnonce(ORG_ID, "Draft Annonce", AnnonceStatus.DRAFT);

        mockMvc.perform(withHeaders(get("/api/v1/annonces")
                .param("status", "PUBLISHED")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"))
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithSearchQuery_Returns200WithMatchingResults() throws Exception {
        createAnnonce(ORG_ID, "Electronics in Paris", AnnonceStatus.PUBLISHED);
        createAnnonce(ORG_ID, "Furniture in Lyon", AnnonceStatus.PUBLISHED);

        mockMvc.perform(withHeaders(get("/api/v1/annonces")
                .param("q", "Electronics")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].title").value("Electronics in Paris"))
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithStatusAndSearchQuery_Returns200WithFilteredAndMatchingResults() throws Exception {
        createAnnonce(ORG_ID, "Electronics in Paris", AnnonceStatus.PUBLISHED);
        createAnnonce(ORG_ID, "Electronics in Lyon", AnnonceStatus.DRAFT);

        mockMvc.perform(withHeaders(get("/api/v1/annonces")
                .param("status", "PUBLISHED")
                .param("q", "Electronics")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(1)))
            .andExpect(jsonPath("$.content[0].title").value("Electronics in Paris"))
            .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"))
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithPagination_Returns200WithCorrectPage() throws Exception {
        for (int i = 1; i <= 25; i++) {
            createAnnonce(ORG_ID, "Annonce " + i, AnnonceStatus.PUBLISHED);
        }

        mockMvc.perform(withHeaders(get("/api/v1/annonces")
                .param("page", "1")
                .param("size", "10")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(10)))
            .andExpect(jsonPath("$.number").value(1))
            .andExpect(jsonPath("$.size").value(10))
            .andExpect(jsonPath("$.totalElements").value(25));
    }

    @Test
    void list_WithSorting_Returns200WithSortedResults() throws Exception {
        createAnnonce(ORG_ID, "Annonce B", AnnonceStatus.PUBLISHED);
        createAnnonce(ORG_ID, "Annonce A", AnnonceStatus.PUBLISHED);

        mockMvc.perform(withHeaders(get("/api/v1/annonces")
                .param("sort", "title,asc")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].title").value("Annonce A"))
            .andExpect(jsonPath("$.content[1].title").value("Annonce B"));
    }

    @Test
    void list_EmptyResult_Returns200WithEmptyPage() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/annonces")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(0)))
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    private Annonce createAnnonce(String orgId) {
        return createAnnonce(orgId, "Test Annonce", AnnonceStatus.DRAFT);
    }

    private Annonce createAnnonce(String orgId, String title, AnnonceStatus status) {
        Annonce annonce = new Annonce();
        annonce.setOrgId(orgId);
        annonce.setTitle(title);
        annonce.setDescription("Test Description");
        annonce.setCategory("Electronics");
        annonce.setCity("Paris");
        annonce.setPrice(BigDecimal.valueOf(100.00));
        annonce.setCurrency("EUR");
        annonce.setStatus(status);
        return annonceRepository.save(annonce);
    }
}
