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

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantFilter extends OncePerRequestFilter {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private final ObjectMapper objectMapper;

    public TenantFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        if (requestPath.startsWith("/api/")) {
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
                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
