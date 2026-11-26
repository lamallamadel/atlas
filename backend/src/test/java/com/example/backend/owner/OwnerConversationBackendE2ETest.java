package com.example.backend.owner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Cas d'usage n°1, lot A (UC-P4, points 2 et 3) : le propriétaire est alerté d'un nouveau contact,
 * répond par la plateforme, propose des créneaux ; le prospect, sans compte, lit, répond et choisit
 * un créneau par le lien reçu.
 */
@BackendE2ETest
@RecordApplicationEvents
class OwnerConversationBackendE2ETest extends BaseBackendE2ETest {

    private static final String OWNER_ORG = "OWN-conv000001";
    private static final String OWNER_PHONE = "+212661000111";
    private static final String PROSPECT_PHONE = "+212611223344";
    private static final String TOKEN = "X-Conversation-Token";

    @Autowired private OrganizationRepository organizations;
    @Autowired private DossierRepository dossiers;
    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private ApplicationEvents events;

    private Long annonceId;

    @BeforeEach
    void setUp() {
        OrganizationEntity org = new OrganizationEntity();
        org.setOrgId(OWNER_ORG);
        org.setOrgType(OrganizationEntity.TYPE_OWNER);
        org.setDisplayName("Nadia I.");
        org.setOwnerUserId("kc-owner-conv");
        org.setOwnerPhone(OWNER_PHONE);
        organizations.save(org);
        Annonce annonce =
                testDataBuilder
                        .annonceBuilder()
                        .withOrgId(OWNER_ORG)
                        .withTitle("Appartement Malabata")
                        .withType(AnnonceType.SALE)
                        .withStatus(AnnonceStatus.PUBLISHED)
                        .withCity("Tanger")
                        .persist();
        annonceId = annonce.getId();
    }

    @AfterEach
    void tearDown() {
        com.example.backend.util.TenantContext.clear();
    }

    // ---------- helpers ----------

    private <T extends MockHttpServletRequestBuilder> T owner(T builder) {
        builder.header(TENANT_HEADER, OWNER_ORG).header(CORRELATION_ID_HEADER, "conv-test");
        builder.with(jwtWithRoles(OWNER_ORG, "OWNER"));
        return builder;
    }

