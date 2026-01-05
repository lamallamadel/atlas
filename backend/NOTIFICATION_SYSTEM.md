# Notification System

## Overview

The notification system provides a flexible way to send notifications via multiple channels (EMAIL, SMS, WhatsApp, IN_APP) with support for HTML templates, retry logic, and async processing.

## Components

### 1. NotificationEntity
Entity that stores notification data with the following fields:
- `type`: EMAIL, SMS, WHATSAPP, IN_APP
- `status`: PENDING, SENT, FAILED
- `templateId`: Reference to the template file (for emails) or template identifier
- `variables`: JSONB field containing template variables
- `recipient`: Email address, phone number, or user ID
- `subject`: Notification subject (mainly for emails)
- `retryCount`: Number of send attempts
- `maxRetries`: Maximum number of retry attempts (default: 3)

### 2. NotificationService
Service that manages notification lifecycle:
- Creates notifications with `createNotification()`
- Processes pending notifications via `@Scheduled` method every 10 seconds (configurable)
- Handles retry logic and status updates
- Uses provider abstraction for different notification types

### 3. Provider Abstraction
- `NotificationProvider`: Base interface for all providers
- `EmailProvider`: Interface for email providers
- `SmsProvider`: Interface for SMS providers
- `JavaMailEmailProvider`: Implementation using JavaMailSender and Thymeleaf templates

## Email Templates

### Template Directory
Create HTML templates in: `backend/src/main/resources/templates/`

### Sample Template (welcome-email.html)
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
    <p th:text="${message}">Thank you for joining us!</p>
</body>
</html>
```

### Using Variables
Pass variables as a Map when creating notifications:
```java
Map<String, Object> variables = Map.of(
    "name", "John Doe",
    "message", "Welcome to our platform!"
);
```

## Configuration

### Application Properties (application.yml)
```yaml
spring:
  mail:
    host: ${MAIL_HOST:localhost}
    port: ${MAIL_PORT:1025}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    from: ${MAIL_FROM:noreply@example.com}
    properties:
      mail:
        smtp:
          auth: ${MAIL_SMTP_AUTH:false}
          starttls:
            enable: ${MAIL_SMTP_STARTTLS:false}

notification:
  processor:
    interval: ${NOTIFICATION_PROCESSOR_INTERVAL:10000}
```

### Environment Variables
- `MAIL_HOST`: SMTP server host
- `MAIL_PORT`: SMTP server port
- `MAIL_USERNAME`: SMTP username (if authentication required)
- `MAIL_PASSWORD`: SMTP password (if authentication required)
- `MAIL_FROM`: Sender email address
- `MAIL_SMTP_AUTH`: Enable SMTP authentication (true/false)
- `MAIL_SMTP_STARTTLS`: Enable STARTTLS (true/false)
- `NOTIFICATION_PROCESSOR_INTERVAL`: Processing interval in milliseconds (default: 10000)

## Usage Example

```java
@Service
public class UserService {
    
    private final NotificationService notificationService;
    
    public void registerUser(User user) {
        // ... user registration logic ...
        
        // Send welcome email
        Map<String, Object> variables = Map.of(
            "name", user.getName(),
            "message", "Thank you for registering with us!"
        );
        
        notificationService.createNotification(
            user.getOrgId(),
            NotificationType.EMAIL,
            user.getEmail(),
            "Welcome to Our Platform",
            "welcome-email",
            variables
        );
    }
}
```

## Development Setup

### For Local Development (MailHog)
Use MailHog for local email testing:
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Access MailHog UI at: http://localhost:8025

Configuration:
```yaml
spring:
  mail:
    host: localhost
    port: 1025
```

### Template Directory Setup
Create the templates directory:
```bash
mkdir -p backend/src/main/resources/templates
```

Add your HTML templates with `.html` extension.

## Extending the System

### Adding a New Provider (e.g., SMS)

1. Create provider implementation:
```java
@Component
public class TwilioSmsProvider implements SmsProvider {
    @Override
    public void send(NotificationEntity notification) throws Exception {
        // Implement SMS sending logic
    }
}
```

2. Register in NotificationService:
```java
this.providerMap = Map.of(
    NotificationType.EMAIL, emailProvider,
    NotificationType.SMS, smsProvider
);
```

## Database Schema

The notification table is created via Flyway migration V6__Add_notification_system.sql:
- Stores all notification records
- Indexed on org_id, status, type, and created_at
- Uses JSONB for flexible variable storage
- Supports retry logic with retry_count field

## Features

- **Async Processing**: Notifications are processed asynchronously via scheduled tasks
- **Retry Logic**: Failed notifications are automatically retried up to max_retries times
- **Template Support**: HTML email templates using Thymeleaf
- **Multi-tenant**: Supports org_id for multi-tenant applications
- **Provider Abstraction**: Easy to add new notification channels
- **Fallback Content**: Generates fallback HTML if template rendering fails
- **Status Tracking**: Track notification lifecycle (PENDING → SENT/FAILED)
- **Error Logging**: Detailed error messages stored for debugging
