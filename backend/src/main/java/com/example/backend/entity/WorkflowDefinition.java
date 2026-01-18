package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Map;

@Entity
@Table(name = "workflow_definition")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WorkflowDefinition extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "case_type", nullable = false, length = 100)
    private String caseType;

    @Column(name = "from_status", nullable = false, length = 50)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 50)
    private String toStatus;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conditions_json", columnDefinition = "jsonb")
    private Map<String, Object> conditionsJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_fields_json", columnDefinition = "jsonb")
    private Map<String, Object> requiredFieldsJson;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String caseType) {
        this.caseType = caseType;
    }

    public String getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(String fromStatus) {
        this.fromStatus = fromStatus;
    }

    public String getToStatus() {
        return toStatus;
    }

    public void setToStatus(String toStatus) {
        this.toStatus = toStatus;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Map<String, Object> getConditionsJson() {
        return conditionsJson;
    }

    public void setConditionsJson(Map<String, Object> conditionsJson) {
        this.conditionsJson = conditionsJson;
    }

    public Map<String, Object> getRequiredFieldsJson() {
        return requiredFieldsJson;
    }

    public void setRequiredFieldsJson(Map<String, Object> requiredFieldsJson) {
        this.requiredFieldsJson = requiredFieldsJson;
    }
}
