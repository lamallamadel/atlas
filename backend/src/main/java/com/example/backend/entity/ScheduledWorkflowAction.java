package com.example.backend.entity;

import com.example.backend.security.DossierScope;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "scheduled_workflow_action")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
@Filter(
        name = DossierScope.FILTER,
        condition = DossierScope.CHILD_CONDITION,
        deduceAliasInjectionPoints = false)
public class ScheduledWorkflowAction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id")
    private Long dossierId;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "run_at", nullable = false)
    private LocalDateTime runAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "action_config", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> actionConfig;

    @Column(name = "user_id")
    private String userId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public LocalDateTime getRunAt() {
        return runAt;
    }

    public void setRunAt(LocalDateTime runAt) {
        this.runAt = runAt;
    }

    public Map<String, Object> getActionConfig() {
        return actionConfig;
    }

    public void setActionConfig(Map<String, Object> actionConfig) {
        this.actionConfig = actionConfig;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
