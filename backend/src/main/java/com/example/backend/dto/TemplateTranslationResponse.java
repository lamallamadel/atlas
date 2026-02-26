package com.example.backend.dto;

public class TemplateTranslationResponse {

    private Long templateId;
    private String name;
    private String languageCode;
    private String status;
    private String metaSubmissionId;
    private String whatsAppTemplateId;

    public TemplateTranslationResponse() {}

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMetaSubmissionId() {
        return metaSubmissionId;
    }

    public void setMetaSubmissionId(String metaSubmissionId) {
        this.metaSubmissionId = metaSubmissionId;
    }

    public String getWhatsAppTemplateId() {
        return whatsAppTemplateId;
    }

    public void setWhatsAppTemplateId(String whatsAppTemplateId) {
        this.whatsAppTemplateId = whatsAppTemplateId;
    }
}
