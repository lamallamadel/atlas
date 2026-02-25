package com.example.backend.filter;

import com.example.backend.entity.ApiKeyEntity;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class PublicApiRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

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

        Long apiKeyId = (Long) request.getAttribute("apiKeyId");
        ApiKeyEntity.ApiTier tier = (ApiKeyEntity.ApiTier) request.getAttribute("apiTier");

        if (apiKeyId == null || tier == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String bucketKey = "api_key_" + apiKeyId;
        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket(tier));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setHeader("X-RateLimit-Limit-Type", tier.name());
            response.setHeader("Retry-After", "60");
            response.getWriter().write("{\"error\":\"Rate limit exceeded\"}");
        }
    }

    private Bucket createBucket(ApiKeyEntity.ApiTier tier) {
        int requestsPerMinute =
                switch (tier) {
                    case FREE -> 60;
                    case PRO -> 600;
                    case ENTERPRISE -> 6000;
                };

        Bandwidth limit =
                Bandwidth.classic(
                        requestsPerMinute,
                        Refill.intervally(requestsPerMinute, Duration.ofMinutes(1)));

        return Bucket.builder().addLimit(limit).build();
    }
}
