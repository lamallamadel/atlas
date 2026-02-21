package com.example.backend.annotation;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

public class WithMockJwtSecurityContextFactory implements WithSecurityContextFactory<WithMockJwt> {

    @Override
    public SecurityContext createSecurityContext(WithMockJwt annotation) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();

        List<String> rolesList = Arrays.asList(annotation.roles());

        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", annotation.subject());
        claims.put("org_id", annotation.orgId());
        claims.put("roles", rolesList);
        claims.put("realm_access", Map.of("roles", rolesList));

        Map<String, Object> headers = new HashMap<>();
        headers.put("alg", "none");

        Jwt jwt =
                new Jwt(
                        "mock-token-" + UUID.randomUUID(),
                        Instant.now(),
                        Instant.now().plusSeconds(3600),
                        headers,
                        claims);

        Collection<GrantedAuthority> authorities =
                rolesList.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());

        Authentication auth = new JwtAuthenticationToken(jwt, authorities);
        context.setAuthentication(auth);

        return context;
    }
}
