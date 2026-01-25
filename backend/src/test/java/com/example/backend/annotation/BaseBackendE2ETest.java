package com.example.backend.annotation;

import com.example.backend.exception.ProblemDetail;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public abstract class BaseBackendE2ETest {

    protected static final String TENANT_HEADER = "X-Org-Id";
    protected static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected HttpHeaders buildHeaders(String tenantId, String correlationId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(TENANT_HEADER, tenantId);
        headers.set(CORRELATION_ID_HEADER, correlationId);
        return headers;
    }

    protected HttpHeaders buildHeaders(String tenantId) {
        return buildHeaders(tenantId, "test-correlation-id");
    }

    protected HttpHeaders buildHeadersWithAuth(String tenantId, String correlationId, String bearerToken) {
        HttpHeaders headers = buildHeaders(tenantId, correlationId);
        headers.setBearerAuth(bearerToken);
        return headers;
    }

    protected HttpHeaders buildHeadersWithAuth(String tenantId, String bearerToken) {
        return buildHeadersWithAuth(tenantId, "test-correlation-id", bearerToken);
    }

    protected <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder> T withTenantHeaders(
            T builder, String tenantId, String correlationId) {
        return (T) builder
                .header(TENANT_HEADER, tenantId)
                .header(CORRELATION_ID_HEADER, correlationId);
    }

    protected <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder> T withTenantHeaders(
            T builder, String tenantId) {
        return withTenantHeaders(builder, tenantId, "test-correlation-id");
    }

    protected void assertProblemDetail(ResultActions resultActions, int expectedStatus, String expectedDetail) throws Exception {
        resultActions
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.detail").value(expectedDetail));
    }

    protected void assertProblemDetailContains(ResultActions resultActions, int expectedStatus, String detailSubstring) throws Exception {
        resultActions
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.detail").exists());

        String responseContent = resultActions.andReturn().getResponse().getContentAsString();
        ProblemDetail problemDetail = objectMapper.readValue(responseContent, ProblemDetail.class);
        assertThat(problemDetail.getDetail()).contains(detailSubstring);
    }

    protected void assertProblemDetail(ResultActions resultActions, int expectedStatus) throws Exception {
        resultActions
                .andExpect(status().is(expectedStatus))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.detail").exists());
    }

    /**
     * Creates a mock JWT token for testing with the specified organization ID.
     * The JWT includes necessary claims for authentication and authorization.
     *
     * @param orgId The organization ID to include in the JWT claims
     * @return A mock JWT token
     */
    protected Jwt createMockJwt(String orgId) {
        return createMockJwt(orgId, "test-user", "ADMIN");
    }

    /**
     * Creates a mock JWT token for testing with specified organization ID, subject, and roles.
     * The JWT includes necessary claims for authentication and authorization.
     *
     * @param orgId The organization ID to include in the JWT claims
     * @param subject The subject (user ID) to include in the JWT
     * @param roles The roles to assign to the user
     * @return A mock JWT token
     */
    protected Jwt createMockJwt(String orgId, String subject, String... roles) {
        List<String> rolesList = List.of(roles);
        return Jwt.withTokenValue("mock-token-" + orgId)
                .header("alg", "none")
                .claim("sub", subject)
                .claim("org_id", orgId)
                .claim("roles", rolesList)
                .claim("realm_access", Map.of("roles", rolesList))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    protected RequestPostProcessor jwtWithRoles(String orgId, String... roles) {
        String[] effectiveRoles = (roles == null || roles.length == 0) ? new String[]{"ADMIN"} : roles;
        List<GrantedAuthority> authorities = Arrays.stream(effectiveRoles)
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .map(authority -> (GrantedAuthority) authority)
                .toList();

        return jwt()
                .jwt(createMockJwt(orgId, "test-user", effectiveRoles))
                .authorities(authorities);
    }
}
