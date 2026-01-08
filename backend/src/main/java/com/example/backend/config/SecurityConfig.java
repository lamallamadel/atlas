package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
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

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())
            .anonymous(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/api-docs/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/webhooks/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .decoder(jwtDecoder())
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            );

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // For tests/local runs without a real IdP:
        if (issuerUri == null || issuerUri.isBlank() || issuerUri.equalsIgnoreCase("mock")) {
            return token -> Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("sub", "test-user")
                // compatible with extractRoles()
                .claim("roles", List.of("ADMIN"))
                .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
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
}
