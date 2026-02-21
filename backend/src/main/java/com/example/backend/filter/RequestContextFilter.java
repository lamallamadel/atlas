package com.example.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Enriches MDC with request/user context and logs slow requests.
 *
 * <p>Named bean: "atlasRequestContextFilter" to avoid conflict with Spring Boot's default
 * RequestContextFilter (spring.main.allow-bean-definition-overriding not needed)
 */
@Component("atlasRequestContextFilter")
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestContextFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestContextFilter.class);

    private final long slowThresholdMs;

    public RequestContextFilter(
            @Value("${atlas.slow-request.threshold-ms:1500}") long slowThresholdMs) {
        this.slowThresholdMs = slowThresholdMs;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long start = System.currentTimeMillis();

        String method = request.getMethod();
        String path = request.getRequestURI();

        MDC.put("httpMethod", method);
        MDC.put("requestPath", path);

        String userId = resolveUserId();
        if (userId != null) {
            MDC.put("userId", userId);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            int status = response.getStatus();

            MDC.put("responseStatus", String.valueOf(status));
            MDC.put("durationMs", String.valueOf(durationMs));

            if (durationMs >= slowThresholdMs) {
                log.warn("Slow request: {} {} -> {} ({} ms)", method, path, status, durationMs);
            }

            MDC.remove("httpMethod");
            MDC.remove("requestPath");
            MDC.remove("userId");
            MDC.remove("responseStatus");
            MDC.remove("durationMs");
        }
    }

    private String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            Object sub = jwt.getClaims().get("sub");
            return sub != null ? String.valueOf(sub) : auth.getName();
        }

        String name = auth.getName();
        return (name != null && !name.isBlank()) ? name : null;
    }
}
