package com.example.backend.dto;

import com.example.backend.entity.enums.MessageChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class OutboundMessageRequest {
    
    private Long dossierId;
    
    @NotNull(message = "Channel is required")
    private MessageChannel channel;
    
    @NotBlank(message = "Recipient is required")
    private String to;
    
    private String templateCode;
    
    private String subject;
    
    private Map<String, Object> payloadJson;
    
    private String idempotencyKey;
    
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
    
    public String getIdempotencyKey() {
        return idempotencyKey;
    }
    
    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
