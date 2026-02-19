package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.SmsProviderConfig;
import com.example.backend.repository.SmsProviderConfigRepository;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;

@Service
public class AwsSnsSmsProvider implements OutboundMessageProvider {

    private static final Logger logger = LoggerFactory.getLogger(AwsSnsSmsProvider.class);
    private static final String SMS_CHANNEL = "SMS";
    private static final int MAX_SMS_LENGTH = 1600;

    private final SmsProviderConfigRepository providerConfigRepository;
    private final SmsRateLimitService rateLimitService;
    private final SmsErrorMapper errorMapper;

    public AwsSnsSmsProvider(
            SmsProviderConfigRepository providerConfigRepository,
            SmsRateLimitService rateLimitService,
            SmsErrorMapper errorMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.rateLimitService = rateLimitService;
        this.errorMapper = errorMapper;
    }

    @Override
    public ProviderSendResult send(OutboundMessageEntity message) {
        SnsClient snsClient = null;
        try {
            SmsProviderConfig config =
                    providerConfigRepository
                            .findByOrgId(message.getOrgId())
                            .orElseThrow(
                                    () ->
                                            new IllegalStateException(
                                                    "SMS provider config not found for org: "
                                                            + message.getOrgId()));

            if (!config.isEnabled()) {
                return ProviderSendResult.failure(
                        "PROVIDER_DISABLED",
                        "SMS provider is disabled for this organization",
                        false,
                        null);
            }

            if (!"AWS_SNS".equalsIgnoreCase(config.getProviderType())) {
                return ProviderSendResult.failure(
                        "INVALID_PROVIDER", "Provider type is not AWS_SNS", false, null);
            }

            if (!rateLimitService.checkAndConsumeQuota(message.getOrgId())) {
                return ProviderSendResult.failure(
                        "QUOTA_EXCEEDED", "SMS quota exceeded or rate limited", true, null);
            }

            validateSmsMessage(message);

            snsClient = createSnsClient(config);

            PublishRequest publishRequest = buildPublishRequest(message, config);

            logger.info(
                    "Sending SMS via AWS SNS: orgId={}, messageId={}, to={}",
                    message.getOrgId(),
                    message.getId(),
                    message.getTo());

            PublishResponse response = snsClient.publish(publishRequest);

            String providerMessageId = response.messageId();

            logger.info(
                    "SMS sent via AWS SNS successfully: messageId={}, providerMessageId={}",
                    message.getId(),
                    providerMessageId);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("messageId", providerMessageId);
            responseData.put("sequenceNumber", response.sequenceNumber());

            return ProviderSendResult.success(providerMessageId, responseData);

        } catch (InvalidParameterException e) {
            logger.error(
                    "Invalid parameter for AWS SNS: messageId={}, error={}",
                    message.getId(),
                    e.getMessage());
            return ProviderSendResult.failure(
                    "AWS_INVALID_PARAMETER", e.awsErrorDetails().errorMessage(), false, null);

        } catch (KmsThrottlingException e) {
            logger.warn("AWS SNS throttling for orgId={}: {}", message.getOrgId(), e.getMessage());
            rateLimitService.handleRateLimitError(message.getOrgId(), null);
            return ProviderSendResult.failure("AWS_THROTTLING", "Rate limit exceeded", true, null);

        } catch (InternalErrorException e) {
            logger.error(
                    "AWS SNS internal error for messageId={}: {}", message.getId(), e.getMessage());
            return ProviderSendResult.failure(
                    "AWS_INTERNAL_ERROR", "Internal AWS service error", true, null);

        } catch (SnsException e) {
            return handleSnsException(e, message);

        } catch (Exception e) {
            logger.error(
                    "Unexpected error sending SMS via AWS SNS: messageId={}", message.getId(), e);
            return ProviderSendResult.failure(
                    "UNEXPECTED_ERROR", sanitizeErrorMessage(e.getMessage()), true, null);

        } finally {
            if (snsClient != null) {
                try {
                    snsClient.close();
                } catch (Exception e) {
                    logger.debug("Error closing SNS client", e);
                }
            }
        }
    }

    @Override
    public boolean supports(String channel) {
        return SMS_CHANNEL.equalsIgnoreCase(channel);
    }

    @Override
    public boolean isRetryableError(String errorCode) {
        return errorMapper.isRetryable(errorCode);
    }

    private SnsClient createSnsClient(SmsProviderConfig config) {
        AwsBasicCredentials credentials =
                AwsBasicCredentials.create(
                        config.getAwsAccessKeyEncrypted(), config.getAwsSecretKeyEncrypted());

        Region region =
                config.getAwsRegion() != null ? Region.of(config.getAwsRegion()) : Region.US_EAST_1;

        return SnsClient.builder()
                .region(region)
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }

