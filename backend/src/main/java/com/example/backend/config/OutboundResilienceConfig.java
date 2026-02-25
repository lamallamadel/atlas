package com.example.backend.config;

import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.observability.MetricsService;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.event.CircuitBreakerOnStateTransitionEvent;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OutboundResilienceConfig {

    private static final Logger logger = LoggerFactory.getLogger(OutboundResilienceConfig.class);
    private static final int[] BACKOFF_MINUTES = {1, 5, 15, 60, 360};

    private final MetricsService metricsService;

    public OutboundResilienceConfig(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Bean
    public RetryRegistry outboundRetryRegistry() {
        RetryConfig config =
                RetryConfig.custom()
                        .maxAttempts(BACKOFF_MINUTES.length)
                        .intervalFunction(
                                attemptNumber -> {
                                    int index =
                                            Math.min(attemptNumber - 1, BACKOFF_MINUTES.length - 1);
                                    return Duration.ofMinutes(BACKOFF_MINUTES[index]).toMillis();
                                })
                        .retryOnException(
                                throwable -> {
                                    return true;
                                })
                        .build();

        return RetryRegistry.of(config);
    }

    @Bean
    public Map<String, Retry> outboundRetryByChannel(RetryRegistry retryRegistry) {
        Map<String, Retry> retryMap = new HashMap<>();
        for (MessageChannel channel : MessageChannel.values()) {
            String channelName = channel.name().toLowerCase();
            Retry retry = retryRegistry.retry(channelName);

            retry.getEventPublisher()
                    .onRetry(
                            event ->
                                    logger.warn(
                                            "Retry attempt {} for channel {}: {}",
                                            event.getNumberOfRetryAttempts(),
                                            channelName,
                                            event.getLastThrowable().getMessage()));

            retryMap.put(channelName, retry);
        }
        return retryMap;
    }

    @Bean
    public CircuitBreakerRegistry outboundCircuitBreakerRegistry() {
        CircuitBreakerConfig config =
                CircuitBreakerConfig.custom()
                        .failureRateThreshold(50)
                        .minimumNumberOfCalls(10)
                        .slidingWindowSize(10)
                        .waitDurationInOpenState(Duration.ofSeconds(60))
                        .permittedNumberOfCallsInHalfOpenState(3)
                        .build();

        return CircuitBreakerRegistry.of(config);
    }

    @Bean
    public Map<String, CircuitBreaker> outboundCircuitBreakerByChannel(
            CircuitBreakerRegistry circuitBreakerRegistry) {
        Map<String, CircuitBreaker> circuitBreakerMap = new HashMap<>();
        for (MessageChannel channel : MessageChannel.values()) {
            String channelName = channel.name().toLowerCase();
            CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(channelName);

            circuitBreaker
                    .getEventPublisher()
                    .onStateTransition(
                            event -> {
                                handleCircuitBreakerStateChange(channelName, event);
                            });

            circuitBreakerMap.put(channelName, circuitBreaker);
        }
        return circuitBreakerMap;
    }

    @Bean
    public TimeLimiterRegistry outboundTimeLimiterRegistry() {
        TimeLimiterConfig config =
                TimeLimiterConfig.custom()
                        .timeoutDuration(Duration.ofSeconds(30))
                        .cancelRunningFuture(true)
                        .build();

        return TimeLimiterRegistry.of(config);
    }

    @Bean
    public Map<String, TimeLimiter> outboundTimeLimiterByChannel(
            TimeLimiterRegistry timeLimiterRegistry) {
        Map<String, TimeLimiter> timeLimiterMap = new HashMap<>();
        for (MessageChannel channel : MessageChannel.values()) {
            String channelName = channel.name().toLowerCase();
            TimeLimiter timeLimiter = timeLimiterRegistry.timeLimiter(channelName);
            timeLimiterMap.put(channelName, timeLimiter);
        }
        return timeLimiterMap;
    }

    private void handleCircuitBreakerStateChange(
            String channel, CircuitBreakerOnStateTransitionEvent event) {
        logger.warn(
                "Circuit breaker state change for channel {}: {} -> {}",
                channel,
                event.getStateTransition().getFromState(),
                event.getStateTransition().getToState());

        metricsService
                .counter(
                        "outbound_circuit_breaker_state_change_total",
                        "channel",
                        channel,
                        "from_state",
                        event.getStateTransition().getFromState().name(),
                        "to_state",
                        event.getStateTransition().getToState().name())
                .increment();
    }
}
