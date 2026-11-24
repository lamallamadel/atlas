package com.example.backend.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Étape 7 : modules d'agence appliqués côté API (spec {@code 05_feature_flags_plans.md}). Sans
 * réglage, tout est actif ; un module désactivé par le super-admin répond 403 pour cette agence
 * seulement.
 */
@BackendE2ETest
class FeatureFlagsBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG = "ORG-FF";
    private static final String OTHER = "ORG-FF2";

    private static RequestPostProcessor user(String org, String role) {
        return jwt().jwt(j -> j.subject("u-" + role).claim("org_id", org))
                .authorities(new SimpleGrantedAuthority("ROLE_" + role));
    }

    private static MockHttpServletRequestBuilder in(String org, MockHttpServletRequestBuilder b) {
        return b.header("X-Org-Id", org);
    }

    private void toggle(String key, boolean enabled) throws Exception {
        mockMvc.perform(
                        in(
                                        ORG,
                                        put("/api/v1/admin/white-label/" + ORG + "/features/" + key)
                                                .param("enabled", String.valueOf(enabled)))
                                .with(user(ORG, "SUPER_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.featureKey").value(key))
                .andExpect(jsonPath("$.enabled").value(enabled));
    }

    @Test
    void modulesAreOnByDefault_andCanBeTurnedOffForOneAgency() throws Exception {
        mockMvc.perform(in(ORG, get("/api/v1/coop/groups")).with(user(ORG, "ADMIN")))
                .andExpect(status().isOk());
        mockMvc.perform(in(ORG, get("/api/v1/features")).with(user(ORG, "PRO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.key=='module.coop_habitat')].enabled").value(true));

        toggle("module.coop_habitat", false);

        mockMvc.perform(in(ORG, get("/api/v1/coop/groups")).with(user(ORG, "ADMIN")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value(Matchers.containsString("FEATURE_DISABLED")))
                .andExpect(
                        jsonPath("$.detail").value(Matchers.containsString("module.coop_habitat")));
        mockMvc.perform(in(OTHER, get("/api/v1/coop/groups")).with(user(OTHER, "ADMIN")))
                .andExpect(status().isOk());
        mockMvc.perform(in(ORG, get("/api/v1/features")).with(user(ORG, "PRO")))
                .andExpect(jsonPath("$[?(@.key=='module.coop_habitat')].enabled").value(false))
                .andExpect(jsonPath("$[?(@.key=='core.dossier')].enabled").value(true));
        // Le reste de l'API n'est pas concerné.
        mockMvc.perform(in(ORG, get("/api/v1/dossiers")).with(user(ORG, "PRO")))
                .andExpect(status().isOk());

        toggle("module.coop_habitat", true);
        mockMvc.perform(in(ORG, get("/api/v1/coop/groups")).with(user(ORG, "ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void exportAndESignature_followTheirAddOns_butTheProviderCallbackStaysOpen() throws Exception {
        toggle("addon.export", false);
        mockMvc.perform(in(ORG, get("/api/v1/leads/export")).with(user(ORG, "PRO")))
                .andExpect(status().isForbidden());

        toggle("addon.esign", false);
        mockMvc.perform(in(ORG, get("/api/v1/esignature/templates")).with(user(ORG, "PRO")))
                .andExpect(status().isForbidden());
        mockMvc.perform(
                        in(ORG, post("/api/v1/esignature/webhook"))
                                .with(user(ORG, "PRO"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(
                        result ->
                                org.assertj.core.api.Assertions.assertThat(
                                                result.getResponse().getContentAsString())
                                        .doesNotContain("FEATURE_DISABLED"));
    }

    @Test
    void onlyThePlatformManagesModules_andTheCoreCannotBeTurnedOff() throws Exception {
        mockMvc.perform(
                        in(
                                        ORG,
                                        put("/api/v1/admin/white-label/"
                                                        + ORG
                                                        + "/features/module.neuf")
                                                .param("enabled", "false"))
                                .with(user(ORG, "ADMIN")))
                .andExpect(status().isForbidden());
        mockMvc.perform(
                        in(
                                        ORG,
                                        put("/api/v1/admin/white-label/"
                                                        + ORG
                                                        + "/features/core.dossier")
                                                .param("enabled", "false"))
                                .with(user(ORG, "SUPER_ADMIN")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        in(ORG, get("/api/v1/admin/white-label/" + ORG + "/features"))
                                .with(user(ORG, "SUPER_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.featureKey=='module.neuf')].enabled").value(true));
    }
}
