package com.example.backend.config;

import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Active le filtre Hibernate {@code orgIdFilter} sur la session de la requête.
 *
 * <p>Doit passer APRÈS l'intercepteur « open-in-view », qui ouvre la session de la requête : activé
 * avant, le filtre tombait sur une session jetable et aucune liste n'était filtrée par agence. Sans
 * organisation (webhooks, page publique de consentement), on n'active rien : ces routes retrouvent
 * l'agence elles-mêmes.
 *
 * <p>Le portail public ({@code /api/v1/portal/}) cherche dans toutes les agences : pas de filtre.
 *
 * <p>Avec une clé d'API ({@code /api/public/v1}), l'agence est celle de la clé, jamais l'en-tête
 * {@code X-Org-Id} : un en-tête différent est refusé (403).
 */
@Component
public class HibernateFilterInterceptor implements HandlerInterceptor {

    /** Attribut posé par {@code ApiKeyAuthenticationFilter} : l'agence de la clé d'API. */
    static final String API_KEY_ORG_ATTRIBUTE = "orgId";

    private static final String PORTAL_PREFIX = "/api/v1/portal/";

    // Absent dans les tests en tranche web (@WebMvcTest) : l'intercepteur ne fait alors rien.
    private final ObjectProvider<EntityManager> entityManagerProvider;

    public HibernateFilterInterceptor(ObjectProvider<EntityManager> entityManagerProvider) {
        this.entityManagerProvider = entityManagerProvider;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/") || path.startsWith(PORTAL_PREFIX)) {
            return true; // pas de filtre sur /ping, ni sur le portail public inter-agences
        }

        String orgId = TenantContext.getOrgId();

        Object keyOrg = request.getAttribute(API_KEY_ORG_ATTRIBUTE);
        if (keyOrg instanceof String apiKeyOrgId && !apiKeyOrgId.isBlank()) {
            if (orgId != null && !orgId.isBlank() && !orgId.equals(apiKeyOrgId)) {
                response.sendError(
                        HttpServletResponse.SC_FORBIDDEN,
                        "X-Org-Id does not match the API key organization");
                return false;
            }
            orgId = apiKeyOrgId;
            TenantContext.setOrgId(orgId);
        }

        if (orgId == null || orgId.isBlank()) {
            return true;
        }

        EntityManager entityManager = entityManagerProvider.getIfAvailable();
        if (entityManager == null) {
            return true;
        }
        Session session = entityManager.unwrap(Session.class);
        Filter filter = session.enableFilter("orgIdFilter");
        filter.setParameter("orgId", orgId);

        return true;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex) {
        try {
            EntityManager entityManager = entityManagerProvider.getIfAvailable();
            if (entityManager == null) {
                return;
            }
            Session session = entityManager.unwrap(Session.class);
            session.disableFilter("orgIdFilter");
        } catch (Exception ignore) {
        }
    }
}
