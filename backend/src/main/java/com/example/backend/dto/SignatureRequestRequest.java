package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class SignatureRequestRequest {

    @NotNull(message = "Dossier ID is required")
    private Long dossierId;

    private Long templateId;

    @NotNull(message = "At least one signer is required")
    private List<SignerInfo> signers;

    private String subject;

    private String emailMessage;

    private Integer expirationDays = 30;

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public List<SignerInfo> getSigners() {
        return signers;
    }

    public void setSigners(List<SignerInfo> signers) {
        this.signers = signers;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getEmailMessage() {
        return emailMessage;
    }

    public void setEmailMessage(String emailMessage) {
        this.emailMessage = emailMessage;
    }

    public Integer getExpirationDays() {
        return expirationDays;
    }

    public void setExpirationDays(Integer expirationDays) {
        this.expirationDays = expirationDays;
    }

    public static class SignerInfo {
        private String name;
        private String email;
        private Integer routingOrder = 1;
        private String roleName;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public Integer getRoutingOrder() {
            return routingOrder;
        }

        public void setRoutingOrder(Integer routingOrder) {
            this.routingOrder = routingOrder;
        }

        public String getRoleName() {
            return roleName;
        }

        public void setRoleName(String roleName) {
            this.roleName = roleName;
        }
    }
}
