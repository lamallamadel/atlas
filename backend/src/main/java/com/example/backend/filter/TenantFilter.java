package com.example.backend.filter;

import com.example.backend.util.TenantContext;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.MDC;

import java.io.IOException;

/**
 * Tenant isolation filter that extracts the X-Org-Id header and sets it in TenantContext.
 * 
 * This filter runs at HIGHEST_PRECEDENCE - 100 to ensure it executes before the Spring Security
 * filter chain. This is critical because:
 * 1. It needs to extract the X-Org-Id header before security validation
 * 2. It sets up the TenantContext that is used throughout the request
 * 3. It ensures proper cleanup in a finally block, even if security checks fail
 * 
 * The X-Org-Id header is mandatory for all /api/** endpoints except:
 * - /actuator/** (monitoring endpoints)
 * - /swagger-ui/** (API documentation)
 * - /api/v1/webhooks/** (webhook endpoints)
 * 
 * Missing or empty X-Org-Id header results in HTTP 400 Bad Request.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE - 100)
public class TenantFilter extends OncePerRequestFilter {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private final ObjectMapper objectMapper;

    public TenantFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (isPermitAllEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/api/")) {
            String orgId = request.getHeader(ORG_ID_HEADER);

            if (orgId == null || orgId.trim().isEmpty()) {
                ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                        HttpStatus.BAD_REQUEST,
                        "Missing required header: " + ORG_ID_HEADER
                );
                problemDetail.setTitle("Bad Request");

                response.setStatus(HttpStatus.BAD_REQUEST.value());
                response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                response.getWriter().write(objectMapper.writeValueAsString(problemDetail));
                return;
            }

            try {
                TenantContext.setOrgId(orgId);
                MDC.put("orgId", orgId);
                filterChain.doFilter(request, response);
            } finally {
                MDC.remove("orgId");
                TenantContext.clear();
            }
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPermitAllEndpoint(String path) {
        return path.startsWith("/actuator/")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/swagger-ui.html")
                || path.startsWith("/api-docs/")
                || path.startsWith("/v3/api-docs/")
                || path.startsWith("/api/v1/webhooks/");
    }

}
