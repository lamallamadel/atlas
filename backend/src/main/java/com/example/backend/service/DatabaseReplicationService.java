package com.example.backend.service;

import com.example.backend.config.MultiRegionConfig;
import jakarta.annotation.PostConstruct;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DatabaseReplicationService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseReplicationService.class);

    @Autowired private MultiRegionConfig multiRegionConfig;

    @Autowired private JdbcTemplate jdbcTemplate;

    @Autowired private DataSource dataSource;

    private static final List<String> GLOBAL_ENTITIES =
            List.of("organization", "app_user", "user_preferences", "referential", "system_config");

    private static final List<String> REGIONAL_ENTITIES =
            List.of("dossier", "annonce", "document", "activity", "audit_event");

    @PostConstruct
    public void initialize() {
        if (!multiRegionConfig.isReplicationEnabled()) {
            logger.info("Database replication is disabled");
            return;
        }

        try (Connection conn = dataSource.getConnection()) {
            String dbUrl = conn.getMetaData().getURL();
            if (dbUrl.startsWith("jdbc:h2")) {
                logger.info("H2 database detected - skipping replication setup");
                return;
            }
        } catch (SQLException e) {
            logger.warn("Could not determine database type, skipping replication", e);
            return;
        }

        try {
            setupLogicalReplication();
            logger.info(
                    "Database replication initialized for region: {}",
                    multiRegionConfig.getCurrentRegion());
        } catch (Exception e) {
            logger.error("Failed to initialize database replication", e);
        }
    }

    private void setupLogicalReplication() {
        try (Connection conn = dataSource.getConnection()) {
            if (!isReplicationEnabled(conn)) {
                logger.warn("Logical replication is not enabled in PostgreSQL configuration");
                return;
            }

            createPublicationForGlobalEntities();

            if (multiRegionConfig.getReplication().isIsolateRegionalData()) {
                logger.info(
                        "Regional data isolation is enabled - regional entities will not be replicated");
            }

        } catch (SQLException e) {
            logger.error("Error setting up logical replication", e);
            throw new RuntimeException("Failed to setup logical replication", e);
        }
    }

    private boolean isReplicationEnabled(Connection conn) throws SQLException {
        String query = "SELECT setting FROM pg_settings WHERE name = 'wal_level'";
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(query);

        if (rs.next()) {
            String walLevel = rs.getString("setting");
            return "logical".equals(walLevel);
        }

        return false;
    }

    @Transactional
    public void createPublicationForGlobalEntities() {
        String publicationName = multiRegionConfig.getReplication().getPublicationName();

        try {
            jdbcTemplate.execute(String.format("DROP PUBLICATION IF EXISTS %s", publicationName));

            String tables = String.join(", ", GLOBAL_ENTITIES);
            String createPublicationSql =
                    String.format("CREATE PUBLICATION %s FOR TABLE %s", publicationName, tables);

            jdbcTemplate.execute(createPublicationSql);
            logger.info("Created publication {} for global entities", publicationName);

        } catch (Exception e) {
            logger.error("Failed to create publication for global entities", e);
            throw new RuntimeException("Failed to create publication", e);
        }
    }

    @Transactional
    public void createSubscriptionToRemoteRegion(String remoteRegion, String connectionString) {
        if (!multiRegionConfig.getReplication().isSyncGlobalEntities()) {
            logger.info("Global entity synchronization is disabled");
            return;
        }

        String subscriptionName =
                multiRegionConfig.getReplication().getSubscriptionName()
                        + "_"
                        + remoteRegion.replace("-", "_");
        String publicationName = multiRegionConfig.getReplication().getPublicationName();

        try {
            jdbcTemplate.execute(String.format("DROP SUBSCRIPTION IF EXISTS %s", subscriptionName));

            String createSubscriptionSql =
                    String.format(
                            "CREATE SUBSCRIPTION %s CONNECTION '%s' PUBLICATION %s "
                                    + "WITH (copy_data = true, create_slot = true)",
                            subscriptionName, connectionString, publicationName);

            jdbcTemplate.execute(createSubscriptionSql);
            logger.info("Created subscription {} to region {}", subscriptionName, remoteRegion);

        } catch (Exception e) {
            logger.error("Failed to create subscription to remote region {}", remoteRegion, e);
            throw new RuntimeException("Failed to create subscription", e);
        }
    }

    public List<Map<String, Object>> getReplicationStatus() {
        String query =
                """
            SELECT
                slot_name,
                plugin,
                slot_type,
                database,
                active,
                restart_lsn,
                confirmed_flush_lsn
            FROM pg_replication_slots
            """;

        return jdbcTemplate.queryForList(query);
    }

    public List<Map<String, Object>> getSubscriptionStatus() {
        String query =
                """
            SELECT
                subname,
                subenabled,
                subconninfo,
                subslotname
            FROM pg_subscription
            """;

        return jdbcTemplate.queryForList(query);
    }

    @Transactional
    public void resolveConflict(String tableName, Long recordId, String strategy) {
        if (!"LAST_WRITE_WINS".equals(strategy)) {
            logger.warn("Unsupported conflict resolution strategy: {}", strategy);
            return;
        }

        logger.info(
                "Resolving conflict for table {} record {} using strategy {}",
                tableName,
                recordId,
                strategy);
    }

    public boolean isGlobalEntity(String tableName) {
        return GLOBAL_ENTITIES.contains(tableName.toLowerCase());
    }

    public boolean isRegionalEntity(String tableName) {
        return REGIONAL_ENTITIES.contains(tableName.toLowerCase());
    }

    @Transactional
    public void addRegionIdentifier() {
        String currentRegion = multiRegionConfig.getCurrentRegion();

        for (String table : REGIONAL_ENTITIES) {
            try {
                String checkColumnSql =
                        String.format(
                                "SELECT column_name FROM information_schema.columns "
                                        + "WHERE table_name = '%s' AND column_name = 'region'",
                                table);

                List<Map<String, Object>> columns = jdbcTemplate.queryForList(checkColumnSql);

                if (columns.isEmpty()) {
                    String alterTableSql =
                            String.format(
                                    "ALTER TABLE %s ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT '%s'",
                                    table, currentRegion);
                    jdbcTemplate.execute(alterTableSql);
                    logger.info("Added region column to table {}", table);
                }

            } catch (Exception e) {
                logger.error("Failed to add region identifier to table {}", table, e);
            }
        }
    }
}
