package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

/** Consentement : saisie par l'agent (preuve posée par le serveur) et confirmation par lien. */
@BackendE2ETest
@WithMockUser(
        username = "agent-1",
        roles = {"PRO"})
class ConsentRequestBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";

    @Autowired private DossierRepository dossierRepository;
    @Autowired private ConsentementRepository consentementRepository;

    private Long dossierId;

    @BeforeEach
    void setUp() {
        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadName("Karim Benali");
        d.setLeadPhone("+212600000041");
        d.setStatus(DossierStatus.QUALIFIED);
        dossierId = dossierRepository.save(d).getId();
    }

    private String createLink() throws Exception {
        String json =
                mockMvc.perform(
                                withTenantHeaders(
                                                post(
                                                        "/api/v1/dossiers/"
                                                                + dossierId
                                                                + "/consent-links"),
                                                ORG1)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                "{\"channel\":\"WHATSAPP\",\"consentType\":\"MARKETING\"}"))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.channel").value("WHATSAPP"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        JsonNode node = objectMapper.readTree(json);
        String url = node.get("url").asText();
        assertThat(url).contains("/consentement/");
        return url.substring(url.lastIndexOf('/') + 1);
    }

    private List<ConsentementEntity> marketing() {
        return consentementRepository.findByDossierIdAndChannelAndConsentTypeOrderByUpdatedAtDesc(
                dossierId,
                com.example.backend.entity.enums.ConsentementChannel.WHATSAPP,
                ConsentementType.MARKETING);
    }

    @Test
    void le_client_confirme_par_le_lien_avec_preuve_de_double_opt_in() throws Exception {
        String token = createLink();

        // page publique : sans jeton ni organisation, seulement le prénom
        mockMvc.perform(get("/api/v1/public/consent/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.clientFirstName").value("Karim"))
                .andExpect(jsonPath("$.consentType").value("MARKETING"));

        mockMvc.perform(
                        post("/api/v1/public/consent/" + token)
                                .header("X-Forwarded-For", "41.250.1.2, 10.0.0.1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"decision\":\"ACCEPT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ANSWERED"))
                .andExpect(jsonPath("$.decision").value("ACCEPT"));

        List<ConsentementEntity> consents = marketing();
        assertThat(consents).hasSize(1);
        ConsentementEntity c = consents.get(0);
        assertThat(c.getStatus()).isEqualTo(ConsentementStatus.GRANTED);
        assertThat(c.getOrgId()).isEqualTo(ORG1);
        assertThat(c.getMeta())
                .containsEntry("source", "CLIENT_LINK")
                .containsEntry("ipAddress", "41.250.1.2")
                .containsEntry("doubleOptInConfirmed", true)
                .containsKey("optInTimestamp");

        // lien à usage unique : une seconde réponse ne change rien
        mockMvc.perform(
                        post("/api/v1/public/consent/" + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"decision\":\"REFUSE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("ACCEPT"));
        assertThat(marketing()).hasSize(1);
    }

    @Test
    void le_client_refuse() throws Exception {
        String token = createLink();
        mockMvc.perform(
                        post("/api/v1/public/consent/" + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"decision\":\"REFUSE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("REFUSE"));
        assertThat(marketing().get(0).getStatus()).isEqualTo(ConsentementStatus.DENIED);
        assertThat(marketing().get(0).getMeta()).doesNotContainKey("doubleOptInConfirmed");
    }

    @Test
    void lien_inconnu_ou_reponse_invalide() throws Exception {
        mockMvc.perform(get("/api/v1/public/consent/inexistant")).andExpect(status().isNotFound());
        String token = createLink();
        mockMvc.perform(
                        post("/api/v1/public/consent/" + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"decision\":\"PEUT-ETRE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void saisie_agent_preuve_posee_par_le_serveur_sans_double_opt_in() throws Exception {
        String body =
                "{\"dossierId\":"
                        + dossierId
                        + ",\"channel\":\"WHATSAPP\",\"consentType\":\"MARKETING\",\"status\":\"GRANTED\","
                        + "\"meta\":{\"source\":\"AGENT\",\"method\":\"PHONE_CALL\",\"note\":\"Appel du 20/11\","
                        + "\"doubleOptInConfirmed\":true,\"ipAddress\":\"1.2.3.4\",\"optInTimestamp\":\"x\"}}";
        mockMvc.perform(
                        withTenantHeaders(post("/api/v1/consentements"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isCreated());

        ConsentementEntity c = marketing().get(0);
        assertThat(c.getMeta())
                .containsEntry("source", "AGENT")
                .containsEntry("method", "PHONE_CALL")
                .containsEntry("note", "Appel du 20/11")
                .containsKeys("recordedBy", "recordedAt")
                .doesNotContainKeys("doubleOptInConfirmed", "ipAddress", "optInTimestamp");
    }
}
