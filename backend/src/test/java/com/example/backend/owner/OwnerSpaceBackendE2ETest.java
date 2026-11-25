package com.example.backend.owner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.brain.BrainVisionClient;
import com.example.backend.dto.PortalLeadRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.OrganizationEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.repository.PhoneVerificationRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Cas d'usage n°1, lot A : inscription par code (PA-1), publication par un particulier avec
 * modération a priori (PA-2), lead routé vers le propriétaire et lui seul (PA-3), cloisonnement des
 * routes propriétaire et Pro (PA-4).
 */
@BackendE2ETest
class OwnerSpaceBackendE2ETest extends BaseBackendE2ETest {

    private static final String AGENCY = "agence-tanger";
    private static final byte[] JPEG = {
        (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3
    };

    @Autowired private OrganizationRepository organizations;
    @Autowired private PhoneVerificationRepository verifications;
    @Autowired private AnnonceRepository annonces;
    @Autowired private DossierRepository dossiers;
    @Autowired private BackendE2ETestDataBuilder testDataBuilder;

    @MockitoBean private OtpSender otpSender;
    @MockitoBean private OwnerDirectory ownerDirectory;
    @MockitoBean private BrainVisionClient visionClient;

    private final List<String> sentCodes = new ArrayList<>();

    @BeforeEach
    void setUp() {
        sentCodes.clear();
        when(otpSender.send(any(), any()))
                .thenAnswer(
                        inv -> {
                            sentCodes.add(inv.getArgument(1));
                            return "SMS";
                        });
        when(ownerDirectory.createOwner(any())).thenReturn("kc-owner-1");
    }

    @AfterEach
    void tearDown() {
        // @BackendE2ETest est transactionnel : les données sont annulées après chaque test.
        com.example.backend.util.TenantContext.clear();
    }

    // ---------- helpers ----------

    private ResultActions postJson(String url, Object body) throws Exception {
        return mockMvc.perform(
                post(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)));
    }

    private <T extends MockHttpServletRequestBuilder> T as(T builder, String org, String... roles) {
        builder.header(TENANT_HEADER, org).header(CORRELATION_ID_HEADER, "owner-test");
        builder.with(jwtWithRoles(org, roles));
        return builder;
    }

    private String signup(String phone) throws Exception {
        postJson("/api/v1/portal/owner/signup/start", Map.of("phone", phone))
                .andExpect(status().isAccepted());
        String code = sentCodes.get(sentCodes.size() - 1);
        postJson(
                        "/api/v1/portal/owner/signup/complete",
                        Map.of(
                                "phone",
                                phone,
                                "code",
                                code,
                                "firstName",
                                "Nadia",
                                "lastName",
                                "Idrissi",
                                "password",
                                "motdepasse-solide",
                                "acceptTerms",
                                true))
                .andExpect(status().isCreated());
        String e164 = PhoneNumbers.normalize(phone).orElseThrow();
        return organizations.findAll().stream()
                .filter(o -> e164.equals(o.getOwnerPhone()))
                .findFirst()
                .orElseThrow()
                .getOrgId();
    }

