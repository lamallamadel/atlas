package com.example.backend.entity;

import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "outbound_message", 
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_outbound_idempotency", columnNames = {"org_id", "idempotency_key"})
    }
)
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class OutboundMessageEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "dossier_id")
    private Long dossierId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false, length = 50)
    private MessageChannel channel;

    @Column(name = "direction", nullable = false, length = 50)
    private String direction = "OUTBOUND";

    @Column(name = "to_recipient", nullable = false, length = 255)
    private String to;

    @Column(name = "template_code", length = 255)
    private String templateCode;

    @Column(name = "subject", length = 500)
    private String subject;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", columnDefinition = "jsonb")
    private Map<String, Object> payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private OutboundMessageStatus status;

    @Column(name = "provider_message_id", length = 255)
    private String providerMessageId;

    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 5;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
}
