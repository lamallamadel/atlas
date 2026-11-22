package com.example.backend.controller;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.ApiKeyEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.ApiKeyService;
import com.example.backend.service.WorkflowTemplateLibraryService;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

/** Portée du filtre d'agence : portail public, clés d'API et modèles partagés (SYSTEM). */
@BackendE2ETest
@WithMockUser(
        username = "agent-1",
        roles = {"PRO"})
class TenantFilterScopeBackendE2ETest extends BaseBackendE2ETest {

    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private ApiKeyService apiKeyService;
    @Autowired private WorkflowTemplateLibraryService templateLibraryService;

    @Test
    void le_portail_public_liste_les_annonces_quelle_que_soit_l_agence_de_l_en_tete()
            throws Exception {
        testDataBuilder
                .annonceBuilder()
                .withOrgId("ORG-001")
                .withTitle("Portail inter-agences")
                .withStatus(AnnonceStatus.PUBLISHED)
                .persist();

        mockMvc.perform(get("/api/v1/portal/annonces").header("X-Org-Id", "ORG-AUTRE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title").value(hasItem("Portail inter-agences")));
    }

    @Test
    void une_cle_d_api_ne_lit_que_son_agence() throws Exception {
        testDataBuilder.dossierBuilder().withOrgId("ORG1").withLeadName("Dossier ORG1").persist();
        testDataBuilder.dossierBuilder().withOrgId("ORG2").withLeadName("Dossier ORG2").persist();
        String key =
                apiKeyService
                        .createApiKey("ORG1", "test", null, ApiKeyEntity.ApiTier.values()[0], null, null)
                        .getPlainTextKey();

        mockMvc.perform(
                        get("/api/public/v1/dossiers")
                                .header("X-API-Key", key)
                                .header("X-Org-Id", "ORG2"))
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        get("/api/public/v1/dossiers")
                                .header("X-API-Key", key)
                                .header("X-Org-Id", "ORG1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].leadName").value("Dossier ORG1"));
    }

    @Test
    void les_modeles_systeme_restent_visibles_des_agences() throws Exception {
        templateLibraryService.seedSystemTemplates();

        mockMvc.perform(withTenantHeaders(get("/api/v1/workflow/templates"), "ORG1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)));
    }
}
