package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.entity.enums.ConsentementType;
import com.example.backend.repository.ConsentementRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.service.PublicLeadService;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/**
 * Étape 3 du backlog : un lead public est enregistré dans l'agence de l'annonce consultée (deux
 * agences), la case de consentement est obligatoire, et la vitrine alimente l'organisation de la
 * plateforme. Appels anonymes, sans en-tête X-Org-Id, comme un visiteur du portail.
 */
@BackendE2ETest
class PortalLeadMultiAgencyBackendE2ETest extends BaseBackendE2ETest {

    private static final String AGENCY_A = "agence-tanger";
    private static final String AGENCY_B = "agence-casa";
    private static final String PLATFORM_ORG = "ORG-001";

    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private DossierRepository dossierRepository;
    @Autowired private ConsentementRepository consentementRepository;

    private Annonce annonce(String orgId, AnnonceType type, AnnonceStatus status) {
        return testDataBuilder
                .annonceBuilder()
                .withOrgId(orgId)
                .withType(type)
                .withStatus(status)
                .withCity("Tanger")
                .persist();
    }

    private PortalLeadRequest lead(Long annonceId, String type, Boolean consent) {
        PortalLeadRequest r = new PortalLeadRequest();
        r.setAnnonceId(annonceId);
        r.setRequestType(type);
        r.setName("Yasmine B.");
        r.setPhone("+212611223344");
        r.setEmail("yasmine@example.ma");
        r.setMessage("Disponible samedi.");
        r.setConsent(consent);
        return r;
    }

    private org.springframework.test.web.servlet.ResultActions submit(PortalLeadRequest r)
            throws Exception {
        return mockMvc.perform(
                post("/api/v1/portal/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(r)));
    }

    private List<Dossier> dossiersForPhone(String phone) {
        return dossierRepository.findAll().stream()
                .filter(d -> phone.equals(d.getLeadPhone()))
                .toList();
    }

    @Test
    void leadGoesToTheAgencyThatOwnsTheAnnonce() throws Exception {
        annonce(AGENCY_A, AnnonceType.SALE, AnnonceStatus.PUBLISHED);
        Annonce rentB = annonce(AGENCY_B, AnnonceType.RENT, AnnonceStatus.PUBLISHED);

        submit(lead(rentB.getId(), "VISIT", true))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RECEIVED"))
                // Le visiteur ne reçoit ni identifiant ni agence.
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.orgId").doesNotExist());

        List<Dossier> created = dossiersForPhone("+212611223344");
        assertThat(created).hasSize(1);
        Dossier d = created.get(0);
        assertThat(d.getOrgId()).isEqualTo(AGENCY_B);
        assertThat(d.getAnnonceId()).isEqualTo(rentB.getId());
        assertThat(d.getCaseType()).isEqualTo("CRM_LEAD_RENT");
        assertThat(d.getLeadSource()).isEqualTo("PORTAIL");
        assertThat(d.getLeadEmail()).isEqualTo("yasmine@example.ma");
        assertThat(d.getNotes()).contains("Demande de visite").contains("Disponible samedi.");
    }

    @Test
    void saleAnnonceCreatesABuyLeadInItsOwnAgency() throws Exception {
        Annonce saleA = annonce(AGENCY_A, AnnonceType.SALE, AnnonceStatus.PUBLISHED);

        submit(lead(saleA.getId(), "INFO", true)).andExpect(status().isCreated());

        Dossier d = dossiersForPhone("+212611223344").get(0);
        assertThat(d.getOrgId()).isEqualTo(AGENCY_A);
        assertThat(d.getCaseType()).isEqualTo("CRM_LEAD_BUY");
    }

    @Test
    void contactConsentIsRecordedAsTransactionalWithProof() throws Exception {
        Annonce a = annonce(AGENCY_A, AnnonceType.SALE, AnnonceStatus.PUBLISHED);

        mockMvc.perform(
                        post("/api/v1/portal/leads")
                                .header("CF-Connecting-IP", "196.200.1.2")
                                .header("User-Agent", "JUnit")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                lead(a.getId(), "VISIT", true))))
                .andExpect(status().isCreated());

        Dossier d = dossiersForPhone("+212611223344").get(0);
        List<ConsentementEntity> consents = consentementRepository.findByDossierId(d.getId());
        assertThat(consents)
                .extracting(ConsentementEntity::getChannel)
                .containsExactlyInAnyOrder(
                        ConsentementChannel.PHONE,
                        ConsentementChannel.WHATSAPP,
                        ConsentementChannel.EMAIL);
        assertThat(consents)
                .allMatch(c -> c.getConsentType() == ConsentementType.TRANSACTIONNEL)
                .allMatch(c -> c.getStatus() == ConsentementStatus.GRANTED)
                .allMatch(c -> AGENCY_A.equals(c.getOrgId()))
                .allMatch(c -> "196.200.1.2".equals(c.getMeta().get("ipAddress")))
                .allMatch(
                        c ->
                                PublicLeadService.CONSENT_TEXT_VERSION.equals(
                                        c.getMeta().get("consentTextVersion")));
    }

