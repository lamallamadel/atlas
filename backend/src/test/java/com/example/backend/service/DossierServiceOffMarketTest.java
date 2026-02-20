package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.MatchRequest;
import com.example.backend.brain.dto.MatchResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DossierServiceOffMarketTest {

    private static final String DEFAULT_ORG = "org123";

    @Autowired
    private DossierService dossierService;

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private AnnonceRepository annonceRepository;

    @MockBean
    private BrainClientService brainClientService;

    @BeforeEach
    void setUp() {
        dossierRepository.deleteAll();
        annonceRepository.deleteAll();
        TenantContext.setOrgId(DEFAULT_ORG);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void matchOffMarket_HappyPath_ReturnsMatchResponse() {
        // Arrange
        Dossier dossier = new Dossier();
        dossier.setOrgId(DEFAULT_ORG);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("Lead Off Market");
        dossier.setStatus(DossierStatus.NEW);
        dossier.setNotes("Looking for a quiet place");
        Dossier savedDossier = dossierRepository.save(dossier);
        final Long dossierId = savedDossier.getId();

        Annonce draftAnnonce = new Annonce();
        draftAnnonce.setOrgId(DEFAULT_ORG);
        draftAnnonce.setTitle("Draft Off Market");
        draftAnnonce.setDescription("Secret villa");
        draftAnnonce.setCity("Paris");
        draftAnnonce.setPrice(BigDecimal.valueOf(1500000));
        draftAnnonce.setStatus(AnnonceStatus.DRAFT);
        annonceRepository.save(draftAnnonce);

        Annonce publishedAnnonce = new Annonce();
        publishedAnnonce.setOrgId(DEFAULT_ORG);
        publishedAnnonce.setTitle("Published Off Market");
        publishedAnnonce.setCity("Lyon");
        publishedAnnonce.setPrice(BigDecimal.valueOf(200000));
        publishedAnnonce.setStatus(AnnonceStatus.PUBLISHED);
        annonceRepository.save(publishedAnnonce);

        MatchResponse expectedResponse = new MatchResponse();
        expectedResponse.setMatches(List.of(Map.of("annonce_id", draftAnnonce.getId(), "score", 0.95)));

        when(brainClientService.calculateMatch(any(MatchRequest.class))).thenAnswer(invocation -> {
            MatchRequest req = invocation.getArgument(0);
            assertThat(req.getClientId()).isEqualTo(dossierId);
            assertThat(req.getPreferences()).containsEntry("notes", "Looking for a quiet place");
            assertThat(req.getBiens()).hasSize(1);
            assertThat(req.getBiens().get(0)).containsEntry("title", "Draft Off Market");
            return Optional.of(expectedResponse);
        });

        // Act
        MatchResponse response = dossierService.matchOffMarket(dossierId);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getMatches()).hasSize(1);
        assertThat(response.getMatches().get(0)).containsEntry("score", 0.95);
    }
}
