package com.example.backend.controller;

import com.example.backend.dto.NotificationCreateRequest;
import com.example.backend.dto.NotificationMapper;
import com.example.backend.dto.NotificationResponse;
import com.example.backend.entity.NotificationEntity;
import com.example.backend.entity.enums.NotificationStatus;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.util.TenantContext;
import com.example.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "API for managing notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;

    public NotificationController(NotificationService notificationService, NotificationMapper notificationMapper) {
        this.notificationService = notificationService;
        this.notificationMapper = notificationMapper;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Create a new notification", description = "Creates a new notification with PENDING status")
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody NotificationCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        
        NotificationEntity notification = notificationService.createNotification(
            orgId,
            request.getDossierId(),
            request.getType(),
            request.getRecipient(),
            request.getSubject(),
            request.getTemplateId(),
            request.getVariables()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationMapper.toResponse(notification));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List notifications", description = "Retrieves a paginated list of notifications with optional filtering")
    public ResponseEntity<Page<NotificationResponse>> list(
            @Parameter(description = "Filter by dossier ID")
            @RequestParam(required = false) Long dossierId,
            @Parameter(description = "Filter by notification type")
            @RequestParam(required = false) NotificationType type,
            @Parameter(description = "Filter by notification status")
            @RequestParam(required = false) NotificationStatus status,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria")
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        Pageable pageable = createPageable(page, size, sort);
        Page<NotificationEntity> notifications = notificationService.listNotifications(dossierId, type, status, pageable);
        
        return ResponseEntity.ok(notifications.map(notificationMapper::toResponse));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get notification by ID", description = "Retrieves a single notification by its ID")
    public ResponseEntity<NotificationResponse> getById(@PathVariable Long id) {
        NotificationEntity notification = notificationService.getNotificationById(id);
        if (notification == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(notificationMapper.toResponse(notification));
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String property = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}
