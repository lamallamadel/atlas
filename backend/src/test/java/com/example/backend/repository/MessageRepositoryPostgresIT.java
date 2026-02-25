package com.example.backend.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.config.PostgresTestcontainersConfiguration;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import jakarta.persistence.EntityManager;
import jakarta.validation.ConstraintViolationException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.sql.SQLException;
import java.time.LocalDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

/**
 * Isolated integration test for MessageRepository using PostgreSQL with Testcontainers.
 *
 * <p>This test is designed to isolate the repository layer and diagnose issues with
 * findByDossierIdWithFilters() method by: 1. Using @DataJpaTest for repository-only testing 2.
 * Using @AutoConfigureTestDatabase(replace = NONE) to use real PostgreSQL 3. Executing queries
 * directly with known test data 4. Capturing exact SQLException or ConstraintViolationException
 * details
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("backend-e2e-postgres")
@Import(PostgresTestcontainersConfiguration.class)
class MessageRepositoryPostgresIT {

    private static final Logger log = LoggerFactory.getLogger(MessageRepositoryPostgresIT.class);
    static {
        // #region agent log
        debugNdjsonStatic(
                "run1",
                "H5",
                "MessageRepositoryPostgresIT.static",
                "Class loaded with environment",
                "{"
                        + "\"springProfilesActive\":\""
                        + safe(System.getProperty("spring.profiles.active"))
                        + "\","
                        + "\"testDatabase\":\""
                        + safe(System.getProperty("test.database"))
                        + "\","
                        + "\"dockerHost\":\""
                        + safe(System.getenv("DOCKER_HOST"))
                        + "\""
                        + "}");
        // #endregion
    }

    @Autowired private MessageRepository messageRepository;

    @Autowired private DossierRepository dossierRepository;

    @Autowired private EntityManager entityManager;

    private Dossier testDossier;
    private MessageEntity testMessage1;
    private MessageEntity testMessage2;
    private MessageEntity testMessage3;

    @BeforeEach
    void setUp() {
        // #region agent log
        debugNdjsonStatic(
                "run1",
                "H5",
                "MessageRepositoryPostgresIT.setUp:start",
                "BeforeEach entered",
                "{"
                        + "\"springProfilesActive\":\""
                        + safe(System.getProperty("spring.profiles.active"))
                        + "\","
                        + "\"testDatabase\":\""
                        + safe(System.getProperty("test.database"))
                        + "\""
                        + "}");
        // #endregion
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ Test Setup: Creating Test Data                                             ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        // Clean up existing data
        messageRepository.deleteAll();
        dossierRepository.deleteAll();
        entityManager.flush();
        entityManager.clear();

        // Create test dossier
        testDossier = createDossier("test-org", "+33612345678", DossierStatus.NEW);
        testDossier = dossierRepository.saveAndFlush(testDossier);
        log.info(
                "Created test dossier with ID: {}, orgId: {}",
                testDossier.getId(),
                testDossier.getOrgId());

        // Create test messages with different attributes
        testMessage1 =
                createMessage(
                        testDossier,
                        MessageChannel.EMAIL,
                        MessageDirection.INBOUND,
                        "Test email message",
                        LocalDateTime.now().minusDays(2));
        testMessage1 = messageRepository.saveAndFlush(testMessage1);
        log.info(
                "Created test message 1 - ID: {}, Channel: {}, Direction: {}, Timestamp: {}",
                testMessage1.getId(),
                testMessage1.getChannel(),
                testMessage1.getDirection(),
                testMessage1.getTimestamp());

        testMessage2 =
                createMessage(
                        testDossier,
                        MessageChannel.SMS,
                        MessageDirection.OUTBOUND,
                        "Test SMS message",
                        LocalDateTime.now().minusDays(1));
        testMessage2 = messageRepository.saveAndFlush(testMessage2);
        log.info(
                "Created test message 2 - ID: {}, Channel: {}, Direction: {}, Timestamp: {}",
                testMessage2.getId(),
                testMessage2.getChannel(),
                testMessage2.getDirection(),
                testMessage2.getTimestamp());

        testMessage3 =
                createMessage(
                        testDossier,
                        MessageChannel.WHATSAPP,
                        MessageDirection.INBOUND,
                        "Test WhatsApp message",
                        LocalDateTime.now());
        testMessage3 = messageRepository.saveAndFlush(testMessage3);
        log.info(
                "Created test message 3 - ID: {}, Channel: {}, Direction: {}, Timestamp: {}",
                testMessage3.getId(),
                testMessage3.getChannel(),
                testMessage3.getDirection(),
                testMessage3.getTimestamp());

        // Clear persistence context to ensure fresh queries
        entityManager.clear();

        log.info("Test setup complete. Total messages created: 3");
    }

    @AfterEach
    void tearDown() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ Test Teardown: Cleaning Up Test Data                                       ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        try {
            messageRepository.deleteAll();
            dossierRepository.deleteAll();
            entityManager.flush();
            log.info("Test data cleaned up successfully");
        } catch (Exception e) {
            log.error("Error during test cleanup", e);
        }
    }

    @Test
    void testFindByDossierIdWithFilters_NoFilters() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with NO filters                           ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);

        try {
            log.info(
                    "Executing query: dossierId={}, channel=null, direction=null, startDate=null, endDate=null",
                    testDossier.getId());

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(), null, null, null, null, pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Total pages: {}, Content size: {}",
                    result.getTotalElements(),
                    result.getTotalPages(),
                    result.getContent().size());

            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getTotalElements()).isEqualTo(3);

            // Log each message found
            result.getContent()
                    .forEach(
                            msg ->
                                    log.info(
                                            "Found message - ID: {}, Channel: {}, Direction: {}, Timestamp: {}",
                                            msg.getId(),
                                            msg.getChannel(),
                                            msg.getDirection(),
                                            msg.getTimestamp()));

            log.info("✓ Test passed: All 3 messages retrieved successfully");

        } catch (DataIntegrityViolationException e) {
            log.error("❌ DataIntegrityViolationException caught", e);
            log.error(
                    "Root cause: {}",
                    e.getRootCause() != null ? e.getRootCause().getMessage() : "null");
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                log.error(
                        "SQLException details - SQLState: {}, ErrorCode: {}, Message: {}",
                        sqlEx.getSQLState(),
                        sqlEx.getErrorCode(),
                        sqlEx.getMessage());
            }
            throw e;
        } catch (org.hibernate.exception.ConstraintViolationException e) {
            log.error("❌ Hibernate ConstraintViolationException caught", e);
            log.error("SQL: {}", e.getSQL());
            log.error("Constraint name: {}", e.getConstraintName());
            log.error("SQLState: {}", e.getSQLState());
            log.error("ErrorCode: {}", e.getErrorCode());
            throw e;
        } catch (ConstraintViolationException e) {
            log.error("❌ Jakarta ConstraintViolationException caught", e);
            e.getConstraintViolations()
                    .forEach(
                            violation ->
                                    log.error(
                                            "Constraint violation - Property: {}, Value: {}, Message: {}",
                                            violation.getPropertyPath(),
                                            violation.getInvalidValue(),
                                            violation.getMessage()));
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected exception caught", e);
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error(
                        "Caused by: {} - {}",
                        e.getCause().getClass().getName(),
                        e.getCause().getMessage());
            }
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_FilterByChannel() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with CHANNEL filter (EMAIL)               ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);

        try {
            log.info(
                    "Executing query: dossierId={}, channel=EMAIL, direction=null, startDate=null, endDate=null",
                    testDossier.getId());

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(), MessageChannel.EMAIL, null, null, null, pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Content size: {}",
                    result.getTotalElements(),
                    result.getContent().size());

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getChannel()).isEqualTo(MessageChannel.EMAIL);
            assertThat(result.getContent().get(0).getId()).isEqualTo(testMessage1.getId());

            log.info(
                    "Found message - ID: {}, Channel: {}, Direction: {}",
                    result.getContent().get(0).getId(),
                    result.getContent().get(0).getChannel(),
                    result.getContent().get(0).getDirection());

            log.info("✓ Test passed: EMAIL channel filter works correctly");

        } catch (Exception e) {
            log.error("❌ Exception caught during channel filter test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_FilterByDirection() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with DIRECTION filter (INBOUND)           ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);

        try {
            log.info(
                    "Executing query: dossierId={}, channel=null, direction=INBOUND, startDate=null, endDate=null",
                    testDossier.getId());

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(),
                            null,
                            MessageDirection.INBOUND,
                            null,
                            null,
                            pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Content size: {}",
                    result.getTotalElements(),
                    result.getContent().size());

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent())
                    .allMatch(msg -> msg.getDirection() == MessageDirection.INBOUND);

            result.getContent()
                    .forEach(
                            msg ->
                                    log.info(
                                            "Found message - ID: {}, Channel: {}, Direction: {}",
                                            msg.getId(),
                                            msg.getChannel(),
                                            msg.getDirection()));

            log.info("✓ Test passed: INBOUND direction filter works correctly");

        } catch (Exception e) {
            log.error("❌ Exception caught during direction filter test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_FilterByDateRange() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with DATE RANGE filter                    ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);
        LocalDateTime startDate = LocalDateTime.now().minusHours(36); // Between message 2 and 3
        LocalDateTime endDate = LocalDateTime.now().plusHours(1);

        try {
            log.info(
                    "Executing query: dossierId={}, channel=null, direction=null, startDate={}, endDate={}",
                    testDossier.getId(),
                    startDate,
                    endDate);

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(), null, null, startDate, endDate, pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Content size: {}",
                    result.getTotalElements(),
                    result.getContent().size());

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent())
                    .allMatch(
                            msg ->
                                    !msg.getTimestamp().isBefore(startDate)
                                            && !msg.getTimestamp().isAfter(endDate));

            result.getContent()
                    .forEach(
                            msg ->
                                    log.info(
                                            "Found message - ID: {}, Timestamp: {}",
                                            msg.getId(),
                                            msg.getTimestamp()));

            log.info("✓ Test passed: Date range filter works correctly");

        } catch (Exception e) {
            log.error("❌ Exception caught during date range filter test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_MultipleFilters() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with MULTIPLE filters                     ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);
        LocalDateTime startDate = LocalDateTime.now().minusDays(3);
        LocalDateTime endDate = LocalDateTime.now().plusHours(1);

        try {
            log.info(
                    "Executing query: dossierId={}, channel=WHATSAPP, direction=INBOUND, startDate={}, endDate={}",
                    testDossier.getId(),
                    startDate,
                    endDate);

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(),
                            MessageChannel.WHATSAPP,
                            MessageDirection.INBOUND,
                            startDate,
                            endDate,
                            pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Content size: {}",
                    result.getTotalElements(),
                    result.getContent().size());

            assertThat(result.getContent()).hasSize(1);
            MessageEntity foundMessage = result.getContent().get(0);
            assertThat(foundMessage.getChannel()).isEqualTo(MessageChannel.WHATSAPP);
            assertThat(foundMessage.getDirection()).isEqualTo(MessageDirection.INBOUND);
            assertThat(foundMessage.getId()).isEqualTo(testMessage3.getId());

            log.info(
                    "Found message - ID: {}, Channel: {}, Direction: {}, Timestamp: {}",
                    foundMessage.getId(),
                    foundMessage.getChannel(),
                    foundMessage.getDirection(),
                    foundMessage.getTimestamp());

            log.info("✓ Test passed: Multiple filters work correctly together");

        } catch (Exception e) {
            log.error("❌ Exception caught during multiple filters test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_EmptyResult() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with filters that match nothing           ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);

        try {
            log.info(
                    "Executing query: dossierId={}, channel=PHONE, direction=null, startDate=null, endDate=null",
                    testDossier.getId());

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(), MessageChannel.PHONE, null, null, null, pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Content size: {}",
                    result.getTotalElements(),
                    result.getContent().size());

            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);

            log.info("✓ Test passed: Empty result returned correctly when no matches");

        } catch (Exception e) {
            log.error("❌ Exception caught during empty result test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_NonExistentDossier() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with non-existent dossier ID              ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);
        Long nonExistentDossierId = 999999L;

        try {
            log.info(
                    "Executing query: dossierId={}, channel=null, direction=null, startDate=null, endDate=null",
                    nonExistentDossierId);

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            nonExistentDossierId, null, null, null, null, pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Content size: {}",
                    result.getTotalElements(),
                    result.getContent().size());

            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);

            log.info("✓ Test passed: Empty result returned for non-existent dossier");

        } catch (Exception e) {
            log.error("❌ Exception caught during non-existent dossier test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_Pagination() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters with pagination                           ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        // Create additional messages for pagination test
        for (int i = 0; i < 7; i++) {
            MessageEntity msg =
                    createMessage(
                            testDossier,
                            MessageChannel.EMAIL,
                            MessageDirection.INBOUND,
                            "Additional message " + i,
                            LocalDateTime.now().plusMinutes(i));
            messageRepository.saveAndFlush(msg);
        }
        entityManager.clear();

        Pageable pageable = PageRequest.of(0, 5); // First page with 5 items

        try {
            log.info("Executing query: dossierId={}, page=0, size=5", testDossier.getId());

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(), null, null, null, null, pageable);

            log.info("Query executed successfully");
            log.info(
                    "Total elements: {}, Total pages: {}, Content size: {}, Current page: {}",
                    result.getTotalElements(),
                    result.getTotalPages(),
                    result.getContent().size(),
                    result.getNumber());

            assertThat(result.getContent()).hasSize(5);
            assertThat(result.getTotalElements()).isEqualTo(10); // 3 original + 7 new
            assertThat(result.getTotalPages()).isEqualTo(2);
            assertThat(result.getNumber()).isEqualTo(0);
            assertThat(result.hasNext()).isTrue();

            log.info("✓ Test passed: Pagination works correctly");

        } catch (Exception e) {
            log.error("❌ Exception caught during pagination test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    @Test
    void testFindByDossierIdWithFilters_VerifyJoinFetch() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ TEST: findByDossierIdWithFilters verifies JOIN FETCH loads dossier         ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        Pageable pageable = PageRequest.of(0, 10);

        try {
            log.info("Executing query with JOIN FETCH to verify eager loading");

            // Clear persistence context to ensure fresh load
            entityManager.clear();

            Page<MessageEntity> result =
                    messageRepository.findByDossierIdWithFilters(
                            testDossier.getId(), null, null, null, null, pageable);

            log.info("Query executed successfully");

            assertThat(result.getContent()).isNotEmpty();
            MessageEntity message = result.getContent().get(0);

            // Access dossier - should not trigger lazy loading exception
            Dossier dossier = message.getDossier();
            assertThat(dossier).isNotNull();
            assertThat(dossier.getId()).isEqualTo(testDossier.getId());
            assertThat(dossier.getOrgId()).isEqualTo(testDossier.getOrgId());

            log.info(
                    "Dossier loaded eagerly - ID: {}, OrgId: {}",
                    dossier.getId(),
                    dossier.getOrgId());
            log.info("✓ Test passed: JOIN FETCH works correctly, no lazy loading exception");

        } catch (Exception e) {
            log.error("❌ Exception caught during JOIN FETCH verification test", e);
            logExceptionDetails(e);
            throw e;
        }
    }

    // Helper methods

    private Dossier createDossier(String orgId, String leadPhone, DossierStatus status) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone(leadPhone);
        dossier.setLeadName("Test Lead");
        dossier.setLeadSource("Test Source");
        dossier.setStatus(status);
        return dossier;
    }

    private MessageEntity createMessage(
            Dossier dossier,
            MessageChannel channel,
            MessageDirection direction,
            String content,
            LocalDateTime timestamp) {
        MessageEntity message = new MessageEntity();
        message.setDossier(dossier);
        message.setChannel(channel);
        message.setDirection(direction);
        message.setContent(content);
        message.setTimestamp(timestamp);
        message.setOrgId(dossier.getOrgId());
        message.setProviderMessageId("provider-msg-" + System.nanoTime());
        return message;
    }

    private void logExceptionDetails(Exception e) {
        log.error("Exception type: {}", e.getClass().getName());
        log.error("Exception message: {}", e.getMessage());

        if (e instanceof DataIntegrityViolationException) {
            DataIntegrityViolationException dive = (DataIntegrityViolationException) e;
            log.error(
                    "Root cause: {}",
                    dive.getRootCause() != null ? dive.getRootCause().getMessage() : "null");
            if (dive.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) dive.getCause();
                log.error(
                        "SQLException details - SQLState: {}, ErrorCode: {}, Message: {}",
                        sqlEx.getSQLState(),
                        sqlEx.getErrorCode(),
                        sqlEx.getMessage());
            }
        }

        if (e instanceof org.hibernate.exception.ConstraintViolationException) {
            org.hibernate.exception.ConstraintViolationException hcve =
                    (org.hibernate.exception.ConstraintViolationException) e;
            log.error("SQL: {}", hcve.getSQL());
            log.error("Constraint name: {}", hcve.getConstraintName());
            log.error("SQLState: {}", hcve.getSQLState());
            log.error("ErrorCode: {}", hcve.getErrorCode());
        }

        if (e instanceof ConstraintViolationException) {
            ConstraintViolationException cve = (ConstraintViolationException) e;
            cve.getConstraintViolations()
                    .forEach(
                            violation ->
                                    log.error(
                                            "Constraint violation - Property: {}, Value: {}, Message: {}",
                                            violation.getPropertyPath(),
                                            violation.getInvalidValue(),
                                            violation.getMessage()));
        }

        if (e.getCause() != null) {
            log.error(
                    "Caused by: {} - {}",
                    e.getCause().getClass().getName(),
                    e.getCause().getMessage());
            if (e.getCause() instanceof SQLException) {
                SQLException sqlEx = (SQLException) e.getCause();
                log.error(
                        "SQL error details - SQLState: {}, ErrorCode: {}",
                        sqlEx.getSQLState(),
                        sqlEx.getErrorCode());
            }
        }

        // Log full stack trace for debugging
        log.error("Full stack trace:", e);
    }

    private static void debugNdjsonStatic(
            String runId, String hypothesisId, String location, String message, String dataJson) {
        try {
            String line =
                    "{"
                            + "\"sessionId\":\"12ec52\","
                            + "\"runId\":\""
                            + safe(runId)
                            + "\","
                            + "\"hypothesisId\":\""
                            + safe(hypothesisId)
                            + "\","
                            + "\"location\":\""
                            + safe(location)
                            + "\","
                            + "\"message\":\""
                            + safe(message)
                            + "\","
                            + "\"data\":"
                            + dataJson
                            + ",\"timestamp\":"
                            + System.currentTimeMillis()
                            + "}";
            Files.writeString(
                    Path.of("c:\\Users\\PRO\\work\\immo\\debug-12ec52.log"),
                    line + System.lineSeparator(),
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND);
        } catch (Exception ignore) {
        }
    }

    private static String safe(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
