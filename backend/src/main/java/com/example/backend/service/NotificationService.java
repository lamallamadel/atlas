package com.example.backend.service;

import com.example.backend.entity.NotificationEntity;
import com.example.backend.entity.enums.NotificationStatus;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.observability.MetricsService;
import com.example.backend.repository.NotificationRepository;
import jakarta.mail.MessagingException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final EmailProvider emailProvider;
    private final Map<NotificationType, NotificationProvider> providerMap;
    private final MetricsService metricsService;

    public NotificationService(
            NotificationRepository notificationRepository,
            EmailProvider emailProvider,
            MetricsService metricsService) {
        this.notificationRepository = notificationRepository;
        this.emailProvider = emailProvider;
        this.metricsService = metricsService;
        this.providerMap = Map.of(NotificationType.EMAIL, emailProvider);
        log.info(
                "NotificationService initialized successfully with EmailProvider: {}",
                emailProvider.getClass().getSimpleName());
    }

    @Transactional
    public NotificationEntity createNotification(
            String orgId,
            NotificationType type,
            String recipient,
            String subject,
            String templateId,
            Map<String, Object> variables) {
        return createNotification(orgId, null, type, recipient, subject, templateId, variables);
    }

    @Transactional
    public NotificationEntity createNotification(
            String orgId,
            Long dossierId,
            NotificationType type,
            String recipient,
            String subject,
            String templateId,
            Map<String, Object> variables) {

        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(orgId);
        notification.setDossierId(dossierId);
        notification.setType(type);
        notification.setRecipient(recipient);
        notification.setSubject(subject);
        notification.setTemplateId(templateId);
        notification.setVariables(variables);
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRetryCount(0);
        notification.setMaxRetries(3);

        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);

        return notificationRepository.save(notification);
    }

    @Scheduled(fixedDelayString = "${notification.processor.interval:10000}")
    @Transactional
    public void processPendingNotifications() {
        log.debug("Processing pending notifications");

        List<NotificationEntity> pendingNotifications =
                notificationRepository.findPendingNotifications(NotificationStatus.PENDING);

        for (NotificationEntity notification : pendingNotifications) {
            processNotification(notification);
        }

        log.debug("Processed {} pending notifications", pendingNotifications.size());
    }

    private void processNotification(NotificationEntity notification) {
        try {
            NotificationProvider provider = providerMap.get(notification.getType());

            if (provider == null) {
                log.error("No provider found for notification type: {}", notification.getType());
                metricsService.incrementNotificationSent(
                        notification.getType().name(), "NO_PROVIDER");
                notification.setStatus(NotificationStatus.FAILED);
                metricsService.incrementNotificationSent(notification.getType().name(), "FAILED");
                notification.setErrorMessage(
                        "No provider found for type: " + notification.getType());
                notification.setUpdatedAt(LocalDateTime.now());
                notificationRepository.save(notification);
                return;
            }

            provider.send(notification);

            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            notification.setErrorMessage(null);
            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);

            metricsService.incrementNotificationSent(
                    notification.getType().name(), notification.getStatus().name());
            log.info("Successfully sent notification ID: {}", notification.getId());

        } catch (Exception e) {
            log.error("Failed to send notification ID: {}", notification.getId(), e);

            notification.setRetryCount(notification.getRetryCount() + 1);

            // Check if the exception or its cause is a MessagingException (JavaMailException)
            String errorMessage;
            if (e instanceof MessagingException || (e.getCause() instanceof MessagingException)) {
                MessagingException mailException =
                        e instanceof MessagingException
                                ? (MessagingException) e
                                : (MessagingException) e.getCause();
                errorMessage = "Failed to send email: " + mailException.getMessage();
            } else {
                errorMessage = e.getMessage();
            }
            notification.setErrorMessage(errorMessage);

            if (notification.getRetryCount() >= notification.getMaxRetries()) {
                notification.setStatus(NotificationStatus.FAILED);
                metricsService.incrementNotificationSent(notification.getType().name(), "FAILED");
                log.error(
                        "Notification ID {} failed after {} retries",
                        notification.getId(),
                        notification.getRetryCount());
            }

            notification.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional(readOnly = true)
    public NotificationEntity getNotificationById(Long id) {
        return notificationRepository.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<NotificationEntity> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<NotificationEntity> listNotifications(
            Long dossierId,
            NotificationType type,
            NotificationStatus status,
            org.springframework.data.domain.Pageable pageable) {
        return notificationRepository.findByFilters(dossierId, type, status, pageable);
    }

    @Transactional
    public NotificationEntity markAsRead(Long id) {
        NotificationEntity notification = notificationRepository.findById(id).orElse(null);
        if (notification != null && notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notification.setUpdatedAt(LocalDateTime.now());
            return notificationRepository.save(notification);
        }
        return notification;
    }

    @Transactional
    public NotificationEntity markAsUnread(Long id) {
        NotificationEntity notification = notificationRepository.findById(id).orElse(null);
        if (notification != null) {
            notification.setReadAt(null);
            notification.setUpdatedAt(LocalDateTime.now());
            return notificationRepository.save(notification);
        }
        return notification;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countUnread();
    }

    @Transactional
    public NotificationEntity createInAppNotification(
            String orgId,
            Long dossierId,
            String recipient,
            String subject,
            String message,
            String actionUrl) {

        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(orgId);
        notification.setDossierId(dossierId);
        notification.setType(NotificationType.IN_APP);
        notification.setRecipient(recipient);
        notification.setSubject(subject);
        notification.setMessage(message);
        notification.setActionUrl(actionUrl);
        notification.setTemplateId("in_app_notification");
        notification.setStatus(NotificationStatus.SENT);
        notification.setRetryCount(0);
        notification.setMaxRetries(0);

        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);
        notification.setSentAt(now);

        return notificationRepository.save(notification);
    }

    @Transactional
    public void createMentionNotification(
            String recipient,
            String mentionedBy,
            com.example.backend.entity.enums.CommentEntityType entityType,
            Long entityId,
            Long commentId) {
        String message =
                String.format(
                        "%s mentioned you in a comment on %s #%d",
                        mentionedBy, entityType.name().toLowerCase(), entityId);
        String actionUrl =
                String.format(
                        "/%s/%d/comments/%d", entityType.name().toLowerCase(), entityId, commentId);

        createInAppNotification("default", null, recipient, "New Mention", message, actionUrl);
    }

    @Transactional
    public void createCommentNotification(
            String recipient,
            String commentedBy,
            com.example.backend.entity.enums.CommentEntityType entityType,
            Long entityId,
            Long commentId) {
        String message =
                String.format(
                        "%s added a comment to a thread you're participating in on %s #%d",
                        commentedBy, entityType.name().toLowerCase(), entityId);
        String actionUrl =
                String.format(
                        "/%s/%d/comments/%d", entityType.name().toLowerCase(), entityId, commentId);

        createInAppNotification("default", null, recipient, "New Comment", message, actionUrl);
    }
}
