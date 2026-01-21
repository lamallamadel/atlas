package com.example.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitConfig {

    private Integer defaultRequestsPerMinute = 100;
    private Boolean enabled = true;

    public Integer getDefaultRequestsPerMinute() {
        return defaultRequestsPerMinute;
    }

    public void setDefaultRequestsPerMinute(Integer defaultRequestsPerMinute) {
        this.defaultRequestsPerMinute = defaultRequestsPerMinute;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
