package com.example.backend.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@TestConfiguration
public class TestSecurityConfig {

    /**
     * IMPORTANT: ne pas appeler ce bean "objectMapper" pour éviter le conflit
     * avec JacksonConfig (overriding désactivé).
     */
    @Bean(name = "objectMapper")
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);

        mapper.disable(SerializationFeature.WRITE_ENUMS_USING_TO_STRING);
        mapper.disable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);

        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        mapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);

        return mapper;
    }

    /**
     * JwtDecoder mock pour E2E.
     * - "expired-token" => 401 (JwtException)
     * - "invalid-jwt-token" => 401 (BadJwtException)
     * - tokens "eyJ..." => 401 (JwtException)
     * - "mock-token-{orgId}" => org_id={orgId} + roles ADMIN
     */
    @Bean(name = "jwtDecoder")
    @Primary
    public JwtDecoder jwtDecoder() {
        return token -> {
            if (token == null || token.isBlank()) {
                throw new BadJwtException("Invalid JWT token");
            }

            // Simuler refus des JWT "réels"
            if (token.startsWith("eyJ")) {
                throw new JwtException("Invalid JWT signature");
            }

            if ("invalid-jwt-token".equals(token)) {
                throw new BadJwtException("Invalid JWT token");
            }

            if ("expired-token".equals(token)) {
                throw new JwtException("JWT expired");
            }

            // Extraire orgId depuis "mock-token-{orgId}"
            String orgId = "ORG1";
            if (token.startsWith("mock-token-")) {
                String extracted = token.substring("mock-token-".length());
                if (!extracted.isBlank()) {
                    orgId = extracted;
                }
            }

            Instant now = Instant.now();
            List<String> roles = List.of("ADMIN");

            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", "test-user");
            claims.put("org_id", orgId);
            claims.put("scope", "read write");
            claims.put("roles", roles);
            claims.put("realm_access", Map.of("roles", roles));

            return new Jwt(
                    token,
                    now,
                    now.plusSeconds(3600),
                    Map.of("alg", "none"),
                    claims
            );
        };
    }
}
