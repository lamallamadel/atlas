package com.example.backend.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration
@Profile("backend-e2e-postgres")
public class PostgresTestContainerConfig {

    private static final String POSTGRES_IMAGE = "postgres:15-alpine";

    @Bean(initMethod = "start", destroyMethod = "stop")
    public PostgreSQLContainer<?> postgresContainer() {
        PostgreSQLContainer<?> container =
                new PostgreSQLContainer<>(DockerImageName.parse(POSTGRES_IMAGE))
                        .withDatabaseName("testdb")
                        .withUsername("testuser")
                        .withPassword("testpass")
                        .withReuse(false);

        System.setProperty("spring.datasource.url", container.getJdbcUrl());
        System.setProperty("spring.datasource.username", container.getUsername());
        System.setProperty("spring.datasource.password", container.getPassword());
        System.setProperty("test.database", "postgres");

        return container;
    }
}
