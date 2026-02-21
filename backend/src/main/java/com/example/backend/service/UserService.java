package com.example.backend.service;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final int MAX_CACHE_SIZE = 1000;

    private final Map<String, String> displayNameCache =
            new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
                    return size() > MAX_CACHE_SIZE;
                }
            };

    private final Keycloak keycloakAdminClient;
    private final CircuitBreaker circuitBreaker;
    private final String keycloakRealm;

    public UserService(
            Keycloak keycloakAdminClient,
            CircuitBreaker keycloakCircuitBreaker,
            @Value("${keycloak.admin.realm}") String keycloakRealm) {
        this.keycloakAdminClient = keycloakAdminClient;
        this.circuitBreaker = keycloakCircuitBreaker;
        this.keycloakRealm = keycloakRealm;
    }

    public String getUserDisplayName(String userId) {
        if (userId == null || userId.isBlank()) {
            return "Système";
        }

        return displayNameCache.computeIfAbsent(userId, this::fetchUserDisplayName);
    }

    public Map<String, String> getUserDisplayNames(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        return userIds.stream()
                .distinct()
                .collect(
                        Collectors.toMap(
                                userId -> userId,
                                this::getUserDisplayName,
                                (existing, replacement) -> existing));
    }

    private String fetchUserDisplayName(String userId) {
        if ("system".equalsIgnoreCase(userId)) {
            return "Système";
        }

        Supplier<String> fetchFromKeycloak =
                () -> {
                    try {
                        UserRepresentation user =
                                keycloakAdminClient
                                        .realm(keycloakRealm)
                                        .users()
                                        .get(userId)
                                        .toRepresentation();

                        return buildDisplayName(user);
                    } catch (Exception e) {
                        log.warn(
                                "Failed to fetch user from Keycloak: userId={}, error={}",
                                userId,
                                e.getMessage());
                        throw e;
                    }
                };

        try {
            return circuitBreaker.executeSupplier(fetchFromKeycloak);
        } catch (Exception e) {
            log.error("Circuit breaker fallback triggered for userId={}", userId, e);
            return getFallbackDisplayName(userId);
        }
    }

    private String buildDisplayName(UserRepresentation user) {
        if (user == null) {
            return "Utilisateur supprimé";
        }

        String firstName = user.getFirstName();
        String lastName = user.getLastName();
        String email = user.getEmail();

        if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
            return firstName.trim() + " " + lastName.trim();
        }

        if (firstName != null && !firstName.isBlank()) {
            return firstName.trim();
        }

        if (lastName != null && !lastName.isBlank()) {
            return lastName.trim();
        }

        if (email != null && !email.isBlank()) {
            return email;
        }

        return "Utilisateur supprimé";
    }

    private String getFallbackDisplayName(String userId) {
        if (userId.contains("@")) {
            return userId;
        }

        return "Utilisateur supprimé";
    }

    public void clearCache() {
        displayNameCache.clear();
    }

    public int getCacheSize() {
        return displayNameCache.size();
    }
}
