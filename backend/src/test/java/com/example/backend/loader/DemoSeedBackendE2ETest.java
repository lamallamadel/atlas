package com.example.backend.loader;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.fasterxml.jackson.databind.JsonNode;
import java.sql.Connection;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Le seed de démonstration ({@code db/demo/demo-seed.sql}) se charge sur le schéma des migrations
 * et se lit par l'application comme des données réelles. Exécuté dans la transaction du test
 * (annulée à la fin) pour ne pas polluer les autres tests.
 */
@BackendE2ETest
class DemoSeedBackendE2ETest extends BaseBackendE2ETest {

    @Autowired private DataSource dataSource;
    @Autowired private JdbcTemplate jdbc;

    @BeforeEach
    void seed() throws Exception {
        Connection c = DataSourceUtils.getConnection(dataSource);
        assertThat(DemoSeedLoader.alreadyLoaded(c)).isFalse();
        DemoSeedLoader.execute(c);
        assertThat(DemoSeedLoader.alreadyLoaded(c)).isTrue();
    }

    private <T extends MockHttpServletRequestBuilder> T as(
            T builder, String org, String sub, String... roles) {
        builder.header(TENANT_HEADER, org).header(CORRELATION_ID_HEADER, "demo-seed");
        builder.with(
                jwt().jwt(createMockJwt(org, sub, roles))
                        .authorities(
                                java.util.Arrays.stream(roles)
                                        .map(
                                                r ->
                                                        (GrantedAuthority)
                                                                new SimpleGrantedAuthority(
                                                                        "ROLE_" + r))
                                        .toList()));
        return builder;
    }

    private long count(String sql) {
        return jdbc.queryForObject(sql, Long.class);
    }

    @Test
    void volumes() {
        assertThat(
                        count(
                                "SELECT COUNT(*) FROM organization WHERE org_id LIKE 'DEMO-%' AND org_type = 'AGENCY' AND org_id <> 'DEMO-PLATFORM'"))
                .isEqualTo(10);
        assertThat(
                        count(
                                "SELECT COUNT(*) FROM organization WHERE org_id LIKE 'OWN-DEMO%' AND org_type = 'OWNER'"))
                .isEqualTo(10);
        assertThat(
                        count(
                                "SELECT COUNT(*) FROM organization WHERE org_id LIKE 'DEMO-%' AND verified = FALSE"))
                .isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM property WHERE org_id LIKE 'OWN-DEMO%'"))
                .isEqualTo(20);
        assertThat(
                        count(
                                "SELECT COUNT(*) FROM property WHERE org_id LIKE 'OWN-DEMO%' AND transaction_type = 'RENT'"))
                .isEqualTo(9);
        assertThat(count("SELECT COUNT(*) FROM agency_zone WHERE org_id LIKE 'DEMO-%'"))
                .isGreaterThanOrEqualTo(20);
        assertThat(count("SELECT COUNT(*) FROM mandate WHERE agency_org_id LIKE 'DEMO-%'"))
                .isEqualTo(9);
        assertThat(
                        count(
                                "SELECT COUNT(*) FROM mandate WHERE dossier_id IS NULL AND agency_org_id LIKE 'DEMO-%'"))
                .isZero();
        assertThat(
                        count(
                                "SELECT COUNT(*) FROM dossier WHERE org_id LIKE 'DEMO-%' AND case_type LIKE 'CRM_LEAD_%'"))
                .isEqualTo(40);
        assertThat(
                        count(
                                "SELECT COUNT(DISTINCT assigned_to) FROM dossier WHERE org_id LIKE 'DEMO-%'"))
                .isGreaterThanOrEqualTo(25);
        assertThat(count("SELECT COUNT(*) FROM mandate_offer WHERE agency_org_id LIKE 'DEMO-%'"))
                .isEqualTo(5);
        assertThat(count("SELECT COUNT(*) FROM agency_review WHERE agency_org_id LIKE 'DEMO-%'"))
                .isEqualTo(3);
    }

