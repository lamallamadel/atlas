package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "contract_template")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class ContractTemplateEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "template_name", nullable = false, length = 255)
    private String templateName;

    @Column(name = "template_type", nullable = false, length = 100)
    private String templateType;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "storage_path", nullable = false, length = 1000)
    private String storagePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "signature_fields", columnDefinition = "${json_type}")
    private String signatureFields;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "docusign_template_id", length = 255)
    private String docusignTemplateId;

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

    public String getTemplateType() {
        return templateType;
    }

    public void setTemplateType(String templateType) {
        this.templateType = templateType;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSignatureFields() {
        return signatureFields;
    }

    public void setSignatureFields(String signatureFields) {
        this.signatureFields = signatureFields;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getDocusignTemplateId() {
        return docusignTemplateId;
    }

    public void setDocusignTemplateId(String docusignTemplateId) {
        this.docusignTemplateId = docusignTemplateId;
    }
}
