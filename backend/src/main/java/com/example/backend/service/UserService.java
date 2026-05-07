package com.example.backend.service;

import com.example.backend.dto.UserInviteRequest;
import com.example.backend.dto.UserInviteResponse;
import com.example.backend.dto.QuotaSettingsDto;
import com.example.backend.util.TenantContext;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.Collections;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UsersResource;
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
    private final OrganizationSettingsService organizationSettingsService;

    public UserService(
            Keycloak keycloakAdminClient,
            CircuitBreaker keycloakCircuitBreaker,
            @Value("${keycloak.admin.realm}") String keycloakRealm,
            OrganizationSettingsService organizationSettingsService) {
        this.keycloakAdminClient = keycloakAdminClient;
        this.circuitBreaker = keycloakCircuitBreaker;
        this.keycloakRealm = keycloakRealm;
        this.organizationSettingsService = organizationSettingsService;
    }

    public UserInviteResponse inviteUser(UserInviteRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null || orgId.isBlank()) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        QuotaSettingsDto quotas = organizationSettingsService.getQuotas(orgId);
        UsersResource usersResource = keycloakAdminClient.realm(keycloakRealm).users();

        if (quotas != null && quotas.getMaxUsers() != null && quotas.getMaxUsers() != -1) {
            // Search users by orgId custom attribute
            List<UserRepresentation> orgUsers = usersResource.search(orgId, 0, 1000);
            long count = orgUsers.stream()
                .filter(u -> u.getAttributes() != null && u.getAttributes().containsKey("orgId") 
                            && u.getAttributes().get("orgId").contains(orgId))
                .count();
                
            if (count >= quotas.getMaxUsers()) {
                throw new IllegalStateException("User quota exceeded. Maximum allowed users is " + quotas.getMaxUsers() + ".");
            }
        }

        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.getEmail());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setAttributes(Map.of("orgId", Arrays.asList(orgId), "tenant_id", Arrays.asList(orgId)));

        Response response = usersResource.create(user);
        
        if (response.getStatus() != 201 && response.getStatus() != 409) {
            throw new RuntimeException("Failed to create user in Keycloak, status: " + response.getStatus());
        }
        
        if (response.getStatus() == 409) {
            throw new IllegalStateException("User with this email already exists.");
        }
        
        String path = response.getLocation().getPath();
        String userId = path.substring(path.lastIndexOf('/') + 1);
        
        // Trigger password reset email
        try {
            usersResource.get(userId).executeActionsEmail(Arrays.asList("UPDATE_PASSWORD"));
        } catch (Exception e) {
            log.warn("Failed to send password reset email to user {}, {}", userId, e.getMessage());
        }
        
        return new UserInviteResponse(userId, request.getEmail(), "INVITED");
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
