package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.PartiePrenanteRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.PartiePrenanteRole;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
@WithMockUser(roles = {"PRO", "ADMIN"})
@ActiveProfiles("backend-e2e-h2")
public class ApiVersioningIntegrationTest extends BaseBackendE2ETest {

    private static final String ORG_ID = "test-org-versioning";

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private BackendE2ETestDataBuilder testDataBuilder;

    @BeforeEach
    void setUp() {
        annonceRepository.deleteAll();
        dossierRepository.deleteAll();
        testDataBuilder.deleteAllTestData();
    }

    @AfterEach
    void tearDown() {
        com.example.backend.util.TenantContext.clear();
        testDataBuilder.deleteAllTestData();
    }

    @Test
    void testV1DossiersEndpointStillWorksWithFlatStructure() throws Exception {
        Annonce annonce = testDataBuilder.annonceBuilder()
                .withTitle("Test Property")
                .withType(AnnonceType.SALE)
                .withPrice(new BigDecimal("350000"))
                .withCity("Paris")
                .withStatus(AnnonceStatus.PUBLISHED)
                .persist();

        DossierCreateRequest request = new DossierCreateRequest();
        request.setAnnonceId(annonce.getId());
        request.setLeadPhone("+33612345678");
        request.setLeadName("John Doe");
        request.setLeadSource("Website");
        request.setSource(DossierSource.WEB);

        PartiePrenanteRequest party = new PartiePrenanteRequest();
        party.setRole(PartiePrenanteRole.BUYER);
        party.setName("John Doe");
        party.setPhone("+33612345678");
        request.setInitialParty(party);

        mockMvc.perform(withTenantHeaders(post("/api/v1/dossiers")
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.annonceId", is(annonce.getId().intValue())))
                .andExpect(jsonPath("$.annonceTitle", is("Test Property")))
                .andExpect(jsonPath("$.leadPhone", is("+33612345678")))
                .andExpect(jsonPath("$.leadName", is("John Doe")))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andExpect(header().exists("Deprecation"))
                .andExpect(header().string("Deprecation", "true"))
                .andExpect(header().exists("Sunset"))
                .andExpect(header().exists("X-API-Warn"));
    }

    @Test
    void testV2DossiersEndpointReturnsNestedStructure() throws Exception {
        Annonce annonce = testDataBuilder.annonceBuilder()
                .withTitle("Modern Apartment")
                .withType(AnnonceType.SALE)
                .withPrice(new BigDecimal("450000"))
                .withCity("Lyon")
                .withStatus(AnnonceStatus.PUBLISHED)
                .persist();

        DossierCreateRequest request = new DossierCreateRequest();
        request.setAnnonceId(annonce.getId());
        request.setLeadPhone("+33698765432");
        request.setLeadName("Jane Smith");
        request.setLeadSource("Phone");
        request.setSource(DossierSource.PHONE);

        PartiePrenanteRequest party = new PartiePrenanteRequest();
        party.setRole(PartiePrenanteRole.BUYER);
        party.setName("Jane Smith");
        party.setPhone("+33698765432");
        request.setInitialParty(party);

        mockMvc.perform(withTenantHeaders(post("/api/v2/dossiers")
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.annonce", notNullValue()))
                .andExpect(jsonPath("$.annonce.id", is(annonce.getId().intValue())))
                .andExpect(jsonPath("$.annonce.title", is("Modern Apartment")))
                .andExpect(jsonPath("$.annonce.city", is("Lyon")))
                .andExpect(jsonPath("$.lead", notNullValue()))
                .andExpect(jsonPath("$.lead.phone", is("+33698765432")))
                .andExpect(jsonPath("$.lead.name", is("Jane Smith")))
                .andExpect(jsonPath("$.lead.source", is("Phone")))
                .andExpect(jsonPath("$.audit", notNullValue()))
                .andExpect(jsonPath("$.audit.createdAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z")))
                .andExpect(jsonPath("$.audit.createdBy", notNullValue()))
                .andExpect(header().doesNotExist("Deprecation"));
    }

    @Test
    void testV1AnnoncesEndpointStillWorksWithFlatStructure() throws Exception {
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("Luxury Villa");
        request.setDescription("A beautiful villa with pool");
        request.setCategory("Villa");
        request.setType(AnnonceType.SALE);
        request.setAddress("456 Beach Road");
        request.setSurface(200.0);
        request.setCity("Nice");
        request.setPrice(new BigDecimal("1200000"));
        request.setCurrency("EUR");
        request.setStatus(AnnonceStatus.PUBLISHED);

        mockMvc.perform(withTenantHeaders(post("/api/v1/annonces")
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Luxury Villa")))
                .andExpect(jsonPath("$.address", is("456 Beach Road")))
                .andExpect(jsonPath("$.city", is("Nice")))
                .andExpect(jsonPath("$.price", is(1200000)))
                .andExpect(jsonPath("$.currency", is("EUR")))
                .andExpect(jsonPath("$.surface", is(200.0)))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andExpect(header().exists("Deprecation"))
                .andExpect(header().string("Deprecation", "true"));
    }

    @Test
    void testV2AnnoncesEndpointReturnsNestedStructure() throws Exception {
        AnnonceCreateRequest request = new AnnonceCreateRequest();
        request.setTitle("City Center Apartment");
        request.setDescription("Modern apartment in city center");
        request.setCategory("Apartment");
        request.setType(AnnonceType.RENT);
        request.setAddress("789 Central Ave");
        request.setSurface(75.0);
        request.setCity("Marseille");
        request.setPrice(new BigDecimal("1500"));
        request.setCurrency("EUR");
        request.setStatus(AnnonceStatus.PUBLISHED);

        mockMvc.perform(withTenantHeaders(post("/api/v2/annonces")
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("City Center Apartment")))
                .andExpect(jsonPath("$.location", notNullValue()))
                .andExpect(jsonPath("$.location.address", is("789 Central Ave")))
                .andExpect(jsonPath("$.location.city", is("Marseille")))
                .andExpect(jsonPath("$.details", notNullValue()))
                .andExpect(jsonPath("$.details.surface", is(75.0)))
                .andExpect(jsonPath("$.pricing", notNullValue()))
                .andExpect(jsonPath("$.pricing.amount", is(1500)))
                .andExpect(jsonPath("$.pricing.currency", is("EUR")))
                .andExpect(jsonPath("$.pricing.pricePerSqm", is(20.0)))
                .andExpect(jsonPath("$.audit", notNullValue()))
                .andExpect(jsonPath("$.audit.createdAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z")))
                .andExpect(header().doesNotExist("Deprecation"));
    }

    @Test
    void testV1AndV2BothReturnDataForSameResource() throws Exception {
        Dossier dossier = testDataBuilder.dossierBuilder()
                .withLeadName("Test User")
                .withLeadPhone("+33611223344")
                .withInitialParty(PartiePrenanteRole.BUYER)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/dossiers/" + dossier.getId())
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(dossier.getId().intValue())))
                .andExpect(jsonPath("$.leadName", is("Test User")))
                .andExpect(header().exists("Deprecation"));

        mockMvc.perform(withTenantHeaders(get("/api/v2/dossiers/" + dossier.getId())
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(dossier.getId().intValue())))
                .andExpect(jsonPath("$.lead.name", is("Test User")))
                .andExpect(header().doesNotExist("Deprecation"));
    }

    @Test
    void testV2TimestampsAreISO8601WithTimezone() throws Exception {
        Annonce annonce = testDataBuilder.annonceBuilder()
                .withTitle("Timestamp Test")
                .withType(AnnonceType.SALE)
                .withPrice(new BigDecimal("300000"))
                .withCity("Toulouse")
                .withStatus(AnnonceStatus.PUBLISHED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v2/annonces/" + annonce.getId())
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.audit.createdAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z")))
                .andExpect(jsonPath("$.audit.updatedAt", matchesPattern("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z")));
    }

    @Test
    void testDeprecationHeadersOnlyPresentInV1() throws Exception {
        Annonce annonce = testDataBuilder.annonceBuilder()
                .withTitle("Header Test")
                .withType(AnnonceType.SALE)
                .withPrice(new BigDecimal("250000"))
                .withCity("Bordeaux")
                .withStatus(AnnonceStatus.PUBLISHED)
                .persist();

        mockMvc.perform(withTenantHeaders(get("/api/v1/annonces/" + annonce.getId())
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID))
                .andExpect(status().isOk())
                .andExpect(header().exists("Deprecation"))
                .andExpect(header().string("Deprecation", "true"))
                .andExpect(header().exists("Sunset"))
                .andExpect(header().string("Sunset", "2025-12-31"))
                .andExpect(header().exists("X-API-Warn"))
                .andExpect(header().exists("Link"));

        mockMvc.perform(withTenantHeaders(get("/api/v2/annonces/" + annonce.getId())
                        .with(jwtWithRoles(ORG_ID, "PRO", "ADMIN")), ORG_ID))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Deprecation"))
                .andExpect(header().doesNotExist("Sunset"))
                .andExpect(header().doesNotExist("X-API-Warn"));
    }
}
