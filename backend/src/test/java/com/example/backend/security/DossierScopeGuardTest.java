package com.example.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.TaskEntity;
import com.example.backend.entity.enums.AuditEntityType;
import jakarta.persistence.Entity;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.web.server.ResponseStatusException;

class DossierScopeGuardTest {

    @AfterEach
    void clear() {
        DossierScope.clear();
    }

    /**
     * Toute entité filtrée par le périmètre doit aussi être protégée au chargement par identifiant,
     * et inversement : une entité ajoutée d'un seul côté ferait une fuite ou un 404 injustifié.
     */
    @Test
    void guardedEntities_matchFilteredEntities() throws Exception {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(Entity.class));
        Set<Class<?>> filtered = new HashSet<>();
        for (BeanDefinition bd : scanner.findCandidateComponents("com.example.backend.entity")) {
            Class<?> type = Class.forName(bd.getBeanClassName());
            boolean scoped =
                    Arrays.stream(type.getAnnotationsByType(Filter.class))
                            .anyMatch(f -> DossierScope.FILTER.equals(f.name()));
            if (scoped) {
                filtered.add(type);
            }
        }
        Set<Class<?>> expected = new HashSet<>(DossierScopeGuard.GUARDED);
        expected.add(Dossier.class);
        assertThat(filtered).containsExactlyInAnyOrderElementsOf(expected);
    }

    @Test
    void everyGuardedEntity_exposesItsDossier() {
        for (Class<?> type : DossierScopeGuard.GUARDED) {
            assertThat(DossierScopeGuard.dossierIdReader(type))
                    .as(type.getSimpleName())
                    .isNotNull();
        }
    }

    @Test
    void dossierOutsideScope_isNotFound() {
        DossierScopeGuard guard = new DossierScopeGuard(null, null);
        Dossier mine = new Dossier();
        mine.setAssignedTo("agent-1");
        Dossier free = new Dossier();
        Dossier other = new Dossier();
        other.setAssignedTo("agent-2");

        // Hors périmètre : rien n'est vérifié.
        guard.check(other);

        DossierScope.enter("agent-1");
        guard.check(mine);
        guard.check(free);
        assertThatThrownBy(() -> guard.check(other))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Dossier introuvable");
    }

    @Test
    void readers_findTheDossierOfEachShape() {
        Dossier d = new Dossier();
        d.setId(42L);
        MessageEntity message = new MessageEntity();
        message.setDossier(d);
        assertThat(DossierScopeGuard.dossierIdReader(MessageEntity.class).apply(message))
                .isEqualTo(42L);

        TaskEntity task = new TaskEntity();
        task.setDossierId(7L);
        assertThat(DossierScopeGuard.dossierIdReader(TaskEntity.class).apply(task)).isEqualTo(7L);

        AuditEventEntity audit = new AuditEventEntity();
        audit.setEntityType(AuditEntityType.DOSSIER);
        audit.setEntityId(9L);
        assertThat(DossierScopeGuard.dossierIdReader(AuditEventEntity.class).apply(audit))
                .isEqualTo(9L);
        audit.setEntityType(AuditEntityType.ANNONCE);
        assertThat(DossierScopeGuard.dossierIdReader(AuditEventEntity.class).apply(audit)).isNull();
    }
}
