package com.example.backend.controller;

import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.service.DossierService;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DossierController.class)
class DossierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DossierService dossierService;

    private DossierCreateRequest createRequest;
    private DossierResponse dossierResponse;

    @BeforeEach
    void setUp() {
        createRequest = new DossierCreateRequest();
        createRequest.setOrgId("org123");
        createRequest.setLeadPhone("+33612345678");
        createRequest.setLeadName("John Doe");
        createRequest.setLeadSource("Website");
        createRequest.setAnnonceId(1L);

        dossierResponse = new DossierResponse();
        dossierResponse.setId(1L);
        dossierResponse.setOrgId("org123");
        dossierResponse.setLeadPhone("+33612345678");
        dossierResponse.setLeadName("John Doe");
        dossierResponse.setLeadSource("Website");
        dossierResponse.setAnnonceId(1L);
        dossierResponse.setStatus(DossierStatus.NEW);
        dossierResponse.setCreatedAt(LocalDateTime.now());
        dossierResponse.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void create_ValidRequest_Returns201WithCreatedEntity() throws Exception {
        when(dossierService.create(any(DossierCreateRequest.class))).thenReturn(dossierResponse);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.orgId").value("org123"))
                .andExpect(jsonPath("$.leadPhone").value("+33612345678"))
                .andExpect(jsonPath("$.leadName").value("John Doe"))
                .andExpect(jsonPath("$.leadSource").value("Website"))
                .andExpect(jsonPath("$.annonceId").value(1))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void create_MissingOrgId_Returns400() throws Exception {
        createRequest.setOrgId(null);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_BlankOrgId_Returns400() throws Exception {
        createRequest.setOrgId("");

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_OrgIdTooLong_Returns400() throws Exception {
        createRequest.setOrgId("A".repeat(256));

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_LeadPhoneTooLong_Returns400() throws Exception {
        createRequest.setLeadPhone("A".repeat(51));

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_LeadNameTooLong_Returns400() throws Exception {
        createRequest.setLeadName("A".repeat(256));

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_LeadSourceTooLong_Returns400() throws Exception {
        createRequest.setLeadSource("A".repeat(101));

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_ArchivedAnnonce_Returns400() throws Exception {
        createRequest.setAnnonceId(1L);

        when(dossierService.create(any(DossierCreateRequest.class)))
                .thenThrow(new IllegalArgumentException("Cannot create dossier with ARCHIVED annonce"));

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot create dossier with ARCHIVED annonce"));
    }

    @Test
    void getById_ExistingId_Returns200WithEntity() throws Exception {
        when(dossierService.getById(1L)).thenReturn(dossierResponse);

        mockMvc.perform(get("/api/v1/dossiers/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.orgId").value("org123"))
                .andExpect(jsonPath("$.leadPhone").value("+33612345678"));
    }

    @Test
    void getById_NonExistingId_Returns404() throws Exception {
        when(dossierService.getById(999L)).thenThrow(new EntityNotFoundException("Dossier not found with id: 999"));

        mockMvc.perform(get("/api/v1/dossiers/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void patchStatus_ValidRequest_Returns200() throws Exception {
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        DossierResponse updatedResponse = new DossierResponse();
        updatedResponse.setId(1L);
        updatedResponse.setOrgId("org123");
        updatedResponse.setStatus(DossierStatus.QUALIFIED);

        when(dossierService.patchStatus(eq(1L), any(DossierStatusPatchRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/api/v1/dossiers/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("QUALIFIED"));
    }

    @Test
    void patchStatus_NonExistingId_Returns404() throws Exception {
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        when(dossierService.patchStatus(eq(999L), any(DossierStatusPatchRequest.class)))
                .thenThrow(new EntityNotFoundException("Dossier not found with id: 999"));

        mockMvc.perform(patch("/api/v1/dossiers/999/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void patchStatus_MissingStatus_Returns400() throws Exception {
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();

        mockMvc.perform(patch("/api/v1/dossiers/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchStatus_InvalidStatus_Returns400() throws Exception {
        String invalidJson = "{\"status\": \"INVALID_STATUS\"}";

        mockMvc.perform(patch("/api/v1/dossiers/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchStatus_AllValidStatuses_Returns200() throws Exception {
        for (DossierStatus status : DossierStatus.values()) {
            DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
            patchRequest.setStatus(status);

            DossierResponse updatedResponse = new DossierResponse();
            updatedResponse.setId(1L);
            updatedResponse.setStatus(status);

            when(dossierService.patchStatus(eq(1L), any(DossierStatusPatchRequest.class))).thenReturn(updatedResponse);

            mockMvc.perform(patch("/api/v1/dossiers/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(patchRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value(status.toString()));
        }
    }

    @Test
    void list_NoFilters_Returns200WithPagedResults() throws Exception {
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(1L);
        dossier1.setLeadName("John Doe");
        dossier1.setStatus(DossierStatus.NEW);

        DossierResponse dossier2 = new DossierResponse();
        dossier2.setId(2L);
        dossier2.setLeadName("Jane Smith");
        dossier2.setStatus(DossierStatus.QUALIFIED);

        List<DossierResponse> dossiers = Arrays.asList(dossier1, dossier2);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(0, 20), 2);

        when(dossierService.list(eq(null), eq(null), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].leadName").value("John Doe"))
                .andExpect(jsonPath("$.content[1].id").value(2))
                .andExpect(jsonPath("$.content[1].leadName").value("Jane Smith"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    void list_WithStatusFilter_Returns200WithFilteredResults() throws Exception {
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(1L);
        dossier1.setLeadName("John Doe");
        dossier1.setStatus(DossierStatus.QUALIFIED);

        List<DossierResponse> dossiers = List.of(dossier1);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(0, 20), 1);

        when(dossierService.list(eq(DossierStatus.QUALIFIED), eq(null), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers")
                        .param("status", "QUALIFIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("QUALIFIED"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithLeadPhoneFilter_Returns200WithFilteredResults() throws Exception {
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(1L);
        dossier1.setLeadPhone("+33612345678");
        dossier1.setStatus(DossierStatus.NEW);

        List<DossierResponse> dossiers = List.of(dossier1);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(0, 20), 1);

        when(dossierService.list(eq(null), eq("+33612345678"), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers")
                        .param("leadPhone", "+33612345678"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].leadPhone").value("+33612345678"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithAnnonceIdFilter_Returns200WithFilteredResults() throws Exception {
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(1L);
        dossier1.setAnnonceId(5L);
        dossier1.setStatus(DossierStatus.NEW);

        List<DossierResponse> dossiers = List.of(dossier1);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(0, 20), 1);

        when(dossierService.list(eq(null), eq(null), eq(5L), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers")
                        .param("annonceId", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].annonceId").value(5))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithStatusAndPhoneFilter_Returns200WithFilteredResults() throws Exception {
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(1L);
        dossier1.setLeadPhone("+33612345678");
        dossier1.setStatus(DossierStatus.QUALIFIED);

        List<DossierResponse> dossiers = List.of(dossier1);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(0, 20), 1);

        when(dossierService.list(eq(DossierStatus.QUALIFIED), eq("+33612345678"), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers")
                        .param("status", "QUALIFIED")
                        .param("leadPhone", "+33612345678"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].leadPhone").value("+33612345678"))
                .andExpect(jsonPath("$.content[0].status").value("QUALIFIED"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithAllFilters_Returns200WithFilteredResults() throws Exception {
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(1L);
        dossier1.setLeadPhone("+33612345678");
        dossier1.setAnnonceId(5L);
        dossier1.setStatus(DossierStatus.QUALIFIED);

        List<DossierResponse> dossiers = List.of(dossier1);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(0, 20), 1);

        when(dossierService.list(eq(DossierStatus.QUALIFIED), eq("+33612345678"), eq(5L), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers")
                        .param("status", "QUALIFIED")
                        .param("leadPhone", "+33612345678")
                        .param("annonceId", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_WithPagination_Returns200WithCorrectPage() throws Exception {
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(11L);
        dossier1.setLeadName("Dossier 11");

        List<DossierResponse> dossiers = List.of(dossier1);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(1, 10), 25);

        when(dossierService.list(eq(null), eq(null), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers")
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
        DossierResponse dossier1 = new DossierResponse();
        dossier1.setId(1L);
        dossier1.setLeadName("Alice");

        DossierResponse dossier2 = new DossierResponse();
        dossier2.setId(2L);
        dossier2.setLeadName("Bob");

        List<DossierResponse> dossiers = Arrays.asList(dossier1, dossier2);
        Page<DossierResponse> page = new PageImpl<>(dossiers, PageRequest.of(0, 20), 2);

        when(dossierService.list(eq(null), eq(null), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/dossiers")
                        .param("sort", "leadName,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].leadName").value("Alice"))
                .andExpect(jsonPath("$.content[1].leadName").value("Bob"));
    }

    @Test
    void list_EmptyResult_Returns200WithEmptyPage() throws Exception {
        Page<DossierResponse> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);

        when(dossierService.list(eq(null), eq(null), eq(null), any())).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/dossiers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }
}
