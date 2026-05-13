package com.example.backend.workflow.action;

import com.example.backend.dto.TaskCreateRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.TaskPriority;
import com.example.backend.service.TaskService;
import java.time.LocalDateTime;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class CreateTaskActionHandler implements WorkflowActionHandler {

    private static final Logger logger = LoggerFactory.getLogger(CreateTaskActionHandler.class);
    public static final String ACTION_TYPE = "CREATE_TASK";

    private final TaskService taskService;

    public CreateTaskActionHandler(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    public boolean supports(String actionType) {
        return ACTION_TYPE.equalsIgnoreCase(actionType);
    }

    @Override
    public void execute(Dossier dossier, Map<String, Object> actionConfig, String userId) {
        try {
            String title = (String) actionConfig.getOrDefault("title", "Automated Task");
            String description = (String) actionConfig.get("description");
            Integer dueInDays = (Integer) actionConfig.getOrDefault("dueInDays", 1);
            String assignTo = (String) actionConfig.get("assignTo");
            String priorityStr = (String) actionConfig.getOrDefault("priority", "MEDIUM");
            
            String assignedTo = null;
            if ("AGENT".equalsIgnoreCase(assignTo)) {
                assignedTo = userId; 
            } else if (assignTo != null) {
                assignedTo = assignTo;
            } else {
                assignedTo = userId;
            }

            TaskCreateRequest taskRequest = new TaskCreateRequest();
            taskRequest.setTitle(title);
            taskRequest.setDescription(description);
            taskRequest.setDueDate(LocalDateTime.now().plusDays(dueInDays));
            taskRequest.setAssignedTo(assignedTo);
            taskRequest.setDossierId(dossier.getId());
            
            try {
                taskRequest.setPriority(TaskPriority.valueOf(priorityStr.toUpperCase()));
            } catch (Exception e) {
                taskRequest.setPriority(TaskPriority.MEDIUM);
            }
            
            taskService.create(taskRequest);
            logger.info("Successfully created task '{}' for dossier {}", title, dossier.getId());
            
        } catch (Exception e) {
            logger.error("Failed to execute CREATE_TASK action for dossier {}", dossier.getId(), e);
        }
    }
}
