package com.example.backend.filter;

import com.example.backend.entity.ApiKeyEntity;
import com.example.backend.service.ApiKeyService;
import com.example.backend.service.ApiUsageTrackingService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;
    private final ApiUsageTrackingService usageTrackingService;

    public ApiKeyAuthenticationFilter(
            ApiKeyService apiKeyService, ApiUsageTrackingService usageTrackingService) {
        this.apiKeyService = apiKeyService;
        this.usageTrackingService = usageTrackingService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String requestUri = request.getRequestURI();

        if (!requestUri.startsWith("/api/public/v1")) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = extractApiKey(request);

        if (apiKey == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Missing API key\"}");
            return;
        }

        ApiKeyEntity keyEntity = apiKeyService.validateApiKey(apiKey).orElse(null);

        if (keyEntity == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Invalid API key\"}");
            return;
        }

        request.setAttribute("orgId", keyEntity.getOrgId());
        request.setAttribute("apiKeyId", keyEntity.getId());
        request.setAttribute("apiTier", keyEntity.getTier());

        long startTime = System.currentTimeMillis();

        filterChain.doFilter(request, response);

        long duration = System.currentTimeMillis() - startTime;
        boolean success = response.getStatus() < 400;

        apiKeyService.updateLastUsed(keyEntity.getId());
        usageTrackingService.trackApiUsage(
                keyEntity.getId(), keyEntity.getOrgId(), requestUri, success, duration);
    }

    private String extractApiKey(HttpServletRequest request) {
        String header = request.getHeader("X-API-Key");
        if (header != null && !header.isBlank()) {
            return header;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }
}
