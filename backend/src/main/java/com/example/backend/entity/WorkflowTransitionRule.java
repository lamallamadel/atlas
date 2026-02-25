package com.example.backend.entity;

import jakarta.persistence.*;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "workflow_transition_rule")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WorkflowTransitionRule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "workflow_definition_id", nullable = false)
    private Long workflowDefinitionId;

    @Column(name = "from_state", nullable = false, length = 50)
    private String fromState;

    @Column(name = "to_state", nullable = false, length = 50)
    private String toState;

    @Column(name = "label", length = 255)
    private String label;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_fields", columnDefinition = "jsonb")
    private List<String> requiredFields;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_validations", columnDefinition = "jsonb")
    private Map<String, Object> fieldValidations;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_roles", columnDefinition = "jsonb")
    private List<String> allowedRoles;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conditions_json", columnDefinition = "jsonb")
    private Map<String, Object> conditionsJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "actions_json", columnDefinition = "jsonb")
    private List<Map<String, Object>> actionsJson;

    @Column(name = "priority")
    private Integer priority;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWorkflowDefinitionId() {
        return workflowDefinitionId;
    }

    public void setWorkflowDefinitionId(Long workflowDefinitionId) {
        this.workflowDefinitionId = workflowDefinitionId;
    }

    public String getFromState() {
        return fromState;
    }

    public void setFromState(String fromState) {
        this.fromState = fromState;
    }

    public String getToState() {
        return toState;
    }

    public void setToState(String toState) {
        this.toState = toState;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<String> getRequiredFields() {
        return requiredFields;
    }

    public void setRequiredFields(List<String> requiredFields) {
        this.requiredFields = requiredFields;
    }

    public Map<String, Object> getFieldValidations() {
        return fieldValidations;
    }

    public void setFieldValidations(Map<String, Object> fieldValidations) {
        this.fieldValidations = fieldValidations;
    }

    public List<String> getAllowedRoles() {
        return allowedRoles;
    }

    public void setAllowedRoles(List<String> allowedRoles) {
        this.allowedRoles = allowedRoles;
    }

    public Map<String, Object> getConditionsJson() {
        return conditionsJson;
    }

    public void setConditionsJson(Map<String, Object> conditionsJson) {
        this.conditionsJson = conditionsJson;
    }

    public List<Map<String, Object>> getActionsJson() {
        return actionsJson;
    }

    public void setActionsJson(List<Map<String, Object>> actionsJson) {
        this.actionsJson = actionsJson;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }
}
