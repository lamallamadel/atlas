package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DossierServiceTest {

    private static final String DEFAULT_ORG = "org123";

    @Autowired private DossierService dossierService;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private AnnonceRepository annonceRepository;

    @Autowired private PartiePrenanteRepository partiePrenanteRepository;

    @BeforeEach
    void setUp() {
        partiePrenanteRepository.deleteAll();
        dossierRepository.deleteAll();
        annonceRepository.deleteAll();
        TenantContext.setOrgId(DEFAULT_ORG);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_WithInitialParty_CreatesPartyCorrectly() {
        DossierCreateRequest request = createBasicRequest();
        PartiePrenanteRequest party = new PartiePrenanteRequest();
        party.setRole(PartiePrenanteRole.BUYER);
        party.setFirstName("John");
        party.setLastName("Doe");
        party.setPhone("+33612345678");
        party.setEmail("john.doe@example.com");
        request.setInitialParty(party);

        DossierResponse response = dossierService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getParties()).isNotNull();
        assertThat(response.getParties()).hasSize(1);
        assertThat(response.getParties().get(0).getRole()).isEqualTo(PartiePrenanteRole.BUYER);
        assertThat(response.getParties().get(0).getFirstName()).isEqualTo("John");
        assertThat(response.getParties().get(0).getLastName()).isEqualTo("Doe");
        assertThat(response.getParties().get(0).getPhone()).isEqualTo("+33612345678");
        assertThat(response.getParties().get(0).getEmail()).isEqualTo("john.doe@example.com");

        Dossier persisted = dossierRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getParties()).hasSize(1);
        assertThat(persisted.getParties().get(0).getRole()).isEqualTo(PartiePrenanteRole.BUYER);
        assertThat(persisted.getParties().get(0).getPhone()).isEqualTo("+33612345678");
    }

    @Test
    void create_WithInitialPartySellerRole_CreatesPartyCorrectly() {
        DossierCreateRequest request = createBasicRequest();
        PartiePrenanteRequest party = new PartiePrenanteRequest();
        party.setRole(PartiePrenanteRole.SELLER);
        party.setFirstName("Jane");
        party.setLastName("Smith");
        party.setPhone("+33698765432");
        request.setInitialParty(party);

        DossierResponse response = dossierService.create(request);

        assertThat(response.getParties()).hasSize(1);
        assertThat(response.getParties().get(0).getRole()).isEqualTo(PartiePrenanteRole.SELLER);
        assertThat(response.getParties().get(0).getFirstName()).isEqualTo("Jane");
        assertThat(response.getParties().get(0).getLastName()).isEqualTo("Smith");

        Dossier persisted = dossierRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getParties()).hasSize(1);
        assertThat(persisted.getParties().get(0).getRole()).isEqualTo(PartiePrenanteRole.SELLER);
    }

    @Test
    void create_WithoutInitialParty_CreatesEmptyPartyList() {
        DossierCreateRequest request = createBasicRequest();
        request.setInitialParty(null);

        DossierResponse response = dossierService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getParties()).isEmpty();

        Dossier persisted = dossierRepository.findById(response.getId()).orElseThrow();
        assertThat(persisted.getParties()).isEmpty();
    }

    @Test
    void create_WithInitialPartyAllFields_PersistsAllCorrectly() {
        DossierCreateRequest request = createBasicRequest();
        PartiePrenanteRequest party = new PartiePrenanteRequest();
        party.setRole(PartiePrenanteRole.TENANT);
        party.setFirstName("Alice");
        party.setLastName("Johnson");
        party.setPhone("+33611223344");
        party.setEmail("alice.j@example.com");
        party.setAddress("123 Main St, Paris");
        request.setInitialParty(party);

        DossierResponse response = dossierService.create(request);

        assertThat(response.getParties()).hasSize(1);
        assertThat(response.getParties().get(0).getRole()).isEqualTo(PartiePrenanteRole.TENANT);
        assertThat(response.getParties().get(0).getFirstName()).isEqualTo("Alice");
        assertThat(response.getParties().get(0).getLastName()).isEqualTo("Johnson");
        assertThat(response.getParties().get(0).getPhone()).isEqualTo("+33611223344");
        assertThat(response.getParties().get(0).getEmail()).isEqualTo("alice.j@example.com");
        assertThat(response.getParties().get(0).getAddress()).isEqualTo("123 Main St, Paris");

        Dossier persisted = dossierRepository.findById(response.getId()).orElseThrow();
        PartiePrenanteEntity persistedParty = persisted.getParties().get(0);
        assertThat(persistedParty.getRole()).isEqualTo(PartiePrenanteRole.TENANT);
        assertThat(persistedParty.getFirstName()).isEqualTo("Alice");
        assertThat(persistedParty.getLastName()).isEqualTo("Johnson");
        assertThat(persistedParty.getPhone()).isEqualTo("+33611223344");
        assertThat(persistedParty.getEmail()).isEqualTo("alice.j@example.com");
        assertThat(persistedParty.getAddress()).isEqualTo("123 Main St, Paris");
    }

    @Test
    void create_WithArchivedAnnonce_ThrowsIllegalArgumentException() {
        Annonce archivedAnnonce =
                createAnnonce(DEFAULT_ORG, "Archived Annonce", AnnonceStatus.ARCHIVED);
        archivedAnnonce = annonceRepository.save(archivedAnnonce);

        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(archivedAnnonce.getId());

        assertThatThrownBy(() -> dossierService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot create dossier with ARCHIVED annonce");
    }

    @Test
    void create_WithPublishedAnnonce_CreatesSuccessfully() {
        Annonce publishedAnnonce =
                createAnnonce(DEFAULT_ORG, "Published Annonce", AnnonceStatus.PUBLISHED);
        publishedAnnonce = annonceRepository.save(publishedAnnonce);

        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(publishedAnnonce.getId());

        DossierResponse response = dossierService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getAnnonceId()).isEqualTo(publishedAnnonce.getId());
    }

    @Test
    void create_WithDraftAnnonce_ThrowsIllegalArgumentException() {
        Annonce draftAnnonce = createAnnonce(DEFAULT_ORG, "Draft Annonce", AnnonceStatus.DRAFT);
        draftAnnonce = annonceRepository.save(draftAnnonce);

        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(draftAnnonce.getId());

        assertThatThrownBy(() -> dossierService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot create dossier with DRAFT annonce");
    }

    @Test
    void create_WithActiveAnnonce_CreatesSuccessfully() {
        Annonce activeAnnonce = createAnnonce(DEFAULT_ORG, "Active Annonce", AnnonceStatus.ACTIVE);
        activeAnnonce = annonceRepository.save(activeAnnonce);

        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(activeAnnonce.getId());

        DossierResponse response = dossierService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getAnnonceId()).isEqualTo(activeAnnonce.getId());
    }

    @Test
    void create_WithNonExistentAnnonce_ThrowsEntityNotFoundException() {
        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(99999L);

        assertThatThrownBy(() -> dossierService.create(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Annonce not found with id: 99999");
    }

    @Test
    void checkForDuplicates_WithMatchingPhone_ReturnsOpenDossiers() {
        String phone = "+33612345678";

        Dossier dossier1 = createDossier(DEFAULT_ORG, phone, DossierStatus.NEW);
        dossier1 = dossierRepository.save(dossier1);
        partiePrenanteRepository.save(createParty(dossier1, PartiePrenanteRole.BUYER, phone));

        Dossier dossier2 = createDossier(DEFAULT_ORG, phone, DossierStatus.QUALIFIED);
        dossier2 = dossierRepository.save(dossier2);
        partiePrenanteRepository.save(createParty(dossier2, PartiePrenanteRole.BUYER, phone));

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(2);
        assertThat(duplicates)
                .extracting(DossierResponse::getStatus)
                .containsExactlyInAnyOrder(DossierStatus.NEW, DossierStatus.QUALIFIED);
    }

    @Test
    void checkForDuplicates_ExcludesWonStatus() {
        String phone = "+33612345678";

        Dossier newDossier = createDossier(DEFAULT_ORG, phone, DossierStatus.NEW);
        newDossier = dossierRepository.save(newDossier);
        partiePrenanteRepository.save(createParty(newDossier, PartiePrenanteRole.BUYER, phone));

        Dossier wonDossier = createDossier(DEFAULT_ORG, phone, DossierStatus.WON);
        wonDossier = dossierRepository.save(wonDossier);
        partiePrenanteRepository.save(createParty(wonDossier, PartiePrenanteRole.BUYER, phone));

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void checkForDuplicates_ExcludesLostStatus() {
        String phone = "+33612345678";

        Dossier qualifiedDossier = createDossier(DEFAULT_ORG, phone, DossierStatus.QUALIFIED);
        qualifiedDossier = dossierRepository.save(qualifiedDossier);
        partiePrenanteRepository.save(
                createParty(qualifiedDossier, PartiePrenanteRole.BUYER, phone));

        Dossier lostDossier = createDossier(DEFAULT_ORG, phone, DossierStatus.LOST);
        lostDossier = dossierRepository.save(lostDossier);
        partiePrenanteRepository.save(createParty(lostDossier, PartiePrenanteRole.BUYER, phone));

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getStatus()).isEqualTo(DossierStatus.QUALIFIED);
    }

    @Test
    void checkForDuplicates_WithAppointmentStatus_ReturnsDossier() {
        String phone = "+33612345678";

        Dossier appointmentDossier = createDossier(DEFAULT_ORG, phone, DossierStatus.APPOINTMENT);
        appointmentDossier = dossierRepository.save(appointmentDossier);
        partiePrenanteRepository.save(
                createParty(appointmentDossier, PartiePrenanteRole.BUYER, phone));

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getStatus()).isEqualTo(DossierStatus.APPOINTMENT);
    }

    @Test
    void checkForDuplicates_WithNullPhone_ReturnsEmptyList() {
        List<DossierResponse> duplicates = dossierService.checkForDuplicates(null);
        assertThat(duplicates).isEmpty();
    }

    @Test
    void checkForDuplicates_WithEmptyPhone_ReturnsEmptyList() {
        List<DossierResponse> duplicates = dossierService.checkForDuplicates("");
        assertThat(duplicates).isEmpty();
    }

    @Test
    void checkForDuplicates_WithWhitespacePhone_ReturnsEmptyList() {
        List<DossierResponse> duplicates = dossierService.checkForDuplicates("   ");
        assertThat(duplicates).isEmpty();
    }

    @Test
    void checkForDuplicates_NoMatchingPhone_ReturnsEmptyList() {
        String phone = "+33612345678";

        Dossier dossier = createDossier(DEFAULT_ORG, "+33698765432", DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);
        partiePrenanteRepository.save(
                createParty(dossier, PartiePrenanteRole.BUYER, "+33698765432"));

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).isEmpty();
    }

    @Test
    void checkForDuplicates_MultiplePartiesWithSamePhone_ReturnsDistinctDossiers() {
        String phone = "+33612345678";

        Dossier dossier = createDossier(DEFAULT_ORG, phone, DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);
        partiePrenanteRepository.save(createParty(dossier, PartiePrenanteRole.BUYER, phone));
        partiePrenanteRepository.save(createParty(dossier, PartiePrenanteRole.SELLER, phone));

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(1);
    }

    @Test
    void create_HappyPath_ReturnsCreatedDossier() {
        DossierCreateRequest request = createBasicRequest();

        DossierResponse result = dossierService.create(request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isNotNull();
        assertThat(result.getOrgId()).isEqualTo(DEFAULT_ORG);
        assertThat(result.getLeadPhone()).isEqualTo("+33612345678");
        assertThat(result.getLeadName()).isEqualTo("John Doe");
        assertThat(result.getLeadSource()).isEqualTo("Website");
        assertThat(result.getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void getById_HappyPath_ReturnsDossier() {
        DossierResponse created = dossierService.create(createBasicRequest());

        DossierResponse result = dossierService.getById(created.getId());

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(created.getId());
        assertThat(result.getLeadPhone()).isEqualTo("+33612345678");
    }

    @Test
    void getById_NotFound_ThrowsEntityNotFoundException() {
        assertThatThrownBy(() -> dossierService.getById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Dossier not found with id: 999");
    }

    @Test
    void patchStatus_HappyPath_ReturnsUpdatedDossier() {
        DossierResponse created = dossierService.create(createBasicRequest());

        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        DossierResponse result = dossierService.patchStatus(created.getId(), patchRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(created.getId());
        assertThat(result.getStatus()).isEqualTo(DossierStatus.QUALIFIED);
    }

    @Test
    void patchStatus_NotFound_ThrowsEntityNotFoundException() {
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        assertThatThrownBy(() -> dossierService.patchStatus(999L, patchRequest))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Dossier not found with id: 999");
    }

    @Test
    void list_NoFilters_ReturnsAllDossiers() {
        dossierService.create(createBasicRequest());
        dossierService.create(createBasicRequest());

        Pageable pageable = PageRequest.of(0, 20);
        Page<DossierResponse> result = dossierService.list(null, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    void list_WithStatusFilter_ReturnsFilteredDossiers() {
        dossierService.create(createBasicRequest());

        DossierResponse created = dossierService.create(createBasicRequest());
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);
        dossierService.patchStatus(created.getId(), patchRequest);

        Pageable pageable = PageRequest.of(0, 20);
        Page<DossierResponse> result = dossierService.list(DossierStatus.NEW, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void list_EmptyResult_ReturnsEmptyPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<DossierResponse> result = dossierService.list(null, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
    }

    @Test
    void crossTenantIsolation_createInOrg1AndOrg2_org1CannotAccessOrg2() {
        try {
            TenantContext.setOrgId("ORG1");
            DossierCreateRequest request1 = createBasicRequest();
            request1.setLeadName("ORG1 Lead");
            DossierResponse org1Response = dossierService.create(request1);

            TenantContext.setOrgId("ORG2");
            DossierCreateRequest request2 = createBasicRequest();
            request2.setLeadName("ORG2 Lead");
            DossierResponse org2Response = dossierService.create(request2);

            TenantContext.setOrgId("ORG1");
            assertThatThrownBy(() -> dossierService.getById(org2Response.getId()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Dossier not found with id: " + org2Response.getId());

            DossierResponse org1Retrieved = dossierService.getById(org1Response.getId());
            assertThat(org1Retrieved.getId()).isEqualTo(org1Response.getId());
            assertThat(org1Retrieved.getLeadName()).isEqualTo("ORG1 Lead");
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void crossTenantIsolation_org2CannotAccessOrg1Resources() {
        try {
            TenantContext.setOrgId("ORG1");
            DossierCreateRequest request = createBasicRequest();
            request.setLeadName("ORG1 Private Lead");
            DossierResponse org1Response = dossierService.create(request);

            TenantContext.setOrgId("ORG2");
            assertThatThrownBy(() -> dossierService.getById(org1Response.getId()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Dossier not found with id: " + org1Response.getId());
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void crossTenantIsolation_patchStatusFromWrongTenant_returns404() {
        try {
            TenantContext.setOrgId("ORG1");
            DossierResponse org1Response = dossierService.create(createBasicRequest());

            TenantContext.setOrgId("ORG2");
            DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
            patchRequest.setStatus(DossierStatus.WON);

            assertThatThrownBy(() -> dossierService.patchStatus(org1Response.getId(), patchRequest))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Dossier not found with id: " + org1Response.getId());
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void crossTenantIsolation_createWithOrg2AnnonceFromOrg1_returns404() {
        try {
            TenantContext.setOrgId("ORG2");
            Annonce org2Annonce = createAnnonce("ORG2", "ORG2 Annonce", AnnonceStatus.PUBLISHED);
            org2Annonce = annonceRepository.save(org2Annonce);

            TenantContext.setOrgId("ORG1");
            DossierCreateRequest request = createBasicRequest();
            request.setAnnonceId(org2Annonce.getId());

            Long finalAnnonceId = org2Annonce.getId();
            assertThatThrownBy(() -> dossierService.create(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Annonce not found with id: " + finalAnnonceId);
        } finally {
            TenantContext.clear();
        }
    }

    private DossierCreateRequest createBasicRequest() {
        DossierCreateRequest request = new DossierCreateRequest();
        // orgId comes from TenantContext / header, so DO NOT set it in the DTO
        request.setLeadPhone("+33612345678");
        request.setLeadName("John Doe");
        request.setLeadSource("Website");
        return request;
    }

    private Dossier createDossier(String orgId, String leadPhone, DossierStatus status) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone(leadPhone);
        dossier.setLeadName("Lead Name");
        dossier.setLeadSource("Website");
        dossier.setStatus(status);
        return dossier;
    }

    private PartiePrenanteEntity createParty(
            Dossier dossier, PartiePrenanteRole role, String phone) {
        PartiePrenanteEntity party = new PartiePrenanteEntity();
        party.setDossier(dossier);
        party.setOrgId(dossier.getOrgId());
        party.setRole(role);
        party.setPhone(phone);
        party.setFirstName("Test");
        party.setLastName("User");
        return party;
    }

    private Annonce createAnnonce(String orgId, String title, AnnonceStatus status) {
        Annonce annonce = new Annonce();
        annonce.setOrgId(orgId);
        annonce.setTitle(title);
        annonce.setDescription("Test description");
        annonce.setCategory("Test category");
        annonce.setCity("Test city");
        annonce.setPrice(BigDecimal.valueOf(100.00));
        annonce.setCurrency("EUR");
        annonce.setStatus(status);
        return annonce;
    }
}
