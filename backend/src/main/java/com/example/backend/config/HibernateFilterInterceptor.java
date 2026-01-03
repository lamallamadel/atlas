package com.example.backend.config;

import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class HibernateFilterInterceptor implements HandlerInterceptor {

    private final EntityManager entityManager;

    public HibernateFilterInterceptor(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String orgId = TenantContext.getOrgId();
        if (orgId != null) {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter("orgIdFilter").setParameter("orgId", orgId);
        }
        return true;
    }
}
