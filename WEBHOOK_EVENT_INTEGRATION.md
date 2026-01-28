# Webhook Event Integration Guide

How to integrate webhook events into existing services.

## Overview

The `WebhookEventService` provides a simple way to trigger webhook notifications from any service in the application. This guide shows how to integrate webhook events into existing services.

## Quick Integration

### Step 1: Inject WebhookEventService

Add the service to your existing service class:

```java
@Service
public class DossierService {
    
    private final DossierRepository dossierRepository;
    private final WebhookEventService webhookEventService; // Add this
    
    public DossierService(
        DossierRepository dossierRepository,
        WebhookEventService webhookEventService  // Add this
    ) {
        this.dossierRepository = dossierRepository;
        this.webhookEventService = webhookEventService;
    }
}
```

### Step 2: Trigger Events

Add webhook triggers to your service methods:

```java
@Transactional
public Dossier createDossier(DossierCreateRequest request, String orgId) {
    Dossier dossier = new Dossier();
    // ... set dossier properties
    
    Dossier saved = dossierRepository.save(dossier);
    
    // Trigger webhook event
    webhookEventService.triggerDossierCreated(saved);
    
    return saved;
}
```

## Available Event Triggers

### Dossier Events

```java
// When a dossier is created
webhookEventService.triggerDossierCreated(dossier);

// When a dossier is updated
webhookEventService.triggerDossierUpdated(dossier);

// When a dossier status changes
webhookEventService.triggerDossierStatusChanged(dossier, "OLD_STATUS", "NEW_STATUS");
```

### Message Events

```java
// When a message is received
webhookEventService.triggerMessageReceived(message);

// When a message is sent
webhookEventService.triggerMessageSent(message);
```

### Appointment Events

```java
// When an appointment is scheduled
webhookEventService.triggerAppointmentScheduled(appointment);

// When an appointment is updated
webhookEventService.triggerAppointmentUpdated(appointment);

// When an appointment is cancelled
webhookEventService.triggerAppointmentCancelled(appointment);
```

## Complete Integration Examples

### Example 1: DossierService

```java
@Service
public class DossierService {
    
    private final DossierRepository dossierRepository;
    private final WebhookEventService webhookEventService;
    
    public DossierService(
        DossierRepository dossierRepository,
        WebhookEventService webhookEventService
    ) {
        this.dossierRepository = dossierRepository;
        this.webhookEventService = webhookEventService;
    }
    
    @Transactional
    public Dossier createDossier(DossierCreateRequest request, String orgId) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setReference(request.getReference());
        dossier.setTitle(request.getTitle());
        dossier.setStatus("NEW");
        
        Dossier saved = dossierRepository.save(dossier);
        
        // Trigger webhook
        webhookEventService.triggerDossierCreated(saved);
        
        return saved;
    }
    
    @Transactional
    public Dossier updateDossier(Long id, DossierUpdateRequest request, String orgId) {
        Dossier dossier = dossierRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new EntityNotFoundException("Dossier not found"));
        
        dossier.setTitle(request.getTitle());
        dossier.setDescription(request.getDescription());
        
        Dossier saved = dossierRepository.save(dossier);
        
        // Trigger webhook
        webhookEventService.triggerDossierUpdated(saved);
        
        return saved;
    }
    
    @Transactional
    public Dossier updateStatus(Long id, String newStatus, String orgId) {
        Dossier dossier = dossierRepository.findByIdAndOrgId(id, orgId)
            .orElseThrow(() -> new EntityNotFoundException("Dossier not found"));
        
        String oldStatus = dossier.getStatus();
        dossier.setStatus(newStatus);
        
        Dossier saved = dossierRepository.save(dossier);
        
        // Trigger webhook with old and new status
        webhookEventService.triggerDossierStatusChanged(saved, oldStatus, newStatus);
        
        return saved;
    }
}
```

### Example 2: MessageService

