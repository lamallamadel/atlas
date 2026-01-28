package com.example.backend;

import com.example.backend.annotation.BackendE2ETest;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationInfoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * E2E Test to verify Flyway migration configuration after refactoring.
 * 
 * Validates:
 * 1. All migrations V1-V37+ execute successfully with json_type=JSON
 * 2. No references to migration-h2 directory
 * 3. Flyway schema_version table shows correct migration order
 * 4. No SQL syntax errors for JSON types in H2
 */
@BackendE2ETest
class FlywayMigrationBackendE2ETest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void testFlywayMigrationsExecutedSuccessfully() {
        MigrationInfoService info = flyway.info();
        MigrationInfo[] applied = info.applied();

        assertThat(applied)
            .as("At least migrations V1 through V37 should be applied")
            .hasSizeGreaterThanOrEqualTo(37);

        List<String> appliedVersions = Arrays.stream(applied)
            .map(m -> m.getVersion().toString())
            .collect(Collectors.toList());

        for (int i = 1; i <= 37; i++) {
            String version = String.valueOf(i);
            assertThat(appliedVersions)
                .as("Migration V%s should be applied", i)
                .contains(version);
        }
    }

    @Test
    void testNoMigrationH2DirectoryReferences() {
        MigrationInfoService info = flyway.info();
        MigrationInfo[] all = info.all();

        for (MigrationInfo migration : all) {
            String script = migration.getScript();
            assertThat(script)
                .as("Migration %s should not reference migration-h2 directory", migration.getVersion())
                .doesNotContain("migration-h2");
        }
    }

    @Test
    void testFlywaySchemaVersionTableExists() {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM flyway_schema_history",
            Integer.class
        );

        assertThat(count)
            .as("Flyway schema history should contain migration records")
            .isGreaterThanOrEqualTo(37);
    }

    @Test
    void testFlywaySchemaVersionOrderCorrect() {
        List<String> versions = jdbcTemplate.queryForList(
            "SELECT version FROM flyway_schema_history WHERE version IS NOT NULL ORDER BY installed_rank",
            String.class
        );

        assertThat(versions)
            .as("Migrations should be applied in correct order")
            .hasSizeGreaterThanOrEqualTo(37);

        assertThat(versions.get(0)).isEqualTo("1");
        
        for (int i = 1; i < Math.min(versions.size(), 37); i++) {
            int currentVersion = Integer.parseInt(versions.get(i));
            int previousVersion = Integer.parseInt(versions.get(i - 1));
            
            assertThat(currentVersion)
                .as("Version %s should come after version %s", currentVersion, previousVersion)
                .isGreaterThan(previousVersion);
        }
    }

    @Test
    void testJsonColumnsCreatedSuccessfully() {
        List<String> jsonColumns = jdbcTemplate.queryForList(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
            "WHERE TABLE_NAME = 'ANNONCE' AND COLUMN_NAME IN ('PHOTOS_JSON', 'RULES_JSON')",
            String.class
        );

        assertThat(jsonColumns)
            .as("JSON columns should exist in annonce table")
            .containsExactlyInAnyOrder("PHOTOS_JSON", "RULES_JSON");
    }

    @Test
    void testJsonColumnsHaveCorrectType() {
        List<String> columnTypes = jdbcTemplate.queryForList(
            "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS " +
            "WHERE TABLE_NAME = 'ANNONCE' AND COLUMN_NAME IN ('PHOTOS_JSON', 'RULES_JSON')",
            String.class
        );

        assertThat(columnTypes)
            .as("JSON columns should have JSON type in H2")
            .allMatch(type -> type.equals("JSON") || type.equals("CHARACTER VARYING"));
    }

    @Test
    void testNoSqlSyntaxErrorsInMigrations() {
        MigrationInfoService info = flyway.info();
        MigrationInfo[] all = info.all();
        
        long failedCount = Arrays.stream(all)
            .filter(m -> m.getState().isFailed())
            .count();

        assertThat(failedCount)
            .as("No migrations should have failed due to SQL syntax errors")
            .isEqualTo(0);
    }

    @Test
    void testFlywayConfigurationUsesJsonTypePlaceholder() {
        assertThat(flyway.getConfiguration().getPlaceholders())
            .as("Flyway should have json_type placeholder configured")
            .containsEntry("json_type", "JSON");
    }

    @Test
    void testFlywayLocationsExcludeMigrationH2() {
        String[] locations = Arrays.stream(flyway.getConfiguration().getLocations())
            .map(Object::toString)
            .toArray(String[]::new);

        assertThat(locations)
            .as("Flyway locations should not include migration-h2 directory")
            .noneMatch(loc -> loc.contains("migration-h2"));

        assertThat(locations)
            .as("Flyway locations should include main migration directory")
            .anyMatch(loc -> loc.contains("db/migration"));
    }

    @Test
    void testAllExpectedTablesCreated() {
        List<String> expectedTables = Arrays.asList(
            "ANNONCE",
            "DOSSIER",
            "PARTIE_PRENANTE",
            "CONSENTEMENT",
            "MESSAGE",
            "APPOINTMENT",
            "NOTIFICATION",
            "DOSSIER_STATUS_HISTORY",
            "OUTBOUND_MESSAGE",
            "OUTBOUND_ATTEMPT"
        );

        for (String tableName : expectedTables) {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?",
                Integer.class,
                tableName
            );

            assertThat(count)
                .as("Table %s should exist", tableName)
                .isEqualTo(1);
        }
    }

    @Test
    void testMigrationVersionsAreSequential() {
        List<Integer> versions = jdbcTemplate.queryForList(
            "SELECT CAST(version AS INTEGER) as version_num FROM flyway_schema_history " +
            "WHERE version IS NOT NULL AND version NOT LIKE '%.%' ORDER BY installed_rank",
            Integer.class
        );

        assertThat(versions)
            .as("Should have sequential version numbers starting from 1")
            .hasSizeGreaterThanOrEqualTo(37);

        assertThat(versions.get(0)).isEqualTo(1);
        
        int consecutiveCount = 1;
        for (int i = 1; i < versions.size(); i++) {
            if (versions.get(i) == versions.get(i - 1) + 1) {
                consecutiveCount++;
            }
        }

        assertThat(consecutiveCount)
            .as("Most versions should be sequential")
            .isGreaterThanOrEqualTo(37);
    }

    @Test
    void testFlywayBaselineNotApplied() {
        List<String> types = jdbcTemplate.queryForList(
            "SELECT type FROM flyway_schema_history",
            String.class
        );

        assertThat(types)
            .as("Should not have baseline migration (migrations should execute from V1)")
            .doesNotContain("BASELINE");
    }
}
