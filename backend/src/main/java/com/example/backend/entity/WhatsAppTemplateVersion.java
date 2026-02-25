package com.example.backend.entity;

import jakarta.persistence.*;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "whatsapp_template_version")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WhatsAppTemplateVersion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private WhatsAppTemplate template;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "components", columnDefinition = "jsonb")
    private List<Map<String, Object>> components;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variables_snapshot", columnDefinition = "jsonb")
    private List<Map<String, Object>> variablesSnapshot;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "change_summary", columnDefinition = "TEXT")
    private String changeSummary;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public WhatsAppTemplate getTemplate() {
        return template;
    }

    public void setTemplate(WhatsAppTemplate template) {
        this.template = template;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public List<Map<String, Object>> getComponents() {
        return components;
    }

    public void setComponents(List<Map<String, Object>> components) {
        this.components = components;
    }

    public List<Map<String, Object>> getVariablesSnapshot() {
        return variablesSnapshot;
    }

    public void setVariablesSnapshot(List<Map<String, Object>> variablesSnapshot) {
        this.variablesSnapshot = variablesSnapshot;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getChangeSummary() {
        return changeSummary;
    }

    public void setChangeSummary(String changeSummary) {
        this.changeSummary = changeSummary;
    }
}
