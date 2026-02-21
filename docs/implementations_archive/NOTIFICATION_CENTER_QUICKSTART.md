# Notification Center Quick Start Guide

Get started with the in-app notification center in 5 minutes.

## For End Users

### Viewing Notifications

1. Look for the bell icon (🔔) in the top toolbar
2. A red badge shows the number of unread notifications
3. Click the bell icon to open the notification center

### Reading Notifications

1. Notifications are grouped by date (Today, Yesterday, etc.)
2. Unread notifications have a blue dot indicator
3. Click any notification to:
   - Mark it as read automatically
   - Navigate to related content (dossier, task, etc.)

### Managing Notifications

- **Mark as Read**: Click the ✉️ icon on the right
- **Mark as Unread**: Click the ✉️ icon on an already-read notification
- **Filter by Type**: Use the chips at the top (All, IN_APP, Email, SMS, WhatsApp)
- **Load More**: Click "Charger plus" at the bottom to see older notifications
- **Refresh**: Click the 🔄 icon to refresh the list

## For Developers

### Creating Notifications from Backend

**Simple example:**

```java
@Autowired
private NotificationService notificationService;

public void notifyUser(String userId, Long dossierId) {
    notificationService.createInAppNotification(
        "org-123",                           // Organization ID
        dossierId,                           // Dossier ID (optional)
        userId,                              // Recipient user ID
        "New message received",              // Subject
        "You have a new message from John",  // Message
        "/dossiers/" + dossierId             // Action URL (optional)
    );
}
```

**REST API example:**

```bash
curl -X POST http://localhost:8080/api/v1/notifications/in-app \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dossierId": 123,
    "recipient": "user@example.com",
    "subject": "Task completed",
    "message": "Your task has been completed successfully",
    "actionUrl": "/tasks/456"
  }'
```

### Common Use Cases

#### 1. Notify on Dossier Status Change

```java
@Service
public class DossierNotificationService {
    @Autowired
    private NotificationService notificationService;
    
    public void notifyStatusChange(Dossier dossier, String newStatus) {
        notificationService.createInAppNotification(
            dossier.getOrgId(),
            dossier.getId(),
            dossier.getAssignedTo(),
            "Dossier status changed",
            "Dossier #" + dossier.getId() + " is now " + newStatus,
            "/dossiers/" + dossier.getId()
        );
    }
}
```

#### 2. Notify on New Message

```java
public void notifyNewMessage(MessageEntity message, Dossier dossier) {
    notificationService.createInAppNotification(
        dossier.getOrgId(),
        dossier.getId(),
        dossier.getAssignedTo(),
        "New message",
        "Message from " + message.getSenderName(),
        "/dossiers/" + dossier.getId() + "?tab=messages"
    );
}
```

#### 3. Notify Multiple Users

```java
public void notifyTeam(List<String> userIds, String subject, String message) {
    userIds.forEach(userId -> 
        notificationService.createInAppNotification(
            TenantContext.getOrgId(),
            null,
            userId,
            subject,
            message,
            "/dashboard"
        )
    );
}
```

### Accessing Notification Data in Frontend

**In a component:**

```typescript
import { NotificationApiService } from '../services/notification-api.service';

export class MyComponent implements OnInit {
  unreadCount$: Observable<number>;
  
  constructor(private notificationApi: NotificationApiService) {
    this.unreadCount$ = this.notificationApi.getUnreadCount();
  }
  
  ngOnInit() {
    // Subscribe to unread count changes
    this.unreadCount$.subscribe(count => {
      console.log(`${count} unread notifications`);
    });
  }
  
  // Load notifications for a specific dossier
  loadDossierNotifications(dossierId: number) {
    this.notificationApi.list(dossierId, 'IN_APP')
      .subscribe(page => {
        console.log('Notifications:', page.content);
      });
  }
}
```

## Configuration

### Change Polling Interval

In `notification-api.service.ts`:

```typescript
private pollingInterval = 30000; // Change to desired milliseconds
```

### Change Page Size

In `notification-center.component.ts`:

```typescript
size = 20; // Change to desired number of notifications per page
```

## Database Migrations

Migrations are automatically applied on application startup:

- **H2**: `V202__Add_in_app_notification_fields.sql`
- **PostgreSQL**: `V107__Add_in_app_notification_fields.sql`
- **Generic**: `V33__Add_in_app_notification_fields.sql`

No manual database changes required.

## Troubleshooting

### Notifications not appearing
1. Check backend logs for errors
2. Verify notification was created: `GET /api/v1/notifications`
3. Check notification type is `IN_APP`
4. Verify user has access to organization

### Badge count not updating
1. Check browser console for errors
2. Verify polling is running (Network tab)
3. Check `/api/v1/notifications/unread-count` returns correct value

### Cannot click notification
1. Verify `actionUrl` is set
2. Check route exists in Angular routing
3. Verify user has permission to access route

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/notifications` | GET | List notifications with filters |
| `/api/v1/notifications/{id}` | GET | Get single notification |
| `/api/v1/notifications/{id}/read` | PATCH | Mark as read |
| `/api/v1/notifications/{id}/unread` | PATCH | Mark as unread |
| `/api/v1/notifications/unread-count` | GET | Get unread count |
| `/api/v1/notifications/in-app` | POST | Create in-app notification |

## Next Steps

- See `NOTIFICATION_CENTER_IMPLEMENTATION.md` for full implementation details
- See `frontend/src/app/components/NOTIFICATION_CENTER_README.md` for frontend docs
- See `backend/src/main/java/com/example/backend/controller/NOTIFICATION_API_EXAMPLES.md` for API examples

## Support

For questions or issues:
1. Check the documentation files listed above
2. Review the code comments in service and component files
3. Examine existing usage in the codebase
