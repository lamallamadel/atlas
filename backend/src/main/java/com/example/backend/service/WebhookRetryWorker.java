package com.example.backend.service;

import com.example.backend.entity.WebhookDeliveryEntity;
import com.example.backend.repository.WebhookDeliveryRepository;
import com.example.backend.repository.WebhookSubscriptionRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class WebhookRetryWorker {

    private static final Logger logger = LoggerFactory.getLogger(WebhookRetryWorker.class);

    private final WebhookDeliveryRepository deliveryRepository;
    private final WebhookSubscriptionRepository subscriptionRepository;
    private final WebhookService webhookService;

    public WebhookRetryWorker(
            WebhookDeliveryRepository deliveryRepository,
            WebhookSubscriptionRepository subscriptionRepository,
            WebhookService webhookService) {
        this.deliveryRepository = deliveryRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.webhookService = webhookService;
    }

    @Scheduled(fixedDelay = 60000) // Every minute
    public void processRetries() {
        logger.debug("Processing webhook retries");

        List<WebhookDeliveryEntity> pendingRetries =
                deliveryRepository.findByStatusAndNextRetryAtBefore(
                        WebhookDeliveryEntity.DeliveryStatus.RETRY, LocalDateTime.now());

        for (WebhookDeliveryEntity delivery : pendingRetries) {
            subscriptionRepository
                    .findById(delivery.getSubscriptionId())
                    .ifPresent(
                            subscription -> {
                                logger.info(
                                        "Retrying webhook delivery {} for subscription {}",
                                        delivery.getId(),
                                        subscription.getId());
                                webhookService.deliverWebhook(delivery, subscription);
                            });
        }
    }
}
