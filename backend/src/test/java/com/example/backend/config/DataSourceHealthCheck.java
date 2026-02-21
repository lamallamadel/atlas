package com.example.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("backend-e2e-postgres")
public class DataSourceHealthCheck implements ApplicationListener<ApplicationStartedEvent> {

    private static final Logger log = LoggerFactory.getLogger(DataSourceHealthCheck.class);

    private final DataSource dataSource;

    public DataSourceHealthCheck(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void onApplicationEvent(ApplicationStartedEvent event) {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ DataSource Connection Health Check                                          ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            log.info("✓ Connection established successfully");
            log.info(
                    "  → Database: {} {}",
                    metaData.getDatabaseProductName(),
                    metaData.getDatabaseProductVersion());
            log.info("  → Driver: {} {}", metaData.getDriverName(), metaData.getDriverVersion());
            log.info("  → URL: {}", metaData.getURL());
            log.info("  → User: {}", metaData.getUserName());
            log.info("  → Catalog: {}", connection.getCatalog());
            log.info("  → Schema: {}", connection.getSchema());
            log.info("  → AutoCommit: {}", connection.getAutoCommit());
            log.info("  → ReadOnly: {}", connection.isReadOnly());

            // Verify flyway_schema_history table exists
            try (ResultSet tables = metaData.getTables(null, null, "flyway_schema_history", null)) {
                if (tables.next()) {
                    log.info("✓ Flyway schema history table exists");

                    // Count migrations
                    try (var stmt = connection.createStatement();
                            var rs =
                                    stmt.executeQuery(
                                            "SELECT COUNT(*) as count FROM flyway_schema_history WHERE success = true")) {
                        if (rs.next()) {
                            int migrationCount = rs.getInt("count");
                            log.info("✓ Successfully applied migrations: {}", migrationCount);
                        }
                    }
                } else {
                    log.warn(
                            "⚠ Flyway schema history table not found - migrations may not have run");
                }
            }

            // List available tables
            log.info("Available tables:");
            try (ResultSet tables =
                    metaData.getTables(null, "public", "%", new String[] {"TABLE"})) {
                int tableCount = 0;
                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    log.info("  • {}", tableName);
                    tableCount++;
                }
                log.info("Total tables: {}", tableCount);
            }

            log.info(
                    "╔════════════════════════════════════════════════════════════════════════════╗");
            log.info(
                    "║ ✓ DataSource Health Check: PASSED                                          ║");
            log.info(
                    "╚════════════════════════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error(
                    "╔════════════════════════════════════════════════════════════════════════════╗");
            log.error(
                    "║ ✗ DataSource Health Check: FAILED                                          ║");
            log.error(
                    "╚════════════════════════════════════════════════════════════════════════════╝");
            log.error("Error connecting to database", e);
            throw new RuntimeException("DataSource health check failed", e);
        }
    }
}
