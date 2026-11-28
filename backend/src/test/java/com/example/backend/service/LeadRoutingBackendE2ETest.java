package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.OrganizationSettings;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.event.PortalLeadCreatedEvent;
import com.example.backend.mandate.OrgScope;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.OrganizationSettingsRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Distribution des leads du portail. Comme pour l'accusé de réception, l'écouteur « après
 * validation » ne se déclenche pas dans la transaction annulée du test : on appelle le routage.
 * Sans Keycloak, l'équipe est celle vue dans les dossiers de l'agence.
 */
@BackendE2ETest
class LeadRoutingBackendE2ETest extends BaseBackendE2ETest {

    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private OrganizationRepository organizations;
    @Autowired private OrganizationSettingsRepository settings;
    @Autowired private DossierRepository dossiers;
    @Autowired private AnnonceRepository annonces;
    @Autowired private LeadRoutingService routing;
    @Autowired private OrgScope orgScope;

    private void agency(String orgId, String mode) {
        OrganizationEntity o = new OrganizationEntity();
        o.setOrgId(orgId);
        o.setOrgType(OrganizationEntity.TYPE_AGENCY);
        o.setDisplayName("Agence " + orgId);
        o.setVerified(true);
        organizations.save(o);
        if (mode != null) {
            OrganizationSettings s = new OrganizationSettings();
            s.setOrgId(orgId);
            Map<String, Object> map = new HashMap<>();
            map.put("team", Map.of("leadRouting", mode));
            s.setSettings(map);
            settings.save(s);
        }
    }

    /** Dossier déjà suivi par {@code agent}, attribué il y a {@code daysAgo} jours. */
    private void handled(String orgId, String agent, int daysAgo) {
        Dossier d =
                testDataBuilder
                        .dossierBuilder()
                        .withOrgId(orgId)
                        .withLeadName("Ancien " + agent)
                        .persist();
        orgScope.run(
                orgId,
                () -> {
                    Dossier x = dossiers.findById(d.getId()).orElseThrow();
                    x.setAssignedTo(agent);
                    x.setAssignedToName(agent.toUpperCase());
                    x.setAssignedAt(LocalDateTime.now().minusDays(daysAgo));
                    dossiers.save(x);
                });
    }

    private Dossier lead(String orgId, String publisher) {
        Annonce a =
                testDataBuilder
                        .annonceBuilder()
                        .withOrgId(orgId)
                        .withTitle("Appartement Iberia")
                        .withType(AnnonceType.SALE)
                        .withStatus(AnnonceStatus.PUBLISHED)
                        .withCity("Tanger")
                        .persist();
        orgScope.run(
                orgId,
                () -> {
                    Annonce x = annonces.findById(a.getId()).orElseThrow();
                    x.setCreatedBy(publisher);
                    annonces.save(x);
                });
        return testDataBuilder
                .dossierBuilder()
                .withOrgId(orgId)
                .withAnnonceId(a.getId())
                .withLeadName("Nouveau lead")
                .persist();
    }

    private String assignee(String orgId, Dossier d) {
        return orgScope.as(orgId, () -> dossiers.findById(d.getId()).orElseThrow().getAssignedTo());
    }

    @Test
    void roundRobin_givesTheLeadToTheAgentWaitingLongest() {
        agency("route-rr", "ROUND_ROBIN");
        handled("route-rr", "agent-a", 5);
        handled("route-rr", "agent-b", 1);
        Dossier d = lead("route-rr", "agent-b");

        assertThat(routing.route(new PortalLeadCreatedEvent(d.getId(), "route-rr")))
                .contains("agent-a");
        assertThat(assignee("route-rr", d)).isEqualTo("agent-a");
    }

    @Test
    void listingAgent_givesTheLeadToThePublisher() {
        agency("route-la", "LISTING_AGENT");
        handled("route-la", "agent-a", 5);
        handled("route-la", "agent-b", 1);
        Dossier d = lead("route-la", "agent-b");

        assertThat(routing.route(new PortalLeadCreatedEvent(d.getId(), "route-la")))
                .contains("agent-b");
    }

    @Test
    void listingAgent_fallsBackToRoundRobin_whenThePublisherLeft() {
        agency("route-lf", "LISTING_AGENT");
        handled("route-lf", "agent-a", 5);
        handled("route-lf", "agent-b", 1);
        Dossier d = lead("route-lf", "ancien-agent");

        assertThat(routing.route(new PortalLeadCreatedEvent(d.getId(), "route-lf")))
                .contains("agent-a");
    }

    @Test
    void sharedQueue_byDefault_leavesTheLeadUnassigned() {
        agency("route-sq", null);
        handled("route-sq", "agent-a", 5);
        Dossier d = lead("route-sq", "agent-a");

        assertThat(routing.route(new PortalLeadCreatedEvent(d.getId(), "route-sq"))).isEmpty();
        assertThat(assignee("route-sq", d)).isNull();
    }
}
