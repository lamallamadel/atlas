package com.example.backend.config;

import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
 */
@Component
public class HibernateFilterInterceptor implements HandlerInterceptor {

    // Absent dans les tests en tranche web (@WebMvcTest) : l'intercepteur ne fait alors rien.
    private final ObjectProvider<EntityManager> entityManagerProvider;

    public HibernateFilterInterceptor(ObjectProvider<EntityManager> entityManagerProvider) {
        this.entityManagerProvider = entityManagerProvider;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            return true; // pas de filtre sur /ping etc.
        }

        String orgId = TenantContext.getOrgId();
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
