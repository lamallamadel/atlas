package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.security.DossierScope;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Étape 6, lot C : périmètre « mes dossiers ». Deux agents de la même agence, comme les tests
 * d'isolation entre agences : quand l'agence l'active, un agent ne voit plus le dossier d'un
 * collègue (404), ni ce qui s'y rattache, mais garde les siens et ceux à attribuer. Le manager et
 * l'admin voient tout ; désactivé, rien ne change.
 */
@BackendE2ETest
class DossierScopeBackendE2ETest extends BaseBackendE2ETest {

    /** Agence propre au test : le réglage ne déborde pas sur les autres classes. */
    private static final String ORG = "ORG-LOTC";

    @Autowired private JwtAuthenticationConverter jwtAuthenticationConverter;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private MessageRepository messageRepository;
    @PersistenceContext private EntityManager entityManager;

    private final RequestPostProcessor amine = as("agent-amine", "AGENT");
    private final RequestPostProcessor salma = as("agent-salma", "AGENT");
    private final RequestPostProcessor manager = as("manager-1", "MANAGER");
    private final RequestPostProcessor admin = as("admin-1", "ADMIN");

    private long amineDossier;
    private long salmaDossier;
    private long unassigned;
    private long amineMessage;

    private RequestPostProcessor as(String sub, String... realmRoles) {
        return request -> {
            Instant now = Instant.now();
            Jwt token =
                    Jwt.withTokenValue("token-" + sub)
                            .header("alg", "none")
                            .subject(sub)
                            .claim("org_id", ORG)
                            .claim("name", sub)
                            .claim("realm_access", Map.of("roles", List.of(realmRoles)))
                            .issuedAt(now)
                            .expiresAt(now.plusSeconds(3600))
                            .build();
            return jwt().jwt(token)
                    .authorities(j -> jwtAuthenticationConverter.convert(j).getAuthorities())
                    .postProcessRequest(request);
        };
    }

    /**
     * Les tests E2E sont transactionnels : la requête simulée partage le contexte de persistance du
     * test. On le vide pour qu'elle recharge depuis la base, comme une vraie requête.
     */
    private void fresh() {
        entityManager.flush();
        entityManager.clear();
    }

    private MockHttpServletRequestBuilder org(MockHttpServletRequestBuilder b) {
        return b.header("X-Org-Id", ORG);
    }