    private PublishRequest buildPublishRequest(
            OutboundMessageEntity message, SmsProviderConfig config) {
        String messageBody = extractMessageBody(message);
        String phoneNumber = normalizePhoneNumber(message.getTo());

        Map<String, MessageAttributeValue> messageAttributes = new HashMap<>();

        messageAttributes.put(
                "AWS.SNS.SMS.SMSType",
                MessageAttributeValue.builder()
                        .dataType("String")
                        .stringValue("Transactional")
                        .build());

        if (config.getAwsSenderId() != null && !config.getAwsSenderId().isEmpty()) {
            messageAttributes.put(
                    "AWS.SNS.SMS.SenderID",
                    MessageAttributeValue.builder()
                            .dataType("String")
                            .stringValue(config.getAwsSenderId())
                            .build());
        }

        messageAttributes.put(
                "IdempotencyKey",
                MessageAttributeValue.builder()
                        .dataType("String")
                        .stringValue(message.getIdempotencyKey())
                        .build());

        Map<String, Object> payloadJson = message.getPayloadJson();
        if (payloadJson != null && payloadJson.containsKey("maxPrice")) {
            messageAttributes.put(
                    "AWS.SNS.SMS.MaxPrice",
                    MessageAttributeValue.builder()
                            .dataType("Number")
                            .stringValue(String.valueOf(payloadJson.get("maxPrice")))
                            .build());
        }

        return PublishRequest.builder()
                .phoneNumber(phoneNumber)
                .message(messageBody)
                .messageAttributes(messageAttributes)
                .build();
    }

    private void validateSmsMessage(OutboundMessageEntity message) {
        if (message.getTo() == null || message.getTo().isEmpty()) {
            throw new IllegalArgumentException("Recipient phone number is required");
        }

        String messageBody = extractMessageBody(message);
        if (messageBody == null || messageBody.isEmpty()) {
            throw new IllegalArgumentException("Message body is required");
        }

        if (messageBody.length() > MAX_SMS_LENGTH) {
            throw new IllegalArgumentException(
                    "Message exceeds maximum length of " + MAX_SMS_LENGTH + " characters");
        }
    }

    private String extractMessageBody(OutboundMessageEntity message) {
        if (message.getPayloadJson() != null && message.getPayloadJson().containsKey("body")) {
            return (String) message.getPayloadJson().get("body");
        }
        return message.getSubject();
    }

    private ProviderSendResult handleSnsException(SnsException e, OutboundMessageEntity message) {
        logger.error("AWS SNS exception for messageId={}: {}", message.getId(), e.getMessage());

        String errorCode = extractAwsErrorCode(e);
        String errorMessage =
                e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : e.getMessage();

        SmsErrorMapper.ErrorInfo errorInfo = errorMapper.getErrorInfo(errorCode);

        if (errorInfo.isRateLimitError()) {
            rateLimitService.handleRateLimitError(message.getOrgId(), null);
        }

        logger.warn(
                "AWS SNS error for messageId={}: code={}, message={}, retryable={}",
                message.getId(),
                errorCode,
                errorMessage,
                errorInfo.isRetryable());

        return ProviderSendResult.failure(
                errorCode != null ? errorCode : "AWS_UNKNOWN",
                errorMessage != null ? errorMessage : "Unknown AWS error",
                errorInfo.isRetryable(),
                null);
    }

    private String extractAwsErrorCode(SnsException e) {
        if (e.awsErrorDetails() != null && e.awsErrorDetails().errorCode() != null) {
            return "AWS_" + e.awsErrorDetails().errorCode().toUpperCase().replace(".", "_");
        }

        if (e instanceof OptedOutException) {
            return "AWS_OPTED_OUT";
        }

        if (e instanceof InvalidParameterException) {
            return "AWS_INVALID_PARAMETER";
        }

        if (e instanceof InvalidParameterValueException) {
            return "AWS_INVALID_PARAMETER";
        }

        return "AWS_UNKNOWN";
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }

        String normalized = phoneNumber.replaceAll("[^0-9+]", "");

        if (!normalized.startsWith("+")) {
            normalized = "+" + normalized;
        }

        return normalized;
    }

    private String sanitizeErrorMessage(String message) {
        if (message == null) {
            return "Unknown error";
        }

        if (message.length() > 500) {
            message = message.substring(0, 500) + "...";
        }

        message =
                message.replaceAll(
                        "(?i)(key|secret|password|credential)\\s*[:=]\\s*[^\\s,}]+", "$1=***");

        return message;
    }
}
