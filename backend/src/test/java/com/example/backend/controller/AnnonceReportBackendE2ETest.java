package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.AnnonceReport;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceReportRepository;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.utils.BackendE2ETestDataBuilder;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Étape 5 du backlog : un visiteur signale une annonce publiée, l'agence qui la publie (et elle
 * seule) voit le signalement, l'écarte ou suspend l'annonce, qui sort alors du portail.
 */
@BackendE2ETest
@WithMockUser(roles = {"PRO"})
class AnnonceReportBackendE2ETest extends BaseBackendE2ETest {

    private static final String AGENCY_A = "agence-rabat";
    private static final String AGENCY_B = "agence-fes";

    @Autowired private BackendE2ETestDataBuilder testDataBuilder;
    @Autowired private AnnonceReportRepository reportRepository;
    @Autowired private AnnonceRepository annonceRepository;

    private Annonce published(String orgId) {
        return testDataBuilder
                .annonceBuilder()
                .withOrgId(orgId)
                .withStatus(AnnonceStatus.PUBLISHED)
                .persist();
    }

    private ResultActions report(Long annonceId, String reason, String ip) throws Exception {
        return mockMvc.perform(
                post("/api/v1/portal/annonces/{id}/reports", annonceId)
                        .header("CF-Connecting-IP", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                objectMapper.writeValueAsString(
                                        Map.of(
                                                "reasonCode", reason,
                                                "comment", "Le prix est trop beau",
                                                "email", "visiteur@example.ma"))));
    }

    private ResultActions close(String org, Long reportId, String resolution) throws Exception {
        return mockMvc.perform(
                withTenantHeaders(post("/api/v1/annonce-reports/{id}/close", reportId), org)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                objectMapper.writeValueAsString(
                                        Map.of("resolution", resolution, "comment", "Vérifié"))));
    }

    private List<AnnonceReport> reportsOf(Long annonceId) {
        return reportRepository.findAll().stream()
                .filter(r -> annonceId.equals(r.getAnnonceId()))
                .toList();
    }

    @Test
    void visitorReportReachesTheOwningAgencyOnce() throws Exception {
        Annonce a = published(AGENCY_A);

        report(a.getId(), "REPORT_FRAUD", "196.1.1.1")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RECEIVED"));
        // Même visiteur, même annonce : pas de doublon.
        report(a.getId(), "REPORT_FRAUD", "196.1.1.1").andExpect(status().isCreated());

        List<AnnonceReport> stored = reportsOf(a.getId());
        assertThat(stored).hasSize(1);
        assertThat(stored.get(0).getOrgId()).isEqualTo(AGENCY_A);
        assertThat(stored.get(0).getStatus()).isEqualTo(AnnonceReport.STATUS_OPEN);
        assertThat(stored.get(0).getIpAddress()).isEqualTo("196.1.1.1");
    }

    @Test
    void invalidReasonOrNonPublicAnnonceIsRejected() throws Exception {
        Annonce a = published(AGENCY_A);
        Annonce draft =
                testDataBuilder
                        .annonceBuilder()
                        .withOrgId(AGENCY_A)
                        .withStatus(AnnonceStatus.DRAFT)
                        .persist();

        report(a.getId(), "PAS_UN_MOTIF", "196.1.1.2").andExpect(status().isBadRequest());
        report(draft.getId(), "REPORT_FRAUD", "196.1.1.2").andExpect(status().isNotFound());
        assertThat(reportsOf(a.getId())).isEmpty();
    }

    @Test
    void onlyTheOwningAgencySeesTheReport() throws Exception {
        Annonce a = published(AGENCY_A);
        report(a.getId(), "REPORT_INCORRECT_INFO", "196.1.1.3").andExpect(status().isCreated());

        mockMvc.perform(withTenantHeaders(get("/api/v1/annonce-reports"), AGENCY_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].annonceId").value(a.getId()))
                .andExpect(jsonPath("$[0].reasonCode").value("REPORT_INCORRECT_INFO"))
                .andExpect(jsonPath("$[0].reporterEmail").value("visiteur@example.ma"))
                // L'IP et le navigateur du visiteur ne sortent pas.
                .andExpect(jsonPath("$[0].ipAddress").doesNotExist());

        mockMvc.perform(withTenantHeaders(get("/api/v1/annonce-reports"), AGENCY_B))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/annonces/{id}/reports", a.getId()), AGENCY_B))
                .andExpect(status().isNotFound());
        Long reportId = reportsOf(a.getId()).get(0).getId();
        close(AGENCY_B, reportId, "DISMISSED").andExpect(status().isNotFound());
    }

    @Test
    void dismissingKeepsTheAnnonceOnline() throws Exception {
        Annonce a = published(AGENCY_A);
        report(a.getId(), "REPORT_OTHER", "196.1.1.4").andExpect(status().isCreated());
        Long reportId = reportsOf(a.getId()).get(0).getId();

        close(AGENCY_A, reportId, "DISMISSED")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.resolution").value("DISMISSED"));
        close(AGENCY_A, reportId, "DISMISSED").andExpect(status().isConflict());

        assertThat(annonceRepository.findById(a.getId()).orElseThrow().getStatus())
                .isEqualTo(AnnonceStatus.PUBLISHED);
    }

    @Test
    void suspendingRemovesTheAnnonceFromThePortalAndClosesAllItsReports() throws Exception {
        Annonce a = published(AGENCY_A);
        report(a.getId(), "REPORT_FRAUD", "196.1.1.5").andExpect(status().isCreated());
        report(a.getId(), "REPORT_DUPLICATE", "196.1.1.6").andExpect(status().isCreated());

        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/annonces/{id}/publication", a.getId()), AGENCY_A))
                .andExpect(jsonPath("$.openReports").value(2));

        Long fraudReport =
                reportsOf(a.getId()).stream()
                        .filter(r -> "REPORT_FRAUD".equals(r.getReasonCode()))
                        .findFirst()
                        .orElseThrow()
                        .getId();
        close(AGENCY_A, fraudReport, "ANNONCE_SUSPENDED")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolution").value("ANNONCE_SUSPENDED"));

        Annonce after = annonceRepository.findById(a.getId()).orElseThrow();
        assertThat(after.getStatus()).isEqualTo(AnnonceStatus.SUSPENDED);
        @SuppressWarnings("unchecked")
        Map<String, Object> suspension = (Map<String, Object>) after.getMeta().get("suspension");
        assertThat(suspension.get("reasonCode")).isEqualTo("MOD_SUSPECT_FRAUD");
        assertThat(reportsOf(a.getId()))
                .allMatch(r -> AnnonceReport.STATUS_CLOSED.equals(r.getStatus()))
                .allMatch(
                        r -> AnnonceReport.RESOLUTION_ANNONCE_SUSPENDED.equals(r.getResolution()));

        mockMvc.perform(get("/api/v1/portal/annonces/{id}", a.getId()))
                .andExpect(status().isNotFound());
        mockMvc.perform(
                        withTenantHeaders(
                                get("/api/v1/annonces/{id}/publication", a.getId()), AGENCY_A))
                .andExpect(jsonPath("$.openReports").value(0));
    }
}
