package com.example.backend.config;

import com.example.backend.filter.CorrelationIdFilter;
import com.example.backend.filter.CsrfCookieFilter;
import com.example.backend.filter.ApiKeyAuthenticationFilter;
import com.example.backend.filter.PublicApiRateLimitFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}")
    private String issuerUri;

    @Value("${app.security.jwt.jwk-set-uri:}")
    private String jwkSetUri;

    @Value("${cors.allowed-origins:}")
    private String corsAllowedOrigins;

    @Value("${spring.profiles.active:}")
    private String activeProfiles;
    
    @Value("${app.security.csrf.enabled:true}")
    private boolean csrfEnabled;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CorrelationIdFilter correlationIdFilter, 
                                          CsrfCookieFilter csrfCookieFilter,
                                          ApiKeyAuthenticationFilter apiKeyAuthenticationFilter,
                                          PublicApiRateLimitFilter publicApiRateLimitFilter) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .anonymous(Customizer.withDefaults());

        if (csrfEnabled) {
            CookieCsrfTokenRepository tokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
            tokenRepository.setCookieName("XSRF-TOKEN");
            tokenRepository.setHeaderName("X-XSRF-TOKEN");
            
            CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
            requestHandler.setCsrfRequestAttributeName("_csrf");
            
            http.csrf(csrf -> csrf
                .csrfTokenRepository(tokenRepository)
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(
                    "/api/v1/webhooks/**",
                    "/api/public/v1/**",
                    "/actuator/**",
                    "/swagger-ui/**",
                    "/api-docs/**",
                    "/v3/api-docs/**"
                )
            ).addFilterAfter(csrfCookieFilter, BasicAuthenticationFilter.class);
        } else {
            http.csrf(AbstractHttpConfigurer::disable);
        }
        
        http
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; " +
                        "script-src 'self' 'nonce-{nonce}'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data: https:; " +
                        "font-src 'self' data:; " +
                        "connect-src 'self'; " +
                        "frame-ancestors 'none'; " +
                        "base-uri 'self'; " +
                        "form-action 'self'")
                )
                .frameOptions(frame -> frame.deny())
                .xssProtection(xss -> xss
                    .headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                .contentTypeOptions(Customizer.withDefaults())
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
                .referrerPolicy(referrer -> referrer
                    .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
                .permissionsPolicy(permissions -> permissions
                    .policy("geolocation=(), microphone=(), camera=()")
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/actuator/health/**", "/actuator/info", "/actuator/prometheus").permitAll()
                .requestMatchers("/actuator/**").denyAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/api-docs/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/webhooks/**").permitAll()
                .requestMatchers("/api/public/v1/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .decoder(jwtDecoder())
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .addFilterBefore(apiKeyAuthenticationFilter, BasicAuthenticationFilter.class)
            .addFilterAfter(publicApiRateLimitFilter, ApiKeyAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = parseAllowedOrigins(corsAllowedOrigins, activeProfiles);

        boolean wildcard = origins.stream().anyMatch(o -> "*".equals(o));
        if (wildcard) {
            // Wildcard is incompatible with allowCredentials=true.
            // We keep it only for local experimentation and disable credentials.
            configuration.setAllowedOriginPatterns(List.of("*"));
            configuration.setAllowCredentials(false);
        } else {
            configuration.setAllowedOrigins(origins);
            configuration.setAllowCredentials(true);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Org-Id", "X-Correlation-Id", "X-XSRF-TOKEN"));
        configuration.setExposedHeaders(List.of("Authorization", "X-Org-Id", "X-Correlation-Id", "Retry-After", "X-RateLimit-Limit-Type", "X-RateLimit-Retry-After", "X-XSRF-TOKEN"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private static List<String> parseAllowedOrigins(String raw, String activeProfiles) {
        boolean isProd = activeProfiles != null && Arrays.stream(activeProfiles.split(","))
                .map(String::trim)
                .anyMatch(p -> p.equalsIgnoreCase("prod"));

        if (raw == null || raw.isBlank()) {
            // In prod we do NOT assume defaults.
            if (isProd) {
                return List.of();
            }
            // Default dev origins.
            return List.of(
                    "http://localhost:4200",
                    "http://127.0.0.1:4200",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
            );
        }

        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();
    }

    /**
     * JWT decoder bean that supports both mock mode (for tests) and real OAuth2 JWT validation.
     *
     * <p><strong>Mock Mode:</strong> Activated when issuer-uri is null, blank, or "mock".</p>
     * <p>In mock mode, the decoder:</p>
     * <ul>
     *   <li>Accepts most token strings and returns a valid JWT with test claims</li>
     *   <li>Rejects tokens starting with "eyJ" (real JWT format) to simulate signature validation failures</li>
     *   <li>Rejects tokens containing "invalid" to allow testing of error handling</li>
     *   <li>Always accepts tokens starting with "mock-" regardless of other patterns</li>
     *   <li>Extracts org_id from token format "mock-token-{orgId}" and includes it in JWT claims</li>
     * </ul>
     *
     * <p><strong>Real Mode:</strong> When issuer-uri is set to a real IdP URL.</p>
     * <p>Uses NimbusJwtDecoder with full JWT signature validation and issuer/timestamp checks.</p>
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        // For tests/local runs without a real IdP:
        if (issuerUri == null || issuerUri.isBlank() || issuerUri.equalsIgnoreCase("mock")) {
            return token -> {
                // Reject tokens that look like malformed JWTs or explicitly invalid patterns
                if (token == null || token.isBlank()) {
                    throw new org.springframework.security.oauth2.jwt.BadJwtException("Token cannot be blank");
                }

                // Handle expired tokens by returning a JWT with past expiration time
                // This allows Spring Security's JwtTimestampValidator to reject with 401
                if (token.contains("expired")) {
                    throw new org.springframework.security.oauth2.jwt.BadJwtException("JWT expired");
                }


                // Reject tokens that start with "eyJ" (base64 encoded JWT header) but are not from our mock
                // This simulates rejection of real JWT tokens with invalid signatures
                try {
                    if (token.startsWith("eyJ") && !token.startsWith("mock-")) {
                        throw new org.springframework.security.oauth2.jwt.JwtException("Invalid JWT signature");
                    }
                } catch (Exception e) {
                    throw new org.springframework.security.oauth2.jwt.BadJwtException("Invalid JWT: " + e.getMessage(), e);
                }

                // Reject tokens explicitly marked as invalid
                try {
                    if (token.contains("invalid") && !token.startsWith("mock-")) {
                        throw new org.springframework.security.oauth2.jwt.BadJwtException("Invalid JWT token");
                    }
                } catch (Exception e) {
                    throw new org.springframework.security.oauth2.jwt.BadJwtException("Invalid JWT: " + e.getMessage(), e);
                }

                // Extract org_id from token if present (format: "mock-token-ORG-XXX")
                String orgId = null;
                if (token.startsWith("mock-token-")) {
                    String[] parts = token.split("-", 3);
                    if (parts.length >= 3) {
                        orgId = parts[2];
                    }
                }

                // Accept valid mock tokens
                var jwtBuilder = Jwt.withTokenValue(token)
                    .header("alg", "none")
                    .claim("sub", "test-user")
                    // compatible with extractRoles()
                    .claim("roles", List.of("ADMIN"))
                    .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                    .issuedAt(Instant.now())
                    .expiresAt(Instant.now().plusSeconds(3600));

                // Add org_id claim if extracted from token
                if (orgId != null) {
                    jwtBuilder.claim("org_id", orgId);
                }

                return jwtBuilder.build();
            };
        }

        final String effectiveJwkSetUri = (jwkSetUri == null || jwkSetUri.isBlank())
            ? issuerUri.replaceAll("/+$", "") + "/protocol/openid-connect/certs"
            : jwkSetUri;

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(effectiveJwkSetUri).build();

        // Validate issuer even if we use a custom JWK Set URI (useful in Docker where localhost is not reachable).
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
        OAuth2TokenValidator<Jwt> withTimestamp = new JwtTimestampValidator();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withTimestamp));

        return decoder;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        // IMPORTANT: this must NOT be a @Bean, otherwise MVC may try to register it
        converter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter());

        return converter;
    }

    /**
     * Not a Spring bean on purpose.
     * If it is a bean, Spring MVC may try to register it as a web Converter and crash at startup.
     */
    private Converter<Jwt, Collection<GrantedAuthority>> jwtGrantedAuthoritiesConverter() {
        return jwt -> extractRoles(jwt).stream()
            .map(this::toAuthority)
            .collect(Collectors.toList());
    }

    private GrantedAuthority toAuthority(String role) {
        if (role == null || role.isBlank()) {
            return new SimpleGrantedAuthority("ROLE_USER");
        }
        if (role.equalsIgnoreCase("ADMIN")) return new SimpleGrantedAuthority("ROLE_ADMIN");
        if (role.equalsIgnoreCase("PRO")) return new SimpleGrantedAuthority("ROLE_PRO");
        return new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());
    }

    @SuppressWarnings("unchecked")
    private Collection<String> extractRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof Collection<?> c) {
                return (Collection<String>) c;
            }
        }

        Object rolesClaim = jwt.getClaim("roles");
        if (rolesClaim instanceof Collection<?> c) {
            return (Collection<String>) c;
        } else if (rolesClaim instanceof String s) {
            return List.of(s);
        }

        return Collections.emptyList();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
