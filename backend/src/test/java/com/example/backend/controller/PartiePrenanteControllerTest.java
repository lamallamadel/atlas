package com.example.backend.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.dto.PartiePrenanteCreateRequest;
import com.example.backend.dto.PartiePrenanteUpdateRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.PartiePrenanteRole;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.PartiePrenanteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PartiePrenanteControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

    private static final String ORG_ID = "org123";
    private static final String OTHER_ORG_ID = "org456";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @Autowired private PartiePrenanteRepository partiePrenanteRepository;

    @Autowired private DossierRepository dossierRepository;

    private <T extends MockHttpServletRequestBuilder> T withHeaders(T builder) {
        return (T) builder
            .header(ORG_ID_HEADER, ORG_ID)
            .header(CORRELATION_ID_HEADER, CORRELATION_ID)
            .header("Authorization", "Bearer mock-token");
    }

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder>
            T withOtherOrgHeaders(T builder) {
        return (T)
                builder.header(ORG_ID_HEADER, OTHER_ORG_ID)
                        .header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }

    @BeforeEach
    void setUp() {
        partiePrenanteRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_ValidRequest_Returns201WithCreatedEntity() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("BUYER");
        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setEmail("jane.smith@example.com");
        request.setPhone("+33698765432");
        request.setAddress("123 Main St, Paris");

        Map<String, Object> meta = new HashMap<>();
        meta.put("key", "value");
        request.setMeta(meta);

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/parties-prenantes")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.role").value("BUYER"))
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.lastName").value("Smith"))
                .andExpect(jsonPath("$.email").value("jane.smith@example.com"))
                .andExpect(jsonPath("$.phone").value("+33698765432"))
                .andExpect(jsonPath("$.address").value("123 Main St, Paris"))
                .andExpect(jsonPath("$.meta.key").value("value"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void create_ValidRequestAsAdmin_Returns201WithCreatedEntity() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("SELLER");
        request.setFirstName("Bob");
        request.setLastName("Brown");

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/parties-prenantes")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.role").value("SELLER"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_MissingDossierId_Returns400() throws Exception {
        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setRole("BUYER");
        request.setFirstName("Jane");
        request.setLastName("Smith");

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/parties-prenantes")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_MissingRole_Returns400() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setFirstName("Jane");
        request.setLastName("Smith");

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/parties-prenantes")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_InvalidEmail_Returns400() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("BUYER");
        request.setEmail("invalid-email");

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/parties-prenantes")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_NonExistingDossier_Returns404() throws Exception {
        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(999L);
        request.setRole("BUYER");
        request.setFirstName("Jane");
        request.setLastName("Smith");

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/parties-prenantes")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_CrossTenantDossier_Returns404() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(OTHER_ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteCreateRequest request = new PartiePrenanteCreateRequest();
        request.setDossierId(dossier.getId());
        request.setRole("BUYER");
        request.setFirstName("Jane");
        request.setLastName("Smith");

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/parties-prenantes")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_ExistingId_Returns200() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity.setEmail("jane.smith@example.com");
        entity.setPhone("+33698765432");
        entity = partiePrenanteRepository.save(entity);

        mockMvc.perform(withHeaders(get("/api/v1/parties-prenantes/" + entity.getId())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(entity.getId()))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.role").value("BUYER"))
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.lastName").value("Smith"))
                .andExpect(jsonPath("$.email").value("jane.smith@example.com"))
                .andExpect(jsonPath("$.phone").value("+33698765432"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_NonExistingId_Returns404() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/parties-prenantes/999")))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_CrossTenantAccess_Returns404() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(OTHER_ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(OTHER_ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity = partiePrenanteRepository.save(entity);

        mockMvc.perform(withHeaders(get("/api/v1/parties-prenantes/" + entity.getId())))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_ValidRequest_Returns200() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity.setEmail("jane.smith@example.com");
        entity = partiePrenanteRepository.save(entity);

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("SELLER");
        request.setFirstName("Janet");
        request.setLastName("Smithson");
        request.setEmail("janet.smithson@example.com");
        request.setPhone("+33699999999");
        request.setAddress("456 Oak Ave, Lyon");

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/parties-prenantes/" + entity.getId())
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(entity.getId()))
                .andExpect(jsonPath("$.role").value("SELLER"))
                .andExpect(jsonPath("$.firstName").value("Janet"))
                .andExpect(jsonPath("$.lastName").value("Smithson"))
                .andExpect(jsonPath("$.email").value("janet.smithson@example.com"))
                .andExpect(jsonPath("$.phone").value("+33699999999"))
                .andExpect(jsonPath("$.address").value("456 Oak Ave, Lyon"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void update_ValidRequestAsAdmin_Returns200() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity = partiePrenanteRepository.save(entity);

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("NOTARY");
        request.setFirstName("Updated");

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/parties-prenantes/" + entity.getId())
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("NOTARY"))
                .andExpect(jsonPath("$.firstName").value("Updated"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_NonExistingId_Returns404() throws Exception {
        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("SELLER");
        request.setFirstName("Janet");

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/parties-prenantes/999")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_CrossTenantAccess_Returns404() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(OTHER_ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(OTHER_ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity = partiePrenanteRepository.save(entity);

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setRole("SELLER");
        request.setFirstName("Janet");

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/parties-prenantes/" + entity.getId())
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_MissingRole_Returns400() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity = partiePrenanteRepository.save(entity);

        PartiePrenanteUpdateRequest request = new PartiePrenanteUpdateRequest();
        request.setFirstName("Janet");

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/parties-prenantes/" + entity.getId())
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_ValidRequest_Returns204() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity = partiePrenanteRepository.save(entity);

        mockMvc.perform(withHeaders(delete("/api/v1/parties-prenantes/" + entity.getId()).with(csrf())))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_NonExistingId_Returns404() throws Exception {
        mockMvc.perform(withHeaders(delete("/api/v1/parties-prenantes/999").with(csrf())))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_CrossTenantAccess_Returns404() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(OTHER_ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(OTHER_ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity = partiePrenanteRepository.save(entity);

        mockMvc.perform(withHeaders(delete("/api/v1/parties-prenantes/" + entity.getId()).with(csrf())))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void delete_AsPROUser_Returns403() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        entity.setLastName("Smith");
        entity = partiePrenanteRepository.save(entity);

        mockMvc.perform(
                        delete("/api/v1/parties-prenantes/" + entity.getId())
                                .with(csrf())
                                .header(ORG_ID_HEADER, ORG_ID)
                                .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                                .header("Authorization", "Bearer mock-role-pro-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listByDossier_ValidDossierId_Returns200WithFilteredResults() throws Exception {
        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID);
        dossier1.setLeadPhone("+33612345678");
        dossier1.setStatus(DossierStatus.NEW);
        dossier1 = dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_ID);
        dossier2.setLeadPhone("+33687654321");
        dossier2.setStatus(DossierStatus.NEW);
        dossier2 = dossierRepository.save(dossier2);

        PartiePrenanteEntity entity1 = new PartiePrenanteEntity();
        entity1.setOrgId(ORG_ID);
        entity1.setDossier(dossier1);
        entity1.setRole(PartiePrenanteRole.BUYER);
        entity1.setFirstName("Jane");
        entity1.setLastName("Smith");
        partiePrenanteRepository.save(entity1);

        PartiePrenanteEntity entity2 = new PartiePrenanteEntity();
        entity2.setOrgId(ORG_ID);
        entity2.setDossier(dossier1);
        entity2.setRole(PartiePrenanteRole.SELLER);
        entity2.setFirstName("John");
        entity2.setLastName("Doe");
        partiePrenanteRepository.save(entity2);

        PartiePrenanteEntity entity3 = new PartiePrenanteEntity();
        entity3.setOrgId(ORG_ID);
        entity3.setDossier(dossier2);
        entity3.setRole(PartiePrenanteRole.BUYER);
        entity3.setFirstName("Bob");
        entity3.setLastName("Brown");
        partiePrenanteRepository.save(entity3);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/parties-prenantes")
                                        .param("dossierId", dossier1.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].dossierId").value(dossier1.getId()))
                .andExpect(jsonPath("$[1].dossierId").value(dossier1.getId()));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void listByDossier_ValidDossierIdAsAdmin_Returns200WithFilteredResults() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity1 = new PartiePrenanteEntity();
        entity1.setOrgId(ORG_ID);
        entity1.setDossier(dossier);
        entity1.setRole(PartiePrenanteRole.BUYER);
        entity1.setFirstName("Jane");
        partiePrenanteRepository.save(entity1);

        PartiePrenanteEntity entity2 = new PartiePrenanteEntity();
        entity2.setOrgId(ORG_ID);
        entity2.setDossier(dossier);
        entity2.setRole(PartiePrenanteRole.NOTARY);
        entity2.setFirstName("Alice");
        partiePrenanteRepository.save(entity2);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/parties-prenantes")
                                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listByDossier_EmptyResult_Returns200WithEmptyList() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/parties-prenantes")
                                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listByDossier_NonExistingDossier_Returns404() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/parties-prenantes").param("dossierId", "999")))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void listByDossier_CrossTenantDossier_Returns404() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(OTHER_ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        PartiePrenanteEntity entity = new PartiePrenanteEntity();
        entity.setOrgId(OTHER_ORG_ID);
        entity.setDossier(dossier);
        entity.setRole(PartiePrenanteRole.BUYER);
        entity.setFirstName("Jane");
        partiePrenanteRepository.save(entity);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/parties-prenantes")
                                        .param("dossierId", dossier.getId().toString())))
                .andExpect(status().isNotFound());
    }
}
