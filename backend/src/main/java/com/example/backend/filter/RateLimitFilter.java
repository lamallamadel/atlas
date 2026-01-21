package com.example.backend.filter;

import com.example.backend.config.RateLimitConfig;
import com.example.backend.service.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE - 50)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final int RETRY_AFTER_SECONDS = 60;

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;
    private final RateLimitConfig rateLimitConfig;

    public RateLimitFilter(RateLimitService rateLimitService, ObjectMapper objectMapper, RateLimitConfig rateLimitConfig) {
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
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

        if (path.startsWith("/api/")) {
            String orgId = request.getHeader(ORG_ID_HEADER);

            if (orgId != null && !orgId.trim().isEmpty()) {
                boolean allowed = rateLimitService.tryConsume(orgId);

                if (!allowed) {
                    ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Rate limit exceeded. Please try again later."
                    );
                    problemDetail.setTitle("Too Many Requests");

                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                    response.setHeader("Retry-After", String.valueOf(RETRY_AFTER_SECONDS));
                    response.getWriter().write(objectMapper.writeValueAsString(problemDetail));
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isExemptEndpoint(String path) {
        return path.startsWith("/actuator/")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/swagger-ui.html")
                || path.startsWith("/api-docs/")
                || path.startsWith("/v3/api-docs/")
                || path.startsWith("/api/v1/webhooks/");
    }
}
