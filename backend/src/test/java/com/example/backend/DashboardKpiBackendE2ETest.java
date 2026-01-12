package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
@WithMockUser(roles = {"PRO", "ADMIN"})
public class DashboardKpiBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG_ID_1 = "test-org-dashboard-1";
    private static final String ORG_ID_2 = "test-org-dashboard-2";
    private static final String BASE_URL = "/api/v1/dashboard/kpis/trends";

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @BeforeEach
    void setUp() {
        annonceRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        com.example.backend.util.TenantContext.clear();
    }

    @Test
    void testGetTrends_Returns200WithValidStructure() throws Exception {
        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives").exists())
                .andExpect(jsonPath("$.annoncesActives.currentValue").isNumber())
                .andExpect(jsonPath("$.annoncesActives.previousValue").isNumber())
                .andExpect(jsonPath("$.annoncesActives.percentageChange").isNumber())
                .andExpect(jsonPath("$.dossiersATraiter").exists())
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").isNumber())
                .andExpect(jsonPath("$.dossiersATraiter.previousValue").isNumber())
                .andExpect(jsonPath("$.dossiersATraiter.percentageChange").isNumber());
    }

    @Test
    void testGetTrends_EmptyDatabase_ReturnsZeroCounts() throws Exception {
        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(0))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(0))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(0.0))
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").value(0))
                .andExpect(jsonPath("$.dossiersATraiter.previousValue").value(0))
                .andExpect(jsonPath("$.dossiersATraiter.percentageChange").value(0.0));
    }

    @Test
    void testGetTrends_WithSampleData_ShowsCorrectCountsAndPercentage() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        LocalDateTime yesterday = today.minusDays(1);

        Annonce annonce1 = new Annonce();
        annonce1.setOrgId(ORG_ID_1);
        annonce1.setTitle("Property 1");
        annonce1.setStatus(AnnonceStatus.ACTIVE);
        annonce1.setType(AnnonceType.SALE);
        annonce1.setPrice(BigDecimal.valueOf(100000));
        annonce1.setCurrency("EUR");
        annonce1.setCreatedAt(today.plusHours(2));
        annonce1.setUpdatedAt(today.plusHours(2));
        annonceRepository.save(annonce1);

        Annonce annonce2 = new Annonce();
        annonce2.setOrgId(ORG_ID_1);
        annonce2.setTitle("Property 2");
        annonce2.setStatus(AnnonceStatus.ACTIVE);
        annonce2.setType(AnnonceType.RENTAL);
        annonce2.setPrice(BigDecimal.valueOf(1000));
        annonce2.setCurrency("EUR");
        annonce2.setCreatedAt(today.plusHours(5));
        annonce2.setUpdatedAt(today.plusHours(5));
        annonceRepository.save(annonce2);

        Annonce annonce3 = new Annonce();
        annonce3.setOrgId(ORG_ID_1);
        annonce3.setTitle("Property 3");
        annonce3.setStatus(AnnonceStatus.ACTIVE);
        annonce3.setType(AnnonceType.SALE);
        annonce3.setPrice(BigDecimal.valueOf(200000));
        annonce3.setCurrency("EUR");
        annonce3.setCreatedAt(yesterday.plusHours(10));
        annonce3.setUpdatedAt(yesterday.plusHours(10));
        annonceRepository.save(annonce3);

        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID_1);
        dossier1.setLeadName("Lead 1");
        dossier1.setLeadPhone("+33600000001");
        dossier1.setStatus(DossierStatus.NEW);
        dossier1.setCreatedAt(today.plusHours(3));
        dossier1.setUpdatedAt(today.plusHours(3));
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_ID_1);
        dossier2.setLeadName("Lead 2");
        dossier2.setLeadPhone("+33600000002");
        dossier2.setStatus(DossierStatus.QUALIFIED);
        dossier2.setCreatedAt(today.plusHours(4));
        dossier2.setUpdatedAt(today.plusHours(4));
        dossierRepository.save(dossier2);

        Dossier dossier3 = new Dossier();
        dossier3.setOrgId(ORG_ID_1);
        dossier3.setLeadName("Lead 3");
        dossier3.setLeadPhone("+33600000003");
        dossier3.setStatus(DossierStatus.NEW);
        dossier3.setCreatedAt(yesterday.plusHours(8));
        dossier3.setUpdatedAt(yesterday.plusHours(8));
        dossierRepository.save(dossier3);

        Dossier dossier4 = new Dossier();
        dossier4.setOrgId(ORG_ID_1);
        dossier4.setLeadName("Lead 4");
        dossier4.setLeadPhone("+33600000004");
        dossier4.setStatus(DossierStatus.QUALIFIED);
        dossier4.setCreatedAt(yesterday.plusHours(12));
        dossier4.setUpdatedAt(yesterday.plusHours(12));
        dossierRepository.save(dossier4);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(2))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(100.0))
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").value(2))
                .andExpect(jsonPath("$.dossiersATraiter.previousValue").value(2))
                .andExpect(jsonPath("$.dossiersATraiter.percentageChange").value(0.0));
    }

    @Test
    void testGetTrends_PeriodToday_CalculatesCorrectly() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        LocalDateTime yesterday = today.minusDays(1);
        LocalDateTime twoDaysAgo = today.minusDays(2);

        Annonce todayAnnonce = new Annonce();
        todayAnnonce.setOrgId(ORG_ID_1);
        todayAnnonce.setTitle("Today Property");
        todayAnnonce.setStatus(AnnonceStatus.ACTIVE);
        todayAnnonce.setType(AnnonceType.SALE);
        todayAnnonce.setPrice(BigDecimal.valueOf(100000));
        todayAnnonce.setCurrency("EUR");
        todayAnnonce.setCreatedAt(today.plusHours(1));
        todayAnnonce.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(todayAnnonce);

        Annonce yesterdayAnnonce = new Annonce();
        yesterdayAnnonce.setOrgId(ORG_ID_1);
        yesterdayAnnonce.setTitle("Yesterday Property");
        yesterdayAnnonce.setStatus(AnnonceStatus.ACTIVE);
        yesterdayAnnonce.setType(AnnonceType.RENTAL);
        yesterdayAnnonce.setPrice(BigDecimal.valueOf(1000));
        yesterdayAnnonce.setCurrency("EUR");
        yesterdayAnnonce.setCreatedAt(yesterday.plusHours(1));
        yesterdayAnnonce.setUpdatedAt(yesterday.plusHours(1));
        annonceRepository.save(yesterdayAnnonce);

        Annonce twoDaysAgoAnnonce = new Annonce();
        twoDaysAgoAnnonce.setOrgId(ORG_ID_1);
        twoDaysAgoAnnonce.setTitle("Two Days Ago Property");
        twoDaysAgoAnnonce.setStatus(AnnonceStatus.ACTIVE);
        twoDaysAgoAnnonce.setType(AnnonceType.SALE);
        twoDaysAgoAnnonce.setPrice(BigDecimal.valueOf(150000));
        twoDaysAgoAnnonce.setCurrency("EUR");
        twoDaysAgoAnnonce.setCreatedAt(twoDaysAgo.plusHours(1));
        twoDaysAgoAnnonce.setUpdatedAt(twoDaysAgo.plusHours(1));
        annonceRepository.save(twoDaysAgoAnnonce);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(0.0));
    }

    @Test
    void testGetTrends_PeriodLast7Days_CalculatesCorrectly() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fiveDaysAgo = now.minusDays(5);
        LocalDateTime tenDaysAgo = now.minusDays(10);
        LocalDateTime fifteenDaysAgo = now.minusDays(15);

        Annonce recent = new Annonce();
        recent.setOrgId(ORG_ID_1);
        recent.setTitle("Recent Property");
        recent.setStatus(AnnonceStatus.ACTIVE);
        recent.setType(AnnonceType.SALE);
        recent.setPrice(BigDecimal.valueOf(100000));
        recent.setCurrency("EUR");
        recent.setCreatedAt(fiveDaysAgo);
        recent.setUpdatedAt(fiveDaysAgo);
        annonceRepository.save(recent);

        Annonce previous = new Annonce();
        previous.setOrgId(ORG_ID_1);
        previous.setTitle("Previous Property");
        previous.setStatus(AnnonceStatus.ACTIVE);
        previous.setType(AnnonceType.RENTAL);
        previous.setPrice(BigDecimal.valueOf(1000));
        previous.setCurrency("EUR");
        previous.setCreatedAt(tenDaysAgo);
        previous.setUpdatedAt(tenDaysAgo);
        annonceRepository.save(previous);

        Annonce old = new Annonce();
        old.setOrgId(ORG_ID_1);
        old.setTitle("Old Property");
        old.setStatus(AnnonceStatus.ACTIVE);
        old.setType(AnnonceType.SALE);
        old.setPrice(BigDecimal.valueOf(150000));
        old.setCurrency("EUR");
        old.setCreatedAt(fifteenDaysAgo);
        old.setUpdatedAt(fifteenDaysAgo);
        annonceRepository.save(old);

        Dossier recentDossier = new Dossier();
        recentDossier.setOrgId(ORG_ID_1);
        recentDossier.setLeadName("Recent Lead");
        recentDossier.setLeadPhone("+33600000001");
        recentDossier.setStatus(DossierStatus.NEW);
        recentDossier.setCreatedAt(fiveDaysAgo);
        recentDossier.setUpdatedAt(fiveDaysAgo);
        dossierRepository.save(recentDossier);

        Dossier previousDossier = new Dossier();
        previousDossier.setOrgId(ORG_ID_1);
        previousDossier.setLeadName("Previous Lead");
        previousDossier.setLeadPhone("+33600000002");
        previousDossier.setStatus(DossierStatus.QUALIFIED);
        previousDossier.setCreatedAt(tenDaysAgo);
        previousDossier.setUpdatedAt(tenDaysAgo);
        dossierRepository.save(previousDossier);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "LAST_7_DAYS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(0.0))
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").value(1))
                .andExpect(jsonPath("$.dossiersATraiter.previousValue").value(1))
                .andExpect(jsonPath("$.dossiersATraiter.percentageChange").value(0.0));
    }

    @Test
    void testGetTrends_PeriodLast30Days_CalculatesCorrectly() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twentyDaysAgo = now.minusDays(20);
        LocalDateTime fortyDaysAgo = now.minusDays(40);
        LocalDateTime sixtyDaysAgo = now.minusDays(60);

        Annonce recent = new Annonce();
        recent.setOrgId(ORG_ID_1);
        recent.setTitle("Recent Property");
        recent.setStatus(AnnonceStatus.ACTIVE);
        recent.setType(AnnonceType.SALE);
        recent.setPrice(BigDecimal.valueOf(100000));
        recent.setCurrency("EUR");
        recent.setCreatedAt(twentyDaysAgo);
        recent.setUpdatedAt(twentyDaysAgo);
        annonceRepository.save(recent);

        Annonce recent2 = new Annonce();
        recent2.setOrgId(ORG_ID_1);
        recent2.setTitle("Recent Property 2");
        recent2.setStatus(AnnonceStatus.ACTIVE);
        recent2.setType(AnnonceType.RENTAL);
        recent2.setPrice(BigDecimal.valueOf(1500));
        recent2.setCurrency("EUR");
        recent2.setCreatedAt(twentyDaysAgo.plusDays(5));
        recent2.setUpdatedAt(twentyDaysAgo.plusDays(5));
        annonceRepository.save(recent2);

        Annonce previous = new Annonce();
        previous.setOrgId(ORG_ID_1);
        previous.setTitle("Previous Property");
        previous.setStatus(AnnonceStatus.ACTIVE);
        previous.setType(AnnonceType.SALE);
        previous.setPrice(BigDecimal.valueOf(120000));
        previous.setCurrency("EUR");
        previous.setCreatedAt(fortyDaysAgo);
        previous.setUpdatedAt(fortyDaysAgo);
        annonceRepository.save(previous);

        Annonce old = new Annonce();
        old.setOrgId(ORG_ID_1);
        old.setTitle("Old Property");
        old.setStatus(AnnonceStatus.ACTIVE);
        old.setType(AnnonceType.SALE);
        old.setPrice(BigDecimal.valueOf(150000));
        old.setCurrency("EUR");
        old.setCreatedAt(sixtyDaysAgo);
        old.setUpdatedAt(sixtyDaysAgo);
        annonceRepository.save(old);

        Dossier recentDossier1 = new Dossier();
        recentDossier1.setOrgId(ORG_ID_1);
        recentDossier1.setLeadName("Recent Lead 1");
        recentDossier1.setLeadPhone("+33600000001");
        recentDossier1.setStatus(DossierStatus.NEW);
        recentDossier1.setCreatedAt(twentyDaysAgo);
        recentDossier1.setUpdatedAt(twentyDaysAgo);
        dossierRepository.save(recentDossier1);

        Dossier recentDossier2 = new Dossier();
        recentDossier2.setOrgId(ORG_ID_1);
        recentDossier2.setLeadName("Recent Lead 2");
        recentDossier2.setLeadPhone("+33600000002");
        recentDossier2.setStatus(DossierStatus.QUALIFIED);
        recentDossier2.setCreatedAt(twentyDaysAgo.plusDays(3));
        recentDossier2.setUpdatedAt(twentyDaysAgo.plusDays(3));
        dossierRepository.save(recentDossier2);

        Dossier recentDossier3 = new Dossier();
        recentDossier3.setOrgId(ORG_ID_1);
        recentDossier3.setLeadName("Recent Lead 3");
        recentDossier3.setLeadPhone("+33600000003");
        recentDossier3.setStatus(DossierStatus.NEW);
        recentDossier3.setCreatedAt(twentyDaysAgo.plusDays(7));
        recentDossier3.setUpdatedAt(twentyDaysAgo.plusDays(7));
        dossierRepository.save(recentDossier3);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "LAST_30_DAYS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(2))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(100.0))
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").value(3))
                .andExpect(jsonPath("$.dossiersATraiter.previousValue").value(0))
                .andExpect(jsonPath("$.dossiersATraiter.percentageChange").value(100.0));
    }

    @Test
    void testGetTrends_MultiTenantIsolation_OrgId1() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();

        Annonce annonce1 = new Annonce();
        annonce1.setOrgId(ORG_ID_1);
        annonce1.setTitle("Org 1 Property");
        annonce1.setStatus(AnnonceStatus.ACTIVE);
        annonce1.setType(AnnonceType.SALE);
        annonce1.setPrice(BigDecimal.valueOf(100000));
        annonce1.setCurrency("EUR");
        annonce1.setCreatedAt(today.plusHours(1));
        annonce1.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(annonce1);

        Annonce annonce2 = new Annonce();
        annonce2.setOrgId(ORG_ID_2);
        annonce2.setTitle("Org 2 Property");
        annonce2.setStatus(AnnonceStatus.ACTIVE);
        annonce2.setType(AnnonceType.RENTAL);
        annonce2.setPrice(BigDecimal.valueOf(1000));
        annonce2.setCurrency("EUR");
        annonce2.setCreatedAt(today.plusHours(2));
        annonce2.setUpdatedAt(today.plusHours(2));
        annonceRepository.save(annonce2);

        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID_1);
        dossier1.setLeadName("Org 1 Lead");
        dossier1.setLeadPhone("+33600000001");
        dossier1.setStatus(DossierStatus.NEW);
        dossier1.setCreatedAt(today.plusHours(1));
        dossier1.setUpdatedAt(today.plusHours(1));
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_ID_2);
        dossier2.setLeadName("Org 2 Lead");
        dossier2.setLeadPhone("+33600000002");
        dossier2.setStatus(DossierStatus.QUALIFIED);
        dossier2.setCreatedAt(today.plusHours(2));
        dossier2.setUpdatedAt(today.plusHours(2));
        dossierRepository.save(dossier2);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(1))
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").value(1));
    }

    @Test
    void testGetTrends_MultiTenantIsolation_OrgId2() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();

        Annonce annonce1 = new Annonce();
        annonce1.setOrgId(ORG_ID_1);
        annonce1.setTitle("Org 1 Property");
        annonce1.setStatus(AnnonceStatus.ACTIVE);
        annonce1.setType(AnnonceType.SALE);
        annonce1.setPrice(BigDecimal.valueOf(100000));
        annonce1.setCurrency("EUR");
        annonce1.setCreatedAt(today.plusHours(1));
        annonce1.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(annonce1);

        Annonce annonce2 = new Annonce();
        annonce2.setOrgId(ORG_ID_2);
        annonce2.setTitle("Org 2 Property");
        annonce2.setStatus(AnnonceStatus.ACTIVE);
        annonce2.setType(AnnonceType.RENTAL);
        annonce2.setPrice(BigDecimal.valueOf(1000));
        annonce2.setCurrency("EUR");
        annonce2.setCreatedAt(today.plusHours(2));
        annonce2.setUpdatedAt(today.plusHours(2));
        annonceRepository.save(annonce2);

        Dossier dossier1 = new Dossier();
        dossier1.setOrgId(ORG_ID_1);
        dossier1.setLeadName("Org 1 Lead");
        dossier1.setLeadPhone("+33600000001");
        dossier1.setStatus(DossierStatus.NEW);
        dossier1.setCreatedAt(today.plusHours(1));
        dossier1.setUpdatedAt(today.plusHours(1));
        dossierRepository.save(dossier1);

        Dossier dossier2 = new Dossier();
        dossier2.setOrgId(ORG_ID_2);
        dossier2.setLeadName("Org 2 Lead");
        dossier2.setLeadPhone("+33600000002");
        dossier2.setStatus(DossierStatus.QUALIFIED);
        dossier2.setCreatedAt(today.plusHours(2));
        dossier2.setUpdatedAt(today.plusHours(2));
        dossierRepository.save(dossier2);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_2)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(1))
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").value(1));
    }

    @Test
    void testGetTrends_MissingOrgIdHeader_Returns400() throws Exception {
        mockMvc.perform(get(BASE_URL)
                        .param("period", "TODAY"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Missing required header: X-Org-Id"));
    }

    @Test
    void testGetTrends_NoPeriodParameter_UsesDefault() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();

        Annonce annonce = new Annonce();
        annonce.setOrgId(ORG_ID_1);
        annonce.setTitle("Property");
        annonce.setStatus(AnnonceStatus.ACTIVE);
        annonce.setType(AnnonceType.SALE);
        annonce.setPrice(BigDecimal.valueOf(100000));
        annonce.setCurrency("EUR");
        annonce.setCreatedAt(today.plusHours(1));
        annonce.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(annonce);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives").exists())
                .andExpect(jsonPath("$.dossiersATraiter").exists());
    }

    @Test
    void testGetTrends_WithIncrease_ShowsPositivePercentage() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        LocalDateTime yesterday = today.minusDays(1);

        Annonce todayAnnonce1 = new Annonce();
        todayAnnonce1.setOrgId(ORG_ID_1);
        todayAnnonce1.setTitle("Today Property 1");
        todayAnnonce1.setStatus(AnnonceStatus.ACTIVE);
        todayAnnonce1.setType(AnnonceType.SALE);
        todayAnnonce1.setPrice(BigDecimal.valueOf(100000));
        todayAnnonce1.setCurrency("EUR");
        todayAnnonce1.setCreatedAt(today.plusHours(1));
        todayAnnonce1.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(todayAnnonce1);

        Annonce todayAnnonce2 = new Annonce();
        todayAnnonce2.setOrgId(ORG_ID_1);
        todayAnnonce2.setTitle("Today Property 2");
        todayAnnonce2.setStatus(AnnonceStatus.ACTIVE);
        todayAnnonce2.setType(AnnonceType.RENTAL);
        todayAnnonce2.setPrice(BigDecimal.valueOf(1000));
        todayAnnonce2.setCurrency("EUR");
        todayAnnonce2.setCreatedAt(today.plusHours(2));
        todayAnnonce2.setUpdatedAt(today.plusHours(2));
        annonceRepository.save(todayAnnonce2);

        Annonce todayAnnonce3 = new Annonce();
        todayAnnonce3.setOrgId(ORG_ID_1);
        todayAnnonce3.setTitle("Today Property 3");
        todayAnnonce3.setStatus(AnnonceStatus.ACTIVE);
        todayAnnonce3.setType(AnnonceType.SALE);
        todayAnnonce3.setPrice(BigDecimal.valueOf(150000));
        todayAnnonce3.setCurrency("EUR");
        todayAnnonce3.setCreatedAt(today.plusHours(3));
        todayAnnonce3.setUpdatedAt(today.plusHours(3));
        annonceRepository.save(todayAnnonce3);

        Annonce yesterdayAnnonce = new Annonce();
        yesterdayAnnonce.setOrgId(ORG_ID_1);
        yesterdayAnnonce.setTitle("Yesterday Property");
        yesterdayAnnonce.setStatus(AnnonceStatus.ACTIVE);
        yesterdayAnnonce.setType(AnnonceType.SALE);
        yesterdayAnnonce.setPrice(BigDecimal.valueOf(120000));
        yesterdayAnnonce.setCurrency("EUR");
        yesterdayAnnonce.setCreatedAt(yesterday.plusHours(1));
        yesterdayAnnonce.setUpdatedAt(yesterday.plusHours(1));
        annonceRepository.save(yesterdayAnnonce);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(3))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(200.0));
    }

    @Test
    void testGetTrends_WithDecrease_ShowsNegativePercentage() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        LocalDateTime yesterday = today.minusDays(1);

        Annonce todayAnnonce = new Annonce();
        todayAnnonce.setOrgId(ORG_ID_1);
        todayAnnonce.setTitle("Today Property");
        todayAnnonce.setStatus(AnnonceStatus.ACTIVE);
        todayAnnonce.setType(AnnonceType.SALE);
        todayAnnonce.setPrice(BigDecimal.valueOf(100000));
        todayAnnonce.setCurrency("EUR");
        todayAnnonce.setCreatedAt(today.plusHours(1));
        todayAnnonce.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(todayAnnonce);

        Annonce yesterdayAnnonce1 = new Annonce();
        yesterdayAnnonce1.setOrgId(ORG_ID_1);
        yesterdayAnnonce1.setTitle("Yesterday Property 1");
        yesterdayAnnonce1.setStatus(AnnonceStatus.ACTIVE);
        yesterdayAnnonce1.setType(AnnonceType.RENTAL);
        yesterdayAnnonce1.setPrice(BigDecimal.valueOf(1000));
        yesterdayAnnonce1.setCurrency("EUR");
        yesterdayAnnonce1.setCreatedAt(yesterday.plusHours(1));
        yesterdayAnnonce1.setUpdatedAt(yesterday.plusHours(1));
        annonceRepository.save(yesterdayAnnonce1);

        Annonce yesterdayAnnonce2 = new Annonce();
        yesterdayAnnonce2.setOrgId(ORG_ID_1);
        yesterdayAnnonce2.setTitle("Yesterday Property 2");
        yesterdayAnnonce2.setStatus(AnnonceStatus.ACTIVE);
        yesterdayAnnonce2.setType(AnnonceType.SALE);
        yesterdayAnnonce2.setPrice(BigDecimal.valueOf(120000));
        yesterdayAnnonce2.setCurrency("EUR");
        yesterdayAnnonce2.setCreatedAt(yesterday.plusHours(2));
        yesterdayAnnonce2.setUpdatedAt(yesterday.plusHours(2));
        annonceRepository.save(yesterdayAnnonce2);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(2))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(-50.0));
    }

    @Test
    void testGetTrends_FromZeroToCurrent_Shows100PercentIncrease() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();

        Annonce todayAnnonce = new Annonce();
        todayAnnonce.setOrgId(ORG_ID_1);
        todayAnnonce.setTitle("Today Property");
        todayAnnonce.setStatus(AnnonceStatus.ACTIVE);
        todayAnnonce.setType(AnnonceType.SALE);
        todayAnnonce.setPrice(BigDecimal.valueOf(100000));
        todayAnnonce.setCurrency("EUR");
        todayAnnonce.setCreatedAt(today.plusHours(1));
        todayAnnonce.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(todayAnnonce);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(1))
                .andExpect(jsonPath("$.annoncesActives.previousValue").value(0))
                .andExpect(jsonPath("$.annoncesActives.percentageChange").value(100.0));
    }

    @Test
    void testGetTrends_OnlyCountsCorrectStatuses_Annonces() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();

        Annonce activeAnnonce = new Annonce();
        activeAnnonce.setOrgId(ORG_ID_1);
        activeAnnonce.setTitle("Active Property");
        activeAnnonce.setStatus(AnnonceStatus.ACTIVE);
        activeAnnonce.setType(AnnonceType.SALE);
        activeAnnonce.setPrice(BigDecimal.valueOf(100000));
        activeAnnonce.setCurrency("EUR");
        activeAnnonce.setCreatedAt(today.plusHours(1));
        activeAnnonce.setUpdatedAt(today.plusHours(1));
        annonceRepository.save(activeAnnonce);

        Annonce publishedAnnonce = new Annonce();
        publishedAnnonce.setOrgId(ORG_ID_1);
        publishedAnnonce.setTitle("Published Property");
        publishedAnnonce.setStatus(AnnonceStatus.PUBLISHED);
        publishedAnnonce.setType(AnnonceType.RENTAL);
        publishedAnnonce.setPrice(BigDecimal.valueOf(1000));
        publishedAnnonce.setCurrency("EUR");
        publishedAnnonce.setCreatedAt(today.plusHours(2));
        publishedAnnonce.setUpdatedAt(today.plusHours(2));
        annonceRepository.save(publishedAnnonce);

        Annonce archivedAnnonce = new Annonce();
        archivedAnnonce.setOrgId(ORG_ID_1);
        archivedAnnonce.setTitle("Archived Property");
        archivedAnnonce.setStatus(AnnonceStatus.ARCHIVED);
        archivedAnnonce.setType(AnnonceType.SALE);
        archivedAnnonce.setPrice(BigDecimal.valueOf(150000));
        archivedAnnonce.setCurrency("EUR");
        archivedAnnonce.setCreatedAt(today.plusHours(3));
        archivedAnnonce.setUpdatedAt(today.plusHours(3));
        annonceRepository.save(archivedAnnonce);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annoncesActives.currentValue").value(1));
    }

    @Test
    void testGetTrends_OnlyCountsCorrectStatuses_Dossiers() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();

        Dossier newDossier = new Dossier();
        newDossier.setOrgId(ORG_ID_1);
        newDossier.setLeadName("New Lead");
        newDossier.setLeadPhone("+33600000001");
        newDossier.setStatus(DossierStatus.NEW);
        newDossier.setCreatedAt(today.plusHours(1));
        newDossier.setUpdatedAt(today.plusHours(1));
        dossierRepository.save(newDossier);

        Dossier qualifiedDossier = new Dossier();
        qualifiedDossier.setOrgId(ORG_ID_1);
        qualifiedDossier.setLeadName("Qualified Lead");
        qualifiedDossier.setLeadPhone("+33600000002");
        qualifiedDossier.setStatus(DossierStatus.QUALIFIED);
        qualifiedDossier.setCreatedAt(today.plusHours(2));
        qualifiedDossier.setUpdatedAt(today.plusHours(2));
        dossierRepository.save(qualifiedDossier);

        Dossier qualifyingDossier = new Dossier();
        qualifyingDossier.setOrgId(ORG_ID_1);
        qualifyingDossier.setLeadName("Qualifying Lead");
        qualifyingDossier.setLeadPhone("+33600000003");
        qualifyingDossier.setStatus(DossierStatus.QUALIFYING);
        qualifyingDossier.setCreatedAt(today.plusHours(3));
        qualifyingDossier.setUpdatedAt(today.plusHours(3));
        dossierRepository.save(qualifyingDossier);

        Dossier wonDossier = new Dossier();
        wonDossier.setOrgId(ORG_ID_1);
        wonDossier.setLeadName("Won Lead");
        wonDossier.setLeadPhone("+33600000004");
        wonDossier.setStatus(DossierStatus.WON);
        wonDossier.setCreatedAt(today.plusHours(4));
        wonDossier.setUpdatedAt(today.plusHours(4));
        dossierRepository.save(wonDossier);

        mockMvc.perform(get(BASE_URL)
                        .header(TENANT_HEADER, ORG_ID_1)
                        .param("period", "TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dossiersATraiter.currentValue").value(2));
    }

    @Test
    void testGetTrends_AllPeriods_ReturnValidData() throws Exception {
        String[] periods = {"TODAY", "LAST_7_DAYS", "LAST_30_DAYS"};

        for (String period : periods) {
            mockMvc.perform(get(BASE_URL)
                            .header(TENANT_HEADER, ORG_ID_1)
                            .param("period", period))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.annoncesActives").exists())
                    .andExpect(jsonPath("$.annoncesActives.currentValue").isNumber())
                    .andExpect(jsonPath("$.annoncesActives.previousValue").isNumber())
                    .andExpect(jsonPath("$.annoncesActives.percentageChange").isNumber())
                    .andExpect(jsonPath("$.dossiersATraiter").exists())
                    .andExpect(jsonPath("$.dossiersATraiter.currentValue").isNumber())
                    .andExpect(jsonPath("$.dossiersATraiter.previousValue").isNumber())
                    .andExpect(jsonPath("$.dossiersATraiter.percentageChange").isNumber());
        }
    }
}
