# Appointment Reminder Multi-Channel Fallback

## Overview

This feature enhances the `AppointmentReminderScheduler` with configurable reminder templates and multi-channel fallback capabilities. The system now supports:

1. **Configurable reminder channels per appointment** (default: WHATSAPP → SMS → EMAIL)
2. **Template-based messages with variable interpolation**
3. **Automatic fallback when consent validation fails or previous attempts fail**
4. **Activity timeline logging for all fallback events**

## Database Schema Changes

### Migration V134: Add Reminder Configuration Fields

```sql
-- Add reminder_channels JSON array with default fallback order
ALTER TABLE appointment ADD COLUMN reminder_channels ${json_type} 
    DEFAULT '["WHATSAPP","SMS","EMAIL"]'::${json_type};

-- Add template_code for linking to WhatsApp templates
ALTER TABLE appointment ADD COLUMN template_code VARCHAR(255);

-- Index for template lookups
CREATE INDEX idx_appointment_template_code ON appointment(template_code);
```

### Migration V135: Seed Default Template

Seeds the `appointment_reminder` template with support for these variables:
- `{{clientName}}` - Client's name
- `{{dateStr}}` - Appointment date (dd/MM/yyyy)
- `{{timeStr}}` - Appointment time (HH:mm)
- `{{location}}` - Appointment location
- `{{agentName}}` - Agent's name

## Component Architecture

### 1. TemplateInterpolationService

**Purpose**: Handles template variable interpolation for reminder messages.

**Key Methods**:
- `interpolateTemplate(templateCode, variables)` - Fetches template and interpolates variables
- `interpolateString(template, variables)` - String-level interpolation with `{{variable}}` syntax
- `validateRequiredVariables(templateCode, providedVariables)` - Validates all required variables are provided

**Example**:
```java
Map<String, String> vars = Map.of(
    "clientName", "M. Dupont",
    "dateStr", "15/12/2024",
    "timeStr", "14:30",
    "location", "123 Rue de la Paix",
    "agentName", "Jean Martin"
);

String message = templateInterpolationService.interpolateTemplate("appointment_reminder", vars);
// Result: "Bonjour M. Dupont, nous vous rappelons votre rendez-vous prévu le 15/12/2024 à 14:30..."
```

### 2. AppointmentReminderScheduler (Enhanced)

**New Method**: `sendReminderWithFallback(AppointmentEntity appointment)`

**Fallback Logic**:
1. Retrieves `reminderChannels` from appointment (or uses default: WHATSAPP, SMS, EMAIL)
2. Builds template variables from appointment data
3. Iterates through channels in order:
   - Validates recipient contact info exists for channel
   - Attempts to queue message via `OutboundMessageService`
   - If consent validation fails → tries next channel
   - If any error occurs → tries next channel
4. Logs all fallback events to activity timeline
5. Marks `reminderSent = true` if any channel succeeds

**Activity Logging**:
- **MESSAGE_FAILED**: When a channel fails (with reason)
- **MESSAGE_SENT**: When a channel succeeds (with previous failure details if applicable)
- **MESSAGE_FAILED**: When all channels fail (with complete failure summary)

## API Changes

### AppointmentCreateRequest / AppointmentUpdateRequest

**New Fields**:
```java
private List<String> reminderChannels;  // e.g., ["WHATSAPP", "SMS", "EMAIL"]
private String templateCode;             // e.g., "appointment_reminder"
```

### AppointmentResponse

**New Fields**:
```java
private List<String> reminderChannels;
private String templateCode;
```

## Usage Examples

### 1. Create Appointment with Custom Reminder Channels

```json
POST /api/appointments
{
  "dossierId": 123,
  "startTime": "2024-12-15T14:30:00",
  "endTime": "2024-12-15T15:30:00",
  "location": "123 Rue de la Paix, Paris",
  "assignedTo": "Jean Martin",
  "reminderChannels": ["SMS", "EMAIL"],
  "templateCode": "appointment_reminder"
}
```

### 2. Update Reminder Configuration

```json
PATCH /api/appointments/456
{
  "reminderChannels": ["WHATSAPP", "SMS"],
  "templateCode": "appointment_reminder_vip"
}
```

### 3. Default Behavior (No Configuration)

If `reminderChannels` is not specified:
- Uses default: `["WHATSAPP", "SMS", "EMAIL"]`

