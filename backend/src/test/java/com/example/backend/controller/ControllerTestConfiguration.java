package com.example.backend.controller;

import com.example.backend.filter.ApiKeyAuthenticationFilter;
import com.example.backend.filter.CorrelationIdFilter;
import com.example.backend.filter.PublicApiRateLimitFilter;
import com.example.backend.filter.TenantFilter;
import com.example.backend.service.ApiKeyService;
import com.example.backend.service.ApiUsageTrackingService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Test configuration for AnnonceControllerTest.
 *
 * <p>This configuration addresses the "ApplicationContext failure threshold exceeded" error that
 * occurs when running @WebMvcTest for AnnonceController. The error is caused by:
 *
 * <p>1. Missing bean definitions required by SecurityConfig 2. Circular dependency between
 * SecurityFilterChain and CorrelationIdFilter 3. Missing ObjectMapper configuration for JSON
 * serialization 4. Missing filter beans (TenantFilter, CorrelationIdFilter)
 *
 * <p>ROOT CAUSE ANALYSIS: - @WebMvcTest loads SecurityConfig which requires: - JwtDecoder bean (for
 * OAuth2 resource server) - CorrelationIdFilter bean (injected into filterChain method) -
 * SecurityFilterChain bean (configured with JWT decoder) - Circular dependency: SecurityFilterChain
 * -> CorrelationIdFilter -> (implied by filter chain ordering) - Solution: Use ObjectProvider to
 * break the circular dependency
 *
 * <p>FIXES IMPLEMENTED: 1. Mock JwtDecoder bean for test authentication 2. CorrelationIdFilter bean
 * for request tracking 3. TenantFilter bean for multi-tenant isolation 4. ObjectMapper bean with
 * JavaTimeModule 5. SecurityFilterChain with ObjectProvider to break circular dependency 6. Disable
 * auto-configurations that cause bean loading issues
 *
 * <p>DETAILED LOGGING: Each bean creation logs with ✓ prefix to help identify which beans are being
 * created and in what order. This helps diagnose future context loading issues.
 *
 * <p>EXCLUDED AUTO-CONFIGURATIONS: - Elasticsearch (conditional on property, disabled in tests) -
 * Redis caching (not needed for unit tests) - Mail sender (not needed for controller tests) -
 * Keycloak admin client (not needed for unit tests)
 */
@TestConfiguration
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity(
        prePostEnabled = true)
public class ControllerTestConfiguration {

    private static final Logger log = LoggerFactory.getLogger(ControllerTestConfiguration.class);

    @Bean
    public ApiKeyService apiKeyService() {
        return org.mockito.Mockito.mock(ApiKeyService.class);
    }

    @Bean
    public ApiUsageTrackingService apiUsageTrackingService() {
        return org.mockito.Mockito.mock(ApiUsageTrackingService.class);
    }

    @Bean
    public ApiKeyAuthenticationFilter apiKeyAuthenticationFilter(
            ApiKeyService apiKeyService, ApiUsageTrackingService apiUsageTrackingService) {
        return new ApiKeyAuthenticationFilter(apiKeyService, apiUsageTrackingService);
    }

    @Bean
    public PublicApiRateLimitFilter publicApiRateLimitFilter() {
        return new PublicApiRateLimitFilter();
    }

    /**
     * Constructor that logs when this configuration is being loaded. This helps identify if the
     * test configuration is being picked up by Spring.
     */
    public ControllerTestConfiguration() {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║ AnnonceControllerTestConfiguration INITIALIZING               ║");
        log.info("║ This configuration provides all beans needed for @WebMvcTest  ║");
        log.info("╚════════════════════════════════════════════════════════════════╝");
    }

    /**
     * Provides a mock JwtDecoder for testing.
     *
     * <p>This decoder: - Accepts any non-blank token - Returns a valid JWT with ADMIN role -
     * Includes standard claims (sub, roles, realm_access) - Sets proper timestamps (issued,
     * expires)
     *
     * <p>This is marked as @Primary to override any auto-configured JwtDecoder.
     *
     * <p>ERROR HANDLING: - Throws BadJwtException for null or blank tokens to simulate real JWT
     * validation
     */
    @Bean
    @Primary
    public JwtDecoder jwtDecoder() {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║ Creating MOCK JwtDecoder for AnnonceControllerTest            ║");
        log.info("╚════════════════════════════════════════════════════════════════╝");

        return token -> {
            log.debug("Mock JwtDecoder processing token: {}", token);

            if (token == null || token.isBlank()) {
                log.error("JwtDecoder received blank token - throwing BadJwtException");
                throw new BadJwtException("Token cannot be blank");
            }

            log.debug("Creating mock JWT with ADMIN role for token: {}", token);
            return Jwt.withTokenValue(token)
                    .header("alg", "none")
                    .claim("sub", "test-user")
                    .claim("roles", List.of("ADMIN"))
                    .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                    .issuedAt(Instant.now())
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .build();
        };
    }

