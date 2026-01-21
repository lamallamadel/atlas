# Automated Activity Timeline Event Generation Implementation

## Overview

This implementation adds automated activity timeline event generation for critical state changes across the backend services. Activities are now automatically logged with standardized JSON metadata for better tracking and auditing.

## Changes Summary

### 1. ActivityType Enum Extension
**File:** `backend/src/main/java/com/example/backend/entity/enums/ActivityType.java`

Added new activity types:
- `APPOINTMENT_SCHEDULED` - Logged when an appointment is created or updated to SCHEDULED status
- `APPOINTMENT_COMPLETED` - Logged when an appointment is marked as COMPLETED
- `CONSENT_GRANTED` - Logged when consent is granted
- `CONSENT_REVOKED` - Logged when previously granted consent is revoked

### 2. ActivityEntity Schema Changes
**Files:**
- `backend/src/main/java/com/example/backend/entity/ActivityEntity.java`
- `backend/src/main/resources/db/migration/V29__Add_activity_metadata_and_new_types.sql`

Added `metadata` field (JSONB column) to store standardized JSON metadata for each activity event.

### 3. DTO Updates
**Files Modified:**
- `backend/src/main/java/com/example/backend/dto/ActivityResponse.java`
- `backend/src/main/java/com/example/backend/dto/ActivityCreateRequest.java`
- `backend/src/main/java/com/example/backend/dto/ActivityUpdateRequest.java`
- `backend/src/main/java/com/example/backend/dto/ActivityMapper.java`

All DTOs now support the `metadata` field for JSON metadata.

### 4. ActivityService Enhancements
**File:** `backend/src/main/java/com/example/backend/service/ActivityService.java`

- Enhanced `logActivity` method to accept and store metadata
- Added overloaded method accepting `ActivityType` enum directly
- Updated create/update methods to handle metadata field

### 5. DossierStatusTransitionService Integration
**File:** `backend/src/main/java/com/example/backend/service/DossierStatusTransitionService.java`

**Activity Type:** `STATUS_CHANGE`

**Metadata Format:**
```json
{
  "fromStatus": "NEW",
  "toStatus": "QUALIFYING",
  "userId": "user@example.com",
  "reason": "Client ready for qualification",
  "timestamp": "2024-01-15T10:30:00"
}
```

**Trigger:** Called automatically in `recordTransition()` method after status history is saved.

### 6. OutboundJobWorker Integration
**File:** `backend/src/main/java/com/example/backend/service/OutboundJobWorker.java`

#### MESSAGE_SENT Event
**Metadata Format:**
```json
{
  "outboundMessageId": 123,
  "channel": "EMAIL",
  "to": "client@example.com",
  "status": "SENT",
  "providerMessageId": "msg_abc123",
  "attemptCount": 1,
  "templateCode": "welcome_email",
  "timestamp": "2024-01-15T10:30:00"
}
```

#### MESSAGE_FAILED Event
**Metadata Format:**
```json
{
  "outboundMessageId": 123,
  "channel": "EMAIL",
  "to": "client@example.com",
  "status": "FAILED",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "errorMessage": "Rate limit exceeded, retry later",
  "reason": "max attempts reached",
  "attemptCount": 5,
  "maxAttempts": 5,
  "templateCode": "welcome_email",
  "timestamp": "2024-01-15T10:35:00"
}
```

**Triggers:** 
- `logMessageSentActivity()` - Called in `handleSuccess()` after message is successfully sent
- `logMessageFailedActivity()` - Called in `handleFailure()` when message permanently fails

### 7. AppointmentService Integration
**File:** `backend/src/main/java/com/example/backend/service/AppointmentService.java`

#### APPOINTMENT_SCHEDULED Event
**Metadata Format:**
```json
{
  "appointmentId": 456,
  "status": "SCHEDULED",
  "startTime": "2024-01-20T14:00:00",
  "endTime": "2024-01-20T15:00:00",
  "location": "123 Main Street, Office 5",
  "assignedTo": "agent@example.com",
  "timestamp": "2024-01-15T10:30:00"
}
```

#### APPOINTMENT_COMPLETED Event
**Metadata Format:**
```json
{
  "appointmentId": 456,
  "status": "COMPLETED",
  "startTime": "2024-01-20T14:00:00",
  "endTime": "2024-01-20T15:00:00",
  "location": "123 Main Street, Office 5",
  "assignedTo": "agent@example.com",
  "notes": "Client signed the contract",
  "timestamp": "2024-01-20T15:05:00"
}
```

**Triggers:**
- `logAppointmentScheduledActivity()` - Called in `create()` when status is SCHEDULED, and in `update()` when status changes to SCHEDULED
- `logAppointmentCompletedActivity()` - Called in `update()` when status changes to COMPLETED

### 8. ConsentementService Integration
**File:** `backend/src/main/java/com/example/backend/service/ConsentementService.java`

#### CONSENT_GRANTED Event
**Metadata Format:**
```json
{
  "consentementId": 789,
  "channel": "EMAIL",
  "consentType": "MARKETING",
  "status": "GRANTED",
  "consentMeta": {
    "previousStatus": null,
    "changedBy": "org_123",
    "changedAt": "2024-01-15T10:30:00"
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

#### CONSENT_REVOKED Event
**Metadata Format:**
```json
{
  "consentementId": 789,
  "channel": "EMAIL",
  "consentType": "MARKETING",
  "status": "REVOKED",
  "previousStatus": "GRANTED",
  "consentMeta": {
    "previousStatus": "GRANTED",
    "changedBy": "org_123",
    "changedAt": "2024-01-15T11:00:00"
  },
  "timestamp": "2024-01-15T11:00:00"
}
```

**Triggers:**
- `logConsentGrantedActivity()` - Called in `create()` when status is GRANTED, and in `update()` when status changes to GRANTED
- `logConsentRevokedActivity()` - Called in `update()` when status changes from GRANTED to REVOKED

## Database Migration

**File:** `backend/src/main/resources/db/migration/V29__Add_activity_metadata_and_new_types.sql`

The migration:
1. Adds `metadata` JSONB column to the `activity` table
2. Creates a GIN index on the metadata column for efficient JSON queries
3. Adds documentation comment explaining metadata structure for each activity type

## Error Handling

All activity logging is wrapped in try-catch blocks to ensure that failures in activity logging do not break the main business logic flow. Errors are logged as warnings using SLF4J.

## Testing Considerations

When testing:
1. Verify that activities are created automatically for each event type
2. Check that metadata is properly structured and contains all expected fields
3. Ensure that failures in activity logging don't affect core functionality
4. Validate that the metadata JSON is queryable via the GIN index

## Future Enhancements

Possible improvements:
1. Add activity search/filter by metadata fields
2. Implement activity aggregation/statistics based on metadata
3. Add webhooks to notify external systems of critical activities
4. Create activity reports/dashboards using metadata
