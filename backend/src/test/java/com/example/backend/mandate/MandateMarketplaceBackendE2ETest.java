package com.example.backend.mandate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MandateRequestEntity;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.event.MandateAnnoncePublishedEvent;
import com.example.backend.owner.OtpSender;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MandateRequestRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Cas d'usage n°1, lot B : bourse aux mandats, critères PB-1 à PB-8 (spec 13 § 13).
 *
 * <p>Agences : A et B vérifiées à Tanger, R vérifiée à Rabat, U non vérifiée à Tanger.
 */
@BackendE2ETest
class MandateMarketplaceBackendE2ETest extends BaseBackendE2ETest {

    private static final String OWNER = "OWN-mkt0000001";
    private static final String OWNER_PHONE = "+212661000333";
    private static final String A = "ORG-MKT-A";
    private static final String B = "ORG-MKT-B";
    private static final String R = "ORG-MKT-R";
    private static final String U = "ORG-MKT-U";

    @Autowired private OrganizationRepository organizations;
    @Autowired private MandateRequestRepository requests;
    @Autowired private AnnonceRepository annonces;
    @Autowired private DossierRepository dossiers;
    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private ApplicationEventPublisher events;

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
        owner.setOwnerUserId("kc-owner-mkt");
        owner.setOwnerPhone(OWNER_PHONE);
        organizations.save(owner);
        agency(A, "Agence du Détroit", "Tanger", true);
        agency(B, "Tanger Immo Conseil", "Tanger", true);
        agency(R, "Rabat Habitat", "Rabat", true);
        agency(U, "Agence non vérifiée", "Tanger", false);
        propertyId = createProperty();
    }

    @AfterEach
    void tearDown() {
        com.example.backend.util.TenantContext.clear();
    }

    // ------------------------------------------------------------------ helpers

    private void agency(String org, String name, String city, boolean verified) throws Exception {
        OrganizationEntity o = new OrganizationEntity();
        o.setOrgId(org);
        o.setOrgType(OrganizationEntity.TYPE_AGENCY);
        o.setDisplayName(org);
        o.setVerified(verified);
        organizations.save(o);
        json(
                        as(put("/api/v1/agency/marketplace-profile"), org, "admin-" + org, "ADMIN"),
                        Map.of(
                                "displayName",
                                name,
                                "description",
                                "Agence de quartier",
                                "transactions",
                                List.of("SALE", "RENT")))
                .andExpect(status().isOk());
        json(
                        as(
                                put("/api/v1/agency/marketplace-profile/zones"),
                                org,
                                "admin-" + org,
                                "ADMIN"),
                        List.of(Map.of("city", city)))
                .andExpect(status().isOk());
    }

    private <T extends MockHttpServletRequestBuilder> T as(
            T builder, String org, String subject, String... roles) {
        builder.header(TENANT_HEADER, org).header(CORRELATION_ID_HEADER, "mkt-test");
        builder.with(jwtAs(org, subject, roles));
        return builder;
    }

    private <T extends MockHttpServletRequestBuilder> T owner(T builder) {
        return as(builder, OWNER, "kc-owner-mkt", "OWNER");
    }

    /** Agent d'une agence (les agents ont aussi ROLE_PRO). */
    private <T extends MockHttpServletRequestBuilder> T agent(T builder, String org) {
        return as(builder, org, "agent-" + org, "AGENT", "PRO");
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
        return read(json(
                                owner(post("/api/v1/owner/properties")),
                                Map.of(
                                        "title", "Appartement Malabata",
                                        "transactionType", "SALE",
                                        "propertyType", "Appartement",
                                        "city", "Tanger",
                                        "district", "Malabata",
                                        "address", "12 rue des Oliviers, 3e étage",
                                        "surface", 92.0,
                                        "rooms", 3,
                                        "expectedPrice", 1450000))
                        .andExpect(status().isCreated()))
                .get("id")
                .asLong();
    }

    private Long openRequest(List<String> types) throws Exception {
        return read(json(
                                owner(post("/api/v1/owner/mandate-requests")),
                                Map.of(
                                        "propertyId",
                                        propertyId,
                                        "visibility",
                                        "MREQ_OPEN_MARKET",
                                        "mandateTypes",
                                        types,
                                        "services",
                                        List.of("PHOTOS", "VISITS"),
                                        "message",
                                        "Vente sous 3 mois. Joignable au 0661000333."))
                        .andExpect(status().isOk()))
                .get("id")
                .asLong();
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
                                        List.of("SIMPLE", "EXCLUSIVE")))
                        .andExpect(status().isOk()))
                .get("id")
                .asLong();
    }

    private Long propose(Long requestId, String org, String type) throws Exception {
        JsonNode r =
                read(
                        json(
                                        agent(
                                                post(
                                                        "/api/v1/marketplace/requests/"
                                                                + requestId
                                                                + "/proposals"),
                                                org),
                                        Map.of(
                                                "mandateType",
                                                type,
                                                "durationMonths",
                                                3,
                                                "commissionKind",
                                                "PERCENT",
                                                "commissionValue",
                                                2.5,
                                                "commissionPayer",
                                                "SELLER",
                                                "services",
                                                List.of("PHOTOS", "VISITS", "NEGOTIATION"),
                                                "estimateMin",
                                                1350000,
                                                "estimateMax",
                                                1500000,
                                                "message",
                                                "Nous vendons à Malabata depuis 10 ans."))
                                .andExpect(status().isOk()));
        return r.get("myProposal").get("id").asLong();
    }

    private JsonNode accept(Long proposalId) throws Exception {
        mockMvc.perform(owner(post("/api/v1/owner/proposals/" + proposalId + "/accept/start")))
                .andExpect(status().isOk());
        String code = sentCodes.get(sentCodes.size() - 1);
        return read(
                json(
                                owner(post("/api/v1/owner/proposals/" + proposalId + "/accept")),
                                Map.of("code", code))
                        .andExpect(status().isOk()));
    }

    private Annonce publishedAnnonce(String org, String kind, Long mandateId) {
        Annonce a =
                testDataBuilder
                        .annonceBuilder()
                        .withOrgId(org)
                        .withTitle("Appartement Malabata")
                        .withType(AnnonceType.SALE)
                        .withStatus(AnnonceStatus.PUBLISHED)
                        .withCity("Tanger")
                        .withPrice(new BigDecimal("1450000"))
                        .persist();
        a.setPropertyId(propertyId);
        a.setPublisherKind(kind);
        a.setMandateId(mandateId);
        return annonces.save(a);
    }

    // ------------------------------------------------------------------ PB-1

    @Test
    void pb1_openRequestReachesVerifiedAgenciesOfTheZone_anonymised() throws Exception {
        Long id = openRequest(List.of("SIMPLE", "EXCLUSIVE"));

        String body =
                mockMvc.perform(agent(get("/api/v1/marketplace/requests"), A))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].id").value(id))
                        .andExpect(jsonPath("$[0].ownerName").value("Nadia I."))
                        .andExpect(jsonPath("$[0].district").value("Malabata"))
                        .andExpect(jsonPath("$[0].canPropose").value(true))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        // Ni adresse, ni téléphone (même écrit dans le message libre).
        assertThat(body)
                .doesNotContain("Oliviers")
                .doesNotContain("0661000333")
                .doesNotContain(OWNER_PHONE);

        mockMvc.perform(agent(get("/api/v1/marketplace/requests"), R))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), R))
                .andExpect(status().isNotFound());
        mockMvc.perform(agent(get("/api/v1/marketplace/requests"), U))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ PB-2

    @Test
    void pb2_onePerAgency_andCappedPerRequest() throws Exception {
        Long id = openRequest(List.of("SIMPLE"));
        MandateRequestEntity r = requests.findById(id).orElseThrow();
        r.setMaxProposals(1);
        requests.save(r);

        propose(id, A, "SIMPLE");
        json(
                        agent(post("/api/v1/marketplace/requests/" + id + "/proposals"), A),
                        Map.of("mandateType", "SIMPLE"))
                .andExpect(status().isConflict());
        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), B))
                .andExpect(jsonPath("$.canPropose").value(false))
                .andExpect(
                        jsonPath("$.cannotProposeReason")
                                .value(org.hamcrest.Matchers.startsWith("REQUEST_FULL")));
    }

    // ------------------------------------------------------------------ PB-3

    @Test
    void pb3_contactsAreMaskedBothWaysUntilAcceptance() throws Exception {
        Long id = openRequest(List.of("EXCLUSIVE"));
        Long proposal = propose(id, A, "EXCLUSIVE");

        json(
                        agent(post("/api/v1/marketplace/proposals/" + proposal + "/messages"), A),
                        Map.of("body", "Appelez-moi au 06 12 34 56 78 ou agent@detroit.ma"))
                .andExpect(status().isOk());
        String ownerView =
                mockMvc.perform(owner(get("/api/v1/owner/proposals/" + proposal + "/messages")))
                        .andExpect(jsonPath("$.masked").value(true))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(ownerView)
                .contains(ContactMasker.MASK)
                .doesNotContain("06 12 34 56 78")
                .doesNotContain("agent@detroit.ma");

        json(
                        owner(post("/api/v1/owner/proposals/" + proposal + "/messages")),
                        Map.of("body", "Mon numéro : +212 661 000 333, wa.me/212661000333"))
                .andExpect(status().isOk());
        String agencyView =
                mockMvc.perform(
                                agent(
                                        get(
                                                "/api/v1/marketplace/proposals/"
                                                        + proposal
                                                        + "/messages"),
                                        A))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(agencyView).doesNotContain("661 000 333").doesNotContain("wa.me");

        // Après acceptation, les coordonnées apparaissent.
        accept(proposal);
        mockMvc.perform(agent(get("/api/v1/marketplace/proposals/" + proposal + "/messages"), A))
                .andExpect(jsonPath("$.masked").value(false))
                .andExpect(
                        jsonPath("$.messages[1].body")
                                .value(org.hamcrest.Matchers.containsString("+212 661 000 333")));
    }

    // ------------------------------------------------------------------ PB-4

    @Test
    void pb4_acceptanceByCode_createsMandateAndAgencyDossier() throws Exception {
        Long id = openRequest(List.of("SIMPLE", "EXCLUSIVE"));
        Long pa = propose(id, A, "EXCLUSIVE");
        Long pb = propose(id, B, "SIMPLE");

        mockMvc.perform(owner(post("/api/v1/owner/proposals/" + pa + "/accept/start")))
                .andExpect(status().isOk());
        json(owner(post("/api/v1/owner/proposals/" + pa + "/accept")), Map.of("code", "000000"))
                .andExpect(status().is4xxClientError());

        JsonNode mandate = accept(pa);
        assertThat(mandate.get("status").asText()).isEqualTo("MANDATE_PENDING_SIGNATURE");
        assertThat(mandate.get("mandateType").asText()).isEqualTo("EXCLUSIVE");
        // Le propriétaire ne voit pas le dossier de l'agence.
        assertThat(mandate.get("dossierId").isNull()).isTrue();
        Long mandateId = mandate.get("id").asLong();

        mockMvc.perform(owner(get("/api/v1/owner/mandate-requests/" + id)))
                .andExpect(jsonPath("$.status").value("MREQ_AWARDED"))
                .andExpect(jsonPath("$.proposals[0].status").value("MPROP_ACCEPTED"))
                .andExpect(jsonPath("$.proposals[1].status").value("MPROP_DECLINED"));

        JsonNode agencyMandate =
                read(
                        mockMvc.perform(agent(get("/api/v1/marketplace/mandates/" + mandateId), A))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.owner.phone").value(OWNER_PHONE))
                                .andExpect(
                                        jsonPath("$.owner.address")
                                                .value("12 rue des Oliviers, 3e étage")));
        Long dossierId = agencyMandate.get("dossierId").asLong();
        Dossier d = dossiers.findById(dossierId).orElseThrow();
        assertThat(d.getOrgId()).isEqualTo(A);
        assertThat(d.getCaseType()).isEqualTo("CRM_MANDATE_SALE");
        assertThat(d.getStatusCode()).isEqualTo("CRM_MANDATE_PENDING");
        assertThat(d.getAssignedTo()).isEqualTo("agent-" + A);
        assertThat(d.getLeadPhone()).isEqualTo(OWNER_PHONE);

        mockMvc.perform(agent(get("/api/v1/marketplace/mandates/" + mandateId), B))
                .andExpect(status().isNotFound());

        // Signature déclarée, puis annonce de l'agence liée au bien.
        json(owner(post("/api/v1/owner/proposals/" + pb + "/accept/start")), Map.of())
                .andExpect(status().isConflict());
        mockMvc.perform(agent(post("/api/v1/marketplace/mandates/" + mandateId + "/annonce"), A))
                .andExpect(status().isConflict());
        mockMvc.perform(agent(post("/api/v1/marketplace/mandates/" + mandateId + "/signed"), A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MANDATE_ACTIVE"));
        assertThat(dossiers.findById(dossierId).orElseThrow().getStatusCode())
                .isEqualTo("CRM_MANDATE_SIGNED");
        Long annonceId =
                read(mockMvc.perform(
                                        agent(
                                                post(
                                                        "/api/v1/marketplace/mandates/"
                                                                + mandateId
                                                                + "/annonce"),
                                                A))
                                .andExpect(status().isOk()))
                        .get("annonceId")
                        .asLong();
        Annonce agencyAnnonce = annonces.findById(annonceId).orElseThrow();
        assertThat(agencyAnnonce.getOrgId()).isEqualTo(A);
        assertThat(agencyAnnonce.getPropertyId()).isEqualTo(propertyId);
        assertThat(agencyAnnonce.getMandateId()).isEqualTo(mandateId);
        assertThat(agencyAnnonce.getAddress()).isEqualTo("Malabata");

        // Annonce en ligne : le dossier passe « En commercialisation ».
        com.example.backend.util.TenantContext.setOrgId(A);
        events.publishEvent(new MandateAnnoncePublishedEvent(annonceId, mandateId, A));
        assertThat(dossiers.findById(dossierId).orElseThrow().getStatusCode())
                .isEqualTo("CRM_LISTED");
    }

    // ------------------------------------------------------------------ PB-5

    @Test
    void pb5_exclusiveSuspendsOwnerListing_andRedirectsToTheAgency() throws Exception {
        Annonce ownerAnnonce = publishedAnnonce(OWNER, "OWNER", null);
        Long id = openRequest(List.of("EXCLUSIVE"));
        Long mandateId = accept(propose(id, A, "EXCLUSIVE")).get("id").asLong();

        assertThat(
                        AnnonceStatus.normalize(
                                annonces.findById(ownerAnnonce.getId()).orElseThrow().getStatus()))
                .isEqualTo(AnnonceStatus.SUSPENDED);
        json(
                        owner(post("/api/v1/owner/mandate-requests")),
                        Map.of("propertyId", propertyId, "mandateTypes", List.of("SIMPLE")))
                .andExpect(status().isConflict())
                .andExpect(
                        jsonPath("$.detail")
                                .value(org.hamcrest.Matchers.containsString("EXCLUSIVE_MANDATE")));
        mockMvc.perform(owner(post("/api/v1/owner/properties/" + propertyId + "/annonce/publish")))
                .andExpect(status().isConflict());

        mockMvc.perform(agent(post("/api/v1/marketplace/mandates/" + mandateId + "/signed"), A))
                .andExpect(status().isOk());
        Annonce agencyAnnonce = publishedAnnonce(A, "AGENCY", mandateId);
        mockMvc.perform(get("/api/v1/portal/annonces/" + ownerAnnonce.getId()))
                .andExpect(status().isMovedPermanently())
                .andExpect(redirectedUrl("/api/v1/portal/annonces/" + agencyAnnonce.getId()));
    }

    // ------------------------------------------------------------------ PB-6

    @Test
    void pb6_simpleMandatesToTwoAgencies_showOnePropertyWithTwoPublishers() throws Exception {
        Long id = openRequest(List.of("SIMPLE"));
        Long pa = propose(id, A, "SIMPLE");
        Long pb = propose(id, B, "SIMPLE");
        Long ma = accept(pa).get("id").asLong();
        // Mandat simple : une autre proposition simple reste acceptable.
        Long mb = accept(pb).get("id").asLong();

        Annonce aa = publishedAnnonce(A, "AGENCY", ma);
        Annonce ab = publishedAnnonce(B, "AGENCY", mb);

        JsonNode page =
                read(mockMvc.perform(get("/api/v1/portal/annonces").param("city", "Tanger")));
        long sameProperty = 0;
        for (JsonNode item : page.get("content")) {
            long itemId = item.get("id").asLong();
            if (itemId == aa.getId() || itemId == ab.getId()) {
                sameProperty++;
            }
        }
        assertThat(sameProperty).isEqualTo(1);
        mockMvc.perform(get("/api/v1/portal/annonces/" + aa.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishers.length()").value(2))
                .andExpect(jsonPath("$.publishers[0].name").value("Agence du Détroit"))
                .andExpect(jsonPath("$.publishers[1].name").value("Tanger Immo Conseil"));
    }

    // ------------------------------------------------------------------ PB-7

    @Test
    void pb7_directRequestForAPrivateProperty_onlyReachesTheChosenAgency() throws Exception {
        mockMvc.perform(owner(get("/api/v1/owner/agencies").param("city", "Tanger")))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Agence du Détroit"));
        Long id = directRequest(A);

        mockMvc.perform(agent(get("/api/v1/marketplace/direct-requests"), A))
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].direct").value(true));
        mockMvc.perform(agent(get("/api/v1/marketplace/requests"), B))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), B))
                .andExpect(status().isNotFound());
        json(
                        agent(post("/api/v1/marketplace/requests/" + id + "/proposals"), B),
                        Map.of("mandateType", "SIMPLE"))
                .andExpect(status().isNotFound());

        // Le bien n'a aucune annonce : la première fiche publique sera celle de l'agence.
        Long mandateId = accept(propose(id, A, "EXCLUSIVE")).get("id").asLong();
        assertThat(annonces.findByPropertyIdOrderByIdAsc(propertyId)).isEmpty();
        mockMvc.perform(agent(post("/api/v1/marketplace/mandates/" + mandateId + "/signed"), A));
        Annonce agencyAnnonce = publishedAnnonce(A, "AGENCY", mandateId);
        mockMvc.perform(get("/api/v1/portal/annonces/" + agencyAnnonce.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publisherKind").value("AGENCY"));
    }

    // ------------------------------------------------------------------ PB-8

    @Test
    void pb8_unansweredOrDeclinedDirectRequest_canBeOpenedToTheMarket() throws Exception {
        Long id = directRequest(A);
        mockMvc.perform(owner(post("/api/v1/owner/mandate-requests/" + id + "/open-to-market")))
                .andExpect(status().isConflict());

        // 72 h sans réponse.
        MandateRequestEntity r = requests.findById(id).orElseThrow();
        r.setOpenedAt(LocalDateTime.now().minusHours(73));
        requests.save(r);
        mockMvc.perform(owner(get("/api/v1/owner/mandate-requests/" + id)))
                .andExpect(jsonPath("$.canOpenToMarket").value(true));
        r.setOpenedAt(LocalDateTime.now());
        requests.save(r);

        // Ou déclinée par l'agence.
        mockMvc.perform(agent(post("/api/v1/marketplace/requests/" + id + "/decline"), A))
                .andExpect(status().isOk());
        mockMvc.perform(owner(post("/api/v1/owner/mandate-requests/" + id + "/open-to-market")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibility").value("MREQ_OPEN_MARKET"));

        mockMvc.perform(agent(get("/api/v1/marketplace/requests"), B))
                .andExpect(jsonPath("$[0].id").value(id));
        // L'agence d'abord choisie garde l'accès.
        mockMvc.perform(agent(get("/api/v1/marketplace/requests/" + id), A))
                .andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ accès

    @Test
    void agentsOnlySeeTheirOwnProposals_andOwnerCannotUseTheMarketplace() throws Exception {
        Long id = openRequest(List.of("SIMPLE"));
        Long proposal = propose(id, A, "SIMPLE");
        mockMvc.perform(
                        as(
                                get("/api/v1/marketplace/proposals/" + proposal),
                                A,
                                "agent-2",
                                "AGENT",
                                "PRO"))
                .andExpect(status().isNotFound());
        mockMvc.perform(
                        as(
                                get("/api/v1/marketplace/proposals/" + proposal),
                                A,
                                "manager-1",
                                "MANAGER",
                                "PRO"))
                .andExpect(status().isOk());
        mockMvc.perform(owner(get("/api/v1/marketplace/requests")))
                .andExpect(status().isForbidden());
        mockMvc.perform(agent(get("/api/v1/owner/mandate-requests"), A))
                .andExpect(status().isForbidden());
    }
}
