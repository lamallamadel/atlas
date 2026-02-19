package com.example.backend.service;

import com.example.backend.entity.NotificationEntity;
import com.example.backend.entity.TaskEntity;
import com.example.backend.entity.enums.NotificationStatus;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.TaskRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(TaskReminderScheduler.class);

    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final AuditEventService auditEventService;

    @Value("${task.reminder.enabled:true}")
    private boolean enabled;

    public TaskReminderScheduler(
            TaskRepository taskRepository,
            NotificationRepository notificationRepository,
            AuditEventService auditEventService) {
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
        this.auditEventService = auditEventService;
    }

    @Scheduled(cron = "${task.reminder.cron:0 0 9 * * ?}")
    @Transactional
    public void checkOverdueTasksAndSendReminders() {
        if (!enabled) {
            logger.debug("Task reminder scheduler is disabled");
            return;
        }

        try {
            logger.info("Starting overdue task reminder check");
            LocalDateTime now = LocalDateTime.now();

            List<TaskEntity> overdueTasks =
                    taskRepository.findAll(
                            (root, query, cb) ->
                                    cb.and(
                                            cb.or(
                                                    cb.equal(
                                                            root.get("status"),
                                                            com.example.backend.entity.enums
                                                                    .TaskStatus.TODO),
                                                    cb.equal(
                                                            root.get("status"),
                                                            com.example.backend.entity.enums
                                                                    .TaskStatus.IN_PROGRESS)),
                                            cb.isNotNull(root.get("dueDate")),
                                            cb.lessThan(root.get("dueDate"), now)));

            if (overdueTasks.isEmpty()) {
                logger.info("No overdue tasks found");
                return;
            }

            logger.info(
                    "Found {} overdue tasks, creating reminder notifications", overdueTasks.size());
            int notificationsCreated = 0;

            for (TaskEntity task : overdueTasks) {
                try {
                    if (task.getAssignedTo() != null && !task.getAssignedTo().trim().isEmpty()) {
                        createReminderNotification(task);
                        notificationsCreated++;

                        auditEventService.logEvent(
                                "TASK",
                                task.getId(),
                                "UPDATED",
                                String.format(
                                        "Overdue reminder sent for task: %s", task.getTitle()));
                    }
                } catch (Exception e) {
                    logger.error(
                            "Failed to create reminder for task {}: {}",
                            task.getId(),
                            e.getMessage(),
                            e);
                }
            }

            logger.info(
                    "Created {} reminder notifications for overdue tasks", notificationsCreated);

        } catch (Exception e) {
            logger.error("Error in task reminder scheduler: {}", e.getMessage(), e);
        }
    }

    private void createReminderNotification(TaskEntity task) {
        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId(task.getOrgId());
        notification.setDossierId(task.getDossierId());
        notification.setType(NotificationType.IN_APP);
        notification.setStatus(NotificationStatus.PENDING);
        notification.setTemplateId("task_overdue_reminder");
        notification.setRecipient(task.getAssignedTo());
        notification.setSubject(String.format("Task Overdue: %s", task.getTitle()));

        Map<String, Object> variables = new HashMap<>();
        variables.put("taskId", task.getId());
        variables.put("taskTitle", task.getTitle());
        variables.put("taskDescription", task.getDescription());
        variables.put("dueDate", task.getDueDate().toString());
        variables.put("priority", task.getPriority().toString());
        variables.put("assignedTo", task.getAssignedTo());
        if (task.getDossierId() != null) {
            variables.put("dossierId", task.getDossierId());
        }
        notification.setVariables(variables);

        LocalDateTime now = LocalDateTime.now();
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);

        notificationRepository.save(notification);

        logger.debug(
                "Created reminder notification for task {} assigned to {}",
                task.getId(),
                task.getAssignedTo());
    }
}
