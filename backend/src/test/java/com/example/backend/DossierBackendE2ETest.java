package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.dto.PartiePrenanteRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.DossierStatusHistory;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.PartiePrenanteRole;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.DossierStatusHistoryRepository;
import com.example.backend.repository.PartiePrenanteRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
@WithMockUser(roles = {"PRO", "ADMIN"})
public class DossierBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG_ID = "test-org-e2e";
    private static final String BASE_URL = "/api/v1/dossiers";

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private DossierStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private PartiePrenanteRepository partiePrenanteRepository;

    @BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        dossierRepository.deleteAll();
        statusHistoryRepository.deleteAll();
        partiePrenanteRepository.deleteAll();
        annonceRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Clear tenant context to prevent tenant ID leakage between tests
        com.example.backend.util.TenantContext.clear();
    }

    @Test
    void testCreateDossierWithInitialParty_Success() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadPhone("+33612345678");
        request.setLeadName("John Doe");
        request.setLeadSource("Website");
        request.setNotes("Test notes");

        PartiePrenanteRequest partyRequest = new PartiePrenanteRequest();
        partyRequest.setRole(PartiePrenanteRole.BUYER);
        partyRequest.setFirstName("John");
        partyRequest.setLastName("Doe");
        partyRequest.setPhone("+33612345678");
        partyRequest.setEmail("john.doe@example.com");
        request.setInitialParty(partyRequest);

        mockMvc.perform(post(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.leadPhone").value("+33612345678"))
                .andExpect(jsonPath("$.leadName").value("John Doe"))
                .andExpect(jsonPath("$.leadSource").value("Website"))
                .andExpect(jsonPath("$.notes").value("Test notes"))
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.parties", hasSize(1)))
                .andExpect(jsonPath("$.parties[0].role").value("BUYER"))
                .andExpect(jsonPath("$.parties[0].firstName").value("John"))
                .andExpect(jsonPath("$.parties[0].lastName").value("Doe"))
                .andExpect(jsonPath("$.parties[0].phone").value("+33612345678"))
                .andExpect(jsonPath("$.parties[0].email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.existingOpenDossierId").doesNotExist())
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(1);
        assertThat(dossiers.get(0).getOrgId()).isEqualTo(ORG_ID);
        assertThat(dossiers.get(0).getStatus()).isEqualTo(DossierStatus.NEW);

        List<PartiePrenanteEntity> parties = partiePrenanteRepository.findByDossierId(dossiers.get(0).getId());
        assertThat(parties).hasSize(1);
        assertThat(parties.get(0).getRole()).isEqualTo(PartiePrenanteRole.BUYER);

        List<DossierStatusHistory> history = statusHistoryRepository.findAll();
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getFromStatus()).isEqualTo(DossierStatus.DRAFT);
        assertThat(history.get(0).getToStatus()).isEqualTo(DossierStatus.NEW);
        assertThat(history.get(0).getReason()).isEqualTo("Initial dossier creation");
    }

    @Test
    void testCreateDossierWithInitialParty_DetectsDuplicate() throws Exception {
        Dossier existingDossier = new Dossier();
        existingDossier.setOrgId(ORG_ID);
        existingDossier.setLeadPhone("+33612345678");
        existingDossier.setLeadName("Jane Doe");
        existingDossier.setStatus(DossierStatus.NEW);
        existingDossier = dossierRepository.save(existingDossier);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setLeadPhone("+33699999999");
        request.setLeadName("John Doe");

        PartiePrenanteRequest partyRequest = new PartiePrenanteRequest();
        partyRequest.setRole(PartiePrenanteRole.BUYER);
        partyRequest.setPhone("+33612345678");
        request.setInitialParty(partyRequest);

        String responseJson = mockMvc.perform(post(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.existingOpenDossierId").value(existingDossier.getId()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        DossierResponse response = objectMapper.readValue(responseJson, DossierResponse.class);
        assertThat(response.getExistingOpenDossierId()).isEqualTo(existingDossier.getId());

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).hasSize(2);
    }

    @Test
    void testCreateDossierWithArchivedAnnonce_Returns400() throws Exception {
        Annonce archivedAnnonce = new Annonce();
        archivedAnnonce.setOrgId(ORG_ID);
        archivedAnnonce.setTitle("Archived Property");
        archivedAnnonce.setStatus(AnnonceStatus.ARCHIVED);
        archivedAnnonce.setType(AnnonceType.SALE);
        archivedAnnonce.setPrice(BigDecimal.valueOf(100000));
        archivedAnnonce.setCurrency("EUR");
        archivedAnnonce = annonceRepository.save(archivedAnnonce);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setAnnonceId(archivedAnnonce.getId());
        request.setLeadPhone("+33612345678");
        request.setLeadName("John Doe");

        mockMvc.perform(post(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Cannot create dossier with ARCHIVED annonce"));

        List<Dossier> dossiers = dossierRepository.findAll();
        assertThat(dossiers).isEmpty();
    }

    @Test
    void testPatchStatusWithValidTransitions_Success() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.QUALIFYING);
        request.setUserId("user-123");
        request.setReason("Starting qualification process");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dossier.getId()))
                .andExpect(jsonPath("$.status").value("QUALIFYING"));

        Dossier updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.QUALIFYING);

        List<DossierStatusHistory> history = statusHistoryRepository.findAll();
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getFromStatus()).isEqualTo(DossierStatus.NEW);
        assertThat(history.get(0).getToStatus()).isEqualTo(DossierStatus.QUALIFYING);
        assertThat(history.get(0).getUserId()).isEqualTo("user-123");
        assertThat(history.get(0).getReason()).isEqualTo("Starting qualification process");

        statusHistoryRepository.deleteAll();
        request.setStatus(DossierStatus.QUALIFIED);
        request.setReason("Client is qualified");
        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUALIFIED"));

        updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.QUALIFIED);

        history = statusHistoryRepository.findAll();
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getFromStatus()).isEqualTo(DossierStatus.QUALIFYING);
        assertThat(history.get(0).getToStatus()).isEqualTo(DossierStatus.QUALIFIED);

        statusHistoryRepository.deleteAll();
        request.setStatus(DossierStatus.APPOINTMENT);
        request.setReason("Appointment scheduled");
        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPOINTMENT"));

        updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.APPOINTMENT);

        history = statusHistoryRepository.findAll();
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getFromStatus()).isEqualTo(DossierStatus.QUALIFIED);
        assertThat(history.get(0).getToStatus()).isEqualTo(DossierStatus.APPOINTMENT);

        statusHistoryRepository.deleteAll();
        request.setStatus(DossierStatus.WON);
        request.setReason("Deal closed successfully");
        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WON"));

        updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.WON);

        history = statusHistoryRepository.findAll();
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getFromStatus()).isEqualTo(DossierStatus.APPOINTMENT);
        assertThat(history.get(0).getToStatus()).isEqualTo(DossierStatus.WON);
    }

    @Test
    void testPatchStatus_TerminalStatePreventsTransition() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.WON);
        dossier = dossierRepository.save(dossier);

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.QUALIFYING);
        request.setUserId("user-123");
        request.setReason("Trying to change won status");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Invalid status transition from WON to QUALIFYING"));

        Dossier unchanged = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(unchanged.getStatus()).isEqualTo(DossierStatus.WON);
    }

    @Test
    void testPatchStatus_LostTerminalState() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.LOST);
        dossier = dossierRepository.save(dossier);

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.NEW);
        request.setUserId("user-123");
        request.setReason("Trying to reopen lost dossier");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Invalid status transition from LOST to NEW"));

        Dossier unchanged = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(unchanged.getStatus()).isEqualTo(DossierStatus.LOST);
    }

    @Test
    void testPatchStatus_InvalidTransition() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.WON);
        request.setUserId("user-123");
        request.setReason("Skipping intermediate steps");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Invalid status transition from NEW to WON"));

        Dossier unchanged = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(unchanged.getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void testGetDossiersWithPhoneFilter() throws Exception {
        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID);
        dossier1.setLeadPhone("+33612345678");
        dossier1.setLeadName("John Doe");
        dossier1.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_ID);
        dossier2.setLeadPhone("+33699999999");
        dossier2.setLeadName("Jane Smith");
        dossier2.setStatus(DossierStatus.QUALIFYING);
        dossierRepository.save(dossier2);

        mockMvc.perform(get(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .param("leadPhone", "+33612345678")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].leadPhone").value("+33612345678"))
                .andExpect(jsonPath("$.content[0].leadName").value("John Doe"));
    }

    @Test
    void testGetDossiersWithStatusFilter() throws Exception {
        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID);
        dossier1.setLeadPhone("+33612345678");
        dossier1.setLeadName("John Doe");
        dossier1.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_ID);
        dossier2.setLeadPhone("+33699999999");
        dossier2.setLeadName("Jane Smith");
        dossier2.setStatus(DossierStatus.QUALIFYING);
        dossierRepository.save(dossier2);

        Dossier dossier3 = new Dossier();
        dossier3.setOrgId(ORG_ID);
        dossier3.setLeadPhone("+33611111111");
        dossier3.setLeadName("Bob Johnson");
        dossier3.setStatus(DossierStatus.QUALIFYING);
        dossierRepository.save(dossier3);

        mockMvc.perform(get(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .param("status", "QUALIFYING")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].status").value("QUALIFYING"))
                .andExpect(jsonPath("$.content[1].status").value("QUALIFYING"));
    }

    @Test
    void testGetDossiersWithAnnonceIdFilter() throws Exception {
        Annonce annonce1 = new Annonce();
        annonce1.setOrgId(ORG_ID);
        annonce1.setTitle("Property 1");
        annonce1.setStatus(AnnonceStatus.PUBLISHED);
        annonce1.setType(AnnonceType.SALE);
        annonce1.setPrice(BigDecimal.valueOf(100000));
        annonce1.setCurrency("EUR");
        annonce1 = annonceRepository.save(annonce1);

        Annonce annonce2 = new Annonce();
        annonce2.setOrgId(ORG_ID);
        annonce2.setTitle("Property 2");
        annonce2.setStatus(AnnonceStatus.PUBLISHED);
        annonce2.setType(AnnonceType.RENTAL);
        annonce2.setPrice(BigDecimal.valueOf(1000));
        annonce2.setCurrency("EUR");
        annonce2 = annonceRepository.save(annonce2);

        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID);
        dossier1.setAnnonceId(annonce1.getId());
        dossier1.setLeadPhone("+33612345678");
        dossier1.setLeadName("John Doe");
        dossier1.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_ID);
        dossier2.setAnnonceId(annonce2.getId());
        dossier2.setLeadPhone("+33699999999");
        dossier2.setLeadName("Jane Smith");
        dossier2.setStatus(DossierStatus.QUALIFYING);
        dossierRepository.save(dossier2);

        Dossier dossier3 = new Dossier();
        dossier3.setOrgId(ORG_ID);
        dossier3.setAnnonceId(annonce1.getId());
        dossier3.setLeadPhone("+33611111111");
        dossier3.setLeadName("Bob Johnson");
        dossier3.setStatus(DossierStatus.QUALIFIED);
        dossierRepository.save(dossier3);

        mockMvc.perform(get(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .param("annonceId", annonce1.getId().toString())
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].annonceId").value(annonce1.getId()))
                .andExpect(jsonPath("$.content[1].annonceId").value(annonce1.getId()));
    }

    @Test
    void testGetDossiersWithPagination() throws Exception {
        for (int i = 0; i < 25; i++) {
            Dossier dossier = new Dossier();
            dossier.setOrgId(ORG_ID);
            dossier.setLeadPhone("+3361234567" + i);
            dossier.setLeadName("User " + i);
            dossier.setStatus(DossierStatus.NEW);
            dossierRepository.save(dossier);
        }

        mockMvc.perform(get(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));

        mockMvc.perform(get(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.number").value(1));

        mockMvc.perform(get(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .param("page", "2")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.number").value(2));
    }

    @Test
    void testStatusHistoryVerification() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.QUALIFYING);
        request.setUserId("user-123");
        request.setReason("First transition");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        request.setStatus(DossierStatus.QUALIFIED);
        request.setUserId("user-456");
        request.setReason("Second transition");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get(BASE_URL + "/{id}/status-history", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].fromStatus").value("QUALIFYING"))
                .andExpect(jsonPath("$.content[0].toStatus").value("QUALIFIED"))
                .andExpect(jsonPath("$.content[0].userId").value("user-456"))
                .andExpect(jsonPath("$.content[0].reason").value("Second transition"))
                .andExpect(jsonPath("$.content[0].transitionedAt").exists())
                .andExpect(jsonPath("$.content[1].fromStatus").value("NEW"))
                .andExpect(jsonPath("$.content[1].toStatus").value("QUALIFYING"))
                .andExpect(jsonPath("$.content[1].userId").value("user-123"))
                .andExpect(jsonPath("$.content[1].reason").value("First transition"));
    }

    @Test
    void testCompleteAuditTrail() throws Exception {
        DossierCreateRequest createRequest = new DossierCreateRequest();
        createRequest.setLeadPhone("+33612345678");
        createRequest.setLeadName("John Doe");
        createRequest.setLeadSource("Website");

        String createResponseJson = mockMvc.perform(post(BASE_URL)

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andExpect(jsonPath("$.updatedAt", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        DossierResponse createResponse = objectMapper.readValue(createResponseJson, DossierResponse.class);
        Long dossierId = createResponse.getId();

        List<DossierStatusHistory> historyAfterCreate = statusHistoryRepository.findByDossierId(dossierId, null).getContent();
        assertThat(historyAfterCreate).hasSize(1);
        assertThat(historyAfterCreate.get(0).getFromStatus()).isEqualTo(DossierStatus.DRAFT);
        assertThat(historyAfterCreate.get(0).getToStatus()).isEqualTo(DossierStatus.NEW);
        assertThat(historyAfterCreate.get(0).getReason()).isEqualTo("Initial dossier creation");
        assertThat(historyAfterCreate.get(0).getOrgId()).isEqualTo(ORG_ID);
        assertThat(historyAfterCreate.get(0).getTransitionedAt()).isNotNull();

        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFYING);
        patchRequest.setUserId("user-123");
        patchRequest.setReason("Client called back");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossierId)

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUALIFYING"))
                .andExpect(jsonPath("$.updatedAt", notNullValue()));

        List<DossierStatusHistory> historyAfterPatch = statusHistoryRepository.findByDossierId(dossierId, null).getContent();
        assertThat(historyAfterPatch).hasSize(2);

        DossierStatusHistory latestHistory = historyAfterPatch.stream()
                .filter(h -> h.getToStatus() == DossierStatus.QUALIFYING)
                .findFirst()
                .orElseThrow();

        assertThat(latestHistory.getFromStatus()).isEqualTo(DossierStatus.NEW);
        assertThat(latestHistory.getToStatus()).isEqualTo(DossierStatus.QUALIFYING);
        assertThat(latestHistory.getUserId()).isEqualTo("user-123");
        assertThat(latestHistory.getReason()).isEqualTo("Client called back");
        assertThat(latestHistory.getOrgId()).isEqualTo(ORG_ID);
        assertThat(latestHistory.getDossierId()).isEqualTo(dossierId);
        assertThat(latestHistory.getTransitionedAt()).isNotNull();

        mockMvc.perform(get(BASE_URL + "/{id}/status-history", dossierId)

                        .header(TENANT_HEADER, ORG_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].dossierId").value(dossierId))
                .andExpect(jsonPath("$.content[0].toStatus").value("QUALIFYING"))
                .andExpect(jsonPath("$.content[0].userId").value("user-123"))
                .andExpect(jsonPath("$.content[1].dossierId").value(dossierId))
                .andExpect(jsonPath("$.content[1].toStatus").value("NEW"));
    }

    @Test
    void testAlternativePathToLost() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.LOST);
        request.setUserId("user-123");
        request.setReason("Client not interested");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOST"));

        Dossier updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.LOST);

        List<DossierStatusHistory> history = statusHistoryRepository.findAll();
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getFromStatus()).isEqualTo(DossierStatus.NEW);
        assertThat(history.get(0).getToStatus()).isEqualTo(DossierStatus.LOST);
    }

    @Test
    void testQualifyingToLostTransition() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.QUALIFYING);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.LOST);
        request.setUserId("user-123");
        request.setReason("Did not meet criteria");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOST"));

        Dossier updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.LOST);
    }

    @Test
    void testQualifiedToLostTransition() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.QUALIFIED);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.LOST);
        request.setUserId("user-123");
        request.setReason("Found another property");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOST"));

        Dossier updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.LOST);
    }

    @Test
    void testAppointmentToLostTransition() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.APPOINTMENT);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.LOST);
        request.setUserId("user-123");
        request.setReason("Client no-showed");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOST"));

        Dossier updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.LOST);
    }

    @Test
    void testNewDirectToQualifiedTransition() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.QUALIFIED);
        request.setUserId("user-123");
        request.setReason("Pre-qualified client");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUALIFIED"));

        Dossier updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.QUALIFIED);
    }

    @Test
    void testNewDirectToAppointmentTransition() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId(ORG_ID);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        statusHistoryRepository.deleteAll();

        DossierStatusPatchRequest request = new DossierStatusPatchRequest();
        request.setStatus(DossierStatus.APPOINTMENT);
        request.setUserId("user-123");
        request.setReason("Direct appointment scheduling");

        mockMvc.perform(patch(BASE_URL + "/{id}/status", dossier.getId())

                        .header(TENANT_HEADER, ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPOINTMENT"));

        Dossier updated = dossierRepository.findById(dossier.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DossierStatus.APPOINTMENT);
    }
}
