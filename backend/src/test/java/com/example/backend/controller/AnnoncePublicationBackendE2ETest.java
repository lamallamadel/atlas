package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.repository.AnnonceRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Étape 4 du backlog, critères A1 à A6 de {@code 03_e2e_acceptance_mvp.md} : brouillon, blocage de
 * la publication, publication visible sur le portail, suspension qui retire du portail, doublon
 * certain bloquant sauf dérogation d'un manager.
 */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class AnnoncePublicationBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG = "org-publication";

    @Autowired private AnnonceRepository annonceRepository;

    private String[] roles = {"PRO"};

    @Override
    protected String[] e2eJwtRoles() {
        return roles;
    }

    private AnnonceCreateRequest complete() {
        AnnonceCreateRequest r = new AnnonceCreateRequest();
        r.setTitle("Appartement lumineux à Malabata");
        r.setDescription(
                "Bel appartement de 3 pièces avec vue sur la baie, cuisine équipée, deux chambres,"
                        + " parking en sous-sol et ascenseur.");
        r.setType(AnnonceType.SALE);
        r.setCategory("Appartement");
        r.setAddress("Malabata");
        r.setCity("Tanger");
        r.setSurface(92.0);
        r.setPrice(new BigDecimal("1250000"));
        r.setCurrency("MAD");
        r.setPhotos(
                List.of(
                        "https://cdn.example.ma/1.jpg",
                        "https://cdn.example.ma/2.jpg",
                        "https://cdn.example.ma/3.jpg"));
        return r;
    }

    private long create(AnnonceCreateRequest r) throws Exception {
        String body =
                mockMvc.perform(
                                withTenantHeaders(post("/api/v1/annonces"), ORG)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(r)))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private ResultActions transition(long id, String code, String reason) throws Exception {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("transitionCode", code);
        if (reason != null) {
            body.put("reasonCode", reason);
        }
        return mockMvc.perform(
                withTenantHeaders(post("/api/v1/annonces/{id}/transitions", id), ORG)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)));
    }

    @Test
    void newAnnonceIsADraftWithQualityAndPublishAction() throws Exception {
        AnnonceCreateRequest r = complete();
        r.setPhotos(List.of());
        long id = create(r);

        mockMvc.perform(withTenantHeaders(get("/api/v1/annonces/{id}/publication", id), ORG))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.quality.minPhotos").value(3))
                .andExpect(jsonPath("$.quality.missing[*].code", hasItem("PHOTOS")))
                .andExpect(jsonPath("$.transitions[0].code").value("ANN_T_PUBLISH"))
                .andExpect(jsonPath("$.transitions[0].allowed").value(false))
                .andExpect(jsonPath("$.transitions[0].blockers[0].code").value("MISSING_PHOTOS"));
    }

    @Test
    void incompleteAnnonceCannotBePublished() throws Exception {
        AnnonceCreateRequest r = complete();
        r.setDescription("Trop court");
        long id = create(r);

        transition(id, "ANN_T_PUBLISH", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("PUBLICATION_BLOCKED")))
                .andExpect(jsonPath("$.detail", containsString("Description")));

        assertThat(annonceRepository.findById(id).orElseThrow().getStatus())
                .isEqualTo(AnnonceStatus.DRAFT);
    }

    @Test
    void publishedAnnonceIsOnThePortalAndSuspensionRemovesIt() throws Exception {
        long id = create(complete());

        transition(id, "ANN_T_PUBLISH", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
        mockMvc.perform(get("/api/v1/portal/annonces/{id}", id)).andExpect(status().isOk());

        transition(id, "ANN_T_SUSPEND", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("REASON_REQUIRED")));
        transition(id, "ANN_T_SUSPEND", "MOD_SUSPECT_FRAUD")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
        mockMvc.perform(get("/api/v1/portal/annonces/{id}", id)).andExpect(status().isNotFound());

        mockMvc.perform(withTenantHeaders(get("/api/v1/annonces/{id}/publication", id), ORG))
                .andExpect(jsonPath("$.suspension.reasonCode").value("MOD_SUSPECT_FRAUD"))
                .andExpect(jsonPath("$.transitions[0].label").value("Republier"));
    }

    @Test
    void impossibleTransitionIsAConflict() throws Exception {
        long id = create(complete());

        transition(id, "ANN_T_SUSPEND", "OWNER_PAUSE").andExpect(status().isConflict());
        transition(id, "ANN_T_ARCHIVE", null).andExpect(status().isOk());
        transition(id, "ANN_T_PUBLISH", null).andExpect(status().isConflict());
    }

    @Test
    void legacyActiveStatusThroughUpdateGoesThroughTheRules() throws Exception {
        AnnonceCreateRequest r = complete();
        r.setPhotos(List.of("https://cdn.example.ma/1.jpg"));
        long id = create(r);

        AnnonceUpdateRequest update = new AnnonceUpdateRequest();
        update.setStatus(AnnonceStatus.ACTIVE);
        mockMvc.perform(
                        withTenantHeaders(put("/api/v1/annonces/{id}", id), ORG)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("photos")));

        update.setPhotos(complete().getPhotos());
        mockMvc.perform(
                        withTenantHeaders(put("/api/v1/annonces/{id}", id), ORG)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void certainDuplicateNeedsAManagerOverride() throws Exception {
        long id = create(complete());
        Annonce a = annonceRepository.findById(id).orElseThrow();
        a.setDuplicateStatut("DOUBLON_CERTAIN");
        a.setDuplicateOfId(123L);
        annonceRepository.saveAndFlush(a);

        transition(id, "ANN_T_PUBLISH", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("Doublon certain")));

        Map<String, String> override = Map.of("reason", "Même bien, deux mandats distincts");
        // Un agent (PRO) ne peut pas déroger.
        mockMvc.perform(
                        withTenantHeaders(post("/api/v1/annonces/{id}/trust/override", id), ORG)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(override)))
                .andExpect(status().isForbidden());

        roles = new String[] {"ADMIN"};
        mockMvc.perform(
                        withTenantHeaders(post("/api/v1/annonces/{id}/trust/override", id), ORG)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(override)))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.trust.override.reason")
                                .value("Même bien, deux mandats distincts"))
                .andExpect(jsonPath("$.transitions[0].allowed").value(true));

        roles = new String[] {"PRO"};
        transition(id, "ANN_T_PUBLISH", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }
}