    private ResultActions json(MockHttpServletRequestBuilder builder, Object body)
            throws Exception {
        return mockMvc.perform(
                builder.contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)));
    }

    private Long submitLead() throws Exception {
        PortalLeadRequest lead = new PortalLeadRequest();
        lead.setAnnonceId(annonceId);
        lead.setRequestType("VISIT");
        lead.setName("Yasmine B.");
        lead.setPhone(PROSPECT_PHONE);
        lead.setMessage("Disponible samedi.");
        lead.setConsent(true);
        json(post("/api/v1/portal/leads"), lead).andExpect(status().isCreated());
        return dossiers.findAll().stream()
                .filter(d -> PROSPECT_PHONE.equals(d.getLeadPhone()))
                .map(Dossier::getId)
                .findFirst()
                .orElseThrow();
    }

    private List<PlatformAlert> alerts(PlatformAlert.Audience audience) {
        return events.stream(PlatformAlert.class).filter(a -> a.audience() == audience).toList();
    }

    private String lastProspectToken() {
        List<PlatformAlert> sent = alerts(PlatformAlert.Audience.PROSPECT);
        assertThat(sent).isNotEmpty();
        return sent.get(sent.size() - 1).linkParam();
    }

    private JsonNode read(ResultActions result) throws Exception {
        return objectMapper.readTree(result.andReturn().getResponse().getContentAsString());
    }

    // ---------- tests ----------

    @Test
    void newLeadAlertsTheOwner_withALinkToTheContact() throws Exception {
        Long leadId = submitLead();

        List<PlatformAlert> sent = alerts(PlatformAlert.Audience.OWNER);
        assertThat(sent).hasSize(1);
        PlatformAlert alert = sent.get(0);
        assertThat(alert.phone()).isEqualTo(OWNER_PHONE);
        assertThat(alert.text()).contains("Nouveau contact", "Appartement Malabata", "Yasmine B.");
        assertThat(alert.linkParam()).isEqualTo("c" + leadId);
        assertThat(alert.linkUrl()).endsWith("/proprietaire/contacts/" + leadId);
    }

    @Test
    void ownerAndProspectExchangeMessages_throughTheLink() throws Exception {
        Long leadId = submitLead();

        json(owner(post("/api/v1/owner/leads/" + leadId + "/messages")), Map.of("body", "Bonjour"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages[0].author").value("OWNER"))
                .andExpect(jsonPath("$.messages[0].body").value("Bonjour"))
                // Répondre fait passer le contact « En contact ».
                .andExpect(jsonPath("$.statusCode").value("CRM_QUALIFYING"))
                .andExpect(jsonPath("$.statusLabel").value("En contact"));

        PlatformAlert toProspect = alerts(PlatformAlert.Audience.PROSPECT).get(0);
        assertThat(toProspect.phone()).isEqualTo(PROSPECT_PHONE);
        assertThat(toProspect.whatsappAllowed()).isTrue();
        assertThat(toProspect.text()).startsWith("Nadia vous a répondu");
        String token = toProspect.linkParam();
        assertThat(toProspect.linkUrl()).endsWith("/contact/" + token);

        // Le prospect lit : il ne voit ni le téléphone du propriétaire ni l'adresse du bien.
        String body =
                mockMvc.perform(get("/api/v1/portal/conversation").header(TOKEN, token))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.ownerName").value("Nadia"))
                        .andExpect(jsonPath("$.annonceTitle").value("Appartement Malabata"))
                        .andExpect(jsonPath("$.messages[0].author").value("OWNER"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(body).doesNotContain(OWNER_PHONE).doesNotContain("prospectPhone");

        json(
                        post("/api/v1/portal/conversation/messages").header(TOKEN, token),
                        Map.of("body", "Samedi 10h ?"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages[1].author").value("PROSPECT"));
        assertThat(alerts(PlatformAlert.Audience.OWNER).get(1).text())
                .startsWith("Yasmine B. vous a écrit");

        // Non lu côté propriétaire, puis lu à l'ouverture.
        mockMvc.perform(owner(get("/api/v1/owner/leads")))
                .andExpect(jsonPath("$[0].unread").value(1));
        mockMvc.perform(owner(get("/api/v1/owner/leads/" + leadId + "/conversation")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages.length()").value(2));
        mockMvc.perform(owner(get("/api/v1/owner/leads")))
                .andExpect(jsonPath("$[0].unread").value(0));
    }

    @Test
    void prospectPicksASlot_whichBooksTheVisit() throws Exception {
        Long leadId = submitLead();
        LocalDateTime base = LocalDateTime.now().plusDays(3).truncatedTo(ChronoUnit.HOURS);

        JsonNode conv =
                read(
                        json(
                                        owner(
                                                post(
                                                        "/api/v1/owner/leads/"
                                                                + leadId
                                                                + "/visit-proposals")),
                                        Map.of(
                                                "slots",
                                                List.of(
                                                        Map.of(
                                                                "start", base.toString(),
                                                                "end",
                                                                        base.plusMinutes(45)
                                                                                .toString()),
                                                        Map.of(
                                                                "start",
                                                                        base.plusDays(1).toString(),
                                                                "end",
                                                                        base.plusDays(1)
                                                                                .plusMinutes(45)
                                                                                .toString()))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.proposals.length()").value(2)));
        Long second = conv.get("proposals").get(1).get("id").asLong();
        String token = lastProspectToken();
        assertThat(alerts(PlatformAlert.Audience.PROSPECT).get(0).text())
                .contains("2 créneaux de visite");

        mockMvc.perform(
                        post("/api/v1/portal/conversation/visit-proposals/" + second + "/accept")
                                .header(TOKEN, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proposals.length()").value(0))
                .andExpect(jsonPath("$.visits.length()").value(1))
                .andExpect(jsonPath("$.visits[0].start").value(startsWith(base.plusDays(1))));

        assertThat(dossiers.findById(leadId).orElseThrow().getStatusCode())
                .isEqualTo("CRM_VISIT_PLANNED");
        assertThat(alerts(PlatformAlert.Audience.OWNER).get(1).text())
                .startsWith("Yasmine B. a choisi la visite du");

        // Le créneau déjà pris ne peut pas l'être deux fois.
        mockMvc.perform(
                        post("/api/v1/portal/conversation/visit-proposals/" + second + "/accept")
                                .header(TOKEN, token))
                .andExpect(status().isConflict());

        // Le propriétaire annule : le prospect est prévenu.
        Long visitId =
                read(mockMvc.perform(owner(get("/api/v1/owner/leads/" + leadId + "/conversation"))))
                        .get("visits")
                        .get(0)
                        .get("id")
                        .asLong();
        mockMvc.perform(
                        owner(
                                post(
                                        "/api/v1/owner/leads/"
                                                + leadId
                                                + "/visits/"
                                                + visitId
                                                + "/cancel")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visits.length()").value(0));
        List<PlatformAlert> toProspect = alerts(PlatformAlert.Audience.PROSPECT);
        assertThat(toProspect.get(toProspect.size() - 1).text()).contains("a annulé la visite");
    }

    @Test
    void slotsAreValidated() throws Exception {
        Long leadId = submitLead();
        String url = "/api/v1/owner/leads/" + leadId + "/visit-proposals";
        LocalDateTime past = LocalDateTime.now().minusHours(1);
        json(owner(post(url)), Map.of("slots", List.of())).andExpect(status().isBadRequest());
        json(
                        owner(post(url)),
                        Map.of(
                                "slots",
                                List.of(
                                        Map.of(
                                                "start",
                                                past.toString(),
                                                "end",
                                                past.plusHours(1).toString()))))
                .andExpect(status().isBadRequest());
        LocalDateTime later = LocalDateTime.now().plusDays(1);
        json(
                        owner(post(url)),
                        Map.of(
                                "slots",
                                List.of(
                                        Map.of(
                                                "start",
                                                later.toString(),
                                                "end",
                                                later.plusHours(5).toString()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidLinksAndOtherOwnersAreRejected() throws Exception {
        Long leadId = submitLead();
        mockMvc.perform(get("/api/v1/portal/conversation").header(TOKEN, "pas-un-jeton"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/portal/conversation")).andExpect(status().isNotFound());

        OrganizationEntity other = new OrganizationEntity();
        other.setOrgId("OWN-conv000002");
        other.setOrgType(OrganizationEntity.TYPE_OWNER);
        other.setDisplayName("Karim T.");
        other.setOwnerPhone("+212661000222");
        organizations.save(other);
        mockMvc.perform(
                        get("/api/v1/owner/leads/" + leadId + "/conversation")
                                .header(TENANT_HEADER, "OWN-conv000002")
                                .with(jwtWithRoles("OWN-conv000002", "OWNER")))
                .andExpect(status().isNotFound());

        // Un contact clos n'accepte plus de message.
        json(
                        owner(put("/api/v1/owner/leads/" + leadId + "/status")),
                        Map.of("statusCode", "CRM_CLOSED_LOST"))
                .andExpect(status().isOk());
        json(owner(post("/api/v1/owner/leads/" + leadId + "/messages")), Map.of("body", "Re"))
                .andExpect(status().isConflict());
    }

    private static org.hamcrest.Matcher<String> startsWith(LocalDateTime value) {
        return org.hamcrest.Matchers.startsWith(value.toString().substring(0, 16));
    }
}