    /**
     * Provides the CorrelationIdFilter for request correlation tracking.
     *
     * <p>This filter: - Extracts X-Correlation-Id header from requests - Generates a new
     * correlation ID if not provided - Adds correlation ID to MDC for logging - Adds correlation ID
     * to response headers
     *
     * <p>Required by the SecurityFilterChain (injected via ObjectProvider).
     */
    @Bean
    public CorrelationIdFilter correlationIdFilter() {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║ Creating CorrelationIdFilter for AnnonceControllerTest        ║");
        log.info("╚════════════════════════════════════════════════════════════════╝");
        return new CorrelationIdFilter();
    }

    /**
     * Provides the TenantFilter for multi-tenant request handling.
     *
     * <p>This filter: - Extracts X-Org-Id header from requests - Sets organization ID in
     * TenantContext - Returns 400 Bad Request if X-Org-Id is missing for /api/** endpoints - Cleans
     * up TenantContext after request processing
     *
     * <p>Depends on: ObjectMapper (for error response serialization)
     */
    @Bean
    public TenantFilter tenantFilter(ObjectMapper objectMapper) {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║ Creating TenantFilter for AnnonceControllerTest               ║");
        log.info(
                "║ Dependencies: ObjectMapper = {}                    ║",
                objectMapper != null ? "AVAILABLE" : "NULL");
        log.info("╚════════════════════════════════════════════════════════════════╝");

        if (objectMapper == null) {
            log.error("ObjectMapper is NULL - TenantFilter creation may fail!");
        }

        return new TenantFilter(objectMapper);
    }

    /**
     * Provides a properly configured ObjectMapper for JSON serialization.
     *
     * <p>Configuration: - Registers JavaTimeModule for LocalDateTime, Instant, etc. - Disables
     * WRITE_DATES_AS_TIMESTAMPS for ISO-8601 format - Disables FAIL_ON_UNKNOWN_PROPERTIES for
     * flexible deserialization - Enables ACCEPT_EMPTY_STRING_AS_NULL_OBJECT for null handling
     *
     * <p>This is marked as @Primary to ensure it's used throughout the test context.
     *
     * <p>IMPORTANT: This bean must be created BEFORE TenantFilter and other filters that depend on
     * it. Spring will handle the ordering automatically.
     */
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║ Creating ObjectMapper for AnnonceControllerTest               ║");
        log.info("╚════════════════════════════════════════════════════════════════╝");

        ObjectMapper mapper = new ObjectMapper();

        log.debug("Registering JavaTimeModule...");
        mapper.registerModule(new JavaTimeModule());

