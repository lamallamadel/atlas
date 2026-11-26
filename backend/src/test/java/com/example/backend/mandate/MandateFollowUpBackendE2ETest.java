package com.example.backend.mandate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.ActivityEntity;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.OrganizationSettings;
import com.example.backend.entity.enums.ActivityType;
import com.example.backend.entity.enums.ActivityVisibility;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.owner.OtpSender;
import com.example.backend.repository.ActivityRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.OrganizationSettingsRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Cas d'usage n°1, lot C : agences recommandées (PC-1), acquéreurs compatibles (PC-2), suivi du
 * mandat par le propriétaire (PC-3), fin de mandat et avis (PC-4), quotas par offre, badges.
 *
 * <p>Six agences vérifiées à Tanger (A couvre Malabata, B toute la ville, C à F d'autres
 * quartiers), R à Rabat, U non vérifiée à Tanger.
 */
@BackendE2ETest
class MandateFollowUpBackendE2ETest extends BaseBackendE2ETest {

    private static final String OWNER = "OWN-fol0000001";
    private static final String OWNER_PHONE = "+212661000444";
    private static final String A = "ORG-FOL-A";
    private static final String B = "ORG-FOL-B";
    private static final String R = "ORG-FOL-R";
    private static final String U = "ORG-FOL-U";

    @Autowired private OrganizationRepository organizations;
    @Autowired private OrganizationSettingsRepository organizationSettings;
    @Autowired private DossierRepository dossiers;
    @Autowired private ActivityRepository activities;
    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private AnnonceRepository annonces;

    @MockitoBean private OtpSender otpSender;

    private final List<String> sentCodes = new ArrayList<>();
    private Long propertyId;

    @BeforeEach
    void setUp() throws Exception {
        sentCodes.clear();
        when(otpSender.send(any(), any()))
                .thenAnswer(
                        inv -> {
                            sentCodes.add(inv.getArgument(1));
                            return "SMS";
                        });
        OrganizationEntity owner = new OrganizationEntity();
        owner.setOrgId(OWNER);
        owner.setOrgType(OrganizationEntity.TYPE_OWNER);
        owner.setDisplayName("Nadia I.");
        owner.setOwnerUserId("kc-owner-fol");
        owner.setOwnerPhone(OWNER_PHONE);
        organizations.save(owner);
        agency(A, "Agence du Détroit", "Tanger", "Malabata", true);
        agency(B, "Tanger Immo Conseil", "Tanger", null, true);
        agency("ORG-FOL-C", "Agence Iberia", "Tanger", "Iberia", true);
        agency("ORG-FOL-D", "Agence Marshan", "Tanger", "Marshan", true);
        agency("ORG-FOL-E", "Agence Boubana", "Tanger", "Boubana", true);
        agency("ORG-FOL-F", "Agence Mesnana", "Tanger", "Mesnana", true);
        agency(R, "Rabat Habitat", "Rabat", null, true);
        agency(U, "Agence non vérifiée", "Tanger", "Malabata", false);
        propertyId = createProperty();
    }

    @AfterEach
    void tearDown() {
        com.example.backend.util.TenantContext.clear();
    }

    // ------------------------------------------------------------------ helpers

    private void agency(String org, String name, String city, String district, boolean verified)
            throws Exception {
        OrganizationEntity o = new OrganizationEntity();
        o.setOrgId(org);
        o.setOrgType(OrganizationEntity.TYPE_AGENCY);
        o.setDisplayName(org);
        o.setVerified(verified);
        organizations.save(o);
        json(
                        as(put("/api/v1/agency/marketplace-profile"), org, "admin-" + org, "ADMIN"),
                        Map.of("displayName", name, "transactions", List.of("SALE")))
                .andExpect(status().isOk());
        Map<String, Object> zone = new HashMap<>();
        zone.put("city", city);
        zone.put("district", district);
        json(
                        as(
                                put("/api/v1/agency/marketplace-profile/zones"),
                                org,
                                "admin-" + org,
                                "ADMIN"),
                        List.of(zone))
                .andExpect(status().isOk());
    }

    private <T extends MockHttpServletRequestBuilder> T as(
            T builder, String org, String subject, String... roles) {
        builder.header(TENANT_HEADER, org).header(CORRELATION_ID_HEADER, "fol-test");
        builder.with(
                jwt().jwt(createMockJwt(org, subject, roles))
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

    private <T extends MockHttpServletRequestBuilder> T owner(T builder) {
        return as(builder, OWNER, "kc-owner-fol", "OWNER");
    }

    private <T extends MockHttpServletRequestBuilder> T agent(T builder, String org) {
        return as(builder, org, "agent-" + org, "AGENT", "PRO");
    }

    private <T extends MockHttpServletRequestBuilder> T admin(T builder) {
        return as(builder, "ORG-PLATFORM", "super-1", "SUPER_ADMIN");
    }

    private ResultActions json(MockHttpServletRequestBuilder b, Object body) throws Exception {
        return mockMvc.perform(
                b.contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)));
    }

