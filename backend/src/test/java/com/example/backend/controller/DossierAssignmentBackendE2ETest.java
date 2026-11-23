package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.entity.ActivityEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.NotificationEntity;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.NotificationRepository;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Étape 6, lot A : agent assigné aux dossiers. Un dossier créé par un agent lui revient, un lead
 * entrant arrive à attribuer, un agent peut le prendre, seul un manager réassigne. Pas encore de
 * restriction de visibilité (lot C).
 */
@BackendE2ETest
class DossierAssignmentBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG = "ORG-001";

    @Autowired private DossierRepository dossierRepository;
    @Autowired private ActivityRepository activityRepository;
    @Autowired private NotificationRepository notificationRepository;

    /** Jeton d'un utilisateur de l'agence, avec son nom et ses rôles. */
    private RequestPostProcessor as(String sub, String name, String... roles) {
        Instant now = Instant.now();
        Jwt token =
                Jwt.withTokenValue("token-" + sub)
                        .header("alg", "none")
                        .subject(sub)
                        .claim("org_id", ORG)
                        .claim("name", name)
                        .claim("realm_access", Map.of("roles", List.of(roles)))
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(3600))
                        .build();
        return jwt().jwt(token)
                .authorities(
                        Arrays.stream(roles)
                                .map(
                                        r ->
                                                (GrantedAuthority)
                                                        new SimpleGrantedAuthority("ROLE_" + r))
                                .toList());
    }

    private MockHttpServletRequestBuilder org(MockHttpServletRequestBuilder b) {
        return b.header("X-Org-Id", ORG);
    }

    private long createAs(RequestPostProcessor user, String phone) throws Exception {
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

    private long incomingLead(String phone) throws Exception {
        PortalLeadRequest r = new PortalLeadRequest();
        r.setName("Visiteur");
        r.setPhone(phone);
        r.setRequestType("CONTACT");
        r.setConsent(true);
        mockMvc.perform(
                        post("/api/v1/portal/leads")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isCreated());
        return dossierRepository.findAll().stream()
                .filter(d -> phone.equals(d.getLeadPhone()))
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private final RequestPostProcessor amine = as("agent-1", "Amine Agent", "PRO");
    private final RequestPostProcessor salma = as("agent-2", "Salma Agent", "PRO");
    private final RequestPostProcessor manager =
            as("manager-1", "Mounia Manager", "MANAGER", "PRO");

    @Test
    void dossierCreatedByAnAgentIsHis() throws Exception {
        long id = createAs(amine, "+212600200001");

        mockMvc.perform(org(get("/api/v1/dossiers/{id}", id)).with(amine))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("agent-1"))
                .andExpect(jsonPath("$.assignedToName").value("Amine Agent"))
                .andExpect(jsonPath("$.assignedAt").exists());
    }

    @Test
    void incomingLeadIsUnassignedAndCanBeTakenOnce() throws Exception {
        long id = incomingLead("+212600200002");
        assertThat(dossierRepository.findById(id).orElseThrow().getAssignedTo()).isNull();

        mockMvc.perform(org(get("/api/v1/dossiers")).with(salma).param("assignee", "unassigned"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", hasItem((int) id)));

        mockMvc.perform(org(post("/api/v1/dossiers/{id}/claim", id)).with(salma))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("agent-2"))
                .andExpect(jsonPath("$.assignedToName").value("Salma Agent"));

        mockMvc.perform(org(post("/api/v1/dossiers/{id}/claim", id)).with(amine))
                .andExpect(status().isConflict());

        List<ActivityEntity> activities =
                activityRepository.findAll().stream()
                        .filter(a -> a.getDossier() != null && a.getDossier().getId() == id)
                        .filter(a -> a.getType() == ActivityType.ASSIGNMENT_CHANGED)
                        .toList();
        assertThat(activities).hasSize(1);
        assertThat(activities.get(0).getContent()).contains("Salma Agent a pris le dossier");
    }

    @Test
    void onlyAManagerReassignsAndTheNewAgentIsNotified() throws Exception {
        long id = createAs(amine, "+212600200003");

        mockMvc.perform(
                        org(post("/api/v1/dossiers/{id}/assign", id))
                                .with(amine)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"userId\":\"agent-2\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        org(post("/api/v1/dossiers/{id}/assign", id))
                                .with(manager)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"userId\":\"agent-1\"}"))
                .andExpect(status().isOk());
        // L'annuaire Keycloak n'est pas joignable en test : repli sur les membres déjà vus.
        mockMvc.perform(
                        org(post("/api/v1/dossiers/{id}/assign", id))
                                .with(manager)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"userId\":\"agent-2\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("agent-2"));

        List<NotificationEntity> notified =
                notificationRepository.findAll().stream()
                        .filter(n -> n.getType() == NotificationType.IN_APP)
                        .filter(n -> "agent-2".equals(n.getRecipient()))
                        .filter(n -> Long.valueOf(id).equals(n.getDossierId()))
                        .toList();
        assertThat(notified).hasSize(1);
        assertThat(notified.get(0).getMessage()).contains("Mounia Manager");

        mockMvc.perform(
                        org(post("/api/v1/dossiers/{id}/assign", id))
                                .with(manager)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"userId\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").doesNotExist());
    }

    @Test
    void myDossiersFilterAndBulkReassign() throws Exception {
        long a = createAs(amine, "+212600200004");
        long b = createAs(amine, "+212600200005");
        long c = createAs(salma, "+212600200006");

        mockMvc.perform(org(get("/api/v1/dossiers")).with(amine).param("assignee", "me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", hasItem((int) a)))
                .andExpect(jsonPath("$.content[?(@.id == " + c + ")]").isEmpty());

        mockMvc.perform(
                        org(post("/api/v1/dossiers/bulk-reassign"))
                                .with(manager)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                Map.of("ids", List.of(a, b), "userId", "agent-2"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.successCount").value(2));

        List<Dossier> moved = dossierRepository.findAllById(List.of(a, b));
        assertThat(moved).allMatch(d -> "agent-2".equals(d.getAssignedTo()));
    }

    @Test
    void teamListsTheAgencyMembersSeenSoFar() throws Exception {
        createAs(amine, "+212600200007");

        mockMvc.perform(org(get("/api/v1/team")).with(salma))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].userId", hasItem("agent-1")))
                .andExpect(jsonPath("$[*].name", hasItem("Amine Agent")));
    }
}
