package com.example.backend.dto;

import com.example.backend.entity.TaskEntity;
import com.example.backend.entity.enums.TaskStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class TaskMapper {

    public TaskEntity toEntity(TaskCreateRequest request) {
        TaskEntity entity = new TaskEntity();
        entity.setDossierId(request.getDossierId());
        entity.setAssignedTo(request.getAssignedTo());
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setDueDate(request.getDueDate());
        entity.setPriority(request.getPriority());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO);
        return entity;
    }

    public void updateEntity(TaskEntity entity, TaskUpdateRequest request) {
        if (request.getDossierId() != null) {
            entity.setDossierId(request.getDossierId());
        }
        if (request.getAssignedTo() != null) {
            entity.setAssignedTo(request.getAssignedTo());
        }
        if (request.getTitle() != null) {
            entity.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }
        if (request.getDueDate() != null) {
            entity.setDueDate(request.getDueDate());
        }
        if (request.getPriority() != null) {
            entity.setPriority(request.getPriority());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
            if (request.getStatus() == TaskStatus.COMPLETED && entity.getCompletedAt() == null) {
                entity.setCompletedAt(LocalDateTime.now());
            } else if (request.getStatus() != TaskStatus.COMPLETED) {
                entity.setCompletedAt(null);
            }
        }
    }

    public TaskResponse toResponse(TaskEntity entity) {
        TaskResponse response = new TaskResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setDossierId(entity.getDossierId());
        response.setAssignedTo(entity.getAssignedTo());
        response.setTitle(entity.getTitle());
        response.setDescription(entity.getDescription());
        response.setDueDate(entity.getDueDate());
        response.setPriority(entity.getPriority());
        response.setStatus(entity.getStatus());
        response.setCompletedAt(entity.getCompletedAt());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setCreatedBy(entity.getCreatedBy());
        response.setUpdatedBy(entity.getUpdatedBy());
        
        if (entity.getDueDate() != null && 
            entity.getStatus() != TaskStatus.COMPLETED && 
            entity.getStatus() != TaskStatus.CANCELLED) {
            response.setIsOverdue(entity.getDueDate().isBefore(LocalDateTime.now()));
        } else {
            response.setIsOverdue(false);
        }
        
        return response;
    }
}
