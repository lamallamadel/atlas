package com.example.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.brain.BrainClientService;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.service.NotificationService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

/** Acheteurs potentiels d'une annonce (brain simulé). */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class AnnonceBuyerMatchBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG1 = "ORG1";

    @Autowired private AnnonceRepository annonceRepository;
    @Autowired private DossierRepository dossierRepository;
    @MockitoBean private BrainClientService brainClientService;
    @MockitoBean private NotificationService notificationService;

    private Long annonceId;
    private Long buyerId;

    @BeforeEach
    void setUp() {
        Annonce a = new Annonce();
        a.setOrgId(ORG1);
        a.setTitle("Villa Achakar");
        a.setCity("Tanger");
        a.setType(AnnonceType.SALE);
        a.setStatus(AnnonceStatus.ACTIVE);
        a.setPrice(new BigDecimal("3000000"));
        annonceId = annonceRepository.save(a).getId();

        Dossier d = new Dossier();
        d.setOrgId(ORG1);
        d.setLeadName("Youssef");
        d.setLeadPhone("+212600000002");
        d.setStatus(DossierStatus.QUALIFIED);
        d.setSearchCriteria(Map.of("cities", List.of("Tanger")));
        buyerId = dossierRepository.save(d).getId();
    }

    private String base() {
        return "/api/v1/annonces/" + annonceId + "/buyer-matches";
    }

    @Test
    void actualiser_lister_ecarter() throws Exception {
        when(brainClientService.matchBuyers(any()))
                .thenReturn(
                        Optional.of(
                                Map.of(
                                        "resultats",
                                        List.of(
                                                Map.of(
                                                        "client_id",
                                                        buyerId,
                                                        "score_match",
                                                        90,
                                                        "raisons",
                                                        List.of("Ville recherchée (Tanger)"),
                                                        "alertes",
                                                        List.of("Piscine : non trouvé"))))));

        MvcResult res =
                mockMvc.perform(withTenantHeaders(post(base() + "/refresh"), ORG1))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$[0].dossierId").value(buyerId))
                        .andExpect(jsonPath("$[0].leadName").value("Youssef"))
                        .andExpect(jsonPath("$[0].score").value(90))
                        .andExpect(jsonPath("$[0].status").value("NEW"))
                        .andExpect(jsonPath("$[0].reasons[0]").value("Ville recherchée (Tanger)"))
                        .andExpect(jsonPath("$[0].alerts[0]").value("Piscine : non trouvé"))
                        .andReturn();
        long matchId =
                objectMapper
                        .readTree(res.getResponse().getContentAsString())
                        .get(0)
                        .get("id")
                        .asLong();

        mockMvc.perform(withTenantHeaders(get(base()), ORG1))
                .andExpect(jsonPath("$[0].status").value("NEW"));
        mockMvc.perform(withTenantHeaders(get(base()), ORG1))
                .andExpect(jsonPath("$[0].status").value("SEEN"));

        mockMvc.perform(withTenantHeaders(post(base() + "/" + matchId + "/dismiss"), ORG1))
                .andExpect(status().isNoContent());
        mockMvc.perform(withTenantHeaders(get(base()), ORG1))
                .andExpect(jsonPath("$[0].status").value("DISMISSED"));
        mockMvc.perform(withTenantHeaders(delete(base() + "/" + matchId + "/dismiss"), ORG1))
                .andExpect(status().isNoContent());
        mockMvc.perform(withTenantHeaders(get(base()), ORG1))
                .andExpect(jsonPath("$[0].status").value("SEEN"));
    }

    @Test
    void brain_indisponible_503() throws Exception {
        when(brainClientService.matchBuyers(any())).thenReturn(Optional.empty());
        mockMvc.perform(withTenantHeaders(post(base() + "/refresh"), ORG1))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void autre_organisation_404() throws Exception {
        mockMvc.perform(withTenantHeaders(get(base()), "ORG2")).andExpect(status().isNotFound());
        mockMvc.perform(withTenantHeaders(post(base() + "/refresh"), "ORG2"))
                .andExpect(status().isNotFound());
    }
}
