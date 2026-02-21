package com.example.backend.performance;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "cache.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RedisCacheService {

    private static final Logger logger = LoggerFactory.getLogger(RedisCacheService.class);
    
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${cache.ttl.annonce:900}")
    private long annonceTtl;

    @Value("${cache.ttl.dossier:600}")
    private long dossierTtl;

    @Value("${cache.ttl.referential:3600}")
    private long referentialTtl;

    @Value("${cache.ttl.user-preferences:1800}")
    private long userPreferencesTtl;

    @Value("${cache.ttl.active-annonces:300}")
    private long activeAnnoncesTtl;

    public RedisCacheService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public <T> void cacheActiveAnnonces(List<T> annonces) {
        try {
            String key = "active_annonces:list";
            String json = objectMapper.writeValueAsString(annonces);
            redisTemplate.opsForValue().set(key, json, activeAnnoncesTtl, TimeUnit.SECONDS);
            logger.debug("Cached active annonces with TTL {}s", activeAnnoncesTtl);
        } catch (JsonProcessingException e) {
            logger.error("Failed to cache active annonces", e);
        }
    }

    public <T> Optional<List<T>> getActiveAnnonces(Class<T> clazz) {
        try {
            String key = "active_annonces:list";
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                logger.debug("Cache hit for active annonces");
                List<T> result = objectMapper.readValue(json, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
                return Optional.of(result);
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve active annonces from cache", e);
        }
        logger.debug("Cache miss for active annonces");
        return Optional.empty();
    }

    public <T> void cacheAnnonce(Long id, T annonce) {
        try {
            String key = "annonce:" + id;
            String json = objectMapper.writeValueAsString(annonce);
            redisTemplate.opsForValue().set(key, json, annonceTtl, TimeUnit.SECONDS);
            logger.debug("Cached annonce {} with TTL {}s", id, annonceTtl);
        } catch (JsonProcessingException e) {
            logger.error("Failed to cache annonce {}", id, e);
        }
    }

    public <T> Optional<T> getAnnonce(Long id, Class<T> clazz) {
        try {
            String key = "annonce:" + id;
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                logger.debug("Cache hit for annonce {}", id);
                return Optional.of(objectMapper.readValue(json, clazz));
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve annonce {} from cache", id, e);
        }
        logger.debug("Cache miss for annonce {}", id);
        return Optional.empty();
    }

    public void invalidateAnnonce(Long id) {
        String key = "annonce:" + id;
        redisTemplate.delete(key);
        redisTemplate.delete("active_annonces:list");
        logger.debug("Invalidated cache for annonce {}", id);
    }

    public <T> void cacheDossier(Long id, T dossier) {
        try {
            String key = "dossier:" + id;
            String json = objectMapper.writeValueAsString(dossier);
            redisTemplate.opsForValue().set(key, json, dossierTtl, TimeUnit.SECONDS);
            logger.debug("Cached dossier {} with TTL {}s", id, dossierTtl);
        } catch (JsonProcessingException e) {
            logger.error("Failed to cache dossier {}", id, e);
        }
    }

    public <T> Optional<T> getDossier(Long id, Class<T> clazz) {
        try {
            String key = "dossier:" + id;
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                logger.debug("Cache hit for dossier {}", id);
                return Optional.of(objectMapper.readValue(json, clazz));
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve dossier {} from cache", id, e);
        }
        logger.debug("Cache miss for dossier {}", id);
        return Optional.empty();
    }

    public void invalidateDossier(Long id) {
        String key = "dossier:" + id;
        redisTemplate.delete(key);
        logger.debug("Invalidated cache for dossier {}", id);
    }

    public <T> void cacheReferentialData(String type, List<T> data) {
        try {
            String key = "referential:" + type;
            String json = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(key, json, referentialTtl, TimeUnit.SECONDS);
            logger.debug("Cached referential data '{}' with TTL {}s", type, referentialTtl);
        } catch (JsonProcessingException e) {
            logger.error("Failed to cache referential data '{}'", type, e);
        }
    }

    public <T> Optional<List<T>> getReferentialData(String type, Class<T> clazz) {
        try {
            String key = "referential:" + type;
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                logger.debug("Cache hit for referential data '{}'", type);
                List<T> result = objectMapper.readValue(json, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
                return Optional.of(result);
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve referential data '{}' from cache", type, e);
        }
        logger.debug("Cache miss for referential data '{}'", type);
        return Optional.empty();
    }

    public void invalidateReferentialData(String type) {
        String key = "referential:" + type;
        redisTemplate.delete(key);
        logger.debug("Invalidated cache for referential data '{}'", type);
    }

    public <T> void cacheUserPreferences(String userId, T preferences) {
        try {
            String key = "user_preferences:" + userId;
            String json = objectMapper.writeValueAsString(preferences);
            redisTemplate.opsForValue().set(key, json, userPreferencesTtl, TimeUnit.SECONDS);
            logger.debug("Cached user preferences for {} with TTL {}s", userId, userPreferencesTtl);
        } catch (JsonProcessingException e) {
            logger.error("Failed to cache user preferences for {}", userId, e);
        }
    }

    public <T> Optional<T> getUserPreferences(String userId, Class<T> clazz) {
        try {
            String key = "user_preferences:" + userId;
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                logger.debug("Cache hit for user preferences {}", userId);
                return Optional.of(objectMapper.readValue(json, clazz));
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve user preferences {} from cache", userId, e);
        }
        logger.debug("Cache miss for user preferences {}", userId);
        return Optional.empty();
    }

    public void invalidateUserPreferences(String userId) {
        String key = "user_preferences:" + userId;
        redisTemplate.delete(key);
        logger.debug("Invalidated cache for user preferences {}", userId);
    }

    public void invalidateAll() {
        Set<String> keys = redisTemplate.keys("*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            logger.info("Invalidated all cache entries: {} keys", keys.size());
        }
    }

    public long getCacheSize() {
        Set<String> keys = redisTemplate.keys("*");
        return keys != null ? keys.size() : 0;
    }

    public void logCacheStats() {
        long cacheSize = getCacheSize();
        logger.info("=== Redis Cache Statistics ===");
        logger.info("Total cached keys: {}", cacheSize);
        
        long annonceCount = countKeysByPattern("annonce:*");
        long dossierCount = countKeysByPattern("dossier:*");
        long referentialCount = countKeysByPattern("referential:*");
        long userPrefCount = countKeysByPattern("user_preferences:*");
        
        logger.info("Cached annonces: {}", annonceCount);
        logger.info("Cached dossiers: {}", dossierCount);
        logger.info("Cached referential data: {}", referentialCount);
        logger.info("Cached user preferences: {}", userPrefCount);
    }

    private long countKeysByPattern(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        return keys != null ? keys.size() : 0;
    }
}
