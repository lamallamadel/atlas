package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitConfig {

    private Integer defaultRequestsPerMinute = 100;
    private Integer ipBasedRequestsPerMinute = 60;
    private Boolean enabled = true;
    private Boolean useRedis = true;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    public Integer getDefaultRequestsPerMinute() {
        return defaultRequestsPerMinute;
    }

    public void setDefaultRequestsPerMinute(Integer defaultRequestsPerMinute) {
        this.defaultRequestsPerMinute = defaultRequestsPerMinute;
    }

    public Integer getIpBasedRequestsPerMinute() {
        return ipBasedRequestsPerMinute;
    }

    public void setIpBasedRequestsPerMinute(Integer ipBasedRequestsPerMinute) {
        this.ipBasedRequestsPerMinute = ipBasedRequestsPerMinute;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean getUseRedis() {
        return useRedis;
    }

    public void setUseRedis(Boolean useRedis) {
        this.useRedis = useRedis;
    }

    public String getRedisHost() {
        return redisHost;
    }

    public int getRedisPort() {
        return redisPort;
    }

    public String getRedisPassword() {
        return redisPassword;
    }
}
