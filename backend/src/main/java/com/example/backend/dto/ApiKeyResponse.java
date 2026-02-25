package com.example.backend.dto;

import com.example.backend.entity.ApiKeyEntity;
import java.time.LocalDateTime;

public class ApiKeyResponse {

    private Long id;
    private String name;
    private String description;
    private String keyPrefix;
    private ApiKeyEntity.ApiKeyStatus status;
    private ApiKeyEntity.ApiTier tier;
    private String scopes;
    private LocalDateTime lastUsedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private String plainTextKey;

    public static ApiKeyResponse from(ApiKeyEntity entity) {
        ApiKeyResponse response = new ApiKeyResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        response.setKeyPrefix(entity.getKeyPrefix());
        response.setStatus(entity.getStatus());
        response.setTier(entity.getTier());
        response.setScopes(entity.getScopes());
        response.setLastUsedAt(entity.getLastUsedAt());
        response.setExpiresAt(entity.getExpiresAt());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    public void setKeyPrefix(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

    public ApiKeyEntity.ApiKeyStatus getStatus() {
        return status;
    }

    public void setStatus(ApiKeyEntity.ApiKeyStatus status) {
        this.status = status;
    }

    public ApiKeyEntity.ApiTier getTier() {
        return tier;
    }

    public void setTier(ApiKeyEntity.ApiTier tier) {
        this.tier = tier;
    }

    public String getScopes() {
        return scopes;
    }

    public void setScopes(String scopes) {
        this.scopes = scopes;
    }

    public LocalDateTime getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(LocalDateTime lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getPlainTextKey() {
        return plainTextKey;
    }

    public void setPlainTextKey(String plainTextKey) {
        this.plainTextKey = plainTextKey;
    }
}
