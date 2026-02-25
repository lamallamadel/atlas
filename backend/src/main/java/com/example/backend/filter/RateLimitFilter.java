package com.example.backend.filter;

import com.example.backend.config.RateLimitConfig;
import com.example.backend.service.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE - 50)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final int RETRY_AFTER_SECONDS = 60;

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;
    private final RateLimitConfig rateLimitConfig;

    public RateLimitFilter(
            RateLimitService rateLimitService,
            ObjectMapper objectMapper,
            RateLimitConfig rateLimitConfig) {
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!rateLimitConfig.getEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        if (isExemptEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean rateLimitExceeded = false;
        String rateLimitType = null;

        if (path.startsWith("/api/")) {
            String orgId = request.getHeader(ORG_ID_HEADER);

            if (orgId != null && !orgId.trim().isEmpty()) {
                boolean allowed = rateLimitService.tryConsumeForOrg(orgId);
                if (!allowed) {

                    rateLimitExceeded = true;
                    rateLimitType = "organization";
                    logger.warn(
                            "Rate limit exceeded for organization. OrgId: {}, Path: {}, IP: {}",
                            orgId,
                            path,
                            getClientIpAddress(request));
                }
            } else if (isPublicEndpoint(path)) {
                String ipAddress = getClientIpAddress(request);
                boolean allowed = rateLimitService.tryConsumeForIp(ipAddress);
                if (!allowed) {
                    rateLimitExceeded = true;
                    rateLimitType = "IP address";
                    logger.warn(
                            "Rate limit exceeded for public endpoint. IP: {}, Path: {}",
                            ipAddress,
                            path);
                }
            }
        }

        if (rateLimitExceeded) {
            sendRateLimitExceededResponse(response, rateLimitType);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendRateLimitExceededResponse(HttpServletResponse response, String rateLimitType)
            throws IOException {
        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(
                        HttpStatus.TOO_MANY_REQUESTS,
                        String.format(
                                "Rate limit exceeded for %s. Please try again later.",
                                rateLimitType));
        problemDetail.setTitle("Too Many Requests");
        problemDetail.setProperty("retryAfter", RETRY_AFTER_SECONDS);
        problemDetail.setProperty("limitType", rateLimitType);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(RETRY_AFTER_SECONDS));
        response.setHeader("X-RateLimit-Limit-Type", rateLimitType);
        response.setHeader("X-RateLimit-Retry-After", String.valueOf(RETRY_AFTER_SECONDS));
        response.getWriter().write(objectMapper.writeValueAsString(problemDetail));
    }

    private boolean isExemptEndpoint(String path) {
        return path.startsWith("/actuator/")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/swagger-ui.html")
                || path.startsWith("/api-docs/")
                || path.startsWith("/v3/api-docs/");
    }

    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/v1/webhooks/") || path.startsWith("/api/v1/public/");
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
