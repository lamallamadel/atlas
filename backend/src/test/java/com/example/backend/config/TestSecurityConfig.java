package com.example.backend.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

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
 * - org_id: extracted from token format "mock-token-{orgId}"
 * 
 * For tests, use the helper methods in BaseBackendE2ETest:
 * - createMockJwt(String orgId)
 * - createMockJwt(String orgId, String subject, String... roles)
 * 
 * These helpers create JWTs with token values formatted as "mock-token-{orgId}", allowing
 * the mock decoder to extract and include the org_id claim. The X-Org-Id header is still
 * required by TenantFilter for tenant isolation.
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
        
        // Register JavaTimeModule for Java 8 date/time types with default ISO-8601 format
        mapper.registerModule(new JavaTimeModule());
        
        // Configure timestamp serialization to use ISO-8601 format
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);
        
        // Configure enum serialization - use name() for consistency (uppercase)
        mapper.disable(SerializationFeature.WRITE_ENUMS_USING_TO_STRING);
        mapper.disable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);
        
        // Other useful configurations
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        mapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);
        
        return mapper;
    }
}