    private long create(RequestPostProcessor user, String phone) throws Exception {
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

    private void restrict(boolean on) throws Exception {
        fresh();
        mockMvc.perform(
                        org(put("/api/v1/team/settings"))
                                .with(admin)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"restrictAgentsToOwnDossiers\":" + on + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restrictAgentsToOwnDossiers").value(on));
        fresh();
    }

    private List<Long> listedIds(RequestPostProcessor user) throws Exception {
        String body =
                mockMvc.perform(org(get("/api/v1/dossiers?size=200")).with(user))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        List<Long> ids = new ArrayList<>();
        for (JsonNode n : objectMapper.readTree(body).get("content")) {
            ids.add(n.get("id").asLong());
        }
        return ids;
    }

    @BeforeEach
    void setUp() throws Exception {
        restrict(false);
        long suffix = System.nanoTime() % 1_000_000;
        amineDossier = create(amine, "+21260" + String.format("%07d", suffix));
        salmaDossier = create(salma, "+21261" + String.format("%07d", suffix));
        unassigned = create(manager, "+21262" + String.format("%07d", suffix));
        mockMvc.perform(
                        org(post("/api/v1/dossiers/" + unassigned + "/assign"))
                                .with(manager)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"userId\":null}"))
                .andExpect(status().isOk());

        Dossier d = dossierRepository.findById(amineDossier).orElseThrow();
        MessageEntity m = new MessageEntity();
        m.setOrgId(ORG);
        m.setDossier(d);
        m.setDirection(MessageDirection.INBOUND);
        m.setChannel(MessageChannel.WHATSAPP);
        m.setContent("Bonjour, toujours disponible ?");
        m.setTimestamp(LocalDateTime.now());
        amineMessage = messageRepository.save(m).getId();
        fresh();
    }

    @Test
    void disabled_agentsStillSeeEverything() throws Exception {
        mockMvc.perform(org(get("/api/v1/dossiers/" + amineDossier)).with(salma))
                .andExpect(status().isOk());
        assertThat(listedIds(salma)).contains(amineDossier, salmaDossier, unassigned);
        mockMvc.perform(org(get("/api/v1/team/settings")).with(salma))
                .andExpect(jsonPath("$.restrictAgentsToOwnDossiers").value(false));
    }

    @Test
    void enabled_agentSeesOwnAndUnassignedOnly() throws Exception {
        restrict(true);

        assertThat(listedIds(salma))
                .contains(salmaDossier, unassigned)
                .doesNotContain(amineDossier);
        mockMvc.perform(org(get("/api/v1/dossiers/" + amineDossier)).with(salma))
                .andExpect(status().isNotFound());
        mockMvc.perform(org(get("/api/v1/dossiers/" + salmaDossier)).with(salma))
                .andExpect(status().isOk());
        mockMvc.perform(org(get("/api/v1/dossiers/" + unassigned)).with(salma))
                .andExpect(status().isOk());

        // Son collègue garde son dossier ; manager et admin voient tout.
        mockMvc.perform(org(get("/api/v1/dossiers/" + amineDossier)).with(amine))
                .andExpect(status().isOk());
        assertThat(listedIds(manager)).contains(amineDossier, salmaDossier, unassigned);
        mockMvc.perform(org(get("/api/v1/dossiers/" + amineDossier)).with(admin))
                .andExpect(status().isOk());
    }

    @Test
    void enabled_subResourcesOfAColleagueDossierAreHidden() throws Exception {
        restrict(true);

        mockMvc.perform(org(get("/api/v1/messages/" + amineMessage)).with(salma))
                .andExpect(status().isNotFound());
        mockMvc.perform(org(get("/api/v1/messages?dossierId=" + amineDossier)).with(salma))
                .andExpect(
                        result ->
                                assertThat(result.getResponse().getContentAsString())
                                        .doesNotContain("toujours disponible"));
        mockMvc.perform(org(get("/api/v1/messages/" + amineMessage)).with(amine))
                .andExpect(status().isOk());
        fresh();

        // Écrire sur le dossier d'un collègue est refusé de la même façon.
        mockMvc.perform(
                        org(post("/api/v1/appointments"))
                                .with(salma)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"dossierId\":"
                                                + amineDossier
                                                + ",\"startTime\":\"2030-01-10T10:00:00\","
                                                + "\"endTime\":\"2030-01-10T11:00:00\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void enabled_cachedDossierIsNotServedToAnotherAgent() throws Exception {
        restrict(true);
        // Le manager met le dossier en cache ; l'agent restreint ne doit pas le recevoir.
        mockMvc.perform(org(get("/api/v1/dossiers/" + amineDossier)).with(manager))
                .andExpect(status().isOk());
        fresh();
        mockMvc.perform(org(get("/api/v1/dossiers/" + amineDossier)).with(salma))
                .andExpect(status().isNotFound());
    }

    @Test
    void enabled_agentCanTakeAnUnassignedDossier() throws Exception {
        restrict(true);
        mockMvc.perform(org(post("/api/v1/dossiers/" + unassigned + "/claim")).with(salma))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("agent-salma"));
        fresh();
        // Pris par Salma, il sort du périmètre d'Amine.
        mockMvc.perform(org(get("/api/v1/dossiers/" + unassigned)).with(amine))
                .andExpect(status().isNotFound());
    }

    @Test
    void onlyAdminChangesTheSetting() throws Exception {
        mockMvc.perform(
                        org(put("/api/v1/team/settings"))
                                .with(manager)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"restrictAgentsToOwnDossiers\":true}"))
                .andExpect(status().isForbidden());
        // Le périmètre ne fuit pas hors de la requête.
        assertThat(DossierScope.isRestricted()).isFalse();
    }
}
