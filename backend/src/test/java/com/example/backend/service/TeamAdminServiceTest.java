package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.dto.TeamMemberResponse;
import com.example.backend.security.AgencyRole;
import jakarta.ws.rs.NotFoundException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

/** Changement de rôle et désactivation, sur un Keycloak simulé. */
class TeamAdminServiceTest {

    private static final String ORG = "ORG-001";

    private RealmResource realm;
    private UsersResource users;
    private RolesResource roles;
    private final Map<String, UserRepresentation> accounts = new HashMap<>();
    private final Map<String, List<UserRepresentation>> roleMembers = new HashMap<>();
    private final Map<String, RoleScopeResource> realmLevels = new HashMap<>();
    private TeamAdminService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        Keycloak keycloak = mock(Keycloak.class);
        realm = mock(RealmResource.class);
        users = mock(UsersResource.class);
        roles = mock(RolesResource.class);
        when(keycloak.realm("myrealm")).thenReturn(realm);
        when(realm.users()).thenReturn(users);
        when(realm.roles()).thenReturn(roles);
        when(users.searchByAttributes("orgId:" + ORG))
                .thenAnswer(
                        i ->
                                accounts.values().stream()
                                        .filter(u -> TeamAdminService.belongsTo(u, ORG))
                                        .toList());
        for (String name : AgencyRole.KEYCLOAK_ROLES) {
            RoleResource role = mock(RoleResource.class);
            RoleRepresentation representation = new RoleRepresentation();
            representation.setName(name);
            when(roles.get(name)).thenReturn(role);
            when(role.toRepresentation()).thenReturn(representation);
            roleMembers.put(name, new ArrayList<>());
            when(role.getUserMembers(anyInt(), anyInt())).thenAnswer(i -> roleMembers.get(name));
        }
        ObjectProvider<Keycloak> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(keycloak);
        service = new TeamAdminService(provider, "myrealm");

        account("admin-1", ORG, "ADMIN");
        account("agent-1", ORG, "PRO");
        account("other-org", "ORG-002", "AGENT");
        as("admin-1", "ROLE_ADMIN");
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void account(String id, String org, String roleName) {
        UserRepresentation u = new UserRepresentation();
        u.setId(id);
        u.setFirstName(id);
        u.setEnabled(true);
        u.setAttributes(Map.of("orgId", List.of(org)));
        accounts.put(id, u);
        roleMembers.get(roleName).add(u);

        UserResource resource = mock(UserResource.class);
        RoleMappingResource mappings = mock(RoleMappingResource.class);
        RoleScopeResource realmLevel = mock(RoleScopeResource.class);
        when(users.get(id)).thenReturn(resource);
        when(resource.toRepresentation()).thenReturn(u);
        when(resource.roles()).thenReturn(mappings);
        when(mappings.realmLevel()).thenReturn(realmLevel);
        RoleRepresentation current = new RoleRepresentation();
        current.setName(roleName);
        when(realmLevel.listAll()).thenReturn(List.of(current), List.of());
        realmLevels.put(id, realmLevel);
    }

    private static void as(String user, String... authorities) {
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                user,
                                "n/a",
                                Arrays.stream(authorities)
                                        .map(SimpleGrantedAuthority::new)
                                        .toList()));
    }

    @Test
    void admin_promotesAgent_replacingLegacyProRole() {
        TeamMemberResponse member = service.changeRole(ORG, "agent-1", AgencyRole.MANAGER);

        assertThat(member.role()).isEqualTo("MANAGER");
        RoleScopeResource realmLevel = realmLevels.get("agent-1");
        verify(realmLevel).remove(argThat(l -> l.size() == 1 && "PRO".equals(l.get(0).getName())));
        verify(realmLevel).add(argThat(l -> l.size() == 1 && "MANAGER".equals(l.get(0).getName())));
    }

    @Test
    void manager_cannotChangeRoles() {
        as("manager-1", "ROLE_MANAGER", "ROLE_PRO");

        assertThatThrownBy(() -> service.changeRole(ORG, "agent-1", AgencyRole.MANAGER))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("ADMIN_REQUIRED");
        verify(realmLevels.get("agent-1"), never()).add(any());
    }

    @Test
    void cannotChangeOwnRole() {
        assertThatThrownBy(() -> service.changeRole(ORG, "admin-1", AgencyRole.AGENT))
                .hasMessageContaining("SELF_ROLE_CHANGE");
    }

    @Test
    void memberOfAnotherAgency_isNotFound() {
        assertThatThrownBy(() -> service.changeRole(ORG, "other-org", AgencyRole.MANAGER))
                .hasMessageContaining("USER_NOT_IN_AGENCY");
        assertThatThrownBy(() -> service.setEnabled(ORG, "other-org", false))
                .hasMessageContaining("USER_NOT_IN_AGENCY");
    }

    @Test
    void unknownUser_isNotFound() {
        UserResource missing = mock(UserResource.class);
        when(users.get("ghost")).thenReturn(missing);
        when(missing.toRepresentation()).thenThrow(new NotFoundException());

        assertThatThrownBy(() -> service.setEnabled(ORG, "ghost", false))
                .hasMessageContaining("USER_NOT_IN_AGENCY");
    }

    @Test
    void lastActiveAdmin_cannotBeDemotedOrDisabled() {
        as("super", "ROLE_SUPER_ADMIN");

        assertThatThrownBy(() -> service.changeRole(ORG, "admin-1", AgencyRole.AGENT))
                .hasMessageContaining("LAST_ADMIN");
        assertThatThrownBy(() -> service.setEnabled(ORG, "admin-1", false))
                .hasMessageContaining("LAST_ADMIN");
    }

    @Test
    void admin_disablesAndReenablesAgent() {
        assertThat(service.setEnabled(ORG, "agent-1", false).enabled()).isFalse();
        verify(users.get("agent-1")).update(argThat(u -> Boolean.FALSE.equals(u.isEnabled())));

        assertThat(service.setEnabled(ORG, "agent-1", true).enabled()).isTrue();
    }

    @Test
    void cannotDisableSelf() {
        assertThatThrownBy(() -> service.setEnabled(ORG, "admin-1", false))
                .hasMessageContaining("SELF_DISABLE");
    }
}
