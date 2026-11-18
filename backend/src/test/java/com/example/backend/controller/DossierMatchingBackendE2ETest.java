package com.example.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.MatchResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** Critères de recherche d'un dossier et biens correspondants (brain simulé). */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class DossierMatchingBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";
    private static final String ORG2 = "ORG2";
    private static final String CRITERIA =
            """
            {"transactionTypes":["SALE"],"cities":["Tanger"],"budgetMax":1200000,
             "surfaceMin":80,"furnished":true,"equipments":["piscine"],"acceptedConditions":["neuf"]}
            """;

    @Autowired private DossierRepository dossierRepository;
    @Autowired private AnnonceRepository annonceRepository;
    @MockitoBean private BrainClientService brainClientService;

    private Long dossierId;
    private Long annonceId;

    @BeforeEach
    void setUp() {
        dossierRepository.deleteAll();
        annonceRepository.deleteAll();
        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadPhone("+212600000000");
        d.setLeadName("Acheteur");
        d.setStatus(DossierStatus.NEW);
        dossierId = dossierRepository.save(d).getId();

        Annonce a = new Annonce();
        a.setOrgId(ORG1);
        a.setTitle("Appartement vue mer");
        a.setCity("Tanger");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        a.setPrice(new BigDecimal("1000000"));
        a.setSurface(95.0);
        annonceId = annonceRepository.save(a).getId();
    }

    private String base() {
        return "/api/v1/dossiers/" + dossierId;
    }

    private void saveCriteria() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(put(base() + "/search-criteria"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(CRITERIA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cities[0]").value("Tanger"));
    }

    @Test
    void criteres_enregistres_puis_relus() throws Exception {
        mockMvc.perform(withTenantHeaders(get(base() + "/search-criteria"), ORG1))
                .andExpect(status().isNoContent());
        saveCriteria();
        mockMvc.perform(withTenantHeaders(get(base() + "/search-criteria"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.budgetMax").value(1200000))
                .andExpect(jsonPath("$.furnished").value(true))
                .andExpect(jsonPath("$.acceptedConditions[0]").value("neuf"));
    }

    @Test
    void criteres_invalides() throws Exception {
        mockMvc.perform(
                        withTenantHeaders(put(base() + "/search-criteria"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"budgetMin\":-5}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        withTenantHeaders(put(base() + "/search-criteria"), ORG1)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void biens_correspondants() throws Exception {
        saveCriteria();
        MatchResponse brain = new MatchResponse();
        brain.setMatches(
                List.of(
                        Map.of(
                                "bien_id",
                                annonceId,
                                "score_match",
                                85,
                                "raisons",
                                List.of("Dans le budget (1 000 000 MAD)"),
                                "alertes",
                                List.of("Piscine : non trouvé"))));
        brain.setExclus(Map.of());
        when(brainClientService.calculateMatch(any())).thenReturn(Optional.of(brain));

        mockMvc.perform(withTenantHeaders(get(base() + "/matches"), ORG1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scope").value("ALL"))
                .andExpect(jsonPath("$.totalCandidates").value(1))
                .andExpect(jsonPath("$.matches[0].annonceId").value(annonceId))
                .andExpect(jsonPath("$.matches[0].title").value("Appartement vue mer"))
                .andExpect(jsonPath("$.matches[0].score").value(85))
                .andExpect(
                        jsonPath("$.matches[0].reasons[0]").value("Dans le budget (1 000 000 MAD)"))
                .andExpect(jsonPath("$.matches[0].alerts[0]").value("Piscine : non trouvé"))
                .andExpect(jsonPath("$.matches[0].photosAnalyzed").value(false));
    }

    @Test
    void sans_critere_400_et_brain_indisponible_503() throws Exception {
        mockMvc.perform(withTenantHeaders(get(base() + "/matches"), ORG1))
                .andExpect(status().isBadRequest());
        saveCriteria();
        when(brainClientService.calculateMatch(any())).thenReturn(Optional.empty());
        mockMvc.perform(withTenantHeaders(get(base() + "/matches"), ORG1))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void autre_organisation() throws Exception {
        mockMvc.perform(withTenantHeaders(get(base() + "/search-criteria"), ORG2))
                .andExpect(status().isNotFound());
        mockMvc.perform(
                        withTenantHeaders(put(base() + "/search-criteria"), ORG2)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(CRITERIA))
                .andExpect(status().isNotFound());
        mockMvc.perform(withTenantHeaders(get(base() + "/matches"), ORG2))
                .andExpect(status().isNotFound());
    }
}
