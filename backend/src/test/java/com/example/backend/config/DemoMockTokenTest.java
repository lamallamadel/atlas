package com.example.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;

/** Jetons des comptes démo (mode mock) : les claims viennent de la charge utile. */
class DemoMockTokenTest {

    private static String token(String payloadJson) {
        Base64.Encoder enc = Base64.getEncoder();
        return "mock-demo-"
                + enc.encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8))
                + "."
                + enc.encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8))
                + ".demo";
    }

    @Test
    void claimsComeFromThePayload() {
        Jwt jwt =
                SecurityConfig.demoJwt(
                        token(
                                "{\"sub\":\"demo-detroit-agent1\",\"roles\":[\"AGENT\"],"
                                        + "\"org_id\":\"DEMO-DETROIT\",\"name\":\"Yassine Alaoui\","
                                        + "\"email\":\"yassine@detroit.demo\",\"unknown\":\"x\"}"));
        assertThat(jwt.getSubject()).isEqualTo("demo-detroit-agent1");
        assertThat(jwt.getClaimAsString("org_id")).isEqualTo("DEMO-DETROIT");
        assertThat(jwt.getClaimAsString("name")).isEqualTo("Yassine Alaoui");
        assertThat(jwt.getClaimAsStringList("roles")).containsExactly("AGENT");
        assertThat(jwt.hasClaim("unknown")).isFalse();
        assertThat(((java.util.Map<?, ?>) jwt.getClaim("realm_access")).get("roles"))
                .isEqualTo(List.of("AGENT"));
    }

    @Test
    void ownerTokenKeepsItsOrganisation() {
        Jwt jwt =
                SecurityConfig.demoJwt(
                        token(
                                "{\"sub\":\"demo-owner-01\",\"roles\":[\"OWNER\"],\"org_id\":\"OWN-DEMO01\"}"));
        assertThat(jwt.getClaimAsStringList("roles")).containsExactly("OWNER");
        assertThat(jwt.getClaimAsString("org_id")).isEqualTo("OWN-DEMO01");
    }

    @Test
    void rejectsMalformedTokens() {
        assertThatThrownBy(() -> SecurityConfig.demoJwt("mock-demo-abc"))
                .isInstanceOf(BadJwtException.class);
        assertThatThrownBy(() -> SecurityConfig.demoJwt(token("{\"roles\":[\"ADMIN\"]}")))
                .isInstanceOf(BadJwtException.class);
        assertThatThrownBy(() -> SecurityConfig.demoJwt("mock-demo-a.!!!.b"))
                .isInstanceOf(BadJwtException.class);
    }
}
