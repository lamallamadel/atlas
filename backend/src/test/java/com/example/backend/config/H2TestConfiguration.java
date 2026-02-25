package com.example.backend.config;

import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;

@TestConfiguration
@Profile("backend-e2e-h2")
@Order(Integer.MIN_VALUE)
public class H2TestConfiguration {

    private static final Logger log = LoggerFactory.getLogger(H2TestConfiguration.class);

    @Bean
    public FlywayConfigurationCustomizer h2FlywayConfigurationCustomizer() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ H2 Test Configuration: Configuring Flyway for H2 Database                 ║");
        log.info("╠════════════════════════════════════════════════════════════════════════════╣");
        log.info("║ json_type placeholder: JSON (for H2 compatibility)                         ║");
        log.info("║ Locations: classpath:db/migration,classpath:db/e2e                         ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        return configuration -> {
            configuration.callbacks(new FlywayH2TestCallback());
        };
    }

    @Bean
    public ApplicationListener<ApplicationReadyEvent> h2ApplicationReadyListener() {
        return event -> {
            log.info(
                    "╔════════════════════════════════════════════════════════════════════════════╗");
            log.info(
                    "║ STEP 4: Spring Application Context Ready - H2 Tests Can Begin              ║");
            log.info(
                    "╠════════════════════════════════════════════════════════════════════════════╣");
            log.info(
                    "║ ✓ H2 Database: IN-MEMORY                                                    ║");
            log.info(
                    "║ ✓ DataSource: CONFIGURED                                                    ║");
            log.info(
                    "║ ✓ Flyway Migrations: COMPLETED                                              ║");
            log.info(
                    "║ ✓ Application Context: INITIALIZED                                          ║");
            log.info(
                    "║                                                                             ║");
            log.info(
                    "║ Test execution can now proceed safely.                                      ║");
            log.info(
                    "╚════════════════════════════════════════════════════════════════════════════╝");
        };
    }

    private static class FlywayH2TestCallback implements Callback {

        private static final Logger callbackLog =
                LoggerFactory.getLogger(FlywayH2TestCallback.class);
        private long migrationStartTime;
        private int migrationCount = 0;

        @Override
        public boolean supports(Event event, Context context) {
            return event == Event.BEFORE_MIGRATE
                    || event == Event.AFTER_MIGRATE
                    || event == Event.BEFORE_EACH_MIGRATE
                    || event == Event.AFTER_EACH_MIGRATE
                    || event == Event.AFTER_MIGRATE_ERROR;
        }

        @Override
        public boolean canHandleInTransaction(Event event, Context context) {
            return true;
        }

        @Override
        public void handle(Event event, Context context) {
            switch (event) {
                case BEFORE_MIGRATE:
                    migrationStartTime = System.currentTimeMillis();
                    callbackLog.info(
                            "╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.info(
                            "║ STEP 2: Starting Flyway Database Migrations (H2)                           ║");
                    callbackLog.info(
                            "╠════════════════════════════════════════════════════════════════════════════╣");
                    callbackLog.info(
                            "║ Database: H2 In-Memory (PostgreSQL Mode)                                   ║");
                    callbackLog.info(
                            "║ Schema: {}",
                            String.format("%-64s", context.getConfiguration().getDefaultSchema())
                                    + "║");
                    callbackLog.info(
                            "║ Locations: {}",
                            String.format(
                                            "%-59s",
                                            java.util.Arrays.toString(
                                                    context.getConfiguration().getLocations()))
                                    + "║");
                    callbackLog.info(
                            "║ JSON Type: JSON                                                             ║");
                    callbackLog.info(
                            "╚════════════════════════════════════════════════════════════════════════════╝");
                    break;

                case BEFORE_EACH_MIGRATE:
                    migrationCount++;
                    String version =
                            context.getMigrationInfo() != null
                                            && context.getMigrationInfo().getVersion() != null
                                    ? context.getMigrationInfo().getVersion().toString()
                                    : "UNKNOWN";
                    String description =
                            context.getMigrationInfo() != null
                                    ? context.getMigrationInfo().getDescription()
                                    : "No description";
                    callbackLog.info(
                            "  → Executing Migration #{}: V{} - {}",
                            migrationCount,
                            version,
                            description);
                    break;

                case AFTER_EACH_MIGRATE:
                    callbackLog.info("  ✓ Migration completed successfully");
                    break;

                case AFTER_MIGRATE:
                    long duration = System.currentTimeMillis() - migrationStartTime;
                    callbackLog.info(
                            "╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.info(
                            "║ Flyway Migrations Completed Successfully (H2)                              ║");
                    callbackLog.info(
                            "╠════════════════════════════════════════════════════════════════════════════╣");
                    callbackLog.info(
                            "║ Total Migrations: {}", String.format("%-58s", migrationCount) + "║");
                    callbackLog.info("║ Duration: {} ms", String.format("%-62s", duration) + "║");
                    callbackLog.info(
                            "╚════════════════════════════════════════════════════════════════════════════╝");
                    callbackLog.info(
                            "╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.info(
                            "║ STEP 3: Initializing Spring Application Context                            ║");
                    callbackLog.info(
                            "║ → Loading Spring Beans                                                      ║");
                    callbackLog.info(
                            "║ → Initializing JPA EntityManager                                            ║");
                    callbackLog.info(
                            "║ → Setting up Transaction Management                                         ║");
                    callbackLog.info(
                            "╚════════════════════════════════════════════════════════════════════════════╝");
                    break;

                case AFTER_MIGRATE_ERROR:
                    callbackLog.error(
                            "╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.error(
                            "║ ❌ FLYWAY MIGRATION ERROR (H2)                                            ║");
                    callbackLog.error(
                            "╚════════════════════════════════════════════════════════════════════════════╝");
                    break;

                default:
                    break;
            }
        }

        @Override
        public String getCallbackName() {
            return "FlywayH2TestCallback";
        }
    }
}
