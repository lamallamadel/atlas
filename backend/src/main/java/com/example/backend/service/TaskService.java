package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.TaskEntity;
import com.example.backend.entity.enums.TaskStatus;
import com.example.backend.repository.TaskRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final AuditEventService auditEventService;

    public TaskService(TaskRepository taskRepository, TaskMapper taskMapper, AuditEventService auditEventService) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.auditEventService = auditEventService;
    }

    @Transactional
    public TaskResponse create(TaskCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        TaskEntity task = taskMapper.toEntity(request);
        task.setOrgId(orgId);

        LocalDateTime now = LocalDateTime.now();
        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        TaskEntity saved = taskRepository.save(task);

        auditEventService.logEvent("TASK", saved.getId(), "CREATED", 
            String.format("Task created: %s", saved.getTitle()));

        return taskMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        TaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));

        if (!orgId.equals(task.getOrgId())) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }

        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse update(Long id, TaskUpdateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        TaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));

        if (!orgId.equals(task.getOrgId())) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }

        TaskStatus oldStatus = task.getStatus();

        taskMapper.updateEntity(task, request);
        task.setUpdatedAt(LocalDateTime.now());

        TaskEntity updated = taskRepository.save(task);

        if (oldStatus != updated.getStatus()) {
            auditEventService.logEvent("TASK", updated.getId(), "UPDATED", 
                String.format("Task status changed from %s to %s", oldStatus, updated.getStatus()));
        } else {
            auditEventService.logEvent("TASK", updated.getId(), "UPDATED", 
                String.format("Task updated: %s", updated.getTitle()));
        }

        return taskMapper.toResponse(updated);
    }

    @Transactional
    public TaskResponse complete(Long id, TaskCompleteRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        TaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));

        if (!orgId.equals(task.getOrgId())) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }

        if (task.getStatus() == TaskStatus.COMPLETED) {
            throw new IllegalStateException("Task is already completed");
        }

        LocalDateTime now = LocalDateTime.now();
        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(now);
        task.setUpdatedAt(now);

        TaskEntity updated = taskRepository.save(task);

        Map<String, Object> auditDiff = new HashMap<>();
        auditDiff.put("status", TaskStatus.COMPLETED);
        auditDiff.put("completedAt", now);
        if (request.getCompletionNotes() != null) {
            auditDiff.put("completionNotes", request.getCompletionNotes());
        }

        auditEventService.logEvent("TASK", updated.getId(), "UPDATED", 
            String.format("Task completed: %s", updated.getTitle()));

        return taskMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        TaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));

        if (!orgId.equals(task.getOrgId())) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }

        taskRepository.delete(task);

        auditEventService.logEvent("TASK", task.getId(), "DELETED", 
            String.format("Task deleted: %s", task.getTitle()));
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> list(
            Long dossierId,
            String assignedTo,
            TaskStatus status,
            LocalDateTime dueBefore,
            LocalDateTime dueAfter,
            Boolean overdue,
            Pageable pageable
    ) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Specification<TaskEntity> spec = Specification.where(
                (root, query, cb) -> cb.equal(root.get("orgId"), orgId)
        );

        if (dossierId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("dossierId"), dossierId));
        }

        if (assignedTo != null && !assignedTo.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("assignedTo"), assignedTo));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), status));
        }

        if (dueBefore != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("dueDate"), dueBefore));
        }

        if (dueAfter != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("dueDate"), dueAfter));
        }

        if (overdue != null && overdue) {
            LocalDateTime now = LocalDateTime.now();
            spec = spec.and((root, query, cb) ->
                    cb.and(
                        cb.lessThan(root.get("dueDate"), now),
                        cb.or(
                            cb.equal(root.get("status"), TaskStatus.TODO),
                            cb.equal(root.get("status"), TaskStatus.IN_PROGRESS)
                        )
                    ));
        }

        Page<TaskEntity> tasks = taskRepository.findAll(spec, pageable);
        return tasks.map(taskMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<TaskEntity> findOverdueTasks(String assignedTo) {
        return taskRepository.findOverdueTasks(assignedTo, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<TaskEntity> findAllOverdueTasksForOrg(String orgId) {
        return taskRepository.findAllOverdueTasksForOrg(orgId, LocalDateTime.now());
    }
}
