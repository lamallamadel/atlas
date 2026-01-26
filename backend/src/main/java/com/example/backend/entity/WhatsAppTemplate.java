package com.example.backend.entity;

import com.example.backend.entity.enums.TemplateCategory;
import com.example.backend.entity.enums.TemplateStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "whatsapp_template",
        uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "name", "language"}))
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class WhatsAppTemplate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "name", nullable = false, length = 512)
    private String name;

    @Column(name = "language", nullable = false, length = 10)
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private TemplateCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private TemplateStatus status;

    @Column(name = "whatsapp_template_id", length = 255)
    private String whatsAppTemplateId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "components", columnDefinition = "jsonb")
    private List<Map<String, Object>> components;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TemplateVariable> variables = new ArrayList<>();

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "current_version", nullable = false)
    private Integer currentVersion = 1;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WhatsAppTemplateVersion> versions = new ArrayList<>();

    @Column(name = "meta_submission_id", length = 255)
    private String metaSubmissionId;

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

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public TemplateCategory getCategory() {
        return category;
    }

    public void setCategory(TemplateCategory category) {
        this.category = category;
    }

    public TemplateStatus getStatus() {
        return status;
    }

    public void setStatus(TemplateStatus status) {
        this.status = status;
    }

    public String getWhatsAppTemplateId() {
        return whatsAppTemplateId;
    }

    public void setWhatsAppTemplateId(String whatsAppTemplateId) {
        this.whatsAppTemplateId = whatsAppTemplateId;
    }

    public List<Map<String, Object>> getComponents() {
        return components;
    }

    public void setComponents(List<Map<String, Object>> components) {
        this.components = components;
    }

    public List<TemplateVariable> getVariables() {
        return variables;
    }

    public void setVariables(List<TemplateVariable> variables) {
        this.variables = variables;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public void addVariable(TemplateVariable variable) {
        variables.add(variable);
        variable.setTemplate(this);
    }

    public void removeVariable(TemplateVariable variable) {
        variables.remove(variable);
        variable.setTemplate(null);
    }

    public Integer getCurrentVersion() {
        return currentVersion;
    }

    public void setCurrentVersion(Integer currentVersion) {
        this.currentVersion = currentVersion;
    }

    public List<WhatsAppTemplateVersion> getVersions() {
        return versions;
    }

    public void setVersions(List<WhatsAppTemplateVersion> versions) {
        this.versions = versions;
    }

    public String getMetaSubmissionId() {
        return metaSubmissionId;
    }

    public void setMetaSubmissionId(String metaSubmissionId) {
        this.metaSubmissionId = metaSubmissionId;
    }
}
