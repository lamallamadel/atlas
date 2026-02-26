package com.example.backend.config;

import com.example.backend.entity.WhatsAppProviderConfig;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.repository.WhatsAppProviderConfigRepository;
import java.time.LocalDateTime;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("whatsapp")
public class WhatsAppHealthIndicator implements HealthIndicator {

    private final WhatsAppProviderConfigRepository providerConfigRepository;
    private final OutboundMessageRepository outboundMessageRepository;

    public WhatsAppHealthIndicator(
            WhatsAppProviderConfigRepository providerConfigRepository,
            OutboundMessageRepository outboundMessageRepository) {
        this.providerConfigRepository = providerConfigRepository;
        this.outboundMessageRepository = outboundMessageRepository;
    }

    @Override
    public Health health() {
        Health.Builder builder = new Health.Builder();

        try {
            boolean hasValidConfig = checkProviderConfig(builder);

            if (!hasValidConfig) {
                return builder.down()
                        .withDetail("message", "No valid WhatsApp provider configuration found")
                        .build();
            }

            boolean hasRecentSuccess = checkRecentSendSuccessRate(builder);

            if (!hasRecentSuccess) {
                return builder.down()
                        .withDetail(
                                "message",
                                "WhatsApp send success rate is below threshold or no recent"
                                        + " activity")
                        .build();
            }

            return builder.up().withDetail("message", "WhatsApp provider is healthy").build();

        } catch (Exception e) {
            return builder.down()
                    .withDetail("message", "Error checking WhatsApp health")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }

    private boolean checkProviderConfig(Health.Builder builder) {
        try {
            java.util.List<WhatsAppProviderConfig> configs = providerConfigRepository.findAll();

            if (configs.isEmpty()) {
                builder.withDetail("providerConfigExists", false)
                        .withDetail("providerConfigValid", false);
                return false;
            }

            WhatsAppProviderConfig config = configs.get(0);
            boolean isValid =
                    config.isEnabled()
                            && config.getApiKeyEncrypted() != null
                            && !config.getApiKeyEncrypted().isEmpty()
                            && config.getPhoneNumberId() != null
                            && !config.getPhoneNumberId().isEmpty();

            builder.withDetail("providerConfigExists", true)
                    .withDetail("providerConfigValid", isValid)
                    .withDetail("providerEnabled", config.isEnabled())
                    .withDetail("phoneNumberIdConfigured", config.getPhoneNumberId() != null);

            return isValid;

        } catch (Exception e) {
            builder.withDetail("providerConfigExists", false)
                    .withDetail("providerConfigValid", false)
                    .withDetail("providerConfigError", e.getMessage());
            return false;
        }
    }

    private boolean checkRecentSendSuccessRate(Health.Builder builder) {
        try {
            LocalDateTime last10Minutes = LocalDateTime.now().minusMinutes(10);

            long totalSent =
                    outboundMessageRepository.countByChannelAndCreatedAtAfter(
                            MessageChannel.WHATSAPP, last10Minutes);

            long successful =
                    outboundMessageRepository.countByChannelAndStatusAndCreatedAtAfter(
                            MessageChannel.WHATSAPP, OutboundMessageStatus.SENT, last10Minutes);

            long delivered =
                    outboundMessageRepository.countByChannelAndStatusAndCreatedAtAfter(
                            MessageChannel.WHATSAPP,
                            OutboundMessageStatus.DELIVERED,
                            last10Minutes);

            long failed =
                    outboundMessageRepository.countByChannelAndStatusAndCreatedAtAfter(
                            MessageChannel.WHATSAPP, OutboundMessageStatus.FAILED, last10Minutes);

            long successfulTotal = successful + delivered;

            double successRate = totalSent > 0 ? (double) successfulTotal / totalSent : 1.0;

            builder.withDetail("last10MinutesTotal", totalSent)
                    .withDetail("last10MinutesSuccessful", successfulTotal)
                    .withDetail("last10MinutesFailed", failed)
                    .withDetail("successRate", String.format("%.2f%%", successRate * 100));

            if (totalSent > 0 && successRate < 0.5) {
                return false;
            }

            return true;

        } catch (Exception e) {
            builder.withDetail("recentSendCheckError", e.getMessage());
            return true;
        }
    }
}
