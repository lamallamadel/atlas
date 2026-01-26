# Notification Center

A comprehensive in-app notification system with real-time updates, grouping by date, and quick actions.

## Features

### 1. Real-time Updates
- **Polling Mechanism**: Automatically polls for new notifications every 30 seconds
- **Unread Count Badge**: Displays the number of unread notifications in the toolbar
- **Instant Synchronization**: Updates immediately when notifications are read/unread

### 2. Notification Display
- **Grouped by Date**: Notifications are organized by date (Today, Yesterday, or specific date)
- **Visual Indicators**: 
  - Blue dot for unread notifications
  - Icon indicating notification type (email, SMS, WhatsApp, in-app)
  - Time ago display (e.g., "Il y a 5 min", "Il y a 2h")
- **Truncated Messages**: Long messages are truncated with ellipsis for better readability

### 3. Filtering
- **Type Filters**: Filter by notification type:
  - All notifications
  - IN_APP: Application notifications
  - EMAIL: Email notifications
  - SMS: SMS notifications
  - WHATSAPP: WhatsApp notifications

### 4. Quick Actions
- **Mark as Read/Unread**: Toggle read status with a single click
- **Navigate to Content**: Click notification to navigate to related dossier or custom action URL
- **Auto-mark as Read**: Automatically marks notification as read when clicked

### 5. Infinite Scroll
- **Load More**: Load additional notifications with pagination
- **Performance**: Only loads 20 notifications at a time for optimal performance

### 6. Accessibility
- **Keyboard Navigation**: Full keyboard support with Enter/Space keys
- **ARIA Labels**: Proper ARIA labels for screen readers
- **Focus Management**: Clear focus indicators for keyboard users

## Usage

### In AppLayoutComponent

The notification center is integrated into the main application layout:

```html
<button
  mat-icon-button
  [matMenuTriggerFor]="notificationMenu"
  matTooltip="Notifications">
  <mat-icon 
    [matBadge]="(unreadNotificationCount$ | async) || 0" 
    [matBadgeHidden]="(unreadNotificationCount$ | async) === 0"
    matBadgeColor="warn">
    notifications
  </mat-icon>
</button>

<mat-menu #notificationMenu="matMenu">
  <div (click)="$event.stopPropagation()">
    <app-notification-center></app-notification-center>
  </div>
</mat-menu>
```

### Creating Notifications (Backend)

To create in-app notifications from the backend:

```java
// Create a simple notification
notificationService.createNotification(
    orgId,
    dossierId,
    NotificationType.IN_APP,
    userId,
    "New message received",
    "notification.message.new",
    Map.of("senderName", "John Doe")
);

// Create notification with message and action URL
NotificationEntity notification = new NotificationEntity();
notification.setOrgId(orgId);
notification.setDossierId(dossierId);
notification.setType(NotificationType.IN_APP);
notification.setRecipient(userId);
notification.setSubject("Dossier status changed");
notification.setMessage("The dossier #" + dossierId + " status changed to APPROVED");
notification.setActionUrl("/dossiers/" + dossierId);
notification.setStatus(NotificationStatus.PENDING);
notificationRepository.save(notification);
```

## API Service

### NotificationApiService

The service provides the following methods:

```typescript
// Get notifications with filtering and pagination
list(dossierId?, type?, status?, page?, size?, sort?): Observable<NotificationPage>

// Get single notification
getById(id: number): Observable<NotificationResponse>

// Mark notification as read
markAsRead(id: number): Observable<NotificationResponse>

// Mark notification as unread
markAsUnread(id: number): Observable<NotificationResponse>

// Get unread count (observable)
getUnreadCount(): Observable<number>

// Manually refresh unread count
refreshUnreadCount(): void
```

### Notification Response Model

```typescript
interface NotificationResponse {
  id: number;
  orgId: string;
  dossierId?: number;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'FAILED';
  templateId: string;
  recipient: string;
  subject?: string;
  message?: string;
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Backend API Endpoints

### List Notifications
```
GET /api/v1/notifications
Query Params:
  - dossierId (optional): Filter by dossier
  - type (optional): Filter by type
  - status (optional): Filter by status
  - page (default: 0): Page number
  - size (default: 20): Page size
  - sort (default: "createdAt,desc"): Sort criteria
```

### Get Notification
```
GET /api/v1/notifications/{id}
```

### Mark as Read
```
PATCH /api/v1/notifications/{id}/read
```

### Mark as Unread
```
PATCH /api/v1/notifications/{id}/unread
```

### Get Unread Count
```
GET /api/v1/notifications/unread-count
Returns: number
```

## Database Schema

### New Fields Added to notification Table

```sql
-- Read timestamp for tracking when notification was read
read_at TIMESTAMP

-- Full message content for in-app notifications
message TEXT

-- URL to navigate to when notification is clicked
action_url VARCHAR(500)
```

### Indexes

```sql
-- Partial index for efficient unread count queries (PostgreSQL only)
CREATE INDEX idx_notification_unread 
ON notification(type, read_at) 
WHERE type = 'IN_APP' AND read_at IS NULL;
```

## Configuration

### Polling Interval

To change the polling interval, modify the `pollingInterval` in `NotificationApiService`:

```typescript
private pollingInterval = 30000; // 30 seconds (default)
```

### Notification Display Count

To change the number of notifications loaded per page:

```typescript
size = 20; // Default page size
```

## Styling

The notification center supports both light and dark themes through CSS custom properties:

```scss
:host-context(.dark-theme) {
  .notification-center {
    --background-color: #303030;
    --background-hover: #424242;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --divider-color: #424242;
    --unread-background: #1e3a5f;
  }
}
```

## Responsive Design

- **Desktop**: 400px width dropdown menu
- **Mobile**: Full-screen overlay on small devices
- **Tablet**: Adjusted width to fit screen

## Future Enhancements

### WebSocket Support

To implement real-time notifications via WebSocket instead of polling:

1. Install WebSocket library: `npm install socket.io-client`
2. Create WebSocket service
3. Connect to backend WebSocket endpoint
4. Listen for notification events
5. Update unread count and notification list in real-time

Example:

```typescript
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class NotificationWebSocketService {
  private socket: Socket;

  connect() {
    this.socket = io('ws://localhost:8080/notifications');
    
    this.socket.on('notification:new', (notification) => {
      // Handle new notification
    });
    
    this.socket.on('notification:read', (notificationId) => {
      // Handle read notification
    });
  }
}
```

### Push Notifications

For browser push notifications:

1. Request notification permission
2. Subscribe to push service
3. Send subscription to backend
4. Backend sends push notifications via Web Push API

## Troubleshooting

### Notifications Not Loading
- Check browser console for API errors
- Verify backend is running and accessible
- Check authentication token is valid

### Badge Count Not Updating
- Verify polling is working (check Network tab)
- Check backend `/unread-count` endpoint returns correct value
- Ensure notifications are marked with correct type (`IN_APP`)

### Dropdown Menu Too Small
- Check if `::ng-deep` styles are being applied
- Verify Material theme is properly imported
- Adjust `max-width` and `max-height` in component styles

## Performance Considerations

- **Pagination**: Only 20 notifications loaded at a time
- **Polling**: 30-second interval to reduce server load
- **Indexes**: Partial index on unread notifications for fast queries
- **Virtual Scrolling**: Consider implementing for 100+ notifications
- **Caching**: Backend could implement Redis cache for unread counts