```java
@Service
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final WebhookEventService webhookEventService;
    
    public MessageService(
        MessageRepository messageRepository,
        WebhookEventService webhookEventService
    ) {
        this.messageRepository = messageRepository;
        this.webhookEventService = webhookEventService;
    }
    
    @Transactional
    public void handleIncomingMessage(IncomingMessageEvent event) {
        MessageEntity message = new MessageEntity();
        message.setDossierId(event.getDossierId());
        message.setChannel(event.getChannel());
        message.setFrom(event.getFrom());
        message.setContent(event.getContent());
        message.setReceivedAt(LocalDateTime.now());
        
        MessageEntity saved = messageRepository.save(message);
        
        // Trigger webhook
        webhookEventService.triggerMessageReceived(saved);
    }
    
    @Transactional
    public void sendMessage(SendMessageRequest request) {
        MessageEntity message = new MessageEntity();
        message.setDossierId(request.getDossierId());
        message.setChannel(request.getChannel());
        message.setTo(request.getTo());
        message.setContent(request.getContent());
        message.setSentAt(LocalDateTime.now());
        
        MessageEntity saved = messageRepository.save(message);
        
        // Actually send the message...
        messagingProvider.send(message);
        
        // Trigger webhook
        webhookEventService.triggerMessageSent(saved);
    }
}
```

### Example 3: AppointmentService

```java
@Service
public class AppointmentService {
    
    private final AppointmentRepository appointmentRepository;
    private final WebhookEventService webhookEventService;
    
    public AppointmentService(
        AppointmentRepository appointmentRepository,
        WebhookEventService webhookEventService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.webhookEventService = webhookEventService;
    }
    
    @Transactional
    public AppointmentEntity scheduleAppointment(ScheduleAppointmentRequest request) {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setDossierId(request.getDossierId());
        appointment.setTitle(request.getTitle());
        appointment.setScheduledAt(request.getScheduledAt());
        appointment.setDuration(request.getDuration());
        appointment.setLocation(request.getLocation());
        appointment.setStatus("SCHEDULED");
        
        AppointmentEntity saved = appointmentRepository.save(appointment);
        
        // Trigger webhook
        webhookEventService.triggerAppointmentScheduled(saved);
        
        return saved;
    }
    
    @Transactional
    public AppointmentEntity updateAppointment(Long id, UpdateAppointmentRequest request) {
        AppointmentEntity appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));
        
        appointment.setTitle(request.getTitle());
        appointment.setScheduledAt(request.getScheduledAt());
        appointment.setLocation(request.getLocation());
        
        AppointmentEntity saved = appointmentRepository.save(appointment);
        
        // Trigger webhook
        webhookEventService.triggerAppointmentUpdated(saved);
        
        return saved;
    }
    
    @Transactional
    public void cancelAppointment(Long id) {
        AppointmentEntity appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));
        
        appointment.setStatus("CANCELLED");
        AppointmentEntity saved = appointmentRepository.save(appointment);
        
        // Trigger webhook
        webhookEventService.triggerAppointmentCancelled(saved);
    }
}
```

## Best Practices

### 1. Trigger After Save

Always trigger webhooks AFTER the database transaction succeeds:

```java
@Transactional
public Dossier createDossier(...) {
    Dossier saved = repository.save(dossier);
    webhookEventService.triggerDossierCreated(saved); // After save
    return saved;
}
```

### 2. Async Execution

Webhook delivery is already async via `@Async`, but ensure you don't block:

```java
// ✅ Good - webhook fires asynchronously
webhookEventService.triggerDossierCreated(saved);
return saved;

// ❌ Bad - don't wait for webhook delivery
webhookService.deliverWebhook(...); // This blocks
```

### 3. Error Handling

Webhook failures don't affect your main transaction:

```java
@Transactional
public Dossier createDossier(...) {
    Dossier saved = repository.save(dossier);
    
    try {
        webhookEventService.triggerDossierCreated(saved);
    } catch (Exception e) {
        // Log but don't fail the transaction
        logger.error("Webhook trigger failed", e);
    }
    
    return saved;
}
```

### 4. Conditional Triggers

Only trigger webhooks when appropriate:

