package com.example.backend.config;

import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@ConditionalOnBean(EntityManagerFactory.class)
public class HibernateFilterInterceptor implements HandlerInterceptor {

    private final EntityManager entityManager;

    public HibernateFilterInterceptor(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            return true; // pas de filtre sur /ping etc.
        }

        String orgId = TenantContext.getOrgId();

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
            Session session = entityManager.unwrap(Session.class);
            session.disableFilter("orgIdFilter");
        } catch (Exception ignore) {
        }
    }
}
