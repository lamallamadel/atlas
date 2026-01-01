package com.example.backend.repository;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class DossierRepositoryTest {

    @Autowired
    private DossierRepository dossierRepository;

    @BeforeEach
    void setUp() {
        dossierRepository.deleteAll();
    }

    @Test
    void testFilterByPhone_ExactMatch() {
        dossierRepository.save(createDossier("org1", "+33612345678", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345680", DossierStatus.NEW));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("leadPhone"), "+33612345678");

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLeadPhone()).isEqualTo("+33612345678");
    }

    @Test
    void testFilterByPhone_NoMatch() {
        dossierRepository.save(createDossier("org1", "+33612345678", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.NEW));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("leadPhone"), "+33699999999");

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).isEmpty();
    }

    @Test
    void testFilterByPhone_MultipleMatches() {
        String phone = "+33612345678";
        dossierRepository.save(createDossier("org1", phone, DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", phone, DossierStatus.QUALIFIED));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.NEW));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("leadPhone"), phone);

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(d -> d.getLeadPhone().equals(phone));
    }

    @Test
    void testFilterByStatus_New() {
        dossierRepository.save(createDossier("org1", "+33612345678", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345680", DossierStatus.QUALIFIED));
        dossierRepository.save(createDossier("org1", "+33612345681", DossierStatus.APPOINTMENT));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), DossierStatus.NEW);

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(d -> d.getStatus() == DossierStatus.NEW);
    }

    @Test
    void testFilterByStatus_Qualified() {
        dossierRepository.save(createDossier("org1", "+33612345678", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.QUALIFIED));
        dossierRepository.save(createDossier("org1", "+33612345680", DossierStatus.QUALIFIED));
        dossierRepository.save(createDossier("org1", "+33612345681", DossierStatus.WON));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), DossierStatus.QUALIFIED);

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(d -> d.getStatus() == DossierStatus.QUALIFIED);
    }

    @Test
    void testFilterByStatus_Appointment() {
        dossierRepository.save(createDossier("org1", "+33612345678", DossierStatus.APPOINTMENT));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345680", DossierStatus.LOST));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), DossierStatus.APPOINTMENT);

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(DossierStatus.APPOINTMENT);
    }

    @Test
    void testFilterByStatus_Won() {
        dossierRepository.save(createDossier("org1", "+33612345678", DossierStatus.WON));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.LOST));
        dossierRepository.save(createDossier("org1", "+33612345680", DossierStatus.NEW));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), DossierStatus.WON);

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(DossierStatus.WON);
    }

    @Test
    void testFilterByStatus_Lost() {
        dossierRepository.save(createDossier("org1", "+33612345678", DossierStatus.LOST));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.WON));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), DossierStatus.LOST);

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(DossierStatus.LOST);
    }

    @Test
    void testFilterByPhoneAndStatus() {
        String phone = "+33612345678";
        dossierRepository.save(createDossier("org1", phone, DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", phone, DossierStatus.QUALIFIED));
        dossierRepository.save(createDossier("org1", "+33612345679", DossierStatus.NEW));
        dossierRepository.save(createDossier("org1", "+33612345680", DossierStatus.QUALIFIED));

        Specification<Dossier> spec = Specification.<Dossier>where(
                (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("leadPhone"), phone))
                .and((root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), DossierStatus.NEW));

        List<Dossier> result = dossierRepository.findAll(spec);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLeadPhone()).isEqualTo(phone);
        assertThat(result.get(0).getStatus()).isEqualTo(DossierStatus.NEW);
    }

    @Test
    void testFilterByStatusWithPagination() {
        for (int i = 0; i < 15; i++) {
            dossierRepository.save(createDossier("org1", "+3361234567" + i, DossierStatus.NEW));
        }
        for (int i = 0; i < 10; i++) {
            dossierRepository.save(createDossier("org1", "+3361234568" + i, DossierStatus.QUALIFIED));
        }

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), DossierStatus.NEW);
        Pageable pageable = PageRequest.of(0, 10);

        Page<Dossier> result = dossierRepository.findAll(spec, pageable);

        assertThat(result.getContent()).hasSize(10);
        assertThat(result.getTotalElements()).isEqualTo(15);
        assertThat(result.getTotalPages()).isEqualTo(2);
        assertThat(result.getContent()).allMatch(d -> d.getStatus() == DossierStatus.NEW);
    }

    @Test
    void testFilterByPhoneWithPagination() {
        String phone = "+33612345678";
        for (int i = 0; i < 12; i++) {
            dossierRepository.save(createDossier("org1", phone, DossierStatus.values()[i % DossierStatus.values().length]));
        }
        dossierRepository.save(createDossier("org1", "+33699999999", DossierStatus.NEW));

        Specification<Dossier> spec = (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("leadPhone"), phone);
        Pageable pageable = PageRequest.of(0, 10);

        Page<Dossier> result = dossierRepository.findAll(spec, pageable);

        assertThat(result.getContent()).hasSize(10);
        assertThat(result.getTotalElements()).isEqualTo(12);
        assertThat(result.getContent()).allMatch(d -> d.getLeadPhone().equals(phone));
    }

    @Test
    void testPagination_FirstPage() {
        for (int i = 0; i < 25; i++) {
            dossierRepository.save(createDossier("org1", "+3361234567" + i, DossierStatus.NEW));
        }

        Pageable pageable = PageRequest.of(0, 10);
        Page<Dossier> result = dossierRepository.findAll(pageable);

        assertThat(result.getContent()).hasSize(10);
        assertThat(result.getTotalElements()).isEqualTo(25);
        assertThat(result.getTotalPages()).isEqualTo(3);
        assertThat(result.getNumber()).isEqualTo(0);
        assertThat(result.isFirst()).isTrue();
        assertThat(result.isLast()).isFalse();
    }

    @Test
    void testPagination_EmptyPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Dossier> result = dossierRepository.findAll(pageable);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
        assertThat(result.getTotalPages()).isEqualTo(0);
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
}
