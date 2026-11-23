package com.example.backend.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.DossierCreateRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Étape 6, lot B : rôles d'agence lus depuis le jeton Keycloak par le vrai convertisseur. Un {@code
 * AGENT} garde les droits de l'ancien {@code PRO}, un {@code MANAGER} est membre de l'agence et
 * réassigne, seul l'admin gère l'équipe.
 */
@BackendE2ETest
class AgencyRolesBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG = "ORG-001";

    @Autowired private JwtAuthenticationConverter jwtAuthenticationConverter;

    /** Jeton avec ces rôles de realm, converti comme en production. */
    private RequestPostProcessor as(String sub, String... realmRoles) {
        Instant now = Instant.now();
        var token =
                org.springframework.security.oauth2.jwt.Jwt.withTokenValue("token-" + sub)
                        .header("alg", "none")
                        .subject(sub)
                        .claim("org_id", ORG)
                        .claim("name", sub)
                        .claim("realm_access", Map.of("roles", List.of(realmRoles)))
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(3600))
                        .build();
        return jwt().jwt(token)
                .authorities(j -> jwtAuthenticationConverter.convert(j).getAuthorities());
    }

    private MockHttpServletRequestBuilder org(MockHttpServletRequestBuilder b) {
        return b.header("X-Org-Id", ORG);
    }

    private long createDossier(RequestPostProcessor user, String phone) throws Exception {
        DossierCreateRequest r = new DossierCreateRequest();
        r.setLeadName("Client " + phone);
        r.setLeadPhone(phone);
        String body =
                mockMvc.perform(
                                org(post("/api/v1/dossiers"))
                                        .with(user)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(r)))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void agentRole_keepsTheRightsOfLegacyPro() throws Exception {
        RequestPostProcessor agent = as("agent-1", "AGENT");

        long id = createDossier(agent, "+212600000201");
        mockMvc.perform(org(get("/api/v1/dossiers/" + id)).with(agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("agent-1"));
        mockMvc.perform(org(get("/api/v1/annonces")).with(agent)).andExpect(status().isOk());
        mockMvc.perform(org(get("/api/v1/team")).with(agent)).andExpect(status().isOk());
    }

    @Test
    void managerRole_isAgencyMember_andReassigns() throws Exception {
        RequestPostProcessor manager = as("manager-1", "MANAGER");
        long id = createDossier(as("agent-1", "AGENT"), "+212600000202");

        mockMvc.perform(org(get("/api/v1/dossiers")).with(manager)).andExpect(status().isOk());
        mockMvc.perform(
                        org(post("/api/v1/dossiers/" + id + "/assign"))
                                .with(manager)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"userId\":\"agent-2\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("agent-2"));
    }

    @Test
    void agent_cannotReassignNorInvite() throws Exception {
        RequestPostProcessor agent = as("agent-1", "AGENT");
        long id = createDossier(agent, "+212600000203");

        mockMvc.perform(
                        org(post("/api/v1/dossiers/" + id + "/assign"))
                                .with(agent)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"userId\":\"agent-2\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(
                        org(post("/api/v1/users/invite"))
                                .with(agent)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"email\":\"x@example.com\",\"firstName\":\"X\","
                                                + "\"lastName\":\"Y\",\"role\":\"AGENT\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyAdmin_managesTheTeam() throws Exception {
        String body = "{\"role\":\"MANAGER\"}";
        mockMvc.perform(
                        org(put("/api/v1/team/agent-1/role"))
                                .with(as("manager-1", "MANAGER"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(
                        org(put("/api/v1/team/agent-1/enabled"))
                                .with(as("agent-2", "PRO"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());

        // L'admin passe le premier filtre ; un rôle inconnu est refusé avant tout appel Keycloak.
        mockMvc.perform(
                        org(put("/api/v1/team/agent-1/role"))
                                .with(as("admin-1", "ADMIN"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"role\":\"OWNER\"}"))
                .andExpect(status().isBadRequest());
    }
}
