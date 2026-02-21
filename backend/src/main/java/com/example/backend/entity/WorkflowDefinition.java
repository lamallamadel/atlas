package com.example.backend.entity;

import jakarta.persistence.*;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "case_type", nullable = false, length = 100)
    private String caseType;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished = false;

    @Column(name = "is_template", nullable = false)
    private Boolean isTemplate = false;

    @Column(name = "template_category", length = 100)
    private String templateCategory;

    @Column(name = "parent_version_id")
    private Long parentVersionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "states_json", columnDefinition = "jsonb")
    private List<Map<String, Object>> statesJson = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "transitions_json", columnDefinition = "jsonb")
    private List<Map<String, Object>> transitionsJson = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "jsonb")
    private Map<String, Object> metadataJson;

    @Column(name = "initial_state", length = 50)
    private String initialState;

    @Column(name = "final_states", length = 500)
    private String finalStates;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String caseType) {
        this.caseType = caseType;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }

    public Boolean getIsTemplate() {
        return isTemplate;
    }

    public void setIsTemplate(Boolean isTemplate) {
        this.isTemplate = isTemplate;
    }

    public String getTemplateCategory() {
        return templateCategory;
    }

    public void setTemplateCategory(String templateCategory) {
        this.templateCategory = templateCategory;
    }

    public Long getParentVersionId() {
        return parentVersionId;
    }

    public void setParentVersionId(Long parentVersionId) {
        this.parentVersionId = parentVersionId;
    }

    public List<Map<String, Object>> getStatesJson() {
        return statesJson;
    }

    public void setStatesJson(List<Map<String, Object>> statesJson) {
        this.statesJson = statesJson;
    }

    public List<Map<String, Object>> getTransitionsJson() {
        return transitionsJson;
    }

    public void setTransitionsJson(List<Map<String, Object>> transitionsJson) {
        this.transitionsJson = transitionsJson;
    }

    public Map<String, Object> getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(Map<String, Object> metadataJson) {
        this.metadataJson = metadataJson;
    }

    public String getInitialState() {
        return initialState;
    }

    public void setInitialState(String initialState) {
        this.initialState = initialState;
    }

    public String getFinalStates() {
        return finalStates;
    }

    public void setFinalStates(String finalStates) {
        this.finalStates = finalStates;
    }

    @Deprecated
    public String getFromStatus() {
        return null;
    }

    @Deprecated
    public void setFromStatus(String fromStatus) {
    }

    @Deprecated
    public String getToStatus() {
        return null;
    }

    @Deprecated
    public void setToStatus(String toStatus) {
    }

    @Deprecated
    public Map<String, Object> getConditionsJson() {
        return metadataJson != null ? metadataJson : new HashMap<>();
    }

    @Deprecated
    public void setConditionsJson(Map<String, Object> conditionsJson) {
        if (this.metadataJson == null) {
            this.metadataJson = new HashMap<>();
        }
        if (conditionsJson != null) {
            this.metadataJson.putAll(conditionsJson);
        }
    }

    @Deprecated
    public Map<String, Object> getRequiredFieldsJson() {
        if (metadataJson != null && metadataJson.containsKey("requiredFields")) {
            return (Map<String, Object>) metadataJson.get("requiredFields");
        }
        return new HashMap<>();
    }

    @Deprecated
    public void setRequiredFieldsJson(Map<String, Object> requiredFieldsJson) {
        if (this.metadataJson == null) {
            this.metadataJson = new HashMap<>();
        }
        if (requiredFieldsJson != null) {
            this.metadataJson.put("requiredFields", requiredFieldsJson);
        }
    }
}
