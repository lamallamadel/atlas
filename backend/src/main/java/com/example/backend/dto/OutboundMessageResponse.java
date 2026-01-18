package com.example.backend.dto;

import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;

import java.time.LocalDateTime;
import java.util.Map;

public class OutboundMessageResponse {
    
    private Long id;
    private String orgId;
    private Long dossierId;
    private MessageChannel channel;
    private String direction;
    private String to;
    private String templateCode;
    private String subject;
    private Map<String, Object> payloadJson;
    private OutboundMessageStatus status;
    private String providerMessageId;
    private String idempotencyKey;
    private Integer attemptCount;
    private Integer maxAttempts;
    private String errorCode;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getOrgId() {
        return orgId;
    }
    
    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }
    
    public Long getDossierId() {
        return dossierId;
    }
    
    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }
    
    public MessageChannel getChannel() {
        return channel;
    }
    
    public void setChannel(MessageChannel channel) {
        this.channel = channel;
    }
    
    public String getDirection() {
        return direction;
    }
    
    public void setDirection(String direction) {
        this.direction = direction;
    }
    
    public String getTo() {
        return to;
    }
    
    public void setTo(String to) {
        this.to = to;
    }
    
    public String getTemplateCode() {
        return templateCode;
    }
    
    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public Map<String, Object> getPayloadJson() {
        return payloadJson;
    }
    
    public void setPayloadJson(Map<String, Object> payloadJson) {
        this.payloadJson = payloadJson;
    }
    
    public OutboundMessageStatus getStatus() {
        return status;
    }
    
    public void setStatus(OutboundMessageStatus status) {
        this.status = status;
    }
    
    public String getProviderMessageId() {
        return providerMessageId;
    }
    
    public void setProviderMessageId(String providerMessageId) {
        this.providerMessageId = providerMessageId;
    }
    
    public String getIdempotencyKey() {
        return idempotencyKey;
    }
    
    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
    
    public Integer getAttemptCount() {
        return attemptCount;
    }
    
    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }
    
    public Integer getMaxAttempts() {
        return maxAttempts;
    }
    
    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
