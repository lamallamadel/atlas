package com.example.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

class AccessPolicyTest {

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private static void as(String... authorities) {
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                "u",
                                "n/a",
                                Arrays.stream(authorities)
                                        .map(SimpleGrantedAuthority::new)
                                        .toList()));
    }

    @Test
    void currentRole_readsAgencyRoles() {
        as("ROLE_AGENT", "ROLE_PRO");
        assertThat(AccessPolicy.currentRole()).isEqualTo(AgencyRole.AGENT);
        as("ROLE_PRO");
        assertThat(AccessPolicy.currentRole()).isEqualTo(AgencyRole.AGENT);
        as("ROLE_MANAGER", "ROLE_PRO");
        assertThat(AccessPolicy.currentRole()).isEqualTo(AgencyRole.MANAGER);
        as("ROLE_SUPER_ADMIN");
        assertThat(AccessPolicy.currentRole()).isEqualTo(AgencyRole.ADMIN);
        as("ROLE_USER");
        assertThat(AccessPolicy.currentRole()).isNull();
    }

    @Test
    void agent_cannotAssignOverrideInviteOrManageTeam() {
        as("ROLE_AGENT", "ROLE_PRO");
        assertThat(AccessPolicy.canAssign()).isFalse();
        assertThat(AccessPolicy.canOverrideTrust()).isFalse();
        assertThat(AccessPolicy.canInvite(AgencyRole.AGENT)).isFalse();
        assertThat(AccessPolicy.canManageTeam()).isFalse();
        assertThatThrownBy(AccessPolicy::requireCanAssign)
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("MANAGER_REQUIRED");
    }

    @Test
    void manager_invitesOnlyAgents_andCannotManageTeam() {
        as("ROLE_MANAGER", "ROLE_PRO");
        assertThat(AccessPolicy.canAssign()).isTrue();
        assertThat(AccessPolicy.canOverrideTrust()).isTrue();
        assertThat(AccessPolicy.canInvite(AgencyRole.AGENT)).isTrue();
        assertThat(AccessPolicy.canInvite(AgencyRole.MANAGER)).isFalse();
        assertThat(AccessPolicy.canInvite(AgencyRole.ADMIN)).isFalse();
        assertThat(AccessPolicy.canManageTeam()).isFalse();
        assertThatThrownBy(() -> AccessPolicy.requireCanInvite(AgencyRole.MANAGER))
                .hasMessageContaining("que des agents");
    }

    @Test
    void admin_canDoEverything() {
        as("ROLE_ADMIN");
        assertThat(AccessPolicy.canAssign()).isTrue();
        assertThat(AccessPolicy.canInvite(AgencyRole.ADMIN)).isTrue();
        assertThat(AccessPolicy.canManageTeam()).isTrue();
    }

    @Test
    void agencyRole_parseAndHighest() {
        assertThat(AgencyRole.parse("pro")).isEqualTo(AgencyRole.AGENT);
        assertThat(AgencyRole.parse("ADMIN_ORG")).isEqualTo(AgencyRole.ADMIN);
        assertThat(AgencyRole.parse("OWNER")).isNull();
        assertThat(AgencyRole.highest(java.util.List.of("PRO", "MANAGER", "offline_access")))
                .isEqualTo(AgencyRole.MANAGER);
        assertThat(AgencyRole.highest(java.util.List.of("offline_access"))).isNull();
    }
}
