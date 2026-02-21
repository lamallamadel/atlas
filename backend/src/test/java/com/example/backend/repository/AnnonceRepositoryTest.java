package com.example.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
// import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
// Si tu utilises une vraie DB (Testcontainers / Docker / Postgres externe) pour les tests JPA,
// décommente ceci pour empêcher Spring de remplacer ta datasource par H2.
// @AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AnnonceRepositoryTest {

    @Autowired private AnnonceRepository annonceRepository;

    @BeforeEach
    void setUp() {
        annonceRepository.deleteAll();
    }

    @Test
    void testPagination_FirstPage() {
        for (int i = 0; i < 25; i++) {
            Annonce annonce = createAnnonce("org1", "Title " + i, AnnonceStatus.PUBLISHED);
            annonceRepository.save(annonce);
        }
        // Optionnel (stabilité): annonceRepository.flush();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Annonce> result = annonceRepository.findAll(pageable);

        assertThat(result.getContent()).hasSize(10);
        assertThat(result.getTotalElements()).isEqualTo(25);
        assertThat(result.getTotalPages()).isEqualTo(3);
        assertThat(result.getNumber()).isEqualTo(0);
        assertThat(result.isFirst()).isTrue();
        assertThat(result.isLast()).isFalse();
    }

    @Test
    void testPagination_SecondPage() {
        for (int i = 0; i < 25; i++) {
            Annonce annonce = createAnnonce("org1", "Title " + i, AnnonceStatus.PUBLISHED);
            annonceRepository.save(annonce);
        }
        // Optionnel (stabilité): annonceRepository.flush();

        Pageable pageable = PageRequest.of(1, 10);
        Page<Annonce> result = annonceRepository.findAll(pageable);

        assertThat(result.getContent()).hasSize(10);
        assertThat(result.getTotalElements()).isEqualTo(25);
        assertThat(result.getNumber()).isEqualTo(1);
        assertThat(result.isFirst()).isFalse();
        assertThat(result.isLast()).isFalse();
    }

    @Test
    void testPagination_LastPage() {
        for (int i = 0; i < 25; i++) {
            Annonce annonce = createAnnonce("org1", "Title " + i, AnnonceStatus.PUBLISHED);
            annonceRepository.save(annonce);
        }
        // Optionnel (stabilité): annonceRepository.flush();

        Pageable pageable = PageRequest.of(2, 10);
        Page<Annonce> result = annonceRepository.findAll(pageable);

        assertThat(result.getContent()).hasSize(5);
        assertThat(result.getTotalElements()).isEqualTo(25);
        assertThat(result.getNumber()).isEqualTo(2);
        assertThat(result.isFirst()).isFalse();
        assertThat(result.isLast()).isTrue();
    }

    @Test
    void testPagination_EmptyPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Annonce> result = annonceRepository.findAll(pageable);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
        assertThat(result.getTotalPages()).isEqualTo(0);
    }

    @Test
    void testStatusFiltering_Published() {
        annonceRepository.save(createAnnonce("org1", "Published 1", AnnonceStatus.PUBLISHED));
        annonceRepository.save(createAnnonce("org1", "Published 2", AnnonceStatus.PUBLISHED));
        annonceRepository.save(createAnnonce("org1", "Draft 1", AnnonceStatus.DRAFT));
        annonceRepository.save(createAnnonce("org1", "Archived 1", AnnonceStatus.ARCHIVED));
        // Optionnel (stabilité): annonceRepository.flush();

        Specification<Annonce> spec =
                (root, query, criteriaBuilder) ->
                        criteriaBuilder.equal(root.get("status"), AnnonceStatus.PUBLISHED);

        List<Annonce> result = annonceRepository.findAll(spec);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(a -> a.getStatus() == AnnonceStatus.PUBLISHED);
    }

    @Test
    void testStatusFiltering_Draft() {
        annonceRepository.save(createAnnonce("org1", "Published 1", AnnonceStatus.PUBLISHED));
        annonceRepository.save(createAnnonce("org1", "Draft 1", AnnonceStatus.DRAFT));
        annonceRepository.save(createAnnonce("org1", "Draft 2", AnnonceStatus.DRAFT));
        annonceRepository.save(createAnnonce("org1", "Archived 1", AnnonceStatus.ARCHIVED));
        // Optionnel (stabilité): annonceRepository.flush();

        Specification<Annonce> spec =
                (root, query, criteriaBuilder) ->
                        criteriaBuilder.equal(root.get("status"), AnnonceStatus.DRAFT);

        List<Annonce> result = annonceRepository.findAll(spec);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(a -> a.getStatus() == AnnonceStatus.DRAFT);
    }

    @Test
    void testStatusFiltering_Archived() {
        annonceRepository.save(createAnnonce("org1", "Published 1", AnnonceStatus.PUBLISHED));
        annonceRepository.save(createAnnonce("org1", "Draft 1", AnnonceStatus.DRAFT));
        annonceRepository.save(createAnnonce("org1", "Archived 1", AnnonceStatus.ARCHIVED));
        // Optionnel (stabilité): annonceRepository.flush();

        Specification<Annonce> spec =
                (root, query, criteriaBuilder) ->
                        criteriaBuilder.equal(root.get("status"), AnnonceStatus.ARCHIVED);

        List<Annonce> result = annonceRepository.findAll(spec);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(AnnonceStatus.ARCHIVED);
    }

    @Test
    void testStatusFilteringWithPagination() {
        for (int i = 0; i < 15; i++) {
            annonceRepository.save(
                    createAnnonce("org1", "Published " + i, AnnonceStatus.PUBLISHED));
        }
        for (int i = 0; i < 10; i++) {
            annonceRepository.save(createAnnonce("org1", "Draft " + i, AnnonceStatus.DRAFT));
        }
        // Optionnel (stabilité): annonceRepository.flush();

        Specification<Annonce> spec =
                (root, query, criteriaBuilder) ->
                        criteriaBuilder.equal(root.get("status"), AnnonceStatus.PUBLISHED);
        Pageable pageable = PageRequest.of(0, 10);

        Page<Annonce> result = annonceRepository.findAll(spec, pageable);

        assertThat(result.getContent()).hasSize(10);
        assertThat(result.getTotalElements()).isEqualTo(15);
        assertThat(result.getTotalPages()).isEqualTo(2);
        assertThat(result.getContent()).allMatch(a -> a.getStatus() == AnnonceStatus.PUBLISHED);
    }

    @Test
    void testMultipleStatusFiltering() {
        annonceRepository.save(createAnnonce("org1", "Published 1", AnnonceStatus.PUBLISHED));
        annonceRepository.save(createAnnonce("org1", "Draft 1", AnnonceStatus.DRAFT));
        annonceRepository.save(createAnnonce("org1", "Archived 1", AnnonceStatus.ARCHIVED));
        annonceRepository.save(createAnnonce("org1", "Draft 2", AnnonceStatus.DRAFT));
        // Optionnel (stabilité): annonceRepository.flush();

        Specification<Annonce> spec =
                (root, query, criteriaBuilder) ->
                        root.get("status").in(AnnonceStatus.DRAFT, AnnonceStatus.PUBLISHED);

        List<Annonce> result = annonceRepository.findAll(spec);

        assertThat(result).hasSize(3);
        assertThat(result).noneMatch(a -> a.getStatus() == AnnonceStatus.ARCHIVED);
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
