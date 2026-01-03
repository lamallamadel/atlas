package com.example.backend.config;

import com.example.backend.dto.AnnonceCreateRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AnnonceRepository annonceRepository;

    @BeforeEach
    void setUp() {
        annonceRepository.deleteAll();
    }

    @Test
    void whenNoJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/annonces")
                        .header("X-Org-Id", "ORG1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void whenProRoleOnDelete_returns403() throws Exception {
        Annonce annonce = createAnnonce("ORG1");
        annonce = annonceRepository.save(annonce);

        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                        .header("X-Org-Id", "ORG1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void whenAdminRoleOnDelete_returns200() throws Exception {
        Annonce annonce = createAnnonce("ORG1");
        annonce = annonceRepository.save(annonce);

        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                        .header("X-Org-Id", "ORG1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void whenAdminRoleOnGet_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/annonces")
                        .header("X-Org-Id", "ORG1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void whenProRoleOnGet_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/annonces")
                        .header("X-Org-Id", "ORG1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void whenProRoleOnPost_returns201() throws Exception {
        AnnonceCreateRequest request = createAnnonceRequest("ORG1");

        mockMvc.perform(post("/api/v1/annonces")
                        .header("X-Org-Id", "ORG1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void whenAdminRoleOnPost_returns201() throws Exception {
        AnnonceCreateRequest request = createAnnonceRequest("ORG1");

        mockMvc.perform(post("/api/v1/annonces")
                        .header("X-Org-Id", "ORG1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private Annonce createAnnonce(String orgId) {
        Annonce annonce = new Annonce();
        annonce.setOrgId(orgId);
        annonce.setTitle("Test Annonce");
        annonce.setDescription("Test Description");
        annonce.setCategory("Test Category");
        annonce.setCity("Paris");
        annonce.setPrice(BigDecimal.valueOf(100.00));
        annonce.setCurrency("EUR");
        annonce.setStatus(AnnonceStatus.DRAFT);
        return annonce;
    }

    private AnnonceCreateRequest createAnnonceRequest(String orgId) {
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setOrgId(orgId);
        request.setTitle("Test Annonce");
        request.setDescription("Test Description");
        request.setCategory("Test Category");
        request.setCity("Paris");
        request.setPrice(BigDecimal.valueOf(100.00));
        request.setCurrency("EUR");
        return request;
    }
}
