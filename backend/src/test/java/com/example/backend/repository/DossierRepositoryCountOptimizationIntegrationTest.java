package com.example.backend.repository;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import org.hibernate.Session;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import jakarta.persistence.EntityManager;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test to verify that DossierRepository COUNT queries use projection
 * and do not trigger unnecessary entity hydration, ensuring minimal overhead.
 */
@DataJpaTest
@ActiveProfiles("test")
class DossierRepositoryCountOptimizationIntegrationTest {

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private TestEntityManager testEntityManager;

    @BeforeEach
    void setUp() {
        dossierRepository.deleteAll();
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Enable Hibernate statistics for query analysis
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        session.getSessionFactory().getStatistics().setStatisticsEnabled(true);
        session.getSessionFactory().getStatistics().clear();
    }

    @Test
    void getPendingCount_shouldUseCountProjection_notLoadEntities() {
        // Given: Create test data with multiple dossiers
        for (int i = 0; i < 50; i++) {
            Dossier dossier = createDossier("org1", "+3361234567" + i, 
                i % 3 == 0 ? DossierStatus.NEW : 
                i % 3 == 1 ? DossierStatus.QUALIFIED : 
                DossierStatus.APPOINTMENT);
            testEntityManager.persist(dossier);
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call getPendingCount
        Long pendingCount = dossierRepository.getPendingCount();
        
        // Then: Verify correct count
        assertThat(pendingCount).isEqualTo(34); // 17 NEW + 17 QUALIFIED out of 50
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded for count query")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
    }

    @Test
    void getPendingCountByOrgId_shouldUseCountProjection_notLoadEntities() {
        // Given: Create test data for multiple organizations
        for (int i = 0; i < 30; i++) {
            Dossier dossier = createDossier(i % 2 == 0 ? "org1" : "org2", 
                "+3361234567" + i, 
                i % 4 == 0 ? DossierStatus.NEW : 
                i % 4 == 1 ? DossierStatus.QUALIFIED : 
                i % 4 == 2 ? DossierStatus.APPOINTMENT :
                DossierStatus.WON);
            testEntityManager.persist(dossier);
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call getPendingCountByOrgId
        Long org1PendingCount = dossierRepository.getPendingCountByOrgId("org1");
        
        // Then: Verify correct count
        assertThat(org1PendingCount).isEqualTo(8); // 4 NEW + 4 QUALIFIED for org1
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded for count query")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
    }

    @Test
    void countByStatusIn_shouldUseCountProjection_notLoadEntities() {
        // Given: Create test data
        for (int i = 0; i < 40; i++) {
            Dossier dossier = createDossier("org1", "+3361234567" + i,
                DossierStatus.values()[i % DossierStatus.values().length]);
            testEntityManager.persist(dossier);
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call countByStatusIn
        List<DossierStatus> statuses = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        Long count = dossierRepository.countByStatusIn(statuses);
        
        // Then: Verify count is correct
        assertThat(count).isGreaterThan(0L);
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded for count query")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
    }

    @Test
    void countByStatusInAndOrgId_shouldUseCountProjection_notLoadEntities() {
        // Given: Create test data for multiple organizations
        for (int i = 0; i < 60; i++) {
            String orgId = "org" + (i % 3 + 1);
            DossierStatus status = DossierStatus.values()[i % DossierStatus.values().length];
            Dossier dossier = createDossier(orgId, "+3361234567" + i, status);
            testEntityManager.persist(dossier);
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call countByStatusInAndOrgId
        List<DossierStatus> statuses = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        Long count = dossierRepository.countByStatusInAndOrgId(statuses, "org1");
        
        // Then: Verify count is correct
        assertThat(count).isGreaterThan(0L);
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded for count query")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
    }

    @Test
    void countByStatusAndCreatedAtAfter_shouldUseCountProjection_notLoadEntities() {
        // Given: Create test data with various statuses
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (int i = 0; i < 30; i++) {
            Dossier dossier = createDossier("org1", "+3361234567" + i, DossierStatus.NEW);
            dossier.setCreatedAt(now.minusDays(i));
            testEntityManager.persist(dossier);
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call countByStatusAndCreatedAtAfter
        Long count = dossierRepository.countByStatusAndCreatedAtAfter(
            DossierStatus.NEW, now.minusDays(10));
        
        // Then: Verify count is correct
        assertThat(count).isEqualTo(10);
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded for count query")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
    }

    @Test
    void countByStatusInAndCreatedAtAfter_shouldUseCountProjection_notLoadEntities() {
        // Given: Create test data with various statuses and dates
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (int i = 0; i < 40; i++) {
            DossierStatus status = i % 2 == 0 ? DossierStatus.NEW : DossierStatus.QUALIFIED;
            Dossier dossier = createDossier("org1", "+3361234567" + i, status);
            dossier.setCreatedAt(now.minusDays(i));
            testEntityManager.persist(dossier);
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call countByStatusInAndCreatedAtAfter
        List<DossierStatus> statuses = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        Long count = dossierRepository.countByStatusInAndCreatedAtAfter(statuses, now.minusDays(15));
        
        // Then: Verify count is correct
        assertThat(count).isEqualTo(15);
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded for count query")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
    }

    @Test
    void countByStatusInAndCreatedAtBetween_shouldUseCountProjection_notLoadEntities() {
        // Given: Create test data with various statuses and dates
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (int i = 0; i < 50; i++) {
            DossierStatus status = i % 3 == 0 ? DossierStatus.NEW : 
                                  i % 3 == 1 ? DossierStatus.QUALIFIED : 
                                  DossierStatus.APPOINTMENT;
            Dossier dossier = createDossier("org1", "+3361234567" + i, status);
            dossier.setCreatedAt(now.minusDays(i));
            testEntityManager.persist(dossier);
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call countByStatusInAndCreatedAtBetween
        List<DossierStatus> statuses = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        Long count = dossierRepository.countByStatusInAndCreatedAtBetween(
            statuses, now.minusDays(20), now.minusDays(5));
        
        // Then: Verify count is correct (between days 5-20, inclusive)
        assertThat(count).isEqualTo(11); // Days 5-15 inclusive = 11 days, ~7 matching
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded for count query")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
    }

    @Test
    void verifyCountQueryPerformance_withLargeDataset() {
        // Given: Create a large dataset (1000 dossiers)
        for (int i = 0; i < 1000; i++) {
            DossierStatus status = DossierStatus.values()[i % DossierStatus.values().length];
            Dossier dossier = createDossier("org" + (i % 10), "+3361234" + String.format("%06d", i), status);
            testEntityManager.persist(dossier);
            
            // Flush periodically to avoid memory issues
            if (i % 100 == 0) {
                testEntityManager.flush();
                testEntityManager.clear();
            }
        }
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Get statistics
        EntityManager em = testEntityManager.getEntityManager();
        Session session = em.unwrap(Session.class);
        Statistics stats = session.getSessionFactory().getStatistics();
        stats.clear();
        
        // When: Call getPendingCount on large dataset
        long startTime = System.currentTimeMillis();
        Long pendingCount = dossierRepository.getPendingCount();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Then: Verify correct count
        assertThat(pendingCount).isGreaterThan(0L);
        
        // Verify COUNT query was used (no entity loads)
        assertThat(stats.getEntityLoadCount())
            .as("No entities should be loaded even with 1000 records")
            .isEqualTo(0);
        
        // Verify only one query was executed
        assertThat(stats.getQueryExecutionCount())
            .as("Only one COUNT query should be executed")
            .isEqualTo(1);
        
        // Performance should be fast (under 1 second even for large dataset)
        assertThat(executionTime)
            .as("COUNT query should execute quickly even with 1000 records")
            .isLessThan(1000L);
    }

    private Dossier createDossier(String orgId, String leadPhone, DossierStatus status) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone(leadPhone);
        dossier.setLeadName("Lead Name " + leadPhone);
        dossier.setLeadSource("Website");
        dossier.setStatus(status);
        return dossier;
    }
}
