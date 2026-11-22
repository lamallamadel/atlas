package com.example.backend.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

/** Recherche (nom ou téléphone) et filtre par source de la liste des dossiers. */
@BackendE2ETest
@WithMockUser(
        username = "agent-1",
        roles = {"PRO"})
class DossierListFilterBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";

    @Autowired private BackendE2ETestDataBuilder testDataBuilder;

    private void dossier(String name, String phone, String source, String org) {
        testDataBuilder
                .dossierBuilder()
                .withOrgId(org)
                .withLeadName(name)
                .withLeadPhone(phone)
                .withLeadSource(source)
                .withStatus(DossierStatus.NEW)
                .persist();
    }

    @BeforeEach
    void setUp() {
        dossier("Salma Idrissi", "+212600000051", "WhatsApp", ORG1);
        dossier("Karim Benali", "+212611112222", "Portail", ORG1);
        dossier("Youssef Alami", "+212600000053", "Recommandation 100%", ORG1);
        dossier("Salma Autre Agence", "+212600000054", "WhatsApp", "ORG2");
    }

    @Test
    void les_dossiers_d_une_autre_agence_ne_sont_jamais_listes() throws Exception {
        mockMvc.perform(withTenantHeaders(get("/api/v1/dossiers"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
        mockMvc.perform(withTenantHeaders(get("/api/v1/dossiers"), "ORG2"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].leadName").value("Salma Autre Agence"));
    }

    @Test
    void recherche_dans_le_nom_sans_tenir_compte_de_la_casse() throws Exception {
        mockMvc.perform(withTenantHeaders(get("/api/v1/dossiers").param("q", "sALMa"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].leadName").value("Salma Idrissi"));
    }

    @Test
    void recherche_dans_le_telephone() throws Exception {
        mockMvc.perform(withTenantHeaders(get("/api/v1/dossiers").param("q", "1111"), ORG1))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.content[*].leadName")
                                .value(containsInAnyOrder("Karim Benali")));
    }

    @Test
    void filtre_par_source_et_caracteres_speciaux_echappes() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/dossiers").param("leadSource", "whatsapp"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/dossiers").param("leadSource", "100%"), ORG1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].leadName").value("Youssef Alami"));
        mockMvc.perform(withTenantHeaders(get("/api/v1/dossiers").param("q", "%"), ORG1))
                .andExpect(jsonPath("$.totalElements").value(0));
    }
}
