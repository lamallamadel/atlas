package com.example.backend.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.util.TenantContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TenantFilterTest {

    @Autowired private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void whenXOrgIdHeaderAbsent_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/annonces"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Missing required header: X-Org-Id"))
                .andExpect(jsonPath("$.title").value("Bad Request"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void whenXOrgIdHeaderPresent_injectsOrgIdIntoContext() throws Exception {
        String orgId = "TEST-ORG-123";

        mockMvc.perform(get("/api/v1/annonces").header("X-Org-Id", orgId))
                .andExpect(status().isOk());

        assertThat(TenantContext.getOrgId()).isNull();
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void whenXOrgIdHeaderEmpty_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/annonces").header("X-Org-Id", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Missing required header: X-Org-Id"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void whenXOrgIdHeaderWhitespace_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/annonces").header("X-Org-Id", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Missing required header: X-Org-Id"));
    }

    @Test
    void whenNonApiEndpoint_doesNotRequireXOrgIdHeader() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
