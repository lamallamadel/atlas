package com.example.backend.config;

import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return new AuditorAwareImpl();
    }

    /**
     * Implementation of AuditorAware to provide the current auditor (user) for JPA auditing. This
     * is used to automatically populate createdBy and updatedBy fields.
     */
    static class AuditorAwareImpl implements AuditorAware<String> {

        @Override
        public Optional<String> getCurrentAuditor() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                return Optional.of("system");
            }

            // Extract username from JWT if available
            Object principal = authentication.getPrincipal();
            if (principal instanceof Jwt jwt) {
                String subject = jwt.getSubject();
                if (subject != null && !subject.isEmpty()) {
                    return Optional.of(subject);
                }
            }

            // Fallback to authentication name
            String name = authentication.getName();
            if (name != null && !name.isEmpty() && !"anonymousUser".equals(name)) {
                return Optional.of(name);
            }

            return Optional.of("system");
        }
    }
}
