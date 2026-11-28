package com.example.backend.mandate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.repository.OrganizationRepository;
import java.util.List;
import java.util.Map;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Chemin de vérification d'une agence : ce qui manque, la demande, la décision d'Atlas. */
@BackendE2ETest
class AgencyVerificationBackendE2ETest extends BaseBackendE2ETest {

    private static final String AGENCY = "agence-verif";
    private static final String BASE = "/api/v1/agency/marketplace-profile";

    @Autowired private OrganizationRepository organizations;

    private <T extends MockHttpServletRequestBuilder> T as(T b, String role) {
        b.header(TENANT_HEADER, AGENCY).header(CORRELATION_ID_HEADER, "verif-test");
        b.with(jwtAs(AGENCY, role.toLowerCase() + "-" + AGENCY, role, "PRO"));
        return b;
    }

    private <T extends MockHttpServletRequestBuilder> T platform(T b) {
        b.header(TENANT_HEADER, "ORG-PLATFORM").header(CORRELATION_ID_HEADER, "verif-test");
        b.with(jwtAs("ORG-PLATFORM", "super-1", "SUPER_ADMIN"));
        return b;
    }

    private ResultActions json(MockHttpServletRequestBuilder b, Object body) throws Exception {
        return mockMvc.perform(
                b.contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)));
    }

    private void agency() {
        OrganizationEntity o = new OrganizationEntity();
        o.setOrgId(AGENCY);
        o.setOrgType(OrganizationEntity.TYPE_AGENCY);
        o.setDisplayName("Agence Vérif");
        organizations.save(o);
    }

    private void completeProfile() throws Exception {
        json(
                        as(put(BASE), "ADMIN"),
                        Map.of("displayName", "Agence Vérif", "transactions", List.of("SALE")))
                .andExpect(status().isOk());
        json(as(put(BASE + "/zones"), "ADMIN"), List.of(Map.of("city", "Tanger")))
                .andExpect(status().isOk());
    }

    private static Map<String, String> papers() {
        return Map.of(
                "rc", "RC 123456 Tanger", "ice", "001 234 567 000 089", "contact", "0661000000");
    }

    @Test
    void unverifiedAgency_seesWhatIsMissing_thenRequests_andAtlasValidates() throws Exception {
        agency();
        mockMvc.perform(as(get(BASE + "/verification"), "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NONE"))
                .andExpect(jsonPath("$.missing", Matchers.containsInAnyOrder("PROFILE", "ZONES")));
        json(as(post(BASE + "/verification"), "ADMIN"), papers())
                .andExpect(status().isBadRequest());

        completeProfile();
        json(as(post(BASE + "/verification"), "ADMIN"), Map.of("rc", "RC 1", "ice", "123"))
                .andExpect(status().isBadRequest());
        json(as(post(BASE + "/verification"), "ADMIN"), papers())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.ice").value("001234567000089"))
                .andExpect(jsonPath("$.missing").isEmpty());

        mockMvc.perform(platform(get("/api/v1/admin/verifications/agencies")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.orgId == '" + AGENCY + "')].cities[0]").value("Tanger"));

        json(
                        platform(put("/api/v1/admin/agencies/" + AGENCY + "/verification")),
                        Map.of("verified", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));
        mockMvc.perform(as(get(BASE + "/verification"), "ADMIN"))
                .andExpect(jsonPath("$.status").value("VERIFIED"));
    }

    @Test
    void refusal_needsAReason_shownToTheAgency_whichCanTryAgain() throws Exception {
        agency();
        completeProfile();
        json(as(post(BASE + "/verification"), "ADMIN"), papers()).andExpect(status().isOk());

        json(
                        platform(put("/api/v1/admin/agencies/" + AGENCY + "/verification")),
                        Map.of("verified", false))
                .andExpect(status().isBadRequest());
        json(
                        platform(put("/api/v1/admin/agencies/" + AGENCY + "/verification")),
                        Map.of(
                                "verified",
                                false,
                                "note",
                                "Le RC ne correspond pas à la raison sociale."))
                .andExpect(status().isOk());
        mockMvc.perform(as(get(BASE + "/verification"), "ADMIN"))
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(
                        jsonPath("$.note").value("Le RC ne correspond pas à la raison sociale."));

        json(as(post(BASE + "/verification"), "ADMIN"), papers())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.note").doesNotExist());
    }

    @Test
    void anAgentCannotRequestVerification() throws Exception {
        agency();
        completeProfile();
        json(as(post(BASE + "/verification"), "AGENT"), papers()).andExpect(status().isForbidden());
    }
}
