package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "sms_provider_config")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
public class SmsProviderConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "provider_type", nullable = false, length = 50)
    private String providerType;

    @Column(name = "twilio_account_sid", length = 255)
    private String twilioAccountSid;

    @Column(name = "twilio_auth_token_encrypted", columnDefinition = "text")
    private String twilioAuthTokenEncrypted;

    @Column(name = "twilio_from_number", length = 50)
    private String twilioFromNumber;

    @Column(name = "aws_access_key_encrypted", columnDefinition = "text")
    private String awsAccessKeyEncrypted;

    @Column(name = "aws_secret_key_encrypted", columnDefinition = "text")
    private String awsSecretKeyEncrypted;

    @Column(name = "aws_region", length = 50)
    private String awsRegion;

    @Column(name = "aws_sender_id", length = 50)
    private String awsSenderId;

    @Column(name = "webhook_secret_encrypted", columnDefinition = "text")
    private String webhookSecretEncrypted;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProviderType() {
        return providerType;
    }

    public void setProviderType(String providerType) {
        this.providerType = providerType;
    }

    public String getTwilioAccountSid() {
        return twilioAccountSid;
    }

    public void setTwilioAccountSid(String twilioAccountSid) {
        this.twilioAccountSid = twilioAccountSid;
    }

    public String getTwilioAuthTokenEncrypted() {
        return twilioAuthTokenEncrypted;
    }

    public void setTwilioAuthTokenEncrypted(String twilioAuthTokenEncrypted) {
        this.twilioAuthTokenEncrypted = twilioAuthTokenEncrypted;
    }

    public String getTwilioFromNumber() {
        return twilioFromNumber;
    }

    public void setTwilioFromNumber(String twilioFromNumber) {
        this.twilioFromNumber = twilioFromNumber;
    }

    public String getAwsAccessKeyEncrypted() {
        return awsAccessKeyEncrypted;
    }

    public void setAwsAccessKeyEncrypted(String awsAccessKeyEncrypted) {
        this.awsAccessKeyEncrypted = awsAccessKeyEncrypted;
    }

    public String getAwsSecretKeyEncrypted() {
        return awsSecretKeyEncrypted;
    }

    public void setAwsSecretKeyEncrypted(String awsSecretKeyEncrypted) {
        this.awsSecretKeyEncrypted = awsSecretKeyEncrypted;
    }

    public String getAwsRegion() {
        return awsRegion;
    }

    public void setAwsRegion(String awsRegion) {
        this.awsRegion = awsRegion;
    }

    public String getAwsSenderId() {
        return awsSenderId;
    }

    public void setAwsSenderId(String awsSenderId) {
        this.awsSenderId = awsSenderId;
    }

    public String getWebhookSecretEncrypted() {
        return webhookSecretEncrypted;
    }

    public void setWebhookSecretEncrypted(String webhookSecretEncrypted) {
        this.webhookSecretEncrypted = webhookSecretEncrypted;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public Boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
