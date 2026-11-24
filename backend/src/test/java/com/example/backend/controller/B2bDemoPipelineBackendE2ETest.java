package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.DossierStatusHistory;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.DossierStatusHistoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Étape 7 : pipeline B2B de démo (spec {@code 08_workflow_b2b_demo.md}) sur la phase B de l'ADR
 * 0004. Le statut est écrit en code {@code B2B_*} et validé par le workflow du type de dossier ;
 * l'enum suit en projection.
 */
@BackendE2ETest
class B2bDemoPipelineBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG = "ORG-001";
    private static final String B2B = "CRM_LEAD_B2B_DEMO";

    @Autowired private JwtAuthenticationConverter jwtAuthenticationConverter;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private DossierStatusHistoryRepository historyRepository;
    @PersistenceContext private EntityManager entityManager;

    private final RequestPostProcessor agent = as("agent-sara", "AGENT");
    private final RequestPostProcessor manager = as("manager-1", "MANAGER");

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

    private MockHttpServletRequestBuilder org(MockHttpServletRequestBuilder b) {
        return b.header("X-Org-Id", ORG);
    }

    private long createB2b(String phone) throws Exception {
        DossierCreateRequest r = new DossierCreateRequest();
        r.setLeadName("Agence " + phone);
        r.setLeadPhone(phone);
        r.setCaseType(B2B);
        String body =
                mockMvc.perform(
                                org(post("/api/v1/dossiers"))
                                        .with(agent)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(r)))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.statusCode").value("B2B_NEW"))
                        .andExpect(jsonPath("$.status").value("NEW"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private ResultActions move(long id, RequestPostProcessor user, String body) throws Exception {
        return mockMvc.perform(
                org(patch("/api/v1/dossiers/" + id + "/status"))
                        .with(user)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body));
    }

    private List<String> targets(long id, RequestPostProcessor user) throws Exception {
        String body =
                mockMvc.perform(org(get("/api/v1/dossiers/" + id + "/transitions")).with(user))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        List<String> codes = new ArrayList<>();
        for (JsonNode t : objectMapper.readTree(body).get("transitions")) {
            codes.add(t.get("statusCode").asText());
        }
        return codes;
    }

    @Test
    void demoGoesFromRequestToLost_withRulesOfThePipeline() throws Exception {
        long id = createB2b("+212600700001");

        // Depuis B2B_NEW : qualifier ou perdre, avec les raisons de perte B2B.
        mockMvc.perform(org(get("/api/v1/dossiers/" + id + "/transitions")).with(agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseType").value(B2B))
                .andExpect(jsonPath("$.statusCode").value("B2B_NEW"))
                .andExpect(jsonPath("$.statusLabel").value("Nouvelle demande"))
                .andExpect(jsonPath("$.transitions.length()").value(2))
                .andExpect(
                        jsonPath("$.transitions[?(@.statusCode=='B2B_LOST')].requires[0]")
                                .value("lossReason"))
                .andExpect(
                        jsonPath("$.transitions[?(@.statusCode=='B2B_LOST')].reasons.length()")
                                .value(6));

        // Pas de saut d'étape.
        move(id, agent, "{\"statusCode\":\"B2B_WON\"}").andExpect(status().isBadRequest());

        move(id, agent, "{\"statusCode\":\"B2B_QUALIFIED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("B2B_QUALIFIED"))
                .andExpect(jsonPath("$.status").value("QUALIFIED"));

        // Retour en arrière réservé au manager.
        assertThat(targets(id, agent)).containsExactlyInAnyOrder("B2B_SCHEDULED", "B2B_LOST");
        assertThat(targets(id, manager)).contains("B2B_NEW");
        move(id, agent, "{\"statusCode\":\"B2B_NEW\"}").andExpect(status().isBadRequest());

        // Planifier exige un rendez-vous.
        move(id, agent, "{\"statusCode\":\"B2B_SCHEDULED\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.properties.errorType").value("MISSING_REQUIRED_FIELDS"))
                .andExpect(
                        jsonPath("$.properties.validationErrors.missingRequiredFields[0]")
                                .value("appointment"));
        mockMvc.perform(
                        org(post("/api/v1/appointments"))
                                .with(agent)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"dossierId\":"
                                                + id
                                                + ",\"startTime\":\"2030-02-10T10:00:00\","
                                                + "\"endTime\":\"2030-02-10T11:00:00\"}"))
                .andExpect(status().isCreated());
        entityManager.flush();
        entityManager.clear();
        move(id, agent, "{\"statusCode\":\"B2B_SCHEDULED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPOINTMENT"));

        move(id, agent, "{\"statusCode\":\"B2B_DONE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("B2B_DONE"));

        // Perte : raison obligatoire, et du référentiel B2B.
        move(id, agent, "{\"statusCode\":\"B2B_LOST\"}").andExpect(status().isBadRequest());
        move(id, agent, "{\"statusCode\":\"B2B_LOST\",\"lossReason\":\"PRICE_TOO_HIGH\"}")
                .andExpect(status().isBadRequest());
        move(id, agent, "{\"statusCode\":\"B2B_LOST\",\"lossReason\":\"B2B_LOST_TIMING\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("B2B_LOST"))
                .andExpect(jsonPath("$.status").value("LOST"));

        assertThat(targets(id, manager)).isEmpty();

        // L'historique garde les codes, même quand l'enum ne change pas (SCHEDULED -> DONE).
        List<DossierStatusHistory> history =
                historyRepository.findByDossierId(id, Pageable.unpaged()).getContent();
        assertThat(history)
                .extracting(DossierStatusHistory::getToCode)
                .contains("B2B_QUALIFIED", "B2B_SCHEDULED", "B2B_DONE", "B2B_LOST");
    }

    @Test
    void legacyEnumStatusIsRefusedOnAB2bDossier() throws Exception {
        long id = createB2b("+212600700002");
        // QUALIFIED (enum) devient CRM_QUALIFIED, absent du pipeline B2B.
        move(id, agent, "{\"status\":\"QUALIFIED\"}").andExpect(status().isBadRequest());
        move(id, agent, "{}").andExpect(status().isBadRequest());
    }

    @Test
    void crmDossierExposesItsTransitionsToo() throws Exception {
        DossierCreateRequest r = new DossierCreateRequest();
        r.setLeadName("Acheteur");
        r.setLeadPhone("+212600700003");
        String body =
                mockMvc.perform(
                                org(post("/api/v1/dossiers"))
                                        .with(agent)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(r)))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        long id = objectMapper.readTree(body).get("id").asLong();

        assertThat(targets(id, agent))
                .containsExactlyInAnyOrder(
                        "CRM_QUALIFYING", "CRM_QUALIFIED", "CRM_VISIT_PLANNED", "CRM_CLOSED_LOST");
        move(id, agent, "{\"statusCode\":\"CRM_QUALIFYING\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUALIFYING"));
    }

    @Test
    void vitrineDemoRequest_keepsTheAgencyProfile_andListsByCaseType() throws Exception {
        PortalLeadRequest r = new PortalLeadRequest();
        r.setName("Agence du Détroit");
        r.setPhone("+212600700004");
        r.setRequestType("DEMO");
        r.setConsent(true);
        r.setDemo(
                new PortalLeadRequest.DemoDetails(
                        "Tanger",
                        "AGENCY",
                        "3-5",
                        "50-200",
                        "GROWTH",
                        List.of("CRM", "WhatsApp", " ")));
        mockMvc.perform(
                        post("/api/v1/portal/leads")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isCreated());

        Dossier saved =
                dossierRepository.findAll().stream()
                        .filter(d -> "+212600700004".equals(d.getLeadPhone()))
                        .findFirst()
                        .orElseThrow();
        assertThat(saved.getStatusCode()).isEqualTo("B2B_NEW");
        assertThat(saved.getLeadDetails())
                .containsEntry("city", "Tanger")
                .containsEntry("needs", List.of("CRM", "WhatsApp"));

        long crm = createB2b("+212600700005");
        String list =
                mockMvc.perform(
                                org(get("/api/v1/dossiers?caseType=" + B2B + "&size=200"))
                                        .with(agent))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        for (JsonNode d : objectMapper.readTree(list).get("content")) {
            assertThat(d.get("caseType").asText()).isEqualTo(B2B);
        }
        assertThat(list).contains("\"id\":" + crm).contains("Tanger");
    }
}
