package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.testcontainers.containers.PostgreSQLContainer;

@TestConfiguration
@Profile("backend-e2e-postgres")
public class PostgresTestcontainersConfiguration {

    private static final Logger log = LoggerFactory.getLogger(PostgresTestcontainersConfiguration.class);

    private static final PostgreSQLContainer<?> POSTGRES_CONTAINER;

    static {
        log.info("Initializing singleton PostgreSQL testcontainer with postgres:16-alpine image");
        
        POSTGRES_CONTAINER = new PostgreSQLContainer<>("postgres:16-alpine")
                .withReuse(true)
                .withEnv("POSTGRES_INITDB_ARGS", "-E UTF8");
        
        POSTGRES_CONTAINER.start();
        
        log.info("PostgreSQL testcontainer started successfully");
        log.info("JDBC URL: {}", POSTGRES_CONTAINER.getJdbcUrl());
        log.info("Username: {}", POSTGRES_CONTAINER.getUsername());
        log.info("Container ID: {}", POSTGRES_CONTAINER.getContainerId());
        log.info("Container will be reused across test classes");
        
        // Configure Flyway placeholders for JSONB support
        System.setProperty("flyway.placeholders.json_type", "JSONB");
        
        // Add shutdown hook to log container lifecycle
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (POSTGRES_CONTAINER.isRunning()) {
                log.info("PostgreSQL testcontainer shutting down (reuse enabled, container may persist)");
            }
        }));
    }

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        return POSTGRES_CONTAINER;
    }
}