        log.debug("Configuring serialization settings...");
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);

        log.debug("Configuring deserialization settings...");
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        mapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);

        log.info("✓ ObjectMapper configured successfully with JavaTimeModule");
        return mapper;
    }

    /**
     * Provides the SecurityFilterChain for test security configuration.
     *
     * <p>CRITICAL FIX FOR CIRCULAR DEPENDENCY: Uses ObjectProvider<CorrelationIdFilter> instead of
     * direct dependency.
     *
     * <p>The circular dependency chain was: 1. SecurityFilterChain creation requires
     * CorrelationIdFilter 2. But Spring needs to create SecurityFilterChain before filters can be
     * registered 3. ObjectProvider breaks this cycle by deferring filter resolution
     *
     * <p>Configuration: - Disables CORS (not needed in unit tests) - Stateless session management
     * (no HTTP session) - CSRF disabled (REST API) - Permits /api/v1/webhooks/** without
     * authentication - Requires authentication for all other /api/** endpoints - Configures OAuth2
     * resource server with JWT decoder
     *
     * @param http HttpSecurity builder
     * @param correlationIdFilterProvider ObjectProvider for lazy CorrelationIdFilter resolution
     * @return SecurityFilterChain configured for testing
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, ObjectProvider<CorrelationIdFilter> correlationIdFilterProvider)
            throws Exception {

        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║ Creating SecurityFilterChain for AnnonceControllerTest        ║");
        log.info("╚════════════════════════════════════════════════════════════════╝");

        CorrelationIdFilter correlationIdFilter = correlationIdFilterProvider.getIfAvailable();
        log.debug("CorrelationIdFilter available: {}", correlationIdFilter != null);

        if (correlationIdFilter == null) {
            log.warn("CorrelationIdFilter is NULL - this may cause issues!");
        }

        log.debug("Configuring HttpSecurity...");
        http.cors(
                        cors -> {
                            log.debug("CORS disabled for testing");
                            cors.disable();
                        })
                .sessionManagement(
                        session -> {
                            log.debug("Session management: STATELESS");
                            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                        })
                .csrf(
                        csrf -> {
                            log.debug("CSRF disabled for testing");
                            csrf.disable();
                        })
                .authorizeHttpRequests(
                        auth -> {
                            log.debug("Configuring authorization rules:");
                            log.debug("  - /api/v1/webhooks/** -> permitAll");
                            log.debug("  - /api/** -> authenticated");
                            log.debug("  - anyRequest -> permitAll");
                            auth.requestMatchers("/api/v1/webhooks/**")
                                    .permitAll()
                                    .requestMatchers("/api/**")
                                    .authenticated()
                                    .anyRequest()
                                    .permitAll();
                        })
                .oauth2ResourceServer(
                        oauth2 -> {
                            log.debug("Configuring OAuth2 resource server with JWT decoder");
                            oauth2.jwt(
                                    jwt -> {
                                        log.debug(
                                                "Setting JWT decoder and authentication converter");
                                        jwt.decoder(jwtDecoder())
                                                .jwtAuthenticationConverter(
                                                        jwtAuthenticationConverter());
                                    });
                        });

        log.info("✓ SecurityFilterChain configured successfully");
        return http.build();
    }

    /**
     * Provides the JwtAuthenticationConverter for converting JWT to authentication.
     *
     * <p>This converter: - Extracts roles from JWT claims (supports both "roles" and
     * "realm_access.roles") - Converts each role to a Spring Security GrantedAuthority with ROLE_
     * prefix - Handles missing or empty roles gracefully
     *
     * <p>NOT A BEAN: This method is private to avoid Spring trying to register it as a web
     * converter, which would cause startup failures.
     *
     * @return JwtAuthenticationConverter configured for test authentication
     */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        log.debug("╔════════════════════════════════════════════════════════════════╗");
        log.debug("║ Creating JwtAuthenticationConverter                            ║");
        log.debug("╚════════════════════════════════════════════════════════════════╝");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(
                jwt -> {
                    log.debug("Converting JWT to granted authorities");
                    log.debug("JWT claims: {}", jwt.getClaims());

                    List<String> roles = jwt.getClaim("roles");
                    if (roles == null) {
                        log.debug("No 'roles' claim found, trying 'realm_access.roles'");
                        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                        if (realmAccess != null && realmAccess.containsKey("roles")) {
                            Object rolesObj = realmAccess.get("roles");
                            if (rolesObj instanceof List) {
                                roles = (List<String>) rolesObj;
                            }
                        }
                    }

                    if (roles == null) {
                        log.warn("No roles found in JWT - returning empty authorities");
                        roles = Collections.emptyList();
                    }

                    log.debug("Extracted roles: {}", roles);
                    return roles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                            .collect(Collectors.toList());
                });

        log.debug("✓ JwtAuthenticationConverter created");
        return converter;
    }

    /**
     * Bean post processor to log all bean creation events. This helps diagnose bean loading order
     * and identify missing dependencies.
     */
    @Bean
    public static org.springframework.beans.factory.config.BeanPostProcessor
            testBeanPostProcessor() {
        return new org.springframework.beans.factory.config.BeanPostProcessor() {
            private final Logger beanLog = LoggerFactory.getLogger("TEST_BEAN_CREATION");

            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (beanName.contains("annonce")
                        || beanName.contains("security")
                        || beanName.contains("filter")
                        || beanName.contains("mapper")
                        || beanName.contains("jwt")) {
                    beanLog.info(
                            "✓ Bean created: {} (type: {})",
                            beanName,
                            bean.getClass().getSimpleName());
                }
                return bean;
            }
        };
    }

    /**
     * Application listener to log context initialization events. Helps identify when and why the
     * context fails to load.
     */
    @Bean
    public static org.springframework.context.ApplicationListener<
                    org.springframework.context.event.ContextRefreshedEvent>
            contextRefreshedListener() {
        return event -> {
            Logger contextLog = LoggerFactory.getLogger("TEST_CONTEXT");
            contextLog.info("╔════════════════════════════════════════════════════════════════╗");
            contextLog.info("║ APPLICATION CONTEXT LOADED SUCCESSFULLY                        ║");
            contextLog.info(
                    "║ Bean count: {}                                           ║",
                    event.getApplicationContext().getBeanDefinitionCount());
            contextLog.info("╚════════════════════════════════════════════════════════════════╝");
        };
    }

    /**
     * Application listener to log context startup failures. Provides detailed error information
     * when context fails to load.
     */
    @Bean
    public static org.springframework.context.ApplicationListener<
                    org.springframework.boot.context.event.ApplicationFailedEvent>
            contextFailedListener() {
        return event -> {
            Logger errorLog = LoggerFactory.getLogger("TEST_CONTEXT_ERROR");
            errorLog.error("╔════════════════════════════════════════════════════════════════╗");
            errorLog.error("║ APPLICATION CONTEXT FAILED TO LOAD                             ║");
            errorLog.error("╚════════════════════════════════════════════════════════════════╝");
            errorLog.error("Exception type: {}", event.getException().getClass().getName());
            errorLog.error("Exception message: {}", event.getException().getMessage());
            errorLog.error("Full stack trace:", event.getException());

            Throwable cause = event.getException().getCause();
            int depth = 0;
            while (cause != null && depth < 5) {
                errorLog.error(
                        "Caused by (depth {}): {} - {}",
                        depth,
                        cause.getClass().getName(),
                        cause.getMessage());
                cause = cause.getCause();
                depth++;
            }
        };
    }
}
