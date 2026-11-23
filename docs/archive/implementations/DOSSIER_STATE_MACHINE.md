# Dossier Status State Machine

## Overview
The dossier workflow implements a state machine that validates status transitions and maintains a complete history of all status changes.

## Status Flow

```
NEW → QUALIFYING → QUALIFIED → APPOINTMENT → WON/LOST
 ↓         ↓           ↓            ↓
LOST      LOST        LOST         LOST
```

## Valid Transitions

### From NEW
- → QUALIFYING
- → LOST

### From QUALIFYING
- → QUALIFIED
- → LOST

### From QUALIFIED
- → APPOINTMENT
- → LOST

### From APPOINTMENT
- → WON
- → LOST

### From WON
- No transitions allowed (terminal state)

### From LOST
- No transitions allowed (terminal state)

## Implementation

### Components

1. **DossierStatus Enum** (`backend/src/main/java/com/example/backend/entity/enums/DossierStatus.java`)
   - NEW, QUALIFYING, QUALIFIED, APPOINTMENT, WON, LOST

2. **DossierStatusTransitionService** (`backend/src/main/java/com/example/backend/service/DossierStatusTransitionService.java`)
   - Validates allowed transitions
   - Records transition history
   - Checks for terminal states

3. **DossierStatusHistory Entity** (`backend/src/main/java/com/example/backend/entity/DossierStatusHistory.java`)
   - Stores: dossierId, fromStatus, toStatus, userId, reason, transitionedAt
   - Multi-tenant aware with orgId filter

4. **DossierStatusHistoryService** (`backend/src/main/java/com/example/backend/service/DossierStatusHistoryService.java`)
   - Retrieves paginated status history

5. **InvalidStatusTransitionException** (`backend/src/main/java/com/example/backend/exception/InvalidStatusTransitionException.java`)
   - Custom exception for invalid transitions
   - Returns HTTP 422 (Unprocessable Entity)

### API Endpoints

#### Update Dossier Status
```
PATCH /api/v1/dossiers/{id}/status
```
Request body:
```json
{
  "status": "QUALIFYING",
  "userId": "user123",
  "reason": "Client expressed interest"
}
```

#### Get Status History
```
GET /api/v1/dossiers/{id}/status-history?page=0&size=20&sort=transitionedAt,desc
```
Returns paginated history of status transitions.

### Database Schema

Table: `dossier_status_history`
- id (bigserial, primary key)
- org_id (varchar, not null)
- dossier_id (bigint, not null, foreign key)
- from_status (varchar)
- to_status (varchar, not null)
- user_id (varchar)
- reason (text)
- transitioned_at (timestamp, not null)

### Features

1. **Validation**: All status transitions are validated before being applied
2. **History**: Every status change is recorded with timestamp, user, and reason
3. **Terminal States**: WON and LOST are terminal - no transitions allowed from these states
4. **Multi-tenancy**: All history records are filtered by organization
5. **Pagination**: Status history endpoint supports pagination and sorting
6. **Initial State Recording**: When a dossier is created, the initial status is recorded in history

### Error Handling

- Invalid transitions throw `InvalidStatusTransitionException` (HTTP 422)
- Missing dossier returns HTTP 404
- Cross-tenant access attempts return HTTP 404
