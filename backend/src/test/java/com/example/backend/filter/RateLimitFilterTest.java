package com.example.backend.filter;

import com.example.backend.config.RateLimitConfig;
import com.example.backend.service.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock
    private RateLimitService rateLimitService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private RateLimitConfig rateLimitConfig;
    private ObjectMapper objectMapper;
    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void setUp() {
        rateLimitConfig = new RateLimitConfig();
        rateLimitConfig.setEnabled(true);
        objectMapper = new ObjectMapper();
        rateLimitFilter = new RateLimitFilter(rateLimitService, objectMapper, rateLimitConfig);
    }

    @Test
    void shouldAllowRequestWhenRateLimitingDisabled() throws Exception {
        rateLimitConfig.setEnabled(false);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(rateLimitService, never()).tryConsumeForOrg(anyString());
        verify(rateLimitService, never()).tryConsumeForIp(anyString());
    }

    @Test
    void shouldAllowRequestForExemptEndpoint() throws Exception {
        when(request.getRequestURI()).thenReturn("/actuator/health");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(rateLimitService, never()).tryConsumeForOrg(anyString());
        verify(rateLimitService, never()).tryConsumeForIp(anyString());
    }

    @Test
    void shouldAllowRequestWhenOrgRateLimitNotExceeded() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/test");
        when(request.getHeader("X-Org-Id")).thenReturn("test-org");
        when(rateLimitService.tryConsumeForOrg("test-org")).thenReturn(true);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitService).tryConsumeForOrg("test-org");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldRejectRequestWhenOrgRateLimitExceeded() throws Exception {
        StringWriter stringWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(stringWriter);

        when(request.getRequestURI()).thenReturn("/api/v1/test");
        when(request.getHeader("X-Org-Id")).thenReturn("test-org");
        when(rateLimitService.tryConsumeForOrg("test-org")).thenReturn(false);
        when(response.getWriter()).thenReturn(writer);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitService).tryConsumeForOrg("test-org");
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        verify(response).setHeader("Retry-After", "60");
        verify(response).setHeader("X-RateLimit-Limit-Type", "organization");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void shouldUseIpBasedRateLimitForPublicEndpointWithoutOrgId() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/webhooks/test");
        when(request.getHeader("X-Org-Id")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");
        when(rateLimitService.tryConsumeForIp("192.168.1.100")).thenReturn(true);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitService).tryConsumeForIp("192.168.1.100");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldRejectRequestWhenIpRateLimitExceeded() throws Exception {
        StringWriter stringWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(stringWriter);

        when(request.getRequestURI()).thenReturn("/api/v1/webhooks/test");
        when(request.getHeader("X-Org-Id")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");
        when(rateLimitService.tryConsumeForIp("192.168.1.100")).thenReturn(false);
        when(response.getWriter()).thenReturn(writer);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitService).tryConsumeForIp("192.168.1.100");
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        verify(response).setHeader("Retry-After", "60");
        verify(response).setHeader("X-RateLimit-Limit-Type", "IP address");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void shouldExtractIpFromXForwardedForHeader() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/webhooks/test");
        when(request.getHeader("X-Org-Id")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.1, 198.51.100.1");
        when(rateLimitService.tryConsumeForIp("203.0.113.1")).thenReturn(true);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitService).tryConsumeForIp("203.0.113.1");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldExtractIpFromXRealIpHeader() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/webhooks/test");
        when(request.getHeader("X-Org-Id")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn("203.0.113.1");
        when(rateLimitService.tryConsumeForIp("203.0.113.1")).thenReturn(true);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(rateLimitService).tryConsumeForIp("203.0.113.1");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldSkipRateLimitingForNonApiEndpoints() throws Exception {
        when(request.getRequestURI()).thenReturn("/public-page");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(rateLimitService, never()).tryConsumeForOrg(anyString());
        verify(rateLimitService, never()).tryConsumeForIp(anyString());
    }
}