```java
@Transactional
public Dossier updateDossier(Long id, DossierUpdateRequest request) {
    Dossier dossier = repository.findById(id).orElseThrow();
    
    String oldStatus = dossier.getStatus();
    dossier.setStatus(request.getStatus());
    
    Dossier saved = repository.save(dossier);
    
    // Only trigger if status actually changed
    if (!oldStatus.equals(request.getStatus())) {
        webhookEventService.triggerDossierStatusChanged(saved, oldStatus, request.getStatus());
    }
    
    return saved;
}
```

### 5. Test Webhook Integration

Add tests to verify webhook triggers:

```java
@Test
void createDossier_shouldTriggerWebhook() {
    // Arrange
    DossierCreateRequest request = new DossierCreateRequest();
    request.setTitle("Test Dossier");
    
    // Act
    Dossier created = dossierService.createDossier(request, "ORG-123");
    
    // Assert
    verify(webhookEventService).triggerDossierCreated(created);
}
```

## Customizing Event Payloads

If you need custom payload fields, extend `WebhookEventService`:

```java
@Service
public class CustomWebhookEventService extends WebhookEventService {
    
    public CustomWebhookEventService(WebhookService webhookService) {
        super(webhookService);
    }
    
    @Override
    protected Map<String, Object> createDossierPayload(Object dossier) {
        Map<String, Object> payload = super.createDossierPayload(dossier);
        
        // Add custom fields
        Dossier d = (Dossier) dossier;
        payload.put("customField", d.getCustomField());
        payload.put("calculatedValue", calculateValue(d));
        
        return payload;
    }
}
```

## Troubleshooting

### Webhooks Not Firing

1. Check service is injecting `WebhookEventService`
2. Verify method is annotated with `@Transactional`
3. Ensure webhook subscription exists for event type
4. Check webhook subscription status is `ACTIVE`

### Duplicate Events

If events fire multiple times:

```java
// ❌ Bad - don't call in multiple places
public Dossier createDossier(...) {
    Dossier saved = repository.save(dossier);
    webhookEventService.triggerDossierCreated(saved); // Called here
    
    updateSearchIndex(saved);
    webhookEventService.triggerDossierCreated(saved); // And here - duplicate!
    
    return saved;
}

// ✅ Good - call once after all operations
public Dossier createDossier(...) {
    Dossier saved = repository.save(dossier);
    updateSearchIndex(saved);
    webhookEventService.triggerDossierCreated(saved); // Called once
    return saved;
}
```

### Transaction Issues

If webhooks fire before transaction commits:

```java
// Use @Transactional(propagation = Propagation.REQUIRES_NEW)
// for methods that should commit independently
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void handleWebhookTrigger(Dossier dossier) {
    webhookEventService.triggerDossierCreated(dossier);
}
```

## Performance Considerations

### 1. Batch Operations

For bulk operations, consider batching webhook triggers:

```java
@Transactional
public List<Dossier> bulkCreateDossiers(List<DossierCreateRequest> requests) {
    List<Dossier> created = new ArrayList<>();
    
    for (DossierCreateRequest request : requests) {
        Dossier dossier = new Dossier();
        // ... set properties
        created.add(repository.save(dossier));
    }
    
    // Trigger webhooks after all saves
    for (Dossier dossier : created) {
        webhookEventService.triggerDossierCreated(dossier);
    }
    
    return created;
}
```

### 2. Rate Limiting

Webhooks respect rate limits based on subscriber tier. No special handling needed on your end.

### 3. Monitoring

Monitor webhook health via Developer Portal:
- Success/failure rates
- Delivery latency
- Retry attempts

## Next Steps

1. Identify services that should trigger webhooks
2. Inject `WebhookEventService` into those services
3. Add webhook triggers after database operations
4. Test webhook delivery
5. Monitor webhook health in Developer Portal

For more details, see:
- [API_MARKETPLACE_IMPLEMENTATION.md](./API_MARKETPLACE_IMPLEMENTATION.md)
- [WEBHOOK_INTEGRATION_GUIDE.md](./backend/src/main/resources/docs/WEBHOOK_INTEGRATION_GUIDE.md)
