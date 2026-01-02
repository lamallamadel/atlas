package com.example.backend.service;

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
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DossierServiceTest {

    @Autowired
    private DossierService dossierService;

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
        Annonce archivedAnnonce = createAnnonce("org123", "Archived Annonce", AnnonceStatus.ARCHIVED);
        archivedAnnonce = annonceRepository.save(archivedAnnonce);

        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(archivedAnnonce.getId());

        assertThatThrownBy(() -> dossierService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot create dossier with ARCHIVED annonce");
    }

    @Test
    void create_WithPublishedAnnonce_CreatesSuccessfully() {
        Annonce publishedAnnonce = createAnnonce("org123", "Published Annonce", AnnonceStatus.PUBLISHED);
        publishedAnnonce = annonceRepository.save(publishedAnnonce);

        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(publishedAnnonce.getId());

        DossierResponse response = dossierService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getAnnonceId()).isEqualTo(publishedAnnonce.getId());
    }

    @Test
    void create_WithDraftAnnonce_CreatesSuccessfully() {
        Annonce draftAnnonce = createAnnonce("org123", "Draft Annonce", AnnonceStatus.DRAFT);
        draftAnnonce = annonceRepository.save(draftAnnonce);

        DossierCreateRequest request = createBasicRequest();
        request.setAnnonceId(draftAnnonce.getId());

        DossierResponse response = dossierService.create(request);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getAnnonceId()).isEqualTo(draftAnnonce.getId());
    }

    @Test
    void create_WithActiveAnnonce_CreatesSuccessfully() {
        Annonce activeAnnonce = createAnnonce("org123", "Active Annonce", AnnonceStatus.ACTIVE);
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

        Dossier dossier1 = createDossier("org123", phone, DossierStatus.NEW);
        dossier1 = dossierRepository.save(dossier1);
        PartiePrenanteEntity party1 = createParty(dossier1, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party1);

        Dossier dossier2 = createDossier("org123", phone, DossierStatus.QUALIFIED);
        dossier2 = dossierRepository.save(dossier2);
        PartiePrenanteEntity party2 = createParty(dossier2, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party2);

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(2);
        assertThat(duplicates).extracting(DossierResponse::getStatus)
                .containsExactlyInAnyOrder(DossierStatus.NEW, DossierStatus.QUALIFIED);
    }

    @Test
    void checkForDuplicates_ExcludesWonStatus() {
        String phone = "+33612345678";

        Dossier newDossier = createDossier("org123", phone, DossierStatus.NEW);
        newDossier = dossierRepository.save(newDossier);
        PartiePrenanteEntity party1 = createParty(newDossier, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party1);

        Dossier wonDossier = createDossier("org123", phone, DossierStatus.WON);
        wonDossier = dossierRepository.save(wonDossier);
        PartiePrenanteEntity party2 = createParty(wonDossier, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party2);

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void checkForDuplicates_ExcludesLostStatus() {
        String phone = "+33612345678";

        Dossier qualifiedDossier = createDossier("org123", phone, DossierStatus.QUALIFIED);
        qualifiedDossier = dossierRepository.save(qualifiedDossier);
        PartiePrenanteEntity party1 = createParty(qualifiedDossier, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party1);

        Dossier lostDossier = createDossier("org123", phone, DossierStatus.LOST);
        lostDossier = dossierRepository.save(lostDossier);
        PartiePrenanteEntity party2 = createParty(lostDossier, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party2);

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(1);
        assertThat(duplicates.get(0).getStatus()).isEqualTo(DossierStatus.QUALIFIED);
    }

    @Test
    void checkForDuplicates_WithAppointmentStatus_ReturnsDossier() {
        String phone = "+33612345678";

        Dossier appointmentDossier = createDossier("org123", phone, DossierStatus.APPOINTMENT);
        appointmentDossier = dossierRepository.save(appointmentDossier);
        PartiePrenanteEntity party = createParty(appointmentDossier, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party);

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

        Dossier dossier = createDossier("org123", "+33698765432", DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);
        PartiePrenanteEntity party = createParty(dossier, PartiePrenanteRole.BUYER, "+33698765432");
        partiePrenanteRepository.save(party);

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).isEmpty();
    }

    @Test
    void checkForDuplicates_MultiplePartiesWithSamePhone_ReturnsDistinctDossiers() {
        String phone = "+33612345678";

        Dossier dossier = createDossier("org123", phone, DossierStatus.NEW);
        dossier = dossierRepository.save(dossier);
        PartiePrenanteEntity party1 = createParty(dossier, PartiePrenanteRole.BUYER, phone);
        partiePrenanteRepository.save(party1);
        PartiePrenanteEntity party2 = createParty(dossier, PartiePrenanteRole.SELLER, phone);
        partiePrenanteRepository.save(party2);

        List<DossierResponse> duplicates = dossierService.checkForDuplicates(phone);

        assertThat(duplicates).hasSize(1);
    }

    @Test
    void create_HappyPath_ReturnsCreatedDossier() {
        DossierCreateRequest request = createBasicRequest();

        DossierResponse result = dossierService.create(request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isNotNull();
        assertThat(result.getOrgId()).isEqualTo("org123");
        assertThat(result.getLeadPhone()).isEqualTo("+33612345678");
        assertThat(result.getLeadName()).isEqualTo("John Doe");
        assertThat(result.getLeadSource()).isEqualTo("Website");
        assertThat(result.getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void getById_HappyPath_ReturnsDossier() {
        DossierCreateRequest request = createBasicRequest();
        DossierResponse created = dossierService.create(request);

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
        DossierCreateRequest createRequest = createBasicRequest();
        DossierResponse created = dossierService.create(createRequest);

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
        
        DossierCreateRequest request2 = createBasicRequest();
        DossierResponse created = dossierService.create(request2);
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

    private DossierCreateRequest createBasicRequest() {
        DossierCreateRequest request = new DossierCreateRequest();
        request.setOrgId("org123");
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

    private PartiePrenanteEntity createParty(Dossier dossier, PartiePrenanteRole role, String phone) {
        PartiePrenanteEntity party = new PartiePrenanteEntity();
        party.setDossier(dossier);
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