    private Long createProperty(String org, String title) throws Exception {
        MvcResult res =
                mockMvc.perform(
                                as(post("/api/v1/owner/properties"), org, "OWNER")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                objectMapper.writeValueAsString(
                                                        Map.of(
                                                                "title", title,
                                                                "transactionType", "SALE",
                                                                "propertyType", "Appartement",
                                                                "city", "Tanger",
                                                                "district", "Malabata",
                                                                "address",
                                                                        "12 rue des Oliviers, 3e étage",
                                                                "surface", 92.0,
                                                                "rooms", 3,
                                                                "expectedPrice", 1450000))))
                        .andExpect(status().isCreated())
                        .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();
    }

    private JsonNode writeListing(String org, Long propertyId) throws Exception {
        MvcResult res =
                mockMvc.perform(
                                as(
                                                put(
                                                        "/api/v1/owner/properties/"
                                                                + propertyId
                                                                + "/annonce"),
                                                org,
                                                "OWNER")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                objectMapper.writeValueAsString(
                                                        Map.of(
                                                                "title",
                                                                "Appartement lumineux vue mer à Malabata",
                                                                "description",
                                                                "Trois pièces de 92 m² au troisième étage, vue sur la baie,"
                                                                        + " cuisine équipée, parking en sous-sol, proche des écoles.",
                                                                "price",
                                                                1450000))))
                        .andExpect(status().isOk())
                        .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString());
    }

    private void addPhotos(String org, Long propertyId, int count) throws Exception {
        var builder = multipart("/api/v1/owner/properties/" + propertyId + "/annonce/photos");
        for (int i = 0; i < count; i++) {
            builder.file(new MockMultipartFile("files", "photo" + i + ".jpg", "image/jpeg", JPEG));
        }
        builder.header(TENANT_HEADER, org).header(CORRELATION_ID_HEADER, "owner-test");
        builder.with(jwtWithRoles(org, "OWNER"));
        mockMvc.perform(builder).andExpect(status().isOk());
    }

    private JsonNode publish(String org, Long propertyId) throws Exception {
        MvcResult res =
                mockMvc.perform(
                                as(
                                        post(
                                                "/api/v1/owner/properties/"
                                                        + propertyId
                                                        + "/annonce/publish"),
                                        org,
                                        "OWNER"))
                        .andExpect(status().isOk())
                        .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString());
    }

    private Long readyListing(String org, String title) throws Exception {
        Long propertyId = createProperty(org, title);
        writeListing(org, propertyId);
        addPhotos(org, propertyId, 3);
        return propertyId;
    }

    // ---------- PA-1 ----------

    @Test
    void ownerSignsUpWithAPhoneCode_onceperNumber() throws Exception {
        postJson("/api/v1/portal/owner/signup/start", Map.of("phone", "06 61 22 33 44"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.channel").value("SMS"));
        assertThat(sentCodes).hasSize(1);

        Map<String, Object> wrong =
                Map.of(
                        "phone", "0661223344",
                        "code", "000000".equals(sentCodes.get(0)) ? "111111" : "000000",
                        "firstName", "Nadia",
                        "lastName", "Idrissi",
                        "password", "motdepasse-solide",
                        "acceptTerms", true);
        postJson("/api/v1/portal/owner/signup/complete", wrong).andExpect(status().isBadRequest());

        Map<String, Object> ok = new java.util.HashMap<>(wrong);
        ok.put("code", sentCodes.get(0));
        postJson("/api/v1/portal/owner/signup/complete", ok)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("212661223344"))
                .andExpect(jsonPath("$.orgId").doesNotExist());

        OrganizationEntity org =
                organizations.findAll().stream()
                        .filter(OrganizationEntity::isOwner)
                        .findFirst()
                        .orElseThrow();
        assertThat(org.getOwnerPhone()).isEqualTo("+212661223344");
        assertThat(org.getOrgId()).startsWith("OWN-");
        assertThat(org.getTermsAcceptedAt()).isNotNull();
        // Le code n'est pas stocké en clair.
        assertThat(verifications.findAll())
                .allSatisfy(v -> assertThat(v.getCodeHash()).doesNotContain(sentCodes.get(0)));

        postJson("/api/v1/portal/owner/signup/start", Map.of("phone", "+212661223344"))
                .andExpect(status().isConflict());
    }

    @Test
    void signupRequiresTermsAndAValidPhone() throws Exception {
        postJson("/api/v1/portal/owner/signup/start", Map.of("phone", "12"))
                .andExpect(status().isBadRequest());
        postJson("/api/v1/portal/owner/signup/start", Map.of("phone", "0612345678"))
                .andExpect(status().isAccepted());
        postJson(
                        "/api/v1/portal/owner/signup/complete",
                        Map.of(
                                "phone", "0612345678",
                                "code", sentCodes.get(0),
                                "firstName", "A",
                                "lastName", "B",
                                "password", "motdepasse-solide",
                                "acceptTerms", false))
                .andExpect(status().isBadRequest());
    }

    // ---------- PA-2 ----------

    @Test
    void firstListingWaitsForModerationThenAppearsAsPrivateSeller() throws Exception {
        String org = signup("0661223344");
        Long propertyId = readyListing(org, "Appartement Malabata");

        JsonNode pending = publish(org, propertyId);
        assertThat(pending.get("status").asText()).isEqualTo("DRAFT");
        assertThat(pending.get("moderationStatus").asText()).isEqualTo("MOD_PENDING");
        Long annonceId = pending.get("id").asLong();
        mockMvc.perform(get("/api/v1/portal/annonces/" + annonceId))
                .andExpect(status().isNotFound());

        // La plateforme voit l'annonce en attente, toutes organisations confondues.
        mockMvc.perform(
                        as(
                                get("/api/v1/admin/moderation/owner-annonces"),
                                "ORG-001",
                                "SUPER_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(annonceId))
                .andExpect(jsonPath("$[0].photoCount").value(3));
        // Une agence n'y a pas accès.
        mockMvc.perform(as(get("/api/v1/admin/moderation/owner-annonces"), AGENCY, "ADMIN"))
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        as(
                                post(
                                        "/api/v1/admin/moderation/owner-annonces/"
                                                + annonceId
                                                + "/approve"),
                                "ORG-001",
                                "SUPER_ADMIN"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/portal/annonces/" + annonceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publisherKind").value("OWNER"))
                .andExpect(jsonPath("$.address").value("Malabata"))
                .andExpect(jsonPath("$.photos.length()").value(3));
        String body =
                mockMvc.perform(get("/api/v1/portal/annonces/" + annonceId))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        assertThat(body)
                .doesNotContain("rue des Oliviers")
                .doesNotContain(org)
                .doesNotContain("+212661223344");
        String photoUrl = objectMapper.readTree(body).get("photos").get(0).asText();
        mockMvc.perform(get(photoUrl)).andExpect(status().isOk());

        // Propriétaire de confiance : la deuxième annonce part sans modération.
        Long second = readyListing(org, "Studio centre-ville");
        JsonNode published = publish(org, second);
        assertThat(published.get("status").asText()).isEqualTo("PUBLISHED");
    }

    @Test
    void incompleteListingCannotBeSubmitted_andRejectionNeedsANote() throws Exception {
        String org = signup("0661223344");
        Long propertyId = createProperty(org, "Villa Achakar");
        writeListing(org, propertyId);
        addPhotos(org, propertyId, 1);
        mockMvc.perform(
                        as(
                                post("/api/v1/owner/properties/" + propertyId + "/annonce/publish"),
                                org,
                                "OWNER"))
                .andExpect(status().isBadRequest());

        addPhotos(org, propertyId, 2);
        Long annonceId = publish(org, propertyId).get("id").asLong();
        mockMvc.perform(
                        as(
                                        post(
                                                "/api/v1/admin/moderation/owner-annonces/"
                                                        + annonceId
                                                        + "/reject"),
                                        "ORG-001",
                                        "SUPER_ADMIN")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        as(
                                        post(
                                                "/api/v1/admin/moderation/owner-annonces/"
                                                        + annonceId
                                                        + "/reject"),
                                        "ORG-001",
                                        "SUPER_ADMIN")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"note\":\"Photos floues\"}"))
                .andExpect(status().isNoContent());
        Annonce a = annonces.findById(annonceId).orElseThrow();
        assertThat(a.getModerationStatus()).isEqualTo("MOD_REJECTED");
        assertThat(AnnonceStatus.normalize(a.getStatus())).isEqualTo(AnnonceStatus.DRAFT);
    }

    // ---------- PA-3 ----------

    @Test
    void leadOnAnOwnerListingReachesThatOwnerOnly() throws Exception {
        String org = signup("0661223344");
        testDataBuilder
                .annonceBuilder()
                .withOrgId(AGENCY)
                .withType(AnnonceType.SALE)
                .withStatus(AnnonceStatus.PUBLISHED)
                .withCity("Tanger")
                .persist();
        Long propertyId = readyListing(org, "Appartement Malabata");
        Long annonceId = publish(org, propertyId).get("id").asLong();
        mockMvc.perform(
                        as(
                                post(
                                        "/api/v1/admin/moderation/owner-annonces/"
                                                + annonceId
                                                + "/approve"),
                                "ORG-001",
                                "SUPER_ADMIN"))
                .andExpect(status().isNoContent());

        PortalLeadRequest lead = new PortalLeadRequest();
        lead.setAnnonceId(annonceId);
        lead.setRequestType("VISIT");
        lead.setName("Yasmine B.");
        lead.setPhone("+212611223344");
        lead.setMessage("Disponible samedi.");
        lead.setConsent(true);
        postJson("/api/v1/portal/leads", lead).andExpect(status().isCreated());

        List<Dossier> created =
                dossiers.findAll().stream()
                        .filter(d -> "+212611223344".equals(d.getLeadPhone()))
                        .toList();
        assertThat(created).hasSize(1);
        assertThat(created.get(0).getOrgId()).isEqualTo(org);

        MvcResult res =
                mockMvc.perform(as(get("/api/v1/owner/leads"), org, "OWNER"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].name").value("Yasmine B."))
                        .andExpect(jsonPath("$[0].statusLabel").value("Nouveau"))
                        .andReturn();
        Long leadId =
                objectMapper
                        .readTree(res.getResponse().getContentAsString())
                        .get(0)
                        .get("id")
                        .asLong();

        mockMvc.perform(
                        as(put("/api/v1/owner/leads/" + leadId + "/status"), org, "OWNER")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"statusCode\":\"CRM_QUALIFYING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusLabel").value("En contact"));

        // L'agence ne voit pas ce lead.
        mockMvc.perform(as(get("/api/v1/dossiers/" + leadId), AGENCY, "PRO"))
                .andExpect(status().isNotFound());
    }

    // ---------- PA-4 ----------

    @Test
    void ownerAndProRoutesAreSealedFromEachOther() throws Exception {
        String org = signup("0661223344");
        Long propertyId = createProperty(org, "Appartement Malabata");

        mockMvc.perform(as(get("/api/v1/annonces"), org, "OWNER"))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(get("/api/v1/dossiers"), org, "OWNER"))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(get("/api/v1/owner/properties"), AGENCY, "PRO"))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(get("/api/v1/owner/properties"), AGENCY, "ADMIN"))
                .andExpect(status().isForbidden());

        // Un jeton OWNER dont l'organisation n'est pas une organisation propriétaire est refusé.
        mockMvc.perform(as(get("/api/v1/owner/properties"), AGENCY, "OWNER"))
                .andExpect(status().isForbidden());

        // Un autre propriétaire ne voit pas ce bien.
        String other = signup("0677889900");
        mockMvc.perform(as(get("/api/v1/owner/properties/" + propertyId), other, "OWNER"))
                .andExpect(status().isNotFound());
        mockMvc.perform(as(get("/api/v1/owner/properties"), other, "OWNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
