# Notification API Examples

This document provides examples of how to use the Notification API to create and manage in-app notifications.

## Creating In-App Notifications

### Example 1: Simple Notification

```bash
curl -X POST http://localhost:8080/api/v1/notifications/in-app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipient": "user@example.com",
    "subject": "New message received",
    "message": "You have received a new message from John Doe"
  }'
```

### Example 2: Notification with Dossier Link

```bash
curl -X POST http://localhost:8080/api/v1/notifications/in-app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dossierId": 123,
    "recipient": "agent@example.com",
    "subject": "Dossier status changed",
    "message": "Dossier #123 status changed to APPROVED",
    "actionUrl": "/dossiers/123"
  }'
```

### Example 3: Notification with Custom Action

```bash
curl -X POST http://localhost:8080/api/v1/notifications/in-app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipient": "admin@example.com",
    "subject": "New task assigned",
    "message": "You have been assigned a new task: Review contract",
    "actionUrl": "/tasks/456"
  }'
```

## Java Service Examples

### Example 1: Create notification when dossier status changes

```java
@Service
public class DossierStatusNotificationService {
    
    private final NotificationService notificationService;
    
    public void notifyStatusChange(Dossier dossier, String previousStatus, String newStatus) {
        String subject = "Dossier status changed";
        String message = String.format(
            "Dossier #%d status changed from %s to %s",
            dossier.getId(), previousStatus, newStatus
        );
        String actionUrl = "/dossiers/" + dossier.getId();
        
        notificationService.createInAppNotification(
            dossier.getOrgId(),
            dossier.getId(),
            dossier.getAssignedTo(), // recipient
            subject,
            message,
            actionUrl
        );
    }
}
```

### Example 2: Create notification for new message

```java
@Service
public class MessageNotificationService {
    
    private final NotificationService notificationService;
    
    public void notifyNewMessage(MessageEntity message, Dossier dossier) {
        String subject = "New message received";
        String message = String.format(
            "You received a message from %s in dossier #%d",
            message.getSenderName(), dossier.getId()
        );
        String actionUrl = "/dossiers/" + dossier.getId() + "?tab=messages";
        
        notificationService.createInAppNotification(
            dossier.getOrgId(),
            dossier.getId(),
            dossier.getAssignedTo(),
            subject,
            message,
            actionUrl
        );
    }
}
```

### Example 3: Create notification for task assignment

```java
@Service
public class TaskNotificationService {
    
    private final NotificationService notificationService;
    
    public void notifyTaskAssignment(TaskEntity task) {
        String subject = "New task assigned";
        String message = String.format(
            "You have been assigned: %s (Due: %s)",
            task.getTitle(),
            task.getDueDate().format(DateTimeFormatter.ISO_LOCAL_DATE)
        );
        String actionUrl = "/tasks/" + task.getId();
        
        notificationService.createInAppNotification(
            task.getOrgId(),
            task.getDossierId(),
            task.getAssignedTo(),
            subject,
            message,
            actionUrl
        );
    }
}
```

### Example 4: Bulk notifications to multiple users

```java
@Service
public class BulkNotificationService {
    
    private final NotificationService notificationService;
    
    public void notifyTeamMembers(List<String> recipients, String subject, String message) {
        String orgId = TenantContext.getOrgId();
        
        recipients.forEach(recipient -> {
            notificationService.createInAppNotification(
                orgId,
                null, // no specific dossier
                recipient,
                subject,
                message,
                "/dashboard" // generic action
            );
        });
    }
}
```

## Querying Notifications

### List all notifications

```bash
curl -X GET "http://localhost:8080/api/v1/notifications?page=0&size=20&sort=createdAt,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by type (IN_APP only)

```bash
curl -X GET "http://localhost:8080/api/v1/notifications?type=IN_APP&page=0&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by dossier

```bash
curl -X GET "http://localhost:8080/api/v1/notifications?dossierId=123&page=0&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get unread count

```bash
curl -X GET "http://localhost:8080/api/v1/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Marking Notifications as Read/Unread

### Mark as read

```bash
curl -X PATCH "http://localhost:8080/api/v1/notifications/456/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mark as unread

```bash
curl -X PATCH "http://localhost:8080/api/v1/notifications/456/unread" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration with Event-Driven Architecture

### Spring Events Example

