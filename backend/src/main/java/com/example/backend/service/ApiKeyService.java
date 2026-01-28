package com.example.backend.service;

import com.example.backend.entity.ApiKeyEntity;
import com.example.backend.repository.ApiKeyRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiKeyService(ApiKeyRepository apiKeyRepository, PasswordEncoder passwordEncoder) {
        this.apiKeyRepository = apiKeyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ApiKeyCreateResult createApiKey(String orgId, String name, String description, 
                                          ApiKeyEntity.ApiTier tier, String scopes, 
                                          LocalDateTime expiresAt) {
        String apiKey = generateApiKey();
        String keyPrefix = apiKey.substring(0, 12);
        String keyHash = passwordEncoder.encode(apiKey);

        ApiKeyEntity entity = new ApiKeyEntity();
        entity.setOrgId(orgId);
        entity.setName(name);
        entity.setDescription(description);
        entity.setKeyHash(keyHash);
        entity.setKeyPrefix(keyPrefix);
        entity.setTier(tier);
        entity.setStatus(ApiKeyEntity.ApiKeyStatus.ACTIVE);
        entity.setScopes(scopes);
        entity.setExpiresAt(expiresAt);

        ApiKeyEntity saved = apiKeyRepository.save(entity);

        return new ApiKeyCreateResult(saved, apiKey);
    }

    public Optional<ApiKeyEntity> validateApiKey(String apiKey) {
        List<ApiKeyEntity> candidates = apiKeyRepository.findAll();
        
        for (ApiKeyEntity key : candidates) {
            if (passwordEncoder.matches(apiKey, key.getKeyHash())) {
                if (key.getStatus() != ApiKeyEntity.ApiKeyStatus.ACTIVE) {
                    return Optional.empty();
                }
                if (key.getExpiresAt() != null && key.getExpiresAt().isBefore(LocalDateTime.now())) {
                    return Optional.empty();
                }
                return Optional.of(key);
            }
        }
        
        return Optional.empty();
    }

    @Transactional
    public void updateLastUsed(Long apiKeyId) {
        apiKeyRepository.findById(apiKeyId).ifPresent(key -> {
            key.setLastUsedAt(LocalDateTime.now());
            apiKeyRepository.save(key);
        });
    }

    public List<ApiKeyEntity> getApiKeysByOrg(String orgId) {
        return apiKeyRepository.findByOrgId(orgId);
    }

    public Optional<ApiKeyEntity> getApiKey(Long id, String orgId) {
        return apiKeyRepository.findById(id)
            .filter(key -> key.getOrgId().equals(orgId));
    }

    @Transactional
    public void revokeApiKey(Long id, String orgId) {
        apiKeyRepository.findById(id)
            .filter(key -> key.getOrgId().equals(orgId))
            .ifPresent(key -> {
                key.setStatus(ApiKeyEntity.ApiKeyStatus.REVOKED);
                apiKeyRepository.save(key);
            });
    }

    private String generateApiKey() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return "sk_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static class ApiKeyCreateResult {
        private final ApiKeyEntity entity;
        private final String plainTextKey;

        public ApiKeyCreateResult(ApiKeyEntity entity, String plainTextKey) {
            this.entity = entity;
            this.plainTextKey = plainTextKey;
        }

        public ApiKeyEntity getEntity() {
            return entity;
        }

        public String getPlainTextKey() {
            return plainTextKey;
        }
    }
}
