package com.example.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Test configuration for JWT-based security in E2E tests.
 * 
 * NOTE: This configuration is for documentation purposes. The actual mock JWT decoder
 * is provided by SecurityConfig when spring.security.oauth2.resourceserver.jwt.issuer-uri
 * is set to "mock" in application-backend-e2e.yml.
 * 
 * The mock JWT decoder (in SecurityConfig.jwtDecoder()) returns a JWT with:
 * - Subject: "test-user"
 * - Roles: ["ADMIN"] 
 * - Realm access: {"roles": ["ADMIN"]}
 * 
 * For tests, use the helper methods in BaseBackendE2ETest:
 * - createMockJwt(String orgId)
 * - createMockJwt(String orgId, String subject, String... roles)
 * 
 * These helpers create JWTs with custom claims including org_id, which is useful
 * for testing but note that the X-Org-Id header is still required by TenantFilter.
 * 
 * TenantFilter runs at HIGHEST_PRECEDENCE before the SecurityFilterChain, ensuring
 * the X-Org-Id header is extracted and TenantContext is set up before JWT validation.
 */
@TestConfiguration
public class TestSecurityConfig {
    
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
        
        mapper.registerModule(javaTimeModule);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        return mapper;
    }
}