```java
// Event class
public class DossierStatusChangedEvent {
    private final Long dossierId;
    private final String previousStatus;
    private final String newStatus;
    
    // constructor, getters
}

// Event publisher
@Service
public class DossierService {
    
    private final ApplicationEventPublisher eventPublisher;
    
    public void updateStatus(Long dossierId, String newStatus) {
        // Update dossier status
        Dossier dossier = dossierRepository.findById(dossierId).orElseThrow();
        String previousStatus = dossier.getStatus();
        dossier.setStatus(newStatus);
        dossierRepository.save(dossier);
        
        // Publish event
        eventPublisher.publishEvent(
            new DossierStatusChangedEvent(dossierId, previousStatus, newStatus)
        );
    }
}

// Event listener
@Component
public class NotificationEventListener {
    
    private final NotificationService notificationService;
    private final DossierRepository dossierRepository;
    
    @EventListener
    public void handleDossierStatusChanged(DossierStatusChangedEvent event) {
        Dossier dossier = dossierRepository.findById(event.getDossierId()).orElse(null);
        if (dossier != null && dossier.getAssignedTo() != null) {
            notificationService.createInAppNotification(
                dossier.getOrgId(),
                dossier.getId(),
                dossier.getAssignedTo(),
                "Dossier status changed",
                String.format("Status changed from %s to %s", 
                    event.getPreviousStatus(), event.getNewStatus()),
                "/dossiers/" + dossier.getId()
            );
        }
    }
}
```

## Testing Notifications

### Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    
    @Mock
    private NotificationRepository notificationRepository;
    
    @InjectMocks
    private NotificationService notificationService;
    
    @Test
    void shouldCreateInAppNotification() {
        // Arrange
        String orgId = "org-123";
        Long dossierId = 456L;
        String recipient = "user@example.com";
        String subject = "Test notification";
        String message = "Test message";
        String actionUrl = "/test";
        
        when(notificationRepository.save(any(NotificationEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        NotificationEntity notification = notificationService.createInAppNotification(
            orgId, dossierId, recipient, subject, message, actionUrl
        );
        
        // Assert
        assertThat(notification).isNotNull();
        assertThat(notification.getOrgId()).isEqualTo(orgId);
        assertThat(notification.getDossierId()).isEqualTo(dossierId);
        assertThat(notification.getRecipient()).isEqualTo(recipient);
        assertThat(notification.getSubject()).isEqualTo(subject);
        assertThat(notification.getMessage()).isEqualTo(message);
        assertThat(notification.getActionUrl()).isEqualTo(actionUrl);
        assertThat(notification.getType()).isEqualTo(NotificationType.IN_APP);
        assertThat(notification.getStatus()).isEqualTo(NotificationStatus.SENT);
        assertThat(notification.getReadAt()).isNull();
    }
}
```

### Integration Test Example

```java
@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerIT {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Test
    void shouldCreateInAppNotification() throws Exception {
        // Arrange
        String requestBody = """
            {
                "dossierId": 123,
                "recipient": "user@example.com",
                "subject": "Test notification",
                "message": "Test message",
                "actionUrl": "/test"
            }
            """;
        
        // Act & Assert
        mockMvc.perform(post("/api/v1/notifications/in-app")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subject").value("Test notification"))
                .andExpect(jsonPath("$.message").value("Test message"))
                .andExpect(jsonPath("$.type").value("IN_APP"))
                .andExpect(jsonPath("$.readAt").isEmpty());
    }
    
    @Test
    void shouldMarkNotificationAsRead() throws Exception {
        // Arrange
        NotificationEntity notification = createTestNotification();
        Long notificationId = notification.getId();
        
        // Act & Assert
        mockMvc.perform(patch("/api/v1/notifications/{id}/read", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readAt").isNotEmpty());
    }
    
    @Test
    void shouldGetUnreadCount() throws Exception {
        // Arrange
        createTestNotification(); // unread
        createTestNotification(); // unread
        
        // Act & Assert
        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(content().string("2"));
    }
    
    private NotificationEntity createTestNotification() {
        NotificationEntity notification = new NotificationEntity();
        notification.setOrgId("test-org");
        notification.setType(NotificationType.IN_APP);
        notification.setRecipient("test@example.com");
        notification.setSubject("Test");
        notification.setMessage("Test message");
        notification.setStatus(NotificationStatus.SENT);
        notification.setTemplateId("test");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }
}
```

## Frontend Usage Examples

### TypeScript/Angular Example

```typescript
// In a component
export class DossierDetailComponent implements OnInit {
  
  constructor(
    private notificationApiService: NotificationApiService,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    // Load notifications for this dossier
    const dossierId = this.route.snapshot.params['id'];
    
    this.notificationApiService.list(dossierId, 'IN_APP')
      .subscribe(notifications => {
        console.log('Dossier notifications:', notifications);
      });
  }
  
  // Mark notification as read when user views it
  viewNotification(notification: NotificationResponse) {
    if (!notification.readAt) {
      this.notificationApiService.markAsRead(notification.id)
        .subscribe(() => {
          console.log('Notification marked as read');
        });
    }
  }
}
```

## Best Practices

1. **Always provide actionUrl**: Help users navigate to relevant content
2. **Keep messages concise**: Notification center truncates long messages
3. **Use meaningful subjects**: Help users quickly identify notification purpose
4. **Link to dossierId when relevant**: Enables filtering by dossier
5. **Implement proper recipient targeting**: Only notify relevant users
6. **Use event-driven architecture**: Decouple notification logic from business logic
7. **Test notification creation**: Ensure notifications are created correctly
8. **Monitor unread counts**: Track user engagement with notifications