    private JsonNode read(ResultActions r) throws Exception {
        return objectMapper.readTree(r.andReturn().getResponse().getContentAsString());
    }

    private Long createProperty() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Appartement Malabata");
        body.put("transactionType", "SALE");
        body.put("propertyType", "Appartement");
        body.put("city", "Tanger");
        body.put("district", "Malabata");
        body.put("address", "12 rue des Oliviers");
        body.put("surface", 92.0);
        body.put("rooms", 3);
        body.put("expectedPrice", 1450000);
        body.put("landTitleNumber", "TF 12345/06");
        return read(json(owner(post("/api/v1/owner/properties")), body)
                        .andExpect(status().isCreated()))
                .get("id")
                .asLong();
    }

    private Long openRequest() throws Exception {
        return read(json(
                                owner(post("/api/v1/owner/mandate-requests")),
                                Map.of(
                                        "propertyId",
                                        propertyId,
                                        "mandateTypes",
                                        List.of("SIMPLE", "EXCLUSIVE")))
                        .andExpect(status().isOk()))
                .get("id")
                .asLong();
    }

    private Long propose(Long requestId, String org) throws Exception {
        return read(json(
                                agent(
                                        post(
                                                "/api/v1/marketplace/requests/"
                                                        + requestId
                                                        + "/proposals"),
                                        org),
                                Map.of(
                                        "mandateType", "EXCLUSIVE",
                                        "durationMonths", 3,
                                        "commissionKind", "PERCENT",
                                        "commissionValue", 2.5,
                                        "commissionPayer", "SELLER"))
                        .andExpect(status().isOk()))
                .get("myProposal")
                .get("id")
                .asLong();
    }

    private JsonNode accept(Long proposalId) throws Exception {
        mockMvc.perform(owner(post("/api/v1/owner/proposals/" + proposalId + "/accept/start")))
                .andExpect(status().isOk());
        return read(
                json(
                                owner(post("/api/v1/owner/proposals/" + proposalId + "/accept")),
                                Map.of("code", sentCodes.get(sentCodes.size() - 1)))
                        .andExpect(status().isOk()));
    }

    // ------------------------------------------------------------------ PC-1

    @Test
    void pc1_fiveRecommendedAgencies_rankedByScore_neverOutOfZone() throws Exception {
        Long id = openRequest();

        JsonNode top =
                read(
                        mockMvc.perform(
                                        owner(
                                                get(
                                                        "/api/v1/owner/mandate-requests/"
                                                                + id
                                                                + "/recommended")))
                                .andExpect(status().isOk()));
        assertThat(top).hasSize(5);
        // Quartier couvert d'abord, puis toute la ville.
        assertThat(top.get(0).get("orgId").asText()).isEqualTo(A);
        assertThat(top.get(1).get("orgId").asText()).isEqualTo(B);
        assertThat(top.toString()).doesNotContain(R).doesNotContain(U);

        // Invitation : l'agence la voit en tête de sa bourse.
        json(
                        owner(post("/api/v1/owner/mandate-requests/" + id + "/invitations")),
                        Map.of("agencyOrgId", "ORG-FOL-C"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.orgId=='ORG-FOL-C')].invited").value(true));
        mockMvc.perform(agent(get("/api/v1/marketplace/requests"), "ORG-FOL-C"))
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].invited").value(true));
        mockMvc.perform(agent(get("/api/v1/marketplace/requests"), A))
                .andExpect(jsonPath("$[0].relevance").value(org.hamcrest.Matchers.greaterThan(50)));
        json(
                        owner(post("/api/v1/owner/mandate-requests/" + id + "/invitations")),
                        Map.of("agencyOrgId", R))
                .andExpect(status().isBadRequest());
    }

    @Test
    void planQuota_blocksProposals_andRemovesTheAgencyFromRecommendations() throws Exception {
        OrganizationSettings s = new OrganizationSettings();
        s.setOrgId(B);
        s.setSettings(Map.of("quotas", Map.of("maxMandateProposalsMonth", 0)));
        s.setVersion(1);
        s.setCreatedAt(LocalDateTime.now());
        s.setUpdatedAt(LocalDateTime.now());
        organizationSettings.save(s);
        Long id = openRequest();

        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), B))
                .andExpect(jsonPath("$.canPropose").value(false))
                .andExpect(
                        jsonPath("$.cannotProposeReason")
                                .value(org.hamcrest.Matchers.startsWith("QUOTA_REACHED")));
        String top =
                mockMvc.perform(owner(get("/api/v1/owner/mandate-requests/" + id + "/recommended")))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(top).doesNotContain(B);
    }

    // ------------------------------------------------------------------ PC-2

    @Test
    void pc2_compatibleBuyers_countedInTheConsultingAgencyOnly() throws Exception {
        Dossier buyer =
                testDataBuilder.dossierBuilder().withOrgId(A).withLeadName("Acquéreur A").persist();
        Map<String, Object> criteria = new HashMap<>();
        criteria.put("transactionTypes", List.of("SALE"));
        criteria.put("cities", List.of("Tanger"));
        criteria.put("budgetMax", 1600000);
        buyer.setSearchCriteria(criteria);
        dossiers.save(buyer);
        Dossier other =
                testDataBuilder
                        .dossierBuilder()
                        .withOrgId(A)
                        .withLeadName("Acquéreur Rabat")
                        .persist();
        other.setSearchCriteria(Map.of("cities", List.of("Rabat")));
        dossiers.save(other);

        Long id = openRequest();
        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), A))
                .andExpect(jsonPath("$.compatibleBuyers").value(1));
        String bView =
                mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), B))
                        .andExpect(jsonPath("$.compatibleBuyers").value(0))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(bView).doesNotContain("Acquéreur");
    }

    // ------------------------------------------------------------------ PC-3

    @Test
    void pc3_onlyEventsMarkedVisible_reachTheOwner() throws Exception {
        Long id = openRequest();
        JsonNode mandate = accept(propose(id, A));
        Long mandateId = mandate.get("id").asLong();
        Long dossierId =
                read(mockMvc.perform(agent(get("/api/v1/marketplace/mandates/" + mandateId), A)))
                        .get("dossierId")
                        .asLong();
        Dossier d = dossiers.findById(dossierId).orElseThrow();
        activity(
                d,
                "Visite faite samedi : retour positif, offre attendue.",
                ActivityVisibility.CLIENT_VISIBLE);
        activity(d, "Note interne : le prospect négocie à 1,3 M.", ActivityVisibility.INTERNAL);

        String body =
                mockMvc.perform(owner(get("/api/v1/owner/mandates/" + mandateId)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.events.length()").value(1))
                        .andExpect(
                                jsonPath("$.events[0].content")
                                        .value(org.hamcrest.Matchers.startsWith("Visite faite")))
                        .andExpect(jsonPath("$.canEnd").value(true))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(body).doesNotContain("Note interne").doesNotContain("1,3 M");

        // Un autre propriétaire ne voit pas ce mandat.
        OrganizationEntity other = new OrganizationEntity();
        other.setOrgId("OWN-fol0000002");
        other.setOrgType(OrganizationEntity.TYPE_OWNER);
        other.setOwnerPhone("+212661000555");
        organizations.save(other);
        mockMvc.perform(
                        as(
                                get("/api/v1/owner/mandates/" + mandateId),
                                "OWN-fol0000002",
                                "kc-2",
                                "OWNER"))
                .andExpect(status().isNotFound());
    }

    private void activity(Dossier d, String content, ActivityVisibility visibility) {
        ActivityEntity a = new ActivityEntity();
        a.setOrgId(d.getOrgId());
        a.setDossier(d);
        a.setType(ActivityType.NOTE);
        a.setContent(content);
        a.setVisibility(visibility);
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        activities.save(a);
    }

    // ------------------------------------------------------------------ PC-4

    @Test
    void pc4_reviewOnlyAfterAnEndedSignedMandate_once() throws Exception {
        Long id = openRequest();
        Long mandateId = accept(propose(id, A)).get("id").asLong();
        String reviewUrl = "/api/v1/owner/mandates/" + mandateId + "/review";

        json(owner(post(reviewUrl)), Map.of("rating", 5)).andExpect(status().isConflict());

        mockMvc.perform(agent(post("/api/v1/marketplace/mandates/" + mandateId + "/signed"), A))
                .andExpect(status().isOk());
        Annonce listing =
                testDataBuilder
                        .annonceBuilder()
                        .withOrgId(A)
                        .withTitle("Appartement Malabata")
                        .withType(AnnonceType.SALE)
                        .withStatus(AnnonceStatus.PUBLISHED)
                        .withCity("Tanger")
                        .withPrice(new java.math.BigDecimal("1450000"))
                        .persist();
        listing.setPropertyId(propertyId);
        listing.setPublisherKind("AGENCY");
        listing.setMandateId(mandateId);
        annonces.save(listing);
        mockMvc.perform(owner(get("/api/v1/owner/mandates/" + mandateId)))
                .andExpect(jsonPath("$.listings[0].annonceId").value(listing.getId()))
                .andExpect(jsonPath("$.listings[0].status").value("PUBLISHED"));
        json(
                        agent(post("/api/v1/marketplace/mandates/" + mandateId + "/end"), A),
                        Map.of("reason", "NOPE"))
                .andExpect(status().isBadRequest());
        json(
                        agent(post("/api/v1/marketplace/mandates/" + mandateId + "/end"), A),
                        Map.of("reason", "DEAL_CLOSED_AGENCY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MANDATE_COMPLETED"))
                .andExpect(jsonPath("$.endReason").value("DEAL_CLOSED_AGENCY"));

        // Sans mandat, l'annonce de l'agence quitte le portail.
        assertThat(
                        AnnonceStatus.normalize(
                                annonces.findById(listing.getId()).orElseThrow().getStatus()))
                .isEqualTo(AnnonceStatus.SUSPENDED);

        json(owner(post(reviewUrl)), Map.of("rating", 6)).andExpect(status().isBadRequest());
        json(owner(post(reviewUrl)), Map.of("rating", 5, "comment", "Vendu en 6 semaines."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.review.rating").value(5))
                .andExpect(jsonPath("$.canReview").value(false));
        json(owner(post(reviewUrl)), Map.of("rating", 1)).andExpect(status().isConflict());

        mockMvc.perform(owner(get("/api/v1/owner/agencies").param("city", "Tanger")))
                .andExpect(jsonPath("$[?(@.orgId=='" + A + "')].rating").value(5.0))
                .andExpect(jsonPath("$[?(@.orgId=='" + A + "')].reviews").value(1));
    }

    @Test
    void ownerEndsTheMandate_withAReason_andCannotReviewAnUnsignedOne() throws Exception {
        Long id = openRequest();
        Long mandateId = accept(propose(id, A)).get("id").asLong();
        json(
                        owner(post("/api/v1/owner/mandates/" + mandateId + "/end")),
                        Map.of("reason", "DEAL_CLOSED_AGENCY"))
                .andExpect(status().isBadRequest());
        json(
                        owner(post("/api/v1/owner/mandates/" + mandateId + "/end")),
                        Map.of("reason", "WITHDRAWN_OWNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mandate.status").value("MANDATE_TERMINATED"))
                .andExpect(jsonPath("$.mandate.endedBy").value("OWNER"))
                .andExpect(jsonPath("$.canEnd").value(false))
                .andExpect(jsonPath("$.canReview").value(false));
        // Le mandat exclusif terminé, le propriétaire peut redemander des propositions.
        openRequest();
    }

    // ------------------------------------------------------------------ badges

    @Test
    void propertyAndOwnerVerification_showBadgesToAgencies() throws Exception {
        Long id = openRequest();
        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), A))
                .andExpect(jsonPath("$.propertyVerified").value(false))
                .andExpect(jsonPath("$.ownerVerified").value(false));

        mockMvc.perform(owner(post("/api/v1/owner/properties/" + propertyId + "/verification")))
                .andExpect(jsonPath("$.verificationStatus").value("PENDING"));
        mockMvc.perform(admin(get("/api/v1/admin/verifications/properties")))
                .andExpect(
                        jsonPath("$[?(@.id==" + propertyId + ")].landTitleNumber")
                                .value("TF 12345/06"));
        json(
                        admin(put("/api/v1/admin/properties/" + propertyId + "/verification")),
                        Map.of("verified", true))
                .andExpect(status().isOk());
        json(
                        admin(put("/api/v1/admin/owners/" + OWNER + "/verification")),
                        Map.of("verified", true))
                .andExpect(status().isOk());
        json(
                        agent(put("/api/v1/admin/owners/" + OWNER + "/verification"), A),
                        Map.of("verified", true))
                .andExpect(status().isForbidden());

        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), A))
                .andExpect(jsonPath("$.propertyVerified").value(true))
                .andExpect(jsonPath("$.ownerVerified").value(true));

        // Un autre numéro de titre foncier n'a pas été contrôlé : le badge tombe.
        Map<String, Object> edit = new HashMap<>();
        edit.put("title", "Appartement Malabata");
        edit.put("transactionType", "SALE");
        edit.put("city", "Tanger");
        edit.put("landTitleNumber", "TF 99999/06");
        json(owner(put("/api/v1/owner/properties/" + propertyId)), edit)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("NONE"));
    }
}
