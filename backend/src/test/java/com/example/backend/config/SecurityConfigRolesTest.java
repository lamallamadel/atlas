package com.example.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

/** Lecture des rôles Keycloak : PRO et AGENT équivalents, MANAGER membre de l'agence. */
class SecurityConfigRolesTest {

    private static java.util.List<String> names(String role) {
        return SecurityConfig.toAuthorities(role).stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }

    @Test
    void agentAndPro_areEquivalent() {
        assertThat(names("AGENT")).containsExactlyInAnyOrder("ROLE_AGENT", "ROLE_PRO");
        assertThat(names("PRO")).containsExactlyInAnyOrder("ROLE_AGENT", "ROLE_PRO");
    }

    @Test
    void manager_isAlsoAgencyMember() {
        assertThat(names("MANAGER")).containsExactlyInAnyOrder("ROLE_MANAGER", "ROLE_PRO");
    }

    @Test
    void otherRoles_unchanged() {
        assertThat(names("ADMIN")).containsExactly("ROLE_ADMIN");
        assertThat(names("super_admin")).containsExactly("ROLE_SUPER_ADMIN");
        assertThat(names("")).containsExactly("ROLE_USER");
    }
}
