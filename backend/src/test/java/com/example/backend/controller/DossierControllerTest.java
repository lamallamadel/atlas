package com.example.backend.controller;

import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.dto.PartiePrenanteRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.PartiePrenanteRole;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.PartiePrenanteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DossierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private PartiePrenanteRepository partiePrenanteRepository;

    @BeforeEach
    void setUp() {
        partiePrenanteRepository.deleteAll();
        dossierRepository.deleteAll();
        annonceRepository.deleteAll();
    }

    @Test
    void create_WithDuplicatePhone_ReturnsExistingOpenDossierId() throws Exception {
        String duplicatePhone = "+33612345678";

        Dossier existingDossier = new Dossier();
        existingDossier.setOrgId("org123");
        existingDossier.setLeadPhone(duplicatePhone);
        existingDossier.setLeadName("Existing User");
        existingDossier.setStatus(DossierStatus.NEW);
        existingDossier = dossierRepository.save(existingDossier);

        PartiePrenanteEntity existingParty = new PartiePrenanteEntity();
        existingParty.setDossier(existingDossier);
        existingParty.setRole(PartiePrenanteRole.BUYER);
        existingParty.setPhone(duplicatePhone);
        existingParty.setFirstName("Existing");
        existingParty.setLastName("User");
        partiePrenanteRepository.save(existingParty);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone(duplicatePhone);
        request.setLeadName("New User");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone(duplicatePhone);
        initialParty.setFirstName("New");
        initialParty.setLastName("User");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value("org123"))
                .andExpect(jsonPath("$.existingOpenDossierId").value(existingDossier.getId()));
    }

    @Test
    void create_WithDuplicatePhoneInQualifiedStatus_ReturnsExistingOpenDossierId() throws Exception {
        String duplicatePhone = "+33698765432";

        Dossier qualifiedDossier = new Dossier();
        qualifiedDossier.setOrgId("org123");
        qualifiedDossier.setLeadPhone(duplicatePhone);
        qualifiedDossier.setLeadName("Qualified User");
        qualifiedDossier.setStatus(DossierStatus.QUALIFIED);
        qualifiedDossier = dossierRepository.save(qualifiedDossier);

        PartiePrenanteEntity qualifiedParty = new PartiePrenanteEntity();
        qualifiedParty.setDossier(qualifiedDossier);
        qualifiedParty.setRole(PartiePrenanteRole.BUYER);
        qualifiedParty.setPhone(duplicatePhone);
        qualifiedParty.setFirstName("Qualified");
        qualifiedParty.setLastName("User");
        partiePrenanteRepository.save(qualifiedParty);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33611111111");
        request.setLeadName("New User");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone(duplicatePhone);
        initialParty.setFirstName("New");
        initialParty.setLastName("User");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").value(qualifiedDossier.getId()));
    }

    @Test
    void create_WithDuplicatePhoneInAppointmentStatus_ReturnsExistingOpenDossierId() throws Exception {
        String duplicatePhone = "+33687654321";

        Dossier appointmentDossier = new Dossier();
        appointmentDossier.setOrgId("org123");
        appointmentDossier.setLeadPhone(duplicatePhone);
        appointmentDossier.setLeadName("Appointment User");
        appointmentDossier.setStatus(DossierStatus.APPOINTMENT);
        appointmentDossier = dossierRepository.save(appointmentDossier);

        PartiePrenanteEntity appointmentParty = new PartiePrenanteEntity();
        appointmentParty.setDossier(appointmentDossier);
        appointmentParty.setRole(PartiePrenanteRole.BUYER);
        appointmentParty.setPhone(duplicatePhone);
        appointmentParty.setFirstName("Appointment");
        appointmentParty.setLastName("User");
        partiePrenanteRepository.save(appointmentParty);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33622222222");
        request.setLeadName("New User");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone(duplicatePhone);
        initialParty.setFirstName("New");
        initialParty.setLastName("User");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").value(appointmentDossier.getId()));
    }

    @Test
    void create_WithDuplicatePhoneInWonStatus_DoesNotReturnExistingOpenDossierId() throws Exception {
        String duplicatePhone = "+33676543210";

        Dossier wonDossier = new Dossier();
        wonDossier.setOrgId("org123");
        wonDossier.setLeadPhone(duplicatePhone);
        wonDossier.setLeadName("Won User");
        wonDossier.setStatus(DossierStatus.WON);
        wonDossier = dossierRepository.save(wonDossier);

        PartiePrenanteEntity wonParty = new PartiePrenanteEntity();
        wonParty.setDossier(wonDossier);
        wonParty.setRole(PartiePrenanteRole.BUYER);
        wonParty.setPhone(duplicatePhone);
        wonParty.setFirstName("Won");
        wonParty.setLastName("User");
        partiePrenanteRepository.save(wonParty);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33633333333");
        request.setLeadName("New User");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone(duplicatePhone);
        initialParty.setFirstName("New");
        initialParty.setLastName("User");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").doesNotExist());
    }

    @Test
    void create_WithDuplicatePhoneInLostStatus_DoesNotReturnExistingOpenDossierId() throws Exception {
        String duplicatePhone = "+33665432109";

        Dossier lostDossier = new Dossier();
        lostDossier.setOrgId("org123");
        lostDossier.setLeadPhone(duplicatePhone);
        lostDossier.setLeadName("Lost User");
        lostDossier.setStatus(DossierStatus.LOST);
        lostDossier = dossierRepository.save(lostDossier);

        PartiePrenanteEntity lostParty = new PartiePrenanteEntity();
        lostParty.setDossier(lostDossier);
        lostParty.setRole(PartiePrenanteRole.BUYER);
        lostParty.setPhone(duplicatePhone);
        lostParty.setFirstName("Lost");
        lostParty.setLastName("User");
        partiePrenanteRepository.save(lostParty);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33644444444");
        request.setLeadName("New User");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone(duplicatePhone);
        initialParty.setFirstName("New");
        initialParty.setLastName("User");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").doesNotExist());
    }

    @Test
    void create_WithNoDuplicatePhone_DoesNotReturnExistingOpenDossierId() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33699999999");
        request.setLeadName("Unique User");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone("+33699999999");
        initialParty.setFirstName("Unique");
        initialParty.setLastName("User");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").doesNotExist());
    }

    @Test
    void create_WithoutInitialParty_DoesNotReturnExistingOpenDossierId() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33688888888");
        request.setLeadName("No Party User");
        request.setInitialParty(null);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").doesNotExist());
    }

    @Test
    void create_WithInitialPartyButNoPhone_DoesNotReturnExistingOpenDossierId() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33677777777");
        request.setLeadName("User Without Phone");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone(null);
        initialParty.setFirstName("No");
        initialParty.setLastName("Phone");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").doesNotExist());
    }

    @Test
    void create_WithMultipleDuplicates_ReturnsFirstExistingOpenDossierId() throws Exception {
        String duplicatePhone = "+33655555555";

        Dossier firstDossier = new Dossier();
        firstDossier.setOrgId("org123");
        firstDossier.setLeadPhone(duplicatePhone);
        firstDossier.setLeadName("First User");
        firstDossier.setStatus(DossierStatus.NEW);
        firstDossier = dossierRepository.save(firstDossier);

        PartiePrenanteEntity firstParty = new PartiePrenanteEntity();
        firstParty.setDossier(firstDossier);
        firstParty.setRole(PartiePrenanteRole.BUYER);
        firstParty.setPhone(duplicatePhone);
        firstParty.setFirstName("First");
        firstParty.setLastName("User");
        partiePrenanteRepository.save(firstParty);

        Dossier secondDossier = new Dossier();
        secondDossier.setOrgId("org123");
        secondDossier.setLeadPhone(duplicatePhone);
        secondDossier.setLeadName("Second User");
        secondDossier.setStatus(DossierStatus.QUALIFIED);
        secondDossier = dossierRepository.save(secondDossier);

        PartiePrenanteEntity secondParty = new PartiePrenanteEntity();
        secondParty.setDossier(secondDossier);
        secondParty.setRole(PartiePrenanteRole.BUYER);
        secondParty.setPhone(duplicatePhone);
        secondParty.setFirstName("Second");
        secondParty.setLastName("User");
        partiePrenanteRepository.save(secondParty);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33666666666");
        request.setLeadName("New User");

        PartiePrenanteRequest initialParty = new PartiePrenanteRequest();
        initialParty.setRole(PartiePrenanteRole.BUYER);
        initialParty.setPhone(duplicatePhone);
        initialParty.setFirstName("New");
        initialParty.setLastName("User");
        request.setInitialParty(initialParty);

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.existingOpenDossierId").exists())
                .andExpect(jsonPath("$.existingOpenDossierId").isNumber());
    }

    @Test
    void create_ValidRequest_Returns201WithCreatedEntity() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33612345678");
        request.setLeadName("John Doe");
        request.setLeadSource("Website");

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value("org123"))
                .andExpect(jsonPath("$.leadPhone").value("+33612345678"))
                .andExpect(jsonPath("$.leadName").value("John Doe"))
                .andExpect(jsonPath("$.leadSource").value("Website"))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void create_MissingOrgId_Returns400() throws Exception {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId(null);
        request.setLeadPhone("+33612345678");

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_ArchivedAnnonce_Returns400() throws Exception {
        Annonce archivedAnnonce = new Annonce();
        archivedAnnonce.setOrgId("org123");
        archivedAnnonce.setTitle("Archived Annonce");
        archivedAnnonce.setDescription("Test");
        archivedAnnonce.setCategory("Test");
        archivedAnnonce.setCity("Test");
        archivedAnnonce.setPrice(BigDecimal.valueOf(100.00));
        archivedAnnonce.setCurrency("EUR");
        archivedAnnonce.setStatus(AnnonceStatus.ARCHIVED);
        archivedAnnonce = annonceRepository.save(archivedAnnonce);

        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
        request.setLeadPhone("+33612345678");
        request.setAnnonceId(archivedAnnonce.getId());

        mockMvc.perform(post("/api/v1/dossiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot create dossier with ARCHIVED annonce"));
    }

    @Test
    void getById_ExistingId_Returns200WithEntity() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId("org123");
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        mockMvc.perform(get("/api/v1/dossiers/" + dossier.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(dossier.getId()))
                .andExpect(jsonPath("$.orgId").value("org123"))
                .andExpect(jsonPath("$.leadPhone").value("+33612345678"));
    }

    @Test
    void getById_NonExistingId_Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/dossiers/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void patchStatus_ValidRequest_Returns200() throws Exception {
        Dossier dossier = new Dossier();
        dossier.setOrgId("org123");
        dossier.setLeadPhone("+33612345678");
        dossier.setStatus(DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);

        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        mockMvc.perform(patch("/api/v1/dossiers/" + dossier.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dossier.getId()))
                .andExpect(jsonPath("$.status").value("QUALIFIED"));
    }

    @Test
    void patchStatus_NonExistingId_Returns404() throws Exception {
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        mockMvc.perform(patch("/api/v1/dossiers/999/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_NoFilters_Returns200WithPagedResults() throws Exception {
        Dossier dossier1 = new Dossier();
        dossier1.setOrgId("org123");
        dossier1.setLeadName("John Doe");
        dossier1.setLeadPhone("+33612345678");
        dossier1.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId("org123");
        dossier2.setLeadName("Jane Smith");
        dossier2.setLeadPhone("+33698765432");
        dossier2.setStatus(DossierStatus.QUALIFIED);
        dossierRepository.save(dossier2);

        mockMvc.perform(get("/api/v1/dossiers"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].leadName").exists())
                .andExpect(jsonPath("$.content[1].leadName").exists())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void list_WithStatusFilter_Returns200WithFilteredResults() throws Exception {
        Dossier dossier1 = new Dossier();
        dossier1.setOrgId("org123");
        dossier1.setLeadName("John Doe");
        dossier1.setLeadPhone("+33612345678");
        dossier1.setStatus(DossierStatus.QUALIFIED);
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId("org123");
        dossier2.setLeadName("Jane Smith");
        dossier2.setLeadPhone("+33698765432");
        dossier2.setStatus(DossierStatus.NEW);
        dossierRepository.save(dossier2);

        mockMvc.perform(get("/api/v1/dossiers")
                        .param("status", "QUALIFIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("QUALIFIED"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void list_EmptyResult_Returns200WithEmptyPage() throws Exception {
        mockMvc.perform(get("/api/v1/dossiers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }
}
