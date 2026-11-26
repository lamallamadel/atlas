package com.example.backend.mandate;

import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityManager;
import java.util.function.Supplier;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

/**
 * Bascule d'organisation pour les objets inter-organisations de la bourse aux mandats (ADR 0005) :
 * travailler dans l'organisation d'une agence depuis une requête du propriétaire (création du
 * dossier), ou lire sans filtre d'organisation (annuaire des agences). Le contexte et le filtre
 * Hibernate sont rétablis à la sortie.
 */
@Component
public class OrgScope {

    static final String FILTER = "orgIdFilter";

    private final EntityManager entityManager;

    public OrgScope(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /** Exécute {@code work} comme si la requête venait de {@code orgId}. */
    public <T> T as(String orgId, Supplier<T> work) {
        String previous = TenantContext.getOrgId();
        Session session = entityManager.unwrap(Session.class);
        boolean filtered = session.getEnabledFilter(FILTER) != null;
        TenantContext.setOrgId(orgId);
        if (filtered) {
            session.enableFilter(FILTER).setParameter("orgId", orgId);
        }
        try {
            return work.get();
        } finally {
            restore(session, previous, filtered);
        }
    }

    public void run(String orgId, Runnable work) {
        as(
                orgId,
                () -> {
                    work.run();
                    return null;
                });
    }

    /** Exécute {@code work} sans filtre d'organisation (lectures inter-organisations). */
    public <T> T unfiltered(Supplier<T> work) {
        Session session = entityManager.unwrap(Session.class);
        boolean filtered = session.getEnabledFilter(FILTER) != null;
        if (filtered) {
            session.disableFilter(FILTER);
        }
        try {
            return work.get();
        } finally {
            if (filtered && TenantContext.getOrgId() != null) {
                session.enableFilter(FILTER).setParameter("orgId", TenantContext.getOrgId());
            }
        }
    }

    private static void restore(Session session, String previous, boolean filtered) {
        if (previous != null) {
            TenantContext.setOrgId(previous);
        } else {
            TenantContext.clear();
        }
        if (filtered) {
            if (previous != null) {
                session.enableFilter(FILTER).setParameter("orgId", previous);
            } else {
                session.disableFilter(FILTER);
            }
        }
    }
}
