package com.example.backend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${cache.redis.enabled:true}")
    private boolean redisEnabled;

    @Bean
    @ConditionalOnProperty(
            name = "cache.redis.enabled",
            havingValue = "true",
            matchIfMissing = true)
    public RedisConnectionFactory redisConnectionFactory() {
        LettuceConnectionFactory factory = new LettuceConnectionFactory(redisHost, redisPort);
        factory.afterPropertiesSet();
        return factory;
    }

    @Bean
    @Primary
    @ConditionalOnProperty(
            name = "cache.redis.enabled",
            havingValue = "true",
            matchIfMissing = true)
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder().allowIfBaseType(Object.class).build(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);

        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);

        RedisCacheConfiguration defaultConfig =
                RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .serializeKeysWith(
                                RedisSerializationContext.SerializationPair.fromSerializer(
                                        new StringRedisSerializer()))
                        .serializeValuesWith(
                                RedisSerializationContext.SerializationPair.fromSerializer(
                                        serializer))
                        .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        cacheConfigurations.put("annonce", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put("dossier", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("funnelAnalysis", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("agentPerformance", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("revenueForecast", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("pipelineSummary", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put(
                "conversionFunnelBySource", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(
                "conversionFunnelByPeriod", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(
                "agentMetricsDetailed", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("revenueProjections", defaultConfig.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }

    @Bean
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException e, Cache cache, Object key) {
                /* swallow */
            }

            @Override
            public void handleCachePutError(
                    RuntimeException e, Cache cache, Object key, Object value) {
                /* swallow */
            }

            @Override
            public void handleCacheEvictError(RuntimeException e, Cache cache, Object key) {
                /* swallow */
            }

            @Override
            public void handleCacheClearError(RuntimeException e, Cache cache) {
                /* swallow */
            }
        };
    }
}
