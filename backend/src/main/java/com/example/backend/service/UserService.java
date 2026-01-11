package com.example.backend.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for resolving user IDs to display names.
 * 
 * <p>This service provides methods to convert user IDs into human-readable display names
 * with an in-memory LRU cache to minimize repeated lookups.</p>
 * 
 * <h3>Fallback Strategy:</h3>
 * <ul>
 *   <li>Returns full name if available</li>
 *   <li>Falls back to email if full name is not available</li>
 *   <li>Returns "Système" if userId is null</li>
 *   <li>Returns "Utilisateur supprimé" if user ID doesn't exist</li>
 * </ul>
 * 
 * <h3>Caching:</h3>
 * <p>Uses an LRU cache to avoid repeated lookups. The cache has a maximum size of 1000 entries.</p>
 * 
 * <h3>Future Integration:</h3>
 * <p>Currently returns user IDs as-is. This should be integrated with a real user
 * management system (e.g., Keycloak API, database table) to fetch actual user details.</p>
 */
@Service
public class UserService {

    private static final int MAX_CACHE_SIZE = 1000;
    private final Map<String, String> displayNameCache = new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
            return size() > MAX_CACHE_SIZE;
        }
    };

    /**
     * Resolves a single user ID to a display name.
     * 
     * @param userId the user ID to resolve (can be null)
     * @return the display name following the fallback strategy
     */
    public String getUserDisplayName(String userId) {
        if (userId == null || userId.isBlank()) {
            return "Système";
        }

        return displayNameCache.computeIfAbsent(userId, this::fetchUserDisplayName);
    }

    /**
     * Resolves multiple user IDs to display names in a batch for better performance.
     * 
     * @param userIds list of user IDs to resolve
     * @return map of user ID to display name
     */
    public Map<String, String> getUserDisplayNames(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        return userIds.stream()
                .distinct()
                .collect(Collectors.toMap(
                        userId -> userId,
                        this::getUserDisplayName,
                        (existing, replacement) -> existing
                ));
    }

    /**
     * Fetches the user display name from the underlying user management system.
     * 
     * <p><strong>TODO:</strong> Integrate with actual user management system:</p>
     * <ul>
     *   <li>Query Keycloak Admin API for user details</li>
     *   <li>Query a local user database table</li>
     *   <li>Use Spring Security User Details Service</li>
     * </ul>
     * 
     * @param userId the user ID to fetch
     * @return the resolved display name
     */
    private String fetchUserDisplayName(String userId) {
        // TODO: Integrate with real user management system
        // Example integrations:
        // 1. Keycloak Admin API:
        //    - Use Keycloak Admin Client to fetch user by ID
        //    - Extract firstName + lastName or email
        // 2. Database lookup:
        //    - Query user table for user details
        // 3. LDAP/Active Directory:
        //    - Query directory service for user information
        
        // For now, check if it's a system user
        if ("system".equalsIgnoreCase(userId)) {
            return "Système";
        }

        // If it looks like an email, return it as-is
        if (userId.contains("@")) {
            return userId;
        }

        // For unknown users, return "Utilisateur supprimé"
        // This will be replaced when integrated with real user system
        return "Utilisateur supprimé";
    }

    /**
     * Clears the display name cache.
     * Useful for testing or when user data changes.
     */
    public void clearCache() {
        displayNameCache.clear();
    }

    /**
     * Gets the current cache size.
     * Useful for monitoring and testing.
     * 
     * @return number of entries in the cache
     */
    public int getCacheSize() {
        return displayNameCache.size();
    }
}
