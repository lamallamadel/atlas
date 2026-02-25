package com.example.backend.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class RateLimitHealthIndicator implements HealthIndicator {

    private final RateLimitConfig rateLimitConfig;

    public RateLimitHealthIndicator(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    public Health health() {
        Health.Builder builder = new Health.Builder();

        if (!rateLimitConfig.getEnabled()) {
            return builder.up()
                    .withDetail("enabled", false)
                    .withDetail("message", "Rate limiting is disabled")
                    .build();
        }

        builder.up()
                .withDetail("enabled", true)
                .withDetail("mode", "in-memory")
                .withDetail("storage", "local")
                .withDetail("message", "Using in-memory rate limiting")
                .withDetail(
                        "defaultRequestsPerMinute", rateLimitConfig.getDefaultRequestsPerMinute())
                .withDetail(
                        "ipBasedRequestsPerMinute", rateLimitConfig.getIpBasedRequestsPerMinute())
                .withDetail("redisSupport", "available for future enhancement");

        return builder.build();
    }
}