    @Test
    void ownerFollowsHerMandate_withOffersAndOnlyVisibleEvents() throws Exception {
        String body =
                mockMvc.perform(
                                as(
                                        get("/api/v1/owner/mandates"),
                                        "OWN-DEMO01",
                                        "demo-owner-01",
                                        "OWNER"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].agencyName").value("Agence du Détroit"))
                        .andExpect(jsonPath("$[0].status").value("MANDATE_ACTIVE"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        long mandateId = objectMapper.readTree(body).get(0).get("id").asLong();
        String followUp =
                mockMvc.perform(
                                as(
                                        get("/api/v1/owner/mandates/" + mandateId),
                                        "OWN-DEMO01",
                                        "demo-owner-01",
                                        "OWNER"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.offers.length()").value(2))
                        .andExpect(jsonPath("$.events.length()").value(3))
                        .andExpect(jsonPath("$.listings[0].status").value("PUBLISHED"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(followUp).doesNotContain("ne pas communiquer");
    }

    @Test
    void agencySeesTheMarketplace_withCompatibleBuyersFromItsOwnPortfolio() throws Exception {
        String list =
                mockMvc.perform(
                                as(
                                        get("/api/v1/marketplace/requests"),
                                        "DEMO-DETROIT",
                                        "demo-detroit-manager",
                                        "MANAGER",
                                        "PRO"))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        JsonNode villa = null;
        for (JsonNode r : objectMapper.readTree(list)) {
            if ("Boubana".equals(r.path("district").asText())) {
                villa = r;
            }
        }
        assertThat(villa)
                .as("la villa de Boubana est dans la bourse de l'Agence du Détroit")
                .isNotNull();
        mockMvc.perform(
                        as(
                                get("/api/v1/marketplace/requests/" + villa.get("id").asLong()),
                                "DEMO-DETROIT",
                                "demo-detroit-manager",
                                "MANAGER",
                                "PRO"))
                .andExpect(jsonPath("$.compatibleBuyers").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.myProposal.status").value("MPROP_SENT"));

        mockMvc.perform(
                        as(
                                get("/api/v1/marketplace/mandates"),
                                "DEMO-DETROIT",
                                "demo-detroit-agent1",
                                "AGENT",
                                "PRO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mockMvc.perform(
                        as(
                                get("/api/v1/agency/marketplace-profile"),
                                "DEMO-DETROIT",
                                "demo-detroit-directeur",
                                "ADMIN"))
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.rating").value(5.0))
                .andExpect(jsonPath("$.zones.length()").value(3));
    }

    @Test
    void ownerGetsRecommendations_fromTheZoneOnly() throws Exception {
        String reqs =
                mockMvc.perform(
                                as(
                                        get("/api/v1/owner/mandate-requests"),
                                        "OWN-DEMO02",
                                        "demo-owner-02",
                                        "OWNER"))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        long openId = -1;
        for (JsonNode r : objectMapper.readTree(reqs)) {
            if ("MREQ_OPEN".equals(r.path("status").asText())) {
                openId = r.get("id").asLong();
            }
        }
        assertThat(openId).isPositive();
        mockMvc.perform(
                        as(
                                get("/api/v1/owner/mandate-requests/" + openId),
                                "OWN-DEMO02",
                                "demo-owner-02",
                                "OWNER"))
                .andExpect(jsonPath("$.proposals.length()").value(3));
        mockMvc.perform(
                        as(
                                get("/api/v1/owner/mandate-requests/" + openId + "/recommended"),
                                "OWN-DEMO02",
                                "demo-owner-02",
                                "OWNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].orgId", hasItem("DEMO-DETROIT")))
                .andExpect(jsonPath("$[*].orgId", not(hasItem("DEMO-KECH"))))
                .andExpect(jsonPath("$[*].orgId", not(hasItem("DEMO-CASAPRESTIGE"))));
    }

    @Test
    void portalListsOwnerAndAgencyListings_withPhotos() throws Exception {
        String page =
                mockMvc.perform(
                                get("/api/v1/portal/annonces")
                                        .param("city", "Tanger")
                                        .param("size", "50"))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        JsonNode content = objectMapper.readTree(page).get("content");
        boolean owner = false;
        boolean agency = false;
        for (JsonNode a : content) {
            if ("Studio meublé centre-ville".equals(a.path("title").asText())) {
                owner =
                        "OWNER".equals(a.path("publisherKind").asText())
                                && a.path("photos").size() > 0;
            }
            if ("Appartement 3 pièces vue mer".equals(a.path("title").asText())) {
                agency = "AGENCY".equals(a.path("publisherKind").asText());
            }
        }
        assertThat(owner).as("annonce de particulier avec photos").isTrue();
        assertThat(agency).as("annonce de l'agence mandatée").isTrue();
    }

    @Test
    void mandateDossierFollowsTheMandateWorkflow() throws Exception {
        Long dossierId =
                jdbc.queryForObject(
                        "SELECT dossier_id FROM mandate m JOIN property p ON p.id = m.property_id WHERE p.title = 'Appartement 3 pièces vue mer'",
                        Long.class);
        mockMvc.perform(
                        as(
                                get("/api/v1/dossiers/" + dossierId + "/transitions"),
                                "DEMO-DETROIT",
                                "demo-detroit-agent1",
                                "AGENT",
                                "PRO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("CRM_OFFER_RECEIVED"))
                .andExpect(jsonPath("$.transitions[*].statusCode", hasItem("CRM_NEGOTIATION")));
    }
}
