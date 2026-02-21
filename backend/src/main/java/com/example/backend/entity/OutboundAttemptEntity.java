package com.example.backend.entity;

import com.example.backend.entity.enums.OutboundAttemptStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "outbound_attempt")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class OutboundAttemptEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outbound_message_id", nullable = false)
    private OutboundMessageEntity outboundMessage;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private OutboundAttemptStatus status;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "provider_response_json", columnDefinition = "jsonb")
    private Map<String, Object> providerResponseJson;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OutboundMessageEntity getOutboundMessage() {
        return outboundMessage;
    }

    public void setOutboundMessage(OutboundMessageEntity outboundMessage) {
        this.outboundMessage = outboundMessage;
    }

    public Integer getAttemptNo() {
        return attemptNo;
    }

    public void setAttemptNo(Integer attemptNo) {
        this.attemptNo = attemptNo;
    }

    public OutboundAttemptStatus getStatus() {
        return status;
    }

    public void setStatus(OutboundAttemptStatus status) {
        this.status = status;
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

    public Map<String, Object> getProviderResponseJson() {
        return providerResponseJson;
    }

    public void setProviderResponseJson(Map<String, Object> providerResponseJson) {
        this.providerResponseJson = providerResponseJson;
    }

    public LocalDateTime getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(LocalDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }
}