If `templateCode` is not specified:
- Uses default: `"appointment_reminder"`

## Fallback Scenarios

### Scenario 1: WhatsApp Consent Missing → SMS Success

**Timeline**:
1. **14:15** - Scheduler processes appointment
2. **14:15:01** - Attempts WHATSAPP → Consent validation fails
3. **14:15:01** - Logs `MESSAGE_FAILED` activity: "Consent validation failed"
4. **14:15:02** - Attempts SMS → Success
5. **14:15:02** - Logs `MESSAGE_SENT` activity: "Reminder sent via SMS after 1 failed attempt"

**Activity Metadata**:
```json
{
  "appointmentId": 123,
  "successChannel": "SMS",
  "attemptedChannels": ["WHATSAPP", "SMS"],
  "previousFailures": [
    "Consent validation failed: No consent found for channel WHATSAPP"
  ]
}
```

### Scenario 2: All Channels Fail

**Timeline**:
1. **14:15** - Scheduler processes appointment
2. **14:15:01** - Attempts WHATSAPP → No phone number
3. **14:15:01** - Attempts SMS → No phone number
4. **14:15:02** - Attempts EMAIL → No email address
5. **14:15:02** - Logs `MESSAGE_FAILED` activity: "Failed on all channels"

**Activity Metadata**:
```json
{
  "appointmentId": 123,
  "attemptedChannels": ["WHATSAPP", "SMS", "EMAIL"],
  "failureReasons": [
    "No contact info for channel WHATSAPP",
    "No contact info for channel SMS",
    "No contact info for channel EMAIL"
  ]
}
```

## Template Management

### Creating Custom Templates

Administrators can create custom templates via the WhatsApp Template API:

```json
POST /api/whatsapp/templates
{
  "name": "appointment_reminder_vip",
  "language": "fr",
  "category": "TRANSACTIONAL",
  "components": [
    {
      "type": "BODY",
      "text": "Cher {{clientName}}, votre rendez-vous VIP est prévu le {{dateStr}} à {{timeStr}}. Rendez-vous à {{location}} avec {{agentName}}."
    }
  ],
  "variables": [
    {"variableName": "clientName", "componentType": "BODY", "position": 1, "isRequired": true},
    {"variableName": "dateStr", "componentType": "BODY", "position": 2, "isRequired": true},
    {"variableName": "timeStr", "componentType": "BODY", "position": 3, "isRequired": true},
    {"variableName": "location", "componentType": "BODY", "position": 4, "isRequired": true},
    {"variableName": "agentName", "componentType": "BODY", "position": 5, "isRequired": true}
  ]
}
```

## Configuration

### Application Properties

```yaml
appointment:
  reminder:
    enabled: true                           # Enable/disable reminder scheduler
    hours-ahead: 24                         # Send reminders 24 hours before appointment
    cron: "0 0/15 * * * ?"                 # Run every 15 minutes
```

## Testing Considerations

### Unit Tests Should Cover:
1. Template interpolation with all variables
2. Template interpolation with missing variables (should keep placeholder)
3. Fallback logic through all channels
4. Activity logging for each scenario
5. Consent validation failures triggering fallback
6. Contact info missing triggering fallback

### Integration Tests Should Cover:
1. End-to-end reminder sending with actual consent records
2. Multi-channel fallback with real outbound message queueing
3. Activity timeline verification
4. Template loading and interpolation

## Monitoring & Observability

**Key Metrics to Track**:
- Reminder success rate by channel
- Fallback rate (% of reminders requiring fallback)
- Average channels attempted per reminder
- Template interpolation errors

**Recommended Alerts**:
- Alert when all channels fail for 3+ consecutive appointments
- Alert when template interpolation fails repeatedly
- Alert when default template is missing

## Security Considerations

1. **Consent Validation**: Each channel is validated independently for consent
2. **Data Protection**: Template variables contain PII - ensure proper logging controls
3. **Template Access**: Only authorized users should create/modify templates
4. **Channel Preference**: Respects user's preferred communication channels via fallback order

## Future Enhancements

1. **Dynamic Channel Selection**: Use ML to predict best channel based on past engagement
2. **A/B Testing**: Test different template versions and channel orders
3. **Time-of-Day Optimization**: Send reminders at optimal times per channel
4. **Delivery Confirmation**: Track which channel actually delivered/was read
5. **Multi-Language Support**: Automatically select template based on client's language preference
