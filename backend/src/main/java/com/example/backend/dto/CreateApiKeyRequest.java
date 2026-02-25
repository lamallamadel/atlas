package com.example.backend.dto;

import com.example.backend.entity.ApiKeyEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateApiKeyRequest {

    @NotBlank private String name;

    private String description;

    @NotNull private ApiKeyEntity.ApiTier tier = ApiKeyEntity.ApiTier.FREE;

    private String scopes;

    private LocalDateTime expiresAt;

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

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
