package com.example.backend.config;

import io.sentry.Sentry;
import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import io.sentry.protocol.User;
import io.sentry.spring.jakarta.EnableSentry;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableSentry(dsn = "${sentry.dsn:}")
@ConditionalOnProperty(name = "sentry.enabled", havingValue = "true", matchIfMissing = false)
public class SentryConfig {

    @Value("${sentry.environment:production}")
    private String environment;

    @Value("${spring.application.name:backend}")
    private String applicationName;

    @Bean
    public Sentry.OptionsConfiguration<SentryOptions> sentryOptionsConfiguration() {
        return options -> {
            options.setEnvironment(environment);
            options.setRelease(applicationName + "@1.0.0");
            options.setTracesSampleRate(0.1);
            options.setEnableUncaughtExceptionHandler(true);
            
            options.setBeforeSend((event, hint) -> {
                enrichEventWithContext(event);
                return event;
            });
        };
    }

    private void enrichEventWithContext(SentryEvent event) {
        String correlationId = MDC.get("correlationId");
        if (correlationId != null) {
            event.setTag("correlation_id", correlationId);
        }

        String orgId = MDC.get("orgId");
        if (orgId != null) {
            event.setTag("org_id", orgId);
            User user = new User();
            user.setId(orgId);
            event.setUser(user);
        }

        String userId = MDC.get("userId");
        if (userId != null) {
            event.setTag("user_id", userId);
        }

        String messageId = MDC.get("messageId");
        if (messageId != null) {
            event.setTag("message_id", messageId);
        }

        String channel = MDC.get("channel");
        if (channel != null) {
            event.setTag("channel", channel);
        }

        String workerType = MDC.get("workerType");
        if (workerType != null) {
            event.setTag("worker_type", workerType);
        }
    }
}
