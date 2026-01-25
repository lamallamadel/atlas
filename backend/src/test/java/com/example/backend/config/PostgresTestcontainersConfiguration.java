package com.example.backend.config;

import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;

@TestConfiguration
@Profile("backend-e2e-postgres")
@Order(Integer.MIN_VALUE)
public class PostgresTestcontainersConfiguration {

    private static final Logger log = LoggerFactory.getLogger(PostgresTestcontainersConfiguration.class);

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ STEP 1: Initializing PostgreSQL Testcontainer (Bean Initialization)        ║");
        log.info("╠════════════════════════════════════════════════════════════════════════════╣");
        log.info("║ @ServiceConnection will auto-configure DataSource properties               ║");
        log.info("║ Spring Boot will use this container for datasource configuration           ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        long containerStartTime = System.currentTimeMillis();

        PostgreSQLContainer<?> container = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                .withReuse(true)
                .withDatabaseName("testdb")
                .withUsername("test")
                .withPassword("test")
                .withEnv("POSTGRES_INITDB_ARGS", "-E UTF8")
                .withStartupTimeout(Duration.ofMinutes(2))
                .waitingFor(Wait.forListeningPort().withStartupTimeout(Duration.ofMinutes(2)));

        log.info("Starting PostgreSQL container with image: postgres:16-alpine");
        log.info("Container reuse enabled: true");

        container.start();

        long containerDuration = System.currentTimeMillis() - containerStartTime;

        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info("║ PostgreSQL Testcontainer Started Successfully                              ║");
        log.info("╠════════════════════════════════════════════════════════════════════════════╣");
        log.info("║ Container Details:                                                          ║");
        log.info("║   • Container ID: {}", String.format("%-56s", container.getContainerId()) + "║");
        log.info("║   • JDBC URL: {}", String.format("%-60s", container.getJdbcUrl()) + "║");
        log.info("║   • Database: {}", String.format("%-62s", container.getDatabaseName()) + "║");
        log.info("║   • Username: {}", String.format("%-62s", container.getUsername()) + "║");
        log.info("║   • Host:Port: {}:{}", String.format("%-55s", container.getHost() + ":" + container.getFirstMappedPort()) + "║");
        log.info("║   • Startup Time: {} ms", String.format("%-56s", containerDuration) + "║");
        log.info("║   • Reusable: true                                                          ║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");

        System.setProperty("flyway.placeholders.json_type", "JSONB");
        log.info("Set Flyway placeholder: json_type=JSONB");

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (container.isRunning()) {
                log.info("╔════════════════════════════════════════════════════════════════════════════╗");
                log.info("║ PostgreSQL Testcontainer Shutdown Hook Triggered                          ║");
                log.info("║ Container will persist (reuse enabled)                                     ║");
                log.info("╚════════════════════════════════════════════════════════════════════════════╝");
            }
        }));

        if (container.isRunning()) {
            log.info("Container health check: PASSED");
        } else {
            throw new IllegalStateException("PostgreSQL container failed to start properly");
        }

        return container;
    }

    @Bean
    public FlywayConfigurationCustomizer flywayConfigurationCustomizer() {
        return configuration -> {
            log.info("╔════════════════════════════════════════════════════════════════════════════╗");
            log.info("║ STEP 3: Configuring Flyway with Custom Callback                            ║");
            log.info("╚════════════════════════════════════════════════════════════════════════════╝");
            configuration.callbacks(new FlywayTestCallback());
        };
    }

    @Bean
    public ApplicationListener<ApplicationReadyEvent> applicationReadyListener() {
        return event -> {
            log.info("╔════════════════════════════════════════════════════════════════════════════╗");
            log.info("║ STEP 6: Spring Application Context Ready - Tests Can Begin                 ║");
            log.info("╠════════════════════════════════════════════════════════════════════════════╣");
            log.info("║ ✓ PostgreSQL Container: RUNNING                                            ║");
            log.info("║ ✓ DataSource: CONFIGURED                                                    ║");
            log.info("║ ✓ Flyway Migrations: COMPLETED                                              ║");
            log.info("║ ✓ Application Context: INITIALIZED                                          ║");
            log.info("║                                                                             ║");
            log.info("║ Test execution can now proceed safely.                                      ║");
            log.info("╚════════════════════════════════════════════════════════════════════════════╝");
        };
    }

    private static class FlywayTestCallback implements Callback {
        
        private static final Logger callbackLog = LoggerFactory.getLogger(FlywayTestCallback.class);
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
                    callbackLog.info("╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.info("║ STEP 4: Starting Flyway Database Migrations                                ║");
                    callbackLog.info("╠════════════════════════════════════════════════════════════════════════════╣");
                    callbackLog.info("║ Schema: {}", String.format("%-64s", context.getConfiguration().getDefaultSchema()) + "║");
                    callbackLog.info("║ Locations: {}", String.format("%-59s", java.util.Arrays.toString(context.getConfiguration().getLocations())) + "║");
                    callbackLog.info("╚════════════════════════════════════════════════════════════════════════════╝");
                    break;
                    
                case BEFORE_EACH_MIGRATE:
                    migrationCount++;
                    String version = context.getMigrationInfo() != null && context.getMigrationInfo().getVersion() != null 
                        ? context.getMigrationInfo().getVersion().toString() 
                        : "UNKNOWN";
                    String description = context.getMigrationInfo() != null 
                        ? context.getMigrationInfo().getDescription() 
                        : "No description";
                    callbackLog.info("  → Executing Migration #{}: V{} - {}", migrationCount, version, description);
                    break;
                    
                case AFTER_EACH_MIGRATE:
                    callbackLog.info("  ✓ Migration completed successfully");
                    break;
                    
                case AFTER_MIGRATE:
                    long duration = System.currentTimeMillis() - migrationStartTime;
                    callbackLog.info("╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.info("║ Flyway Migrations Completed Successfully                                   ║");
                    callbackLog.info("╠════════════════════════════════════════════════════════════════════════════╣");
                    callbackLog.info("║ Total Migrations: {}", String.format("%-58s", migrationCount) + "║");
                    callbackLog.info("║ Duration: {} ms", String.format("%-62s", duration) + "║");
                    callbackLog.info("╚════════════════════════════════════════════════════════════════════════════╝");
                    callbackLog.info("╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.info("║ STEP 5: Initializing Spring Application Context                            ║");
                    callbackLog.info("║ → Loading Spring Beans                                                      ║");
                    callbackLog.info("║ → Initializing JPA EntityManager                                            ║");
                    callbackLog.info("║ → Setting up Transaction Management                                         ║");
                    callbackLog.info("╚════════════════════════════════════════════════════════════════════════════╝");
                    break;
                    
                case AFTER_MIGRATE_ERROR:
                    callbackLog.error("╔════════════════════════════════════════════════════════════════════════════╗");
                    callbackLog.error("║ ❌ FLYWAY MIGRATION ERROR                                                  ║");
                    callbackLog.error("╚════════════════════════════════════════════════════════════════════════════╝");
                    break;
                    
                default:
                    break;
            }
        }

        @Override
        public String getCallbackName() {
            return "FlywayTestCallback";
        }
    }
}
