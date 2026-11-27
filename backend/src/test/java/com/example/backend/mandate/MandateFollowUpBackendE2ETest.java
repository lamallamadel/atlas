package com.example.backend.mandate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
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
@RecordApplicationEvents
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
    @Autowired private ApplicationEvents events;
    @Autowired private com.example.backend.repository.MandateRequestRepository mandateRequests;
    @Autowired private MandateLifecycleService lifecycle;
    @Autowired private MandateMatchingService matching;
    @Autowired private org.springframework.transaction.PlatformTransactionManager txManager;

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
        builder.with(jwtAs(org, subject, roles));
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

    // ------------------------------------------------------------------ alertes aux agences

    private List<AgencyAlert> agencyAlerts() {
        return events.stream(AgencyAlert.class).toList();
    }

    @Test
    void agenciesAreAlerted_topTenOnOpening_thenTheInvitedOne() throws Exception {
        Long id = openRequest();
        List<AgencyAlert> opening = agencyAlerts();
        assertThat(opening).hasSize(1);
        assertThat(opening.get(0).agencyOrgIds())
                .contains(A, B)
                .doesNotContain(R, U)
                .hasSizeLessThanOrEqualTo(10);
        assertThat(opening.get(0).path()).isEqualTo("/pro/mandats/demandes/" + id);
        assertThat(opening.get(0).message()).contains("Malabata, Tanger");

        json(
                        owner(post("/api/v1/owner/mandate-requests/" + id + "/invitations")),
                        Map.of("agencyOrgId", "ORG-FOL-C"))
                .andExpect(status().isOk());
        // Inviter deux fois la même agence ne la relance pas.
        json(
                        owner(post("/api/v1/owner/mandate-requests/" + id + "/invitations")),
                        Map.of("agencyOrgId", "ORG-FOL-C"))
                .andExpect(status().isOk());
        List<AgencyAlert> all = agencyAlerts();
        assertThat(all).hasSize(2);
        assertThat(all.get(1).agencyOrgIds()).containsExactly("ORG-FOL-C");
        assertThat(all.get(1).subject()).isEqualTo("Un propriétaire vous invite");
    }

    private Long directRequest(String target) throws Exception {
        return read(json(
                                owner(post("/api/v1/owner/mandate-requests")),
                                Map.of(
                                        "propertyId",
                                        propertyId,
                                        "visibility",
                                        "MREQ_DIRECT",
                                        "targetAgencyOrgId",
                                        target,
                                        "mandateTypes",
                                        List.of("SIMPLE")))
                        .andExpect(status().isOk()))
                .get("id")
                .asLong();
    }

    @Test
    void directRequest_alertsTheAgency_remindsAt48h_thenTellsTheOwnerAt72h() throws Exception {
        Long id = directRequest(A);
        assertThat(agencyAlerts()).hasSize(1);
        assertThat(agencyAlerts().get(0).agencyOrgIds()).containsExactly(A);

        var r = mandateRequests.findById(id).orElseThrow();
        r.setOpenedAt(LocalDateTime.now().minusHours(49));
        mandateRequests.save(r);
        lifecycle.expire();
        assertThat(agencyAlerts()).hasSize(2);
        assertThat(agencyAlerts().get(1).subject()).startsWith("Rappel");
        lifecycle.expire();
        assertThat(agencyAlerts()).hasSize(2);
        long ownerAlerts = events.stream(com.example.backend.owner.PlatformAlert.class).count();

        // 24 h plus tard : le rappel est parti à 48 h, le propriétaire est prévenu à 72 h.
        r = mandateRequests.findById(id).orElseThrow();
        r.setOpenedAt(LocalDateTime.now().minusHours(73));
        r.setIdleAlertedAt(LocalDateTime.now().minusHours(25));
        mandateRequests.save(r);
        lifecycle.expire();
        lifecycle.expire();
        assertThat(agencyAlerts()).hasSize(2);
        assertThat(
                        events.stream(com.example.backend.owner.PlatformAlert.class)
                                .filter(a -> a.text().contains("72 h"))
                                .count())
                .isEqualTo(1);
        assertThat(events.stream(com.example.backend.owner.PlatformAlert.class).count())
                .isEqualTo(ownerAlerts + 1);
    }

    // ------------------------------------------------------------------ offres

    private String offersUrl(Long mandateId) {
        return "/api/v1/marketplace/mandates/" + mandateId + "/offers";
    }

    private String decisionUrl(Long mandateId, long offerId) {
        return "/api/v1/owner/mandates/" + mandateId + "/offers/" + offerId + "/decision";
    }

    private long submitOffer(Long mandateId, int amount, String buyer) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amount);
        body.put("buyerSummary", buyer);
        body.put("conditions", "Prêt bancaire accordé, signature sous 30 jours.");
        return read(json(agent(post(offersUrl(mandateId)), A), body).andExpect(status().isOk()))
                .get(0)
                .get("id")
                .asLong();
    }

    @Test
    void offers_ownerAcceptsRefusesOrCounters_tracedInTheAgencyDossier() throws Exception {
        Long id = openRequest();
        Long mandateId = accept(propose(id, A)).get("id").asLong();
        json(agent(post(offersUrl(mandateId)), A), Map.of("amount", 1300000))
                .andExpect(status().isConflict());

        mockMvc.perform(agent(post("/api/v1/marketplace/mandates/" + mandateId + "/signed"), A))
                .andExpect(status().isOk());
        Long dossierId =
                read(mockMvc.perform(agent(get("/api/v1/marketplace/mandates/" + mandateId), A)))
                        .get("dossierId")
                        .asLong();
        json(
                        agent(patch("/api/v1/dossiers/" + dossierId + "/status"), A),
                        Map.of("statusCode", "CRM_LISTED"))
                .andExpect(status().isOk());
        json(agent(post(offersUrl(mandateId)), A), Map.of("amount", 0))
                .andExpect(status().isBadRequest());

        // Offre 1 : l'acquéreur reste anonyme, ses coordonnées sont masquées.
        long first =
                submitOffer(mandateId, 1300000, "Couple de Casablanca, joignable au 0661223344");
        assertThat(dossiers.findById(dossierId).orElseThrow().getStatusCode())
                .isEqualTo("CRM_OFFER_RECEIVED");
        assertThat(
                        events.stream(com.example.backend.owner.PlatformAlert.class)
                                .filter(a -> a.text().startsWith("Nouvelle offre de 1 300 000 MAD"))
                                .findFirst())
                .hasValueSatisfying(a -> assertThat(a.linkParam()).isEqualTo("m" + mandateId));
        String followUp =
                mockMvc.perform(owner(get("/api/v1/owner/mandates/" + mandateId)))
                        .andExpect(jsonPath("$.offers[0].status").value("OFFER_PENDING"))
                        .andExpect(jsonPath("$.offers[0].amount").value(1300000.0))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(followUp).doesNotContain("0661223344").contains("Couple de Casablanca");

        // Contre-proposition : au-dessus de l'offre, le dossier passe en négociation.
        json(
                        owner(post(decisionUrl(mandateId, first))),
                        Map.of("decision", "COUNTER", "counterAmount", 1250000))
                .andExpect(status().isBadRequest());
        json(owner(post(decisionUrl(mandateId, first))), Map.of("decision", "MAYBE"))
                .andExpect(status().isBadRequest());
        json(
                        owner(post(decisionUrl(mandateId, first))),
                        Map.of(
                                "decision",
                                "COUNTER",
                                "counterAmount",
                                1400000,
                                "comment",
                                "Prix ferme sous 1,4 M."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offers[0].status").value("OFFER_COUNTERED"))
                .andExpect(jsonPath("$.offers[0].counterAmount").value(1400000.0));
        assertThat(dossiers.findById(dossierId).orElseThrow().getStatusCode())
                .isEqualTo("CRM_NEGOTIATION");
        json(owner(post(decisionUrl(mandateId, first))), Map.of("decision", "ACCEPT"))
                .andExpect(status().isConflict());

        // Offre 2 acceptée ; une 3e ne peut pas l'être tant que la 2e tient.
        long second = submitOffer(mandateId, 1400000, "Même couple, nouvelle offre");
        json(owner(post(decisionUrl(mandateId, second))), Map.of("decision", "ACCEPT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offers[0].status").value("OFFER_ACCEPTED"));
        long third = submitOffer(mandateId, 1420000, "Investisseur");
        json(owner(post(decisionUrl(mandateId, third))), Map.of("decision", "ACCEPT"))
                .andExpect(status().isConflict());
        mockMvc.perform(agent(post(offersUrl(mandateId) + "/" + second + "/withdraw"), A))
                .andExpect(status().isOk());
        json(owner(post(decisionUrl(mandateId, third))), Map.of("decision", "ACCEPT"))
                .andExpect(status().isOk());

        // Tracé dans le dossier de l'agence, en interne : rien de plus dans les événements
        // visibles.
        Dossier d = dossiers.findById(dossierId).orElseThrow();
        List<String> notes =
                activities.findAll().stream()
                        .filter(
                                a ->
                                        a.getDossier() != null
                                                && dossierId.equals(a.getDossier().getId()))
                        .map(ActivityEntity::getContent)
                        .toList();
        assertThat(notes)
                .anyMatch(n -> n.startsWith("Le propriétaire répond à l'offre de 1 300 000 MAD"))
                .anyMatch(n -> n.contains("Prix ferme sous 1,4 M."))
                .anyMatch(n -> n.equals("Le propriétaire accepte l'offre de 1 420 000 MAD."));
        assertThat(d.getOrgId()).isEqualTo(A);
        mockMvc.perform(owner(get("/api/v1/owner/mandates/" + mandateId)))
                .andExpect(jsonPath("$.events.length()").value(0));

        // Ni une autre agence ni un autre propriétaire n'y ont accès.
        mockMvc.perform(agent(get(offersUrl(mandateId)), B)).andExpect(status().isNotFound());
        OrganizationEntity other = new OrganizationEntity();
        other.setOrgId("OWN-fol0000003");
        other.setOrgType(OrganizationEntity.TYPE_OWNER);
        other.setOwnerPhone("+212661000666");
        organizations.save(other);
        json(
                        as(post(decisionUrl(mandateId, first)), "OWN-fol0000003", "kc-3", "OWNER"),
                        Map.of("decision", "REFUSE"))
                .andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------------ profil de l'agence

    @Test
    void agencyProfile_showsItsOwnRatingAndRecentReviews() throws Exception {
        Long id = openRequest();
        Long mandateId = accept(propose(id, A)).get("id").asLong();
        mockMvc.perform(agent(post("/api/v1/marketplace/mandates/" + mandateId + "/signed"), A))
                .andExpect(status().isOk());
        json(
                        agent(post("/api/v1/marketplace/mandates/" + mandateId + "/end"), A),
                        Map.of("reason", "DEAL_CLOSED_AGENCY"))
                .andExpect(status().isOk());
        json(
                        owner(post("/api/v1/owner/mandates/" + mandateId + "/review")),
                        Map.of("rating", 4, "comment", "Sérieux."))
                .andExpect(status().isOk());

        mockMvc.perform(as(get("/api/v1/agency/marketplace-profile"), A, "admin-" + A, "ADMIN"))
                .andExpect(jsonPath("$.rating").value(4.0))
                .andExpect(jsonPath("$.reviews").value(1))
                .andExpect(jsonPath("$.recentReviews[0].comment").value("Sérieux."));
        mockMvc.perform(as(get("/api/v1/agency/marketplace-profile"), B, "admin-" + B, "ADMIN"))
                .andExpect(jsonPath("$.reviews").value(0))
                .andExpect(jsonPath("$.recentReviews.length()").value(0));
    }

    // ------------------------------------------------------------------ régression

    /**
     * Une agence sans réglages (cas général) : le quota par défaut s'applique sans marquer la
     * transaction pour annulation. Avant correction, la bourse renvoyait 500 au commit ; la
     * transaction du test, annulée de toute façon, ne le montrait pas.
     */
    @Test
    void quotaOfAnAgencyWithoutSettings_doesNotPoisonTheTransaction() {
        var tx = new org.springframework.transaction.support.TransactionTemplate(txManager);
        tx.setPropagationBehavior(
                org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        Long remaining = tx.execute(status -> matching.remainingQuota("ORG-WITHOUT-SETTINGS"));
        assertThat(remaining).isEqualTo(30L);
    }
}
