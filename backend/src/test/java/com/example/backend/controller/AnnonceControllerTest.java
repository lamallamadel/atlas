package com.example.backend.controller;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnnonceController.class)
class AnnonceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnnonceService annonceService;

    private AnnonceCreateRequest createRequest;
    private AnnonceResponse annonceResponse;

    @BeforeEach
    void setUp() {
        createRequest = new AnnonceCreateRequest();
        createRequest.setOrgId("org123");
        createRequest.setTitle("Test Annonce");
        createRequest.setDescription("Test Description");
        createRequest.setCategory("Electronics");
        createRequest.setCity("Paris");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        createRequest.setCurrency("EUR");

        annonceResponse = new AnnonceResponse();
        annonceResponse.setId(1L);
        annonceResponse.setOrgId("org123");
        annonceResponse.setTitle("Test Annonce");
        annonceResponse.setDescription("Test Description");
        annonceResponse.setCategory("Electronics");
        annonceResponse.setCity("Paris");
        annonceResponse.setPrice(BigDecimal.valueOf(100.00));
        annonceResponse.setCurrency("EUR");
        annonceResponse.setStatus(AnnonceStatus.DRAFT);
        annonceResponse.setCreatedAt(LocalDateTime.now());
        annonceResponse.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void create_ValidRequest_Returns201WithCreatedEntity() throws Exception {
        when(annonceService.create(any(AnnonceCreateRequest.class))).thenReturn(annonceResponse);

        mockMvc.perform(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.orgId").value("org123"))
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

        mockMvc.perform(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_BlankTitle_Returns400() throws Exception {
        createRequest.setTitle("");

        mockMvc.perform(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_TitleTooLong_Returns400() throws Exception {
        createRequest.setTitle("A".repeat(501));

        mockMvc.perform(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_MissingOrgId_Returns400() throws Exception {
        createRequest.setOrgId(null);

        mockMvc.perform(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_NegativePrice_Returns400() throws Exception {
        createRequest.setPrice(BigDecimal.valueOf(-10.00));

        mockMvc.perform(post("/api/v1/annonces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getById_ExistingId_Returns200WithEntity() throws Exception {
        when(annonceService.getById(1L)).thenReturn(annonceResponse);

        mockMvc.perform(get("/api/v1/annonces/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Test Annonce"))
                .andExpect(jsonPath("$.orgId").value("org123"));
    }

    @Test
    void getById_NonExistingId_Returns404() throws Exception {
        when(annonceService.getById(999L))
                .thenThrow(new EntityNotFoundException("Annonce not found with id: 999"));

        mockMvc.perform(get("/api/v1/annonces/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_ValidRequest_Returns200() throws Exception {
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);

        AnnonceResponse updatedResponse = new AnnonceResponse();
        updatedResponse.setId(1L);
        updatedResponse.setOrgId("org123");
        updatedResponse.setTitle("Updated Title");
        updatedResponse.setStatus(AnnonceStatus.PUBLISHED);

        when(annonceService.update(eq(1L), any(AnnonceUpdateRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(put("/api/v1/annonces/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void update_NonExistingId_Returns404() throws Exception {
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");

        when(annonceService.update(eq(999L), any(AnnonceUpdateRequest.class)))
                .thenThrow(new EntityNotFoundException("Annonce not found with id: 999"));

        mockMvc.perform(put("/api/v1/annonces/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_NoFilters_Returns200WithPagedResults() throws Exception {
        AnnonceResponse annonce1 = new AnnonceResponse();
        annonce1.setId(1L);
        annonce1.setTitle("Annonce 1");
        annonce1.setStatus(AnnonceStatus.PUBLISHED);

        AnnonceResponse annonce2 = new AnnonceResponse();
        annonce2.setId(2L);
        annonce2.setTitle("Annonce 2");
        annonce2.setStatus(AnnonceStatus.DRAFT);

        List<AnnonceResponse> annonces = Arrays.asList(annonce1, annonce2);
        Page<AnnonceResponse> page = new PageImpl<>(annonces, PageRequest.of(0, 20), 2);

        when(annonceService.list(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(get("/api/v1/annonces"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Annonce 1"))
                .andExpect(jsonPath("$.content[1].id").value(2))
                .andExpect(jsonPath("$.content[1].title").value("Annonce 2"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    void list_WithStatusFilter_Returns200WithFilteredResults() throws Exception {
        AnnonceResponse annonce1 = new AnnonceResponse();
        annonce1.setId(1L);
        annonce1.setTitle("Published Annonce");
        annonce1.setStatus(AnnonceStatus.PUBLISHED);

        List<AnnonceResponse> annonces = List.of(annonce1);
        Page<AnnonceResponse> page = new PageImpl<>(annonces, PageRequest.of(0, 20), 1);

        when(annonceService.list(
                eq(AnnonceStatus.PUBLISHED),
                isNull(),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(get("/api/v1/annonces")
                        .param("status", "PUBLISHED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithSearchQuery_Returns200WithMatchingResults() throws Exception {
        AnnonceResponse annonce1 = new AnnonceResponse();
        annonce1.setId(1L);
        annonce1.setTitle("Electronics in Paris");
        annonce1.setStatus(AnnonceStatus.PUBLISHED);

        List<AnnonceResponse> annonces = List.of(annonce1);
        Page<AnnonceResponse> page = new PageImpl<>(annonces, PageRequest.of(0, 20), 1);

        when(annonceService.list(
                isNull(),
                eq("Electronics"),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(get("/api/v1/annonces")
                        .param("q", "Electronics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Electronics in Paris"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithStatusAndSearchQuery_Returns200WithFilteredAndMatchingResults() throws Exception {
        AnnonceResponse annonce1 = new AnnonceResponse();
        annonce1.setId(1L);
        annonce1.setTitle("Electronics in Paris");
        annonce1.setStatus(AnnonceStatus.PUBLISHED);

        List<AnnonceResponse> annonces = List.of(annonce1);
        Page<AnnonceResponse> page = new PageImpl<>(annonces, PageRequest.of(0, 20), 1);

        when(annonceService.list(
                eq(AnnonceStatus.PUBLISHED),
                eq("Electronics"),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(get("/api/v1/annonces")
                        .param("status", "PUBLISHED")
                        .param("q", "Electronics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Electronics in Paris"))
                .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithPagination_Returns200WithCorrectPage() throws Exception {
        AnnonceResponse annonce1 = new AnnonceResponse();
        annonce1.setId(11L);
        annonce1.setTitle("Annonce 11");

        List<AnnonceResponse> annonces = List.of(annonce1);
        Page<AnnonceResponse> page = new PageImpl<>(annonces, PageRequest.of(1, 10), 25);

        when(annonceService.list(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(get("/api/v1/annonces")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(25));
    }

    @Test
    void list_WithSorting_Returns200WithSortedResults() throws Exception {
        AnnonceResponse annonce1 = new AnnonceResponse();
        annonce1.setId(1L);
        annonce1.setTitle("Annonce A");

        AnnonceResponse annonce2 = new AnnonceResponse();
        annonce2.setId(2L);
        annonce2.setTitle("Annonce B");

        List<AnnonceResponse> annonces = Arrays.asList(annonce1, annonce2);
        Page<AnnonceResponse> page = new PageImpl<>(annonces, PageRequest.of(0, 20), 2);

        when(annonceService.list(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(page);

        mockMvc.perform(get("/api/v1/annonces")
                        .param("sort", "title,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].title").value("Annonce A"))
                .andExpect(jsonPath("$.content[1].title").value("Annonce B"));
    }

    @Test
    void list_EmptyResult_Returns200WithEmptyPage() throws Exception {
        Page<AnnonceResponse> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);

        when(annonceService.list(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/annonces"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }
}
