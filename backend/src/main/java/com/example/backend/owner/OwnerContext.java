package com.example.backend.owner;

import com.example.backend.entity.OrganizationEntity;
import com.example.backend.repository.OrganizationRepository;
import com.example.backend.util.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Garde des routes propriétaire : le jeton doit porter une organisation ({@code org_id}), égale à
 * l'en-tête, et cette organisation doit être de type {@code OWNER}. Sans cela, un jeton sans claim
 * d'organisation pourrait choisir l'organisation par l'en-tête.
 */
@Component
public class OwnerContext {

    private final OrganizationRepository organizations;

    public OwnerContext(OrganizationRepository organizations) {
        this.organizations = organizations;
    }

    public OrganizationEntity requireOwnerOrg() {
        String orgId = TenantContext.getOrgId();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String tokenOrg =
                auth instanceof JwtAuthenticationToken jwt
                        ? jwt.getToken().getClaimAsString("org_id")
                        : null;
        if (orgId == null || tokenOrg == null || !tokenOrg.equals(orgId)) {
            throw forbidden();
        }
        return organizations
                .findByOrgId(orgId)
                .filter(OrganizationEntity::isOwner)
                .orElseThrow(OwnerContext::forbidden);
    }

    private static ResponseStatusException forbidden() {
        return new ResponseStatusException(
                HttpStatus.FORBIDDEN, "OWNER_ONLY: espace réservé aux comptes propriétaires.");
    }
}
