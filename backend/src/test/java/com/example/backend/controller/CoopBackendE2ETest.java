package com.example.backend.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Module Coop habitat (écrans de l'étape 7) : le manager gère le groupement, ses membres, projets,
 * lots et cotisations ; l'agent consulte ; une autre agence ne voit rien.
 */
@BackendE2ETest
class CoopBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG = "ORG-COOP";

    private static RequestPostProcessor user(String org, String... roles) {
        return jwt().jwt(j -> j.subject("u-" + roles[0]).claim("org_id", org))
                .authorities(
                        java.util.Arrays.stream(roles)
                                .map(
                                        r ->
                                                (org.springframework.security.core.GrantedAuthority)
                                                        new SimpleGrantedAuthority("ROLE_" + r))
                                .toList());
    }

    private final RequestPostProcessor manager = user(ORG, "MANAGER", "PRO");
    private final RequestPostProcessor agent = user(ORG, "AGENT", "PRO");

    private MockHttpServletRequestBuilder in(MockHttpServletRequestBuilder b) {
        return b.header("X-Org-Id", ORG);
    }

    private long post(String url, String body, RequestPostProcessor who) throws Exception {
        String json =
                mockMvc.perform(
                                in(org.springframework.test.web.servlet.request
                                                .MockMvcRequestBuilders.post(url))
                                        .with(who)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return objectMapper.readTree(json).get("id").asLong();
    }

    @Test
    void managerRunsAGroup_agentReads_otherAgencySeesNothing() throws Exception {
        long group =
                post(
                        "/api/v1/coop/groups",
                        "{\"name\":\"Coop Les Oliviers\",\"city\":\"Tanger\"}",
                        manager);
        long member =
                post(
                        "/api/v1/coop/members",
                        "{\"groupId\":"
                                + group
                                + ",\"firstName\":\"Nadia\",\"lastName\":\"Alami\","
                                + "\"email\":\"nadia@example.com\",\"status\":\"PENDING\","
                                + "\"memberNumber\":\"1\"}",
                        manager);
        long project =
                post(
                        "/api/v1/coop/projects",
                        "{\"groupId\":"
                                + group
                                + ",\"name\":\"Résidence Oliviers\",\"status\":\"PLANNING\","
                                + "\"totalBudget\":12000000,\"currency\":\"MAD\"}",
                        manager);
        post(
                "/api/v1/coop/lots",
                "{\"projectId\":"
                        + project
                        + ",\"memberId\":"
                        + member
                        + ",\"lotNumber\":\"A1\",\"surfaceArea\":92,\"status\":\"RESERVED\"}",
                manager);
        post(
                "/api/v1/coop/contributions",
                "{\"memberId\":"
                        + member
                        + ",\"projectId\":"
                        + project
                        + ",\"type\":\"INITIAL\",\"amount\":50000,\"currency\":\"MAD\","
                        + "\"status\":\"PENDING\",\"dueDate\":\"2027-01-15\"}",
                manager);

        // Journal du groupement, lots du projet, membres : lisibles par un agent.
        mockMvc.perform(in(get("/api/v1/coop/contributions?groupId=" + group)).with(agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].amount").value(50000));
        mockMvc.perform(in(get("/api/v1/coop/lots?projectId=" + project)).with(agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].memberId").value(member));
        mockMvc.perform(in(get("/api/v1/coop/members?groupId=" + group)).with(agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].lastName").value("Alami"));

        // L'agent ne modifie rien.
        mockMvc.perform(
                        in(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(
                                        "/api/v1/coop/groups"))
                                .with(agent)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"Interdit\"}"))
                .andExpect(status().isForbidden());

        // Une autre agence ne voit pas ce groupement.
        mockMvc.perform(
                        get("/api/v1/coop/groups/" + group)
                                .header("X-Org-Id", "ORG-COOP-2")
                                .with(user("ORG-COOP-2", "ADMIN")))
                .andExpect(status().isNotFound());
        mockMvc.perform(
                        get("/api/v1/coop/contributions?groupId=" + group)
                                .header("X-Org-Id", "ORG-COOP-2")
                                .with(user("ORG-COOP-2", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }
}
