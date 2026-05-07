package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.backend.dto.QuotaSettingsDto;
import com.example.backend.dto.UserInviteRequest;
import com.example.backend.util.TenantContext;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.util.Collections;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private Keycloak keycloakAdminClient;

    @Mock
    private CircuitBreaker circuitBreaker;

    @Mock
    private OrganizationSettingsService organizationSettingsService;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(keycloakAdminClient, circuitBreaker, "test-realm", organizationSettingsService);
        TenantContext.setOrgId("org1");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testInviteUser_QuotaExceeded() {
        UserInviteRequest request = new UserInviteRequest();
        request.setEmail("test@example.com");

        QuotaSettingsDto quotas = new QuotaSettingsDto(1, 10, 100L, 5, "STARTER");
        when(organizationSettingsService.getQuotas("org1")).thenReturn(quotas);

        RealmResource realmResource = mock(RealmResource.class);
        UsersResource usersResource = mock(UsersResource.class);
        
        when(keycloakAdminClient.realm("test-realm")).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        
        // Mock Keycloak returning 1 existing user with orgId="org1"
        org.keycloak.representations.idm.UserRepresentation existingUser = new org.keycloak.representations.idm.UserRepresentation();
        existingUser.setAttributes(java.util.Map.of("orgId", java.util.Arrays.asList("org1")));
        when(usersResource.search("org1", 0, 1000)).thenReturn(java.util.Arrays.asList(existingUser));

        assertThatThrownBy(() -> userService.inviteUser(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("User quota exceeded");
    }
    
    @Test
    void testInviteUser_NoTenantContext() {
        TenantContext.clear();
        UserInviteRequest request = new UserInviteRequest();
        
        assertThatThrownBy(() -> userService.inviteUser(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Organization ID not found");
    }
}
