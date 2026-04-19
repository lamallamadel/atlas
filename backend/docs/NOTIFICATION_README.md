# Notification System - Quick Start Guide

## Overview

A complete notification system for Spring Boot with support for EMAIL, SMS, WhatsApp, and In-App notifications. Features include:

- ✅ Async processing with scheduled polling
- ✅ Retry logic with configurable max attempts
- ✅ HTML email templates using Thymeleaf
- ✅ Provider abstraction for multiple channels
- ✅ Multi-tenant support
- ✅ JSONB storage for flexible template variables
- ✅ Error tracking and detailed logging

## Quick Setup (5 Steps)

### 1. Create Templates Directory

```bash
mkdir -p backend/src/main/resources/templates
```

### 2. Add a Sample Email Template

Create `backend/src/main/resources/templates/welcome-email.html`:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome!</h1>
    <p>Hello <span th:text="${name}">User</span>,</p>
    <p th:text="${message}">Thank you for joining!</p>
</body>
</html>
```

### 3. Start MailHog (for local testing)

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Access MailHog UI at: http://localhost:8025

### 4. Build and Run

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

The notification processor will start automatically and poll for pending notifications every 10 seconds.

### 5. Send a Test Notification

```java
@Autowired
private NotificationService notificationService;

public void sendTestEmail() {
    Map<String, Object> variables = Map.of(
        "name", "John Doe",
        "message", "Welcome to our platform!"
    );
    
    notificationService.createNotification(
        "org123",                    // orgId
        NotificationType.EMAIL,      // type
        "user@example.com",          // recipient
        "Welcome to Our Platform",   // subject
        "welcome-email",             // templateId
        variables                    // variables
    );
}
```

Check MailHog UI to see the email!

## Architecture

```
┌─────────────────┐
│  Application    │ Creates notification (PENDING)
│      Code       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Notification  │ Saves to database
│     Service     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Database     │ Stores notification
│   (PostgreSQL)  │
└────────┬────────┘
         │
         │ ◄──── Polls every 10s
         ▼
┌─────────────────┐
│   @Scheduled    │ Fetches PENDING notifications
│    Processor    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Provider     │ EmailProvider / SmsProvider
│   Abstraction   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JavaMailSender │ Sends email via SMTP
│   (Thymeleaf)   │
└─────────────────┘
```

## Configuration

### Environment Variables

```bash
# Mail Server
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@example.com
MAIL_SMTP_AUTH=false
MAIL_SMTP_STARTTLS=false

# Notification Processor
NOTIFICATION_PROCESSOR_INTERVAL=10000
```

### Production SMTP (Gmail Example)

```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
```

## Usage Examples

### Send Welcome Email

```java
Map<String, Object> variables = Map.of(
    "name", user.getName(),
    "message", "Thank you for registering!"
);

notificationService.createNotification(
    user.getOrgId(),
    NotificationType.EMAIL,
    user.getEmail(),
    "Welcome",
    "welcome-email",
    variables
);
```

### Send Password Reset Email

```java
Map<String, Object> variables = Map.of(
    "name", user.getName(),
    "resetLink", "https://example.com/reset?token=" + token,
    "expiryHours", "24"
);

notificationService.createNotification(
    user.getOrgId(),
    NotificationType.EMAIL,
    user.getEmail(),
    "Password Reset Request",
    "password-reset",
    variables
);
```

### Send Appointment Reminder

```java
Map<String, Object> variables = Map.of(
    "clientName", appointment.getClientName(),
    "appointmentDate", appointment.getDate(),
    "appointmentTime", appointment.getTime(),
    "location", appointment.getLocation()
);

notificationService.createNotification(
    appointment.getOrgId(),
    NotificationType.EMAIL,
    appointment.getClientEmail(),
    "Appointment Reminder",
    "appointment-reminder",
    variables
);
```

## Monitoring

### Check Notification Status

```java
NotificationEntity notification = notificationService.getNotificationById(id);
System.out.println("Status: " + notification.getStatus());
System.out.println("Retry Count: " + notification.getRetryCount());
if (notification.getErrorMessage() != null) {
    System.out.println("Error: " + notification.getErrorMessage());
}
```

### Database Queries

```sql
-- Check pending notifications
SELECT * FROM notification WHERE status = 'PENDING';

-- Check failed notifications
SELECT * FROM notification WHERE status = 'FAILED';

-- Check notifications by type
SELECT type, status, COUNT(*) 
FROM notification 
GROUP BY type, status;
```

## Extending the System

### Add SMS Provider (Twilio Example)

1. Add Twilio dependency to `pom.xml`
2. Create implementation:

```java
@Component
public class TwilioSmsProvider implements SmsProvider {
    private final TwilioRestClient twilioClient;
    
    @Override
    public void send(NotificationEntity notification) throws Exception {
        // Implement Twilio SMS sending
        Message.creator(
            new PhoneNumber(notification.getRecipient()),
            new PhoneNumber(fromNumber),
            renderTemplate(notification.getTemplateId(), notification.getVariables())
        ).create(twilioClient);
    }
}
```

3. Register in NotificationService constructor:

```java
this.providerMap = Map.of(
    NotificationType.EMAIL, emailProvider,
    NotificationType.SMS, smsProvider
);
```

## Documentation

- **NOTIFICATION_SYSTEM.md** - Complete system overview and configuration
- **NOTIFICATION_TEMPLATES.md** - Template examples and Thymeleaf guide
- **NOTIFICATION_IMPLEMENTATION_SUMMARY.md** - Technical implementation details

## Database Schema

The `notification` table includes:
- All notification data and metadata
- JSONB column for flexible template variables
- Indexes for efficient querying
- CHECK constraints on enums
- Automatic timestamps

## Troubleshooting

### Emails Not Sending

1. Check MailHog is running: `curl http://localhost:8025`
2. Check logs: `tail -f backend/backend.log`
3. Verify notification status in database
4. Check MAIL_HOST and MAIL_PORT configuration

### Template Not Found

- Ensure templates directory exists
- Check template filename matches templateId
- System will generate fallback HTML automatically

### Notifications Stuck in PENDING

- Check scheduled processor is enabled (@EnableScheduling)
- Verify notification processor interval
- Check for exceptions in logs
- Ensure max_retries not exceeded

## Features

| Feature | Status |
|---------|--------|
| Email notifications | ✅ Implemented |
| SMS notifications | 🔧 Interface ready |
| WhatsApp notifications | 🔧 Interface ready |
| In-App notifications | 🔧 Interface ready |
| HTML templates | ✅ Implemented |
| Retry logic | ✅ Implemented |
| Async processing | ✅ Implemented |
| Multi-tenant | ✅ Implemented |
| Error tracking | ✅ Implemented |
| Scheduled polling | ✅ Implemented |

## License

Part of the Backend Application project.
