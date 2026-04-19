# Email Template Examples

## Setup

Create the templates directory:
```bash
mkdir -p backend/src/main/resources/templates
```

## Template: welcome-email.html

Save as: `backend/src/main/resources/templates/welcome-email.html`

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome!</h1>
    </div>
    <div class="content">
        <p>Hello <span th:text="${name}">User</span>,</p>
        <p th:text="${message}">Thank you for joining us!</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
    </div>
</body>
</html>
```

**Variables:**
- `name`: User's name
- `message`: Welcome message

**Usage:**
```java
Map<String, Object> variables = Map.of(
    "name", "John Doe",
    "message", "Welcome to our platform!"
);

notificationService.createNotification(
    orgId,
    NotificationType.EMAIL,
    "user@example.com",
    "Welcome to Our Platform",
    "welcome-email",
    variables
);
```

## Template: password-reset.html

Save as: `backend/src/main/resources/templates/password-reset.html`

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 5px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .warning {
            color: #856404;
            background-color: #fff3cd;
            padding: 10px;
            border-radius: 4px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello <span th:text="${name}">User</span>,</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a th:href="${resetLink}" href="#" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p th:text="${resetLink}">https://example.com/reset?token=xxx</p>
        <div class="warning">
            <strong>Note:</strong> This link will expire in <span th:text="${expiryHours}">24</span> hours.
            If you didn't request this, please ignore this email.
        </div>
    </div>
</body>
</html>
```

**Variables:**
- `name`: User's name
- `resetLink`: Password reset URL
- `expiryHours`: Link expiry duration

## Template: appointment-reminder.html

Save as: `backend/src/main/resources/templates/appointment-reminder.html`

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Reminder</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .card {
            background-color: #ffffff;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .detail {
            margin: 10px 0;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
        .highlight {
            background-color: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h2>Appointment Reminder</h2>
    <p>Hello <span th:text="${clientName}">Client</span>,</p>
    <p>This is a reminder about your upcoming appointment:</p>
    
    <div class="card">
        <div class="detail">
            <span class="label">Date:</span>
            <span th:text="${appointmentDate}">January 1, 2024</span>
        </div>
        <div class="detail">
            <span class="label">Time:</span>
            <span th:text="${appointmentTime}">10:00 AM</span>
        </div>
        <div class="detail">
            <span class="label">Location:</span>
            <span th:text="${location}">Office Location</span>
        </div>
        <div class="detail" th:if="${notes}">
            <span class="label">Notes:</span>
            <span th:text="${notes}">-</span>
        </div>
    </div>
    
    <div class="highlight">
        <strong>Important:</strong> Please arrive 10 minutes early.
        If you need to reschedule, please contact us at least 24 hours in advance.
    </div>
</body>
</html>
```

**Variables:**
- `clientName`: Client's name
- `appointmentDate`: Date of appointment
- `appointmentTime`: Time of appointment
- `location`: Appointment location
- `notes`: Optional notes

## Template: notification-generic.html

Save as: `backend/src/main/resources/templates/notification-generic.html`

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="content">
        <h2 th:text="${title}">Notification</h2>
        <p th:text="${message}">Your notification message here</p>
    </div>
</body>
</html>
```

**Variables:**
- `title`: Notification title
- `message`: Notification message

## Thymeleaf Features

### Conditional Rendering
```html
<div th:if="${variable}">
    Content shown only if variable exists
</div>

<div th:unless="${variable}">
    Content shown only if variable doesn't exist
</div>
```

### Loops
```html
<ul>
    <li th:each="item : ${items}" th:text="${item}">Item</li>
</ul>
```

### Date Formatting
```html
<span th:text="${#dates.format(date, 'dd/MM/yyyy')}">01/01/2024</span>
```

### Number Formatting
```html
<span th:text="${#numbers.formatDecimal(amount, 1, 2)}">100.00</span>
```

### URL Building
```html
<a th:href="@{/reset(token=${token})}">Reset Password</a>
```