    @Test
    void leadWithoutConsentIsRejected() throws Exception {
        Annonce a = annonce(AGENCY_A, AnnonceType.SALE, AnnonceStatus.PUBLISHED);

        submit(lead(a.getId(), "VISIT", false))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("CONSENT_REQUIRED")));
        submit(lead(a.getId(), "VISIT", null)).andExpect(status().isBadRequest());

        assertThat(dossiersForPhone("+212611223344")).isEmpty();
    }

    @Test
    void leadWithoutAnyContactIsRejected() throws Exception {
        Annonce a = annonce(AGENCY_A, AnnonceType.SALE, AnnonceStatus.PUBLISHED);
        PortalLeadRequest r = lead(a.getId(), "INFO", true);
        r.setPhone(" ");
        r.setEmail(null);

        submit(r)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("CONTACT_REQUIRED")));
    }

    @Test
    void leadOnNonPublicAnnonceIsNotFound() throws Exception {
        Annonce draft = annonce(AGENCY_B, AnnonceType.RENT, AnnonceStatus.DRAFT);

        submit(lead(draft.getId(), "VISIT", true)).andExpect(status().isNotFound());
        submit(lead(999_999L, "VISIT", true)).andExpect(status().isNotFound());

        assertThat(dossiersForPhone("+212611223344")).isEmpty();
    }

    @Test
    void vitrineDemoGoesToThePlatformOrganisation() throws Exception {
        submit(lead(null, "DEMO", true)).andExpect(status().isCreated());

        Dossier d = dossiersForPhone("+212611223344").get(0);
        assertThat(d.getOrgId()).isEqualTo(PLATFORM_ORG);
        assertThat(d.getCaseType()).isEqualTo("CRM_LEAD_B2B_DEMO");
        assertThat(d.getLeadSource()).isEqualTo("VITRINE");
        assertThat(d.getAnnonceId()).isNull();
    }

    @Test
    void publicDetailServesPublishedAnnoncesFromAnyAgencyWithoutHeaders() throws Exception {
        Annonce published = annonce(AGENCY_B, AnnonceType.SALE, AnnonceStatus.PUBLISHED);
        Annonce draft = annonce(AGENCY_B, AnnonceType.SALE, AnnonceStatus.DRAFT);

        mockMvc.perform(get("/api/v1/portal/annonces/{id}", published.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(published.getId()))
                .andExpect(jsonPath("$.title").exists())
                // Rien d'interne ne sort sur le portail public.
                .andExpect(jsonPath("$.orgId").doesNotExist())
                .andExpect(jsonPath("$.fraudScore").doesNotExist())
                .andExpect(jsonPath("$.duplicateOfId").doesNotExist())
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.rulesJson").doesNotExist());

        mockMvc.perform(get("/api/v1/portal/annonces"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").exists())
                .andExpect(jsonPath("$.content[0].orgId").doesNotExist())
                .andExpect(jsonPath("$.content[0].fraudScore").doesNotExist());
        mockMvc.perform(get("/api/v1/portal/annonces/{id}", draft.getId()))
                .andExpect(status().isNotFound());
    }
}
