package com.example.backend.entity;

import com.example.backend.entity.enums.DocumentWorkflowType;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "workflow_template")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WorkflowTemplateEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "template_name", nullable = false, length = 255)
    private String templateName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_type", nullable = false, length = 50)
    private DocumentWorkflowType workflowType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "steps_definition")
    private List<Map<String, Object>> stepsDefinition;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "default_config")
    private Map<String, Object> defaultConfig;

    @Column(name = "is_system_template", nullable = false)
    private Boolean isSystemTemplate = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DocumentWorkflowType getWorkflowType() {
        return workflowType;
    }

    public void setWorkflowType(DocumentWorkflowType workflowType) {
        this.workflowType = workflowType;
    }

    public List<Map<String, Object>> getStepsDefinition() {
        return stepsDefinition;
    }

    public void setStepsDefinition(List<Map<String, Object>> stepsDefinition) {
        this.stepsDefinition = stepsDefinition;
    }

    public Map<String, Object> getDefaultConfig() {
        return defaultConfig;
    }

    public void setDefaultConfig(Map<String, Object> defaultConfig) {
        this.defaultConfig = defaultConfig;
    }

    public Boolean getIsSystemTemplate() {
        return isSystemTemplate;
    }

    public void setIsSystemTemplate(Boolean isSystemTemplate) {
        this.isSystemTemplate = isSystemTemplate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }
}
