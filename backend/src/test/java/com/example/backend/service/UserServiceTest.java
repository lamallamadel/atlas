package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.dto.QuotaSettingsDto;
import com.example.backend.dto.UserInviteRequest;
import com.example.backend.dto.UserInviteResponse;
import com.example.backend.util.TenantContext;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleMappingResource;
import org.keycloak.admin.client.resource.RoleResource;
import org.keycloak.admin.client.resource.RoleScopeResource;
import org.keycloak.admin.client.resource.RolesResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserServiceTest {

    @Mock private Keycloak keycloakAdminClient;

    @Mock private CircuitBreaker circuitBreaker;

    @Mock private OrganizationSettingsService organizationSettingsService;

    private UserService userService;
    private RealmResource realmResource;
    private UsersResource usersResource;

    @BeforeEach
    void setUp() {
        userService =
                new UserService(
                        keycloakAdminClient,
                        circuitBreaker,
                        "test-realm",
                        organizationSettingsService);
        TenantContext.setOrgId("org1");
        realmResource = mock(RealmResource.class);
        usersResource = mock(UsersResource.class);
        when(keycloakAdminClient.realm("test-realm")).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        as("ROLE_ADMIN");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    private static void as(String... authorities) {
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                "me",
                                "n/a",
                                Arrays.stream(authorities)
                                        .map(SimpleGrantedAuthority::new)
                                        .toList()));
    }

    private static UserInviteRequest request(String role) {
        UserInviteRequest request = new UserInviteRequest();
        request.setEmail("test@example.com");
        request.setFirstName("Test");
        request.setLastName("User");
        if (role != null) {
            request.setRole(role);
        }
        return request;
    }

    /** Keycloak qui crée l'utilisateur new-id et renvoie le rôle demandé. */
    private RoleScopeResource keycloakCreates(String roleName) {
        when(usersResource.create(any()))
                .thenReturn(
                        Response.created(URI.create("http://kc/admin/realms/r/users/new-id"))
                                .build());
        UserResource userResource = mock(UserResource.class);
        RoleMappingResource mappings = mock(RoleMappingResource.class);
        RoleScopeResource realmLevel = mock(RoleScopeResource.class);
        when(usersResource.get("new-id")).thenReturn(userResource);
        when(userResource.roles()).thenReturn(mappings);
        when(mappings.realmLevel()).thenReturn(realmLevel);
        when(realmLevel.listAll()).thenReturn(List.of());

        RolesResource roles = mock(RolesResource.class);
        RoleResource role = mock(RoleResource.class);
        RoleRepresentation representation = new RoleRepresentation();
        representation.setName(roleName);
        when(realmResource.roles()).thenReturn(roles);
        when(roles.get(roleName)).thenReturn(role);
        when(role.toRepresentation()).thenReturn(representation);
        return realmLevel;
    }

    @Test
    void testInviteUser_QuotaExceeded() {
        QuotaSettingsDto quotas = new QuotaSettingsDto(1, 10, 100L, 5, "STARTER");
        when(organizationSettingsService.getQuotas("org1")).thenReturn(quotas);

        UserRepresentation existingUser = new UserRepresentation();
        existingUser.setAttributes(Map.of("orgId", List.of("org1")));
        when(usersResource.searchByAttributes("orgId:org1")).thenReturn(List.of(existingUser));

        assertThatThrownBy(() -> userService.inviteUser(request(null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("User quota exceeded");
    }

    @Test
    void testInviteUser_NoTenantContext() {
        TenantContext.clear();

        assertThatThrownBy(() -> userService.inviteUser(new UserInviteRequest()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Organization ID not found");
    }

    @Test
    void invite_grantsRequestedRole() {
        as("ROLE_MANAGER", "ROLE_PRO");
        RoleScopeResource realmLevel = keycloakCreates("AGENT");

        UserInviteResponse response = userService.inviteUser(request("AGENT"));

        assertThat(response.getId()).isEqualTo("new-id");
        assertThat(response.getRole()).isEqualTo("AGENT");
        verify(realmLevel)
                .add(
                        org.mockito.ArgumentMatchers.argThat(
                                l -> l.size() == 1 && "AGENT".equals(l.get(0).getName())));
        verify(usersResource.get("new-id")).executeActionsEmail(List.of("UPDATE_PASSWORD"));
    }

    @Test
    void invite_legacyProRole_isReadAsAgent() {
        keycloakCreates("AGENT");

        assertThat(userService.inviteUser(request("PRO")).getRole()).isEqualTo("AGENT");
    }

    @Test
    void invite_managerCannotInviteManager() {
        as("ROLE_MANAGER", "ROLE_PRO");

        assertThatThrownBy(() -> userService.inviteUser(request("MANAGER")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(
                        e ->
                                assertThat(((ResponseStatusException) e).getStatusCode())
                                        .isEqualTo(HttpStatus.FORBIDDEN));
        verify(usersResource, never()).create(any());
    }

    @Test
    void invite_agentCannotInvite() {
        as("ROLE_AGENT", "ROLE_PRO");

        assertThatThrownBy(() -> userService.inviteUser(request("AGENT")))
                .hasMessageContaining("INVITE_FORBIDDEN");
        verify(usersResource, never()).create(any());
    }

    @Test
    void invite_unknownRole_isRejected() {
        assertThatThrownBy(() -> userService.inviteUser(request("OWNER")))
                .hasMessageContaining("INVALID_ROLE");
    }

    @Test
    void invite_roleGrantFailure_removesUser() {
        RoleScopeResource realmLevel = keycloakCreates("MANAGER");
        org.mockito.Mockito.doThrow(new RuntimeException("boom")).when(realmLevel).add(any());

        assertThatThrownBy(() -> userService.inviteUser(request("MANAGER")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Could not grant the requested role");
        verify(usersResource.get("new-id")).remove();
    }
}
