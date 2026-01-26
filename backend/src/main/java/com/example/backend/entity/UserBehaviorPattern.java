package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_behavior_pattern",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"org_id", "user_id", "action_type", "context_type", "context_id"}
    ))
public class UserBehaviorPattern extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Column(name = "context_type", length = 100)
    private String contextType;

    @Column(name = "context_id")
    private Long contextId;

    @Column(name = "frequency_count", nullable = false)
    private Integer frequencyCount = 1;

    @Column(name = "last_performed_at", nullable = false)
    private LocalDateTime lastPerformedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getContextType() {
        return contextType;
    }

    public void setContextType(String contextType) {
        this.contextType = contextType;
    }

    public Long getContextId() {
        return contextId;
    }

    public void setContextId(Long contextId) {
        this.contextId = contextId;
    }

    public Integer getFrequencyCount() {
        return frequencyCount;
    }

    public void setFrequencyCount(Integer frequencyCount) {
        this.frequencyCount = frequencyCount;
    }

    public LocalDateTime getLastPerformedAt() {
        return lastPerformedAt;
    }

    public void setLastPerformedAt(LocalDateTime lastPerformedAt) {
        this.lastPerformedAt = lastPerformedAt;
    }

    public void incrementFrequency() {
        this.frequencyCount++;
        this.lastPerformedAt = LocalDateTime.now();
    }
}
