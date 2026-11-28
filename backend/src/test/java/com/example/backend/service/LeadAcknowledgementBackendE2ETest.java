package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.entitlement.EntitlementService;
import com.example.backend.entitlement.Feature;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.event.PortalLeadCreatedEvent;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/**
 * Accusé de réception d'un contact du portail. Les tests E2E tournent dans une transaction annulée
 * : l'écouteur « après validation » n'y est pas déclenché, l'envoi est donc appelé directement, sur
 * un lead réellement soumis par le portail.
 */
@BackendE2ETest
class LeadAcknowledgementBackendE2ETest extends BaseBackendE2ETest {

    private static final String AGENCY = "agence-ack";

    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private OrganizationRepository organizations;
    @Autowired private DossierRepository dossiers;
    @Autowired private OutboundMessageRepository outbound;
    @Autowired private WhatsAppProviderConfigRepository whatsAppConfigs;
    @Autowired private EntitlementService entitlements;
    @Autowired private LeadAcknowledgementService acknowledgement;

    private void organization(String orgId, String type, String name) {
        OrganizationEntity o = new OrganizationEntity();
        o.setOrgId(orgId);
        o.setOrgType(type);
        o.setDisplayName(name);
        o.setVerified(true);
        organizations.save(o);
    }

    private void whatsApp(String orgId) {
        WhatsAppProviderConfig c = new WhatsAppProviderConfig();
        c.setOrgId(orgId);
        c.setPhoneNumberId("ack-" + orgId);
        c.setApiKeyEncrypted("k");
        c.setApiSecretEncrypted("s");
        c.setWebhookSecretEncrypted("w");
        c.setEnabled(true);
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        whatsAppConfigs.save(c);
    }

    /** Soumet un lead par le portail et renvoie le dossier créé. */
    private Dossier submitLead(String phone, String email) throws Exception {
        return submitLead(AGENCY, phone, email);
    }

    private Dossier submitLead(String agency, String phone, String email) throws Exception {
        Annonce a =
                testDataBuilder
                        .annonceBuilder()
                        .withOrgId(agency)
                        .withTitle("Appartement Malabata")
                        .withType(AnnonceType.SALE)
                        .withStatus(AnnonceStatus.PUBLISHED)
                        .withCity("Tanger")
                        .persist();
        PortalLeadRequest r = new PortalLeadRequest();
        r.setAnnonceId(a.getId());
        r.setRequestType("INFO");
        r.setName("Yasmine Benali");
        r.setPhone(phone);
        r.setEmail(email);
        r.setConsent(true);
        mockMvc.perform(
                        post("/api/v1/portal/leads")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isCreated());
        return dossiers.findAll().stream()
                .filter(d -> agency.equals(d.getOrgId()) && d.getAnnonceId().equals(a.getId()))
                .findFirst()
                .orElseThrow();
    }

    private List<OutboundMessageEntity> sent(Dossier d) {
        return outbound.findByDossierId(d.getId());
    }

    @Test
    void whatsAppAgency_sendsTheApprovedTemplateWithNameListingAndAgency() throws Exception {
        organization(AGENCY, OrganizationEntity.TYPE_AGENCY, "Agence du Détroit");
        whatsApp(AGENCY);
        Dossier d = submitLead("+212611220001", null);

        acknowledgement.acknowledge(new PortalLeadCreatedEvent(d.getId(), AGENCY));
        acknowledgement.acknowledge(new PortalLeadCreatedEvent(d.getId(), AGENCY));

        List<OutboundMessageEntity> messages = sent(d);
        assertThat(messages).hasSize(1); // clé d'idempotence : jamais deux accusés
        OutboundMessageEntity m = messages.get(0);
        assertThat(m.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
        assertThat(m.getTo()).isEqualTo("+212611220001");
        assertThat(m.getTemplateCode()).isEqualTo(LeadAcknowledgementService.TEMPLATE);
        assertThat(m.getPayloadJson().get("language")).isEqualTo("fr");
        assertThat(m.getPayloadJson().get("body").toString())
                .isEqualTo(
                        "Bonjour Yasmine, Agence du Détroit a bien reçu votre demande concernant"
                                + " « Appartement Malabata ». Un conseiller vous recontacte"
                                + " rapidement.");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> components =
                (List<Map<String, Object>>) m.getPayloadJson().get("components");
        assertThat(components.get(0).get("parameters").toString())
                .contains("Yasmine", "Appartement Malabata", "Agence du Détroit");
    }

    @Test
    void withoutWhatsApp_fallsBackToEmail() throws Exception {
        organization(AGENCY, OrganizationEntity.TYPE_AGENCY, "Agence du Détroit");
        Dossier d = submitLead("+212611220002", "yasmine@example.ma");

        acknowledgement.acknowledge(new PortalLeadCreatedEvent(d.getId(), AGENCY));

        assertThat(sent(d))
                .singleElement()
                .satisfies(
                        m -> {
                            assertThat(m.getChannel()).isEqualTo(MessageChannel.EMAIL);
                            assertThat(m.getTo()).isEqualTo("yasmine@example.ma");
                            assertThat(m.getSubject())
                                    .isEqualTo(LeadAcknowledgementService.EMAIL_SUBJECT);
                        });
    }

    @Test
    void nothingWhenTheModuleIsOff_orWithoutAnyReachableChannel() throws Exception {
        organization(AGENCY, OrganizationEntity.TYPE_AGENCY, "Agence du Détroit");
        Dossier phoneOnly = submitLead("+212611220003", null); // pas de WhatsApp configuré
        acknowledgement.acknowledge(new PortalLeadCreatedEvent(phoneOnly.getId(), AGENCY));
        assertThat(sent(phoneOnly)).isEmpty();

        // Agence à part : l'état des modules est mis en cache par agence.
        String off = "agence-ack-off";
        organization(off, OrganizationEntity.TYPE_AGENCY, "Agence sans accusé");
        whatsApp(off);
        entitlements.setEnabled(off, Feature.MODULE_LEAD_AUTO_ACK.key(), false);
        Dossier d = submitLead(off, "+212611220004", "x@example.ma");
        acknowledgement.acknowledge(new PortalLeadCreatedEvent(d.getId(), off));
        assertThat(sent(d)).isEmpty();
    }

    @Test
    void ownerListings_areLeftToTheOwnerThread() throws Exception {
        organization(AGENCY, OrganizationEntity.TYPE_AGENCY, "Agence du Détroit");
        whatsApp(AGENCY);
        Dossier d = submitLead("+212611220005", null);
        organization("OWN-ACK", OrganizationEntity.TYPE_OWNER, "Nadia I.");

        acknowledgement.acknowledge(new PortalLeadCreatedEvent(d.getId(), "OWN-ACK"));

        assertThat(sent(d)).isEmpty();
    }

    @Test
    void messageText_handlesMissingListingAndName() {
        assertThat(LeadAcknowledgementService.message("Omar", null, "Maârif Immo"))
                .isEqualTo(
                        "Bonjour Omar, Maârif Immo a bien reçu votre demande. Un conseiller vous"
                                + " recontacte rapidement.");
        assertThat(LeadAcknowledgementService.firstName("  ")).isEqualTo("Madame, Monsieur");
    }
}
