package com.example.backend;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@BackendE2ETest
class SecurityBackendE2ETest extends BaseBackendE2ETest {

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private JwtDecoder jwtDecoder;

    private ListAppender<ILoggingEvent> listAppender;
    private Logger logger;

    @BeforeEach
    void setUp() {
        // Delete all seed data and test data for fresh state
        annonceRepository.deleteAll();
        
        logger = (Logger) LoggerFactory.getLogger("com.example.backend");
        listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);
    }

    @AfterEach
    void tearDown() {
        if (logger != null && listAppender != null) {
            logger.detachAppender(listAppender);
        }
        // Clear tenant context to prevent tenant ID leakage between tests
        com.example.backend.util.TenantContext.clear();
    }

    @Test
    void whenMissingAuthorizationBearerToken_returns401WithWWWAuthenticateHeader() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/annonces")
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, "test-corr-id"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("WWW-Authenticate"))
                .andReturn();

        String wwwAuthenticate = result.getResponse().getHeader("WWW-Authenticate");
        assertThat(wwwAuthenticate).isNotNull();
        assertThat(wwwAuthenticate).contains("Bearer");
    }

    @Test
    void whenExpiredJWT_returns401() throws Exception {
        Jwt expiredJwt = Jwt.withTokenValue("expired-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("roles", List.of("ADMIN"))
                .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                .issuedAt(Instant.now().minusSeconds(7200))
                .expiresAt(Instant.now().minusSeconds(3600))
                .build();

        mockMvc.perform(get("/api/v1/annonces")
                        .with(jwt().jwt(expiredJwt))
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, "test-corr-id"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void whenInvalidJWT_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/annonces")
                        .header("Authorization", "Bearer invalid-jwt-token")
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, "test-corr-id"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void whenInvalidJWTSignature_returns401WithWWWAuthenticateHeader() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/annonces")
                        .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, "test-corr-id"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("WWW-Authenticate"))
                .andReturn();

        String wwwAuthenticate = result.getResponse().getHeader("WWW-Authenticate");
        assertThat(wwwAuthenticate).isNotNull();
        assertThat(wwwAuthenticate).contains("Bearer");
    }

    @Test
    void whenProUserCallsDelete_returns403() throws Exception {
        Annonce annonce = createAndSaveAnnonce("ORG1");

        Jwt proJwt = Jwt.withTokenValue("pro-token")
                .header("alg", "none")
                .claim("sub", "pro-user")
                .claim("roles", List.of("PRO"))
                .claim("realm_access", Map.of("roles", List.of("PRO")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                        .with(jwt().jwt(proJwt))
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, "test-corr-id"))
                .andExpect(status().isForbidden());
    }

    @Test
    void whenAdminUserCallsDelete_returns204() throws Exception {
        Annonce annonce = createAndSaveAnnonce("ORG1");

        Jwt adminJwt = Jwt.withTokenValue("admin-token")
                .header("alg", "none")
                .claim("sub", "admin-user")
                .claim("roles", List.of("ADMIN"))
                .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        mockMvc.perform(delete("/api/v1/annonces/" + annonce.getId())
                        .with(jwt().jwt(adminJwt))
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, "test-corr-id"))
                .andExpect(status().isNoContent());

        assertThat(annonceRepository.findById(annonce.getId())).isEmpty();
    }

    @Test
    void whenCorsPreflightOptions_returnsAccessControlAllowOriginHeader() throws Exception {
        String requestOrigin = "http://localhost:3000";
        
        MvcResult result = mockMvc.perform(options("/api/v1/annonces")
                        .header("Origin", requestOrigin)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization,X-Org-Id"))
                .andExpect(status().isOk())
                .andReturn();

        String allowOrigin = result.getResponse().getHeader("Access-Control-Allow-Origin");
        assertThat(allowOrigin).isNotNull();
        assertThat(allowOrigin).isEqualTo(requestOrigin);
    }

    @Test
    void whenCorsPreflightOptionsWithDifferentOrigin_returnsAccessControlAllowOriginHeader() throws Exception {
        String requestOrigin = "http://example.com";
        
        MvcResult result = mockMvc.perform(options("/api/v1/dossiers")
                        .header("Origin", requestOrigin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,X-Org-Id,Content-Type"))
                .andExpect(status().isOk())
                .andReturn();

        String allowOrigin = result.getResponse().getHeader("Access-Control-Allow-Origin");
        String allowMethods = result.getResponse().getHeader("Access-Control-Allow-Methods");
        String allowHeaders = result.getResponse().getHeader("Access-Control-Allow-Headers");

        assertThat(allowOrigin).isNotNull();
        assertThat(allowOrigin).isEqualTo(requestOrigin);
        assertThat(allowMethods).isNotNull();
        assertThat(allowHeaders).isNotNull();
    }

    @Test
    void whenCorrelationIdProvidedInRequest_propagatesToResponseHeaderAndMDC() throws Exception {
        String providedCorrelationId = "test-correlation-" + UUID.randomUUID();

        Jwt validJwt = Jwt.withTokenValue("valid-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("roles", List.of("ADMIN"))
                .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        MvcResult result = mockMvc.perform(get("/api/v1/annonces")
                        .with(jwt().jwt(validJwt))
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, providedCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(CORRELATION_ID_HEADER, providedCorrelationId))
                .andReturn();

        boolean foundInLogs = listAppender.list.stream()
                .anyMatch(event -> {
                    String correlationId = event.getMDCPropertyMap().get("correlationId");
                    return providedCorrelationId.equals(correlationId);
                });

        assertThat(foundInLogs)
                .as("Correlation ID should propagate to MDC and appear in logs")
                .isTrue();
    }

    @Test
    void whenCorrelationIdAbsentInRequest_generatesUUIDAndPropagatesToResponseAndMDC() throws Exception {
        Jwt validJwt = Jwt.withTokenValue("valid-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("roles", List.of("ADMIN"))
                .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        MvcResult result = mockMvc.perform(get("/api/v1/annonces")
                        .with(jwt().jwt(validJwt))
                        .header(TENANT_HEADER, "ORG1"))
                .andExpect(status().isOk())
                .andExpect(header().exists(CORRELATION_ID_HEADER))
                .andReturn();

        String generatedCorrelationId = result.getResponse().getHeader(CORRELATION_ID_HEADER);
        assertThat(generatedCorrelationId).isNotNull();
        assertThat(generatedCorrelationId)
                .matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

        boolean foundInLogs = listAppender.list.stream()
                .anyMatch(event -> {
                    String correlationId = event.getMDCPropertyMap().get("correlationId");
                    return generatedCorrelationId.equals(correlationId);
                });

        assertThat(foundInLogs)
                .as("Generated correlation ID should propagate to MDC and appear in logs")
                .isTrue();
    }

    @Test
    void whenCorrelationIdPresentInUnauthorizedRequest_stillPropagatesToResponse() throws Exception {
        String providedCorrelationId = "unauthorized-corr-" + UUID.randomUUID();

        MvcResult result = mockMvc.perform(get("/api/v1/annonces")
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, providedCorrelationId))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(CORRELATION_ID_HEADER, providedCorrelationId))
                .andReturn();

        boolean foundInLogs = listAppender.list.stream()
                .anyMatch(event -> {
                    String correlationId = event.getMDCPropertyMap().get("correlationId");
                    return providedCorrelationId.equals(correlationId);
                });

        assertThat(foundInLogs)
                .as("Correlation ID should propagate even for unauthorized requests")
                .isTrue();
    }

    @Test
    void whenMockJwtIssuerUri_decoderAcceptsTokensWithoutValidation() throws Exception {
        Jwt mockJwt = jwtDecoder.decode("any-token-value");

        assertThat(mockJwt).isNotNull();
        assertThat(mockJwt.getSubject()).isEqualTo("test-user");
        assertThat((List<?>) mockJwt.getClaim("roles")).isEqualTo(List.of("ADMIN"));
        
        mockMvc.perform(get("/api/v1/annonces")
                        .with(jwt().jwt(mockJwt))
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, "test-corr-id"))
                .andExpect(status().isOk());
    }

    @Test
    void whenMockJwtIssuerUri_decoderGeneratesValidJwtClaims() {
        Jwt mockJwt = jwtDecoder.decode("mock-token");

        assertThat(mockJwt).isNotNull();
        assertThat(mockJwt.getTokenValue()).isEqualTo("mock-token");
        assertThat(mockJwt.getSubject()).isEqualTo("test-user");
        assertThat(mockJwt.getIssuedAt()).isNotNull();
        assertThat(mockJwt.getExpiresAt()).isNotNull();
        assertThat(mockJwt.getExpiresAt()).isAfter(mockJwt.getIssuedAt());

        Map<String, Object> realmAccess = mockJwt.getClaim("realm_access");
        assertThat(realmAccess).isNotNull();
        org.assertj.core.api.Assertions.assertThat(realmAccess).containsKey("roles");
        assertThat(realmAccess.get("roles")).isEqualTo(List.of("ADMIN"));
    }

    @Test
    void whenMultipleSecuredEndpointsWithSameCorrelationId_allUseTheSameCorrelationId() throws Exception {
        String correlationId = "multi-request-" + UUID.randomUUID();

        Jwt validJwt = Jwt.withTokenValue("valid-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("roles", List.of("ADMIN"))
                .claim("realm_access", Map.of("roles", List.of("ADMIN")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        mockMvc.perform(get("/api/v1/annonces")
                        .with(jwt().jwt(validJwt))
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, correlationId))
                .andExpect(status().isOk())
                .andExpect(header().string(CORRELATION_ID_HEADER, correlationId));

        mockMvc.perform(get("/api/v1/dossiers")
                        .with(jwt().jwt(validJwt))
                        .header(TENANT_HEADER, "ORG1")
                        .header(CORRELATION_ID_HEADER, correlationId))
                .andExpect(status().isOk())
                .andExpect(header().string(CORRELATION_ID_HEADER, correlationId));

        long matchingLogCount = listAppender.list.stream()
                .filter(event -> {
                    String logCorrelationId = event.getMDCPropertyMap().get("correlationId");
                    return correlationId.equals(logCorrelationId);
                })
                .count();

        assertThat(matchingLogCount)
                .as("Multiple requests with same correlation ID should all log with that ID")
                .isGreaterThanOrEqualTo(2);
    }

    private Annonce createAndSaveAnnonce(String orgId) {
        Annonce annonce = new Annonce();
        annonce.setOrgId(orgId);
        annonce.setTitle("Test Annonce for Security");
        annonce.setDescription("Test Description");
        annonce.setCategory("Test Category");
        annonce.setCity("Paris");
        annonce.setPrice(BigDecimal.valueOf(150.00));
        annonce.setCurrency("EUR");
        annonce.setStatus(AnnonceStatus.DRAFT);
        return annonceRepository.save(annonce);
    }
}
