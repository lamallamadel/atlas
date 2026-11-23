package com.example.backend.security;

import com.example.backend.entity.ActivityEntity;
import com.example.backend.entity.AnnonceDossierMatch;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.CommentThreadEntity;
import com.example.backend.entity.ConsentEventEntity;
import com.example.backend.entity.ConsentRequest;
import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.ConversationStateEntity;
import com.example.backend.entity.DocumentEntity;
import com.example.backend.entity.DocumentWorkflowEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.DossierStatusHistory;
import com.example.backend.entity.LeadActivity;
import com.example.backend.entity.LeadScore;
import com.example.backend.entity.MLPrediction;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.PartiePrenanteEntity;
import com.example.backend.entity.ScheduledWorkflowAction;
import com.example.backend.entity.SignatureRequestEntity;
import com.example.backend.entity.TaskEntity;
import com.example.backend.entity.WorkflowTransition;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.event.spi.PostLoadEvent;
import org.hibernate.event.spi.PostLoadEventListener;
import org.hibernate.event.spi.PreInsertEvent;
import org.hibernate.event.spi.PreInsertEventListener;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Second rempart du périmètre « mes dossiers » ({@link DossierScope}) : le filtre Hibernate ne
 * s'applique pas au chargement par identifiant ({@code findById}). Ce garde-fou refuse donc, pour
 * un agent restreint, tout dossier hors périmètre chargé en mémoire, tout élément rattaché à un tel
 * dossier, et toute création d'élément sur un tel dossier. Le refus est un 404, comme entre
 * agences, pour ne pas révéler l'existence du dossier.
 *
 * <p>{@link #GUARDED} est exactement la liste des entités qui portent le filtre {@link
 * DossierScope#FILTER} (vérifié par un test). Volontairement absentes : les notifications
 * (adressées à un utilisateur), les réservations de lots (stock partagé de l'agence) et les objets
 * du portail client.
 */
@Component
public class DossierScopeGuard implements PostLoadEventListener, PreInsertEventListener {

    public static final Set<Class<?>> GUARDED =
            Set.of(
                    ActivityEntity.class,
                    AnnonceDossierMatch.class,
                    AppointmentEntity.class,
                    AuditEventEntity.class,
                    CommentThreadEntity.class,
                    ConsentEventEntity.class,
                    ConsentRequest.class,
                    ConsentementEntity.class,
                    ConversationStateEntity.class,
                    DocumentEntity.class,
                    DocumentWorkflowEntity.class,
                    DossierStatusHistory.class,
                    LeadActivity.class,
                    LeadScore.class,
                    MLPrediction.class,
                    MessageEntity.class,
                    OutboundMessageEntity.class,
                    PartiePrenanteEntity.class,
                    ScheduledWorkflowAction.class,
                    SignatureRequestEntity.class,
                    TaskEntity.class,
                    WorkflowTransition.class);

    private static final ClassValue<Function<Object, Long>> DOSSIER_ID =
            new ClassValue<>() {
                @Override
                protected Function<Object, Long> computeValue(Class<?> type) {
                    return dossierIdReader(type);
                }
            };

    private final JdbcTemplate jdbcTemplate;
    private final EntityManagerFactory entityManagerFactory;

    public DossierScopeGuard(JdbcTemplate jdbcTemplate, EntityManagerFactory entityManagerFactory) {
        this.jdbcTemplate = jdbcTemplate;
        this.entityManagerFactory = entityManagerFactory;
    }

    @PostConstruct
    void register() {
        EventListenerRegistry registry =
                entityManagerFactory
                        .unwrap(SessionFactoryImplementor.class)
                        .getServiceRegistry()
                        .getService(EventListenerRegistry.class);
        registry.appendListeners(EventType.POST_LOAD, this);
        registry.appendListeners(EventType.PRE_INSERT, this);
    }

    @Override
    public void onPostLoad(PostLoadEvent event) {
        if (DossierScope.isRestricted()) {
            check(event.getEntity());
        }
    }

    @Override
    public boolean onPreInsert(PreInsertEvent event) {
        // Un dossier créé par l'agent lui est assigné : seuls ses éléments rattachés sont vérifiés.
        if (DossierScope.isRestricted() && !(event.getEntity() instanceof Dossier)) {
            check(event.getEntity());
        }
        return false;
    }

    void check(Object entity) {
        if (entity instanceof Dossier dossier) {
            if (!DossierScope.isVisibleAssignee(dossier.getAssignedTo())) {
                throw notFound();
            }
            DossierScope.remember(dossier.getId(), true);
            return;
        }
        if (entity == null || !GUARDED.contains(entity.getClass())) {
            return;
        }
        Long dossierId = DOSSIER_ID.get(entity.getClass()).apply(entity);
        if (dossierId != null && !isVisible(dossierId)) {
            throw notFound();
        }
    }

    private boolean isVisible(Long dossierId) {
        Boolean known = DossierScope.memo(dossierId);
        if (known != null) {
            return known;
        }
        List<String> assignees =
                jdbcTemplate.queryForList(
                        "SELECT assigned_to FROM dossier WHERE id = ?", String.class, dossierId);
        // Dossier inexistant : on laisse le traitement normal répondre.
        boolean visible = assignees.isEmpty() || DossierScope.isVisibleAssignee(assignees.get(0));
        DossierScope.remember(dossierId, visible);
        return visible;
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Dossier introuvable");
    }

    /**
     * {@code getDossierId()} s'il existe, sinon l'identifiant de {@code getDossier()}, sinon {@code
     * getEntityId()} quand {@code getEntityType()} vaut {@code DOSSIER}.
     */
    static Function<Object, Long> dossierIdReader(Class<?> type) {
        Method byId = findGetter(type, "getDossierId");
        if (byId != null && Long.class.equals(byId.getReturnType())) {
            return entity -> (Long) invoke(byId, entity);
        }
        Method byRelation = findGetter(type, "getDossier");
        if (byRelation != null && Dossier.class.isAssignableFrom(byRelation.getReturnType())) {
            return entity -> {
                Object dossier = invoke(byRelation, entity);
                if (dossier instanceof HibernateProxy proxy) {
                    return (Long) proxy.getHibernateLazyInitializer().getIdentifier();
                }
                return dossier == null ? null : ((Dossier) dossier).getId();
            };
        }
        Method entityType = findGetter(type, "getEntityType");
        Method entityId = findGetter(type, "getEntityId");
        if (entityType != null && entityId != null && Long.class.equals(entityId.getReturnType())) {
            return entity -> {
                Object kind = invoke(entityType, entity);
                return kind != null && "DOSSIER".equals(String.valueOf(kind))
                        ? (Long) invoke(entityId, entity)
                        : null;
            };
        }
        throw new IllegalStateException(type.getName() + " n'expose pas son dossier");
    }

    private static Method findGetter(Class<?> type, String name) {
        try {
            return type.getMethod(name);
        } catch (NoSuchMethodException e) {
            return null;
        }
    }

    private static Object invoke(Method method, Object target) {
        try {
            return method.invoke(target);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
