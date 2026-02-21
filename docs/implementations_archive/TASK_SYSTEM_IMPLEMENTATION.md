# Task/Reminder System Implementation

This document describes the complete implementation of the task/reminder system for the backend application.

## Overview

The task/reminder system provides comprehensive task management capabilities with:
- Task CRUD operations
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Status tracking (TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- Due date tracking and overdue detection
- Automated reminder notifications for overdue tasks
- Full audit trail for task completion
- Organization-level multi-tenancy support

## Components Implemented

### 1. Enums

#### TaskPriority
- **Location**: `backend/src/main/java/com/example/backend/entity/enums/TaskPriority.java`
- **Values**: LOW, MEDIUM, HIGH, URGENT

#### TaskStatus
- **Location**: `backend/src/main/java/com/example/backend/entity/enums/TaskStatus.java`
- **Values**: TODO, IN_PROGRESS, COMPLETED, CANCELLED

### 2. Entity

#### TaskEntity
- **Location**: `backend/src/main/java/com/example/backend/entity/TaskEntity.java`
- **Fields**:
  - `id`: Primary key (BIGSERIAL)
  - `orgId`: Organization ID (required, multi-tenant support)
  - `dossierId`: Optional link to dossier (CASCADE DELETE on dossier deletion)
  - `assignedTo`: User assigned to the task (VARCHAR 255)
  - `title`: Task title (required, VARCHAR 500)
  - `description`: Detailed task description (TEXT)
  - `dueDate`: Optional due date (TIMESTAMP)
  - `priority`: Task priority (required, ENUM)
  - `status`: Task status (required, ENUM)
  - `completedAt`: Timestamp when task was completed
  - `createdAt`, `updatedAt`, `createdBy`, `updatedBy`: Audit fields from BaseEntity

### 3. Repository

#### TaskRepository
- **Location**: `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
- **Methods**:
  - `findOverdueTasks(assignedTo, currentDate)`: Finds overdue tasks for a specific user
  - `findAllOverdueTasksForOrg(orgId, currentDate)`: Finds all overdue tasks for an organization
- **Features**:
  - Extends JpaRepository and JpaSpecificationExecutor for advanced querying
  - Custom JPQL queries for efficient overdue task detection

### 4. DTOs

#### TaskCreateRequest
- **Location**: `backend/src/main/java/com/example/backend/dto/TaskCreateRequest.java`
- **Validations**:
  - Title: required, max 500 characters
  - Description: optional, max 10000 characters
  - Priority: required
  - AssignedTo: optional, max 255 characters

#### TaskUpdateRequest
- **Location**: `backend/src/main/java/com/example/backend/dto/TaskUpdateRequest.java`
- **Features**: All fields optional for partial updates

#### TaskCompleteRequest
- **Location**: `backend/src/main/java/com/example/backend/dto/TaskCompleteRequest.java`
- **Fields**: Optional completion notes (max 10000 characters)

#### TaskResponse
- **Location**: `backend/src/main/java/com/example/backend/dto/TaskResponse.java`
- **Features**:
  - Includes all task fields
  - Computed `isOverdue` boolean flag

#### TaskMapper
- **Location**: `backend/src/main/java/com/example/backend/dto/TaskMapper.java`
- **Methods**:
  - `toEntity(TaskCreateRequest)`: Converts create request to entity
  - `updateEntity(TaskEntity, TaskUpdateRequest)`: Updates entity with request data
  - `toResponse(TaskEntity)`: Converts entity to response with overdue calculation

### 5. Service Layer

#### TaskService
- **Location**: `backend/src/main/java/com/example/backend/service/TaskService.java`
- **Methods**:
  - `create(TaskCreateRequest)`: Creates a new task
  - `getById(Long)`: Retrieves a task by ID
  - `update(Long, TaskUpdateRequest)`: Updates an existing task
  - `complete(Long, TaskCompleteRequest)`: Marks a task as completed
  - `delete(Long)`: Deletes a task
  - `list(...)`: Paginated listing with filtering
  - `findOverdueTasks(String)`: Finds overdue tasks for a user
  - `findAllOverdueTasksForOrg(String)`: Finds all overdue tasks for an org
- **Features**:
  - Multi-tenant isolation via TenantContext
  - Audit logging for all operations
  - Transaction management
  - Advanced filtering with Specifications API

#### TaskReminderScheduler
- **Location**: `backend/src/main/java/com/example/backend/service/TaskReminderScheduler.java`
- **Schedule**: Daily at 9:00 AM (configurable via `task.reminder.cron`)
- **Functionality**:
  - Scans for all overdue tasks across all organizations
  - Creates NotificationEntity for each overdue task assigned to a user
  - Logs audit events for reminder notifications
  - Handles errors gracefully per task
- **Configuration**:
  - `task.reminder.enabled`: Enable/disable scheduler (default: true)
  - `task.reminder.cron`: Cron expression (default: "0 0 9 * * ?")

### 6. Controller

#### TaskController
- **Location**: `backend/src/main/java/com/example/backend/controller/TaskController.java`
- **Base Path**: `/api/v1/tasks`
- **Endpoints**:

| Method | Path | Description | Authorization |
|--------|------|-------------|---------------|
| POST | `/` | Create task | ADMIN, PRO |
| GET | `/{id}` | Get task by ID | ADMIN, PRO |
| PUT | `/{id}` | Update task | ADMIN, PRO |
| POST | `/{id}/complete` | Mark task complete | ADMIN, PRO |
| DELETE | `/{id}` | Delete task | ADMIN only |
| GET | `/` | List tasks with filters | ADMIN, PRO |

**List Endpoint Query Parameters**:
- `dossierId`: Filter by dossier ID
- `assignedTo`: Filter by assigned user
- `status`: Filter by task status
- `dueBefore`: Filter tasks due before this date
- `dueAfter`: Filter tasks due after this date
- `overdue`: Filter only overdue tasks (boolean)
- `page`: Page number (0-indexed, default: 0)
- `size`: Page size (default: 20)
- `sort`: Sort criteria (default: "dueDate,asc")

### 7. Database Migration

#### V22__Add_task_system.sql
- **Location**: `backend/src/main/resources/db/migration/V22__Add_task_system.sql`
- **Changes**:
  - Creates `task` table with all required fields
  - Foreign key to `dossier` table with CASCADE DELETE
  - Check constraints for priority and status enums
  - Comprehensive indexes:
    - `idx_task_org_id`: Organization filtering
    - `idx_task_dossier_id`: Dossier-based queries
    - `idx_task_assigned_to`: User assignment queries
    - `idx_task_due_date`: Due date sorting/filtering
    - `idx_task_status`: Status filtering
    - `idx_task_priority`: Priority filtering
    - `idx_task_assigned_to_status`: Composite index for overdue detection
    - `idx_task_due_date_status`: Composite index for overdue queries

### 8. Audit Support

#### AuditEntityType Update
- **Location**: `backend/src/main/java/com/example/backend/entity/enums/AuditEntityType.java`
- **Change**: Added `TASK("task")` enum value

All task operations (create, update, complete, delete) generate audit events automatically through the AuditEventService.

## Features

### Multi-Tenancy
- All queries automatically filtered by organization ID via TenantContext
- Organization ID enforced at entity level

### Security
- All endpoints protected with Spring Security
- Role-based access control (ADMIN, PRO)
- Delete operations restricted to ADMIN only

### Performance Optimizations
- Composite indexes on frequently queried columns (assigned_to + status, due_date + status)
- JPA Specifications for dynamic query building
- Paginated results for list operations

### Audit Trail
- All CRUD operations logged to audit_event table
- Task completion tracked with completedAt timestamp
- Completion notes captured in audit log
- Reminder notifications tracked in audit log

### Scheduled Jobs
- Automatic overdue task detection
- Daily reminder notifications at 9:00 AM (configurable)
- Graceful error handling per task
- Can be disabled via configuration

### Overdue Detection
- Real-time overdue calculation in TaskResponse
- Efficient database queries for overdue tasks
- Excludes completed and cancelled tasks from overdue status

## Usage Examples

### Create a Task
```bash
POST /api/v1/tasks
{
  "title": "Review proposal",
  "description": "Review the client proposal for accuracy",
  "priority": "HIGH",
  "dueDate": "2024-12-31T17:00:00",
  "assignedTo": "user123",
  "dossierId": 456
}
```

### Update a Task
```bash
PUT /api/v1/tasks/123
{
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

### Complete a Task
```bash
POST /api/v1/tasks/123/complete
{
  "completionNotes": "Proposal reviewed and approved"
}
```

### List Overdue Tasks
```bash
GET /api/v1/tasks?overdue=true&assignedTo=user123
```

### List Tasks by Dossier
```bash
GET /api/v1/tasks?dossierId=456&status=TODO&sort=priority,desc
```

## Configuration

Add to `application.yml` or environment variables:

```yaml
task:
  reminder:
    enabled: true  # Enable/disable reminder scheduler
    cron: "0 0 9 * * ?"  # Daily at 9:00 AM
```

Environment variables:
- `TASK_REMINDER_ENABLED`: true/false
- `TASK_REMINDER_CRON`: Cron expression

## Database Schema

```sql
CREATE TABLE task (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT,
    assigned_to VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT fk_task_dossier FOREIGN KEY (dossier_id) REFERENCES dossier(id) ON DELETE CASCADE,
    CONSTRAINT chk_task_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_task_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);
```

## Testing Recommendations

1. **Unit Tests**:
   - TaskService methods
   - TaskMapper conversions
   - Overdue detection logic

2. **Integration Tests**:
   - TaskRepository custom queries
   - TaskReminderScheduler functionality
   - Multi-tenant isolation

3. **E2E Tests**:
   - Full CRUD workflow
   - Task completion with audit trail
   - Overdue task detection
   - Reminder notification creation

4. **Security Tests**:
   - Authorization on all endpoints
   - Organization isolation
   - Role-based access control

## Implementation Complete

All components have been implemented and are ready for testing. The system provides:

✅ Complete task management CRUD operations  
✅ Priority and status tracking  
✅ Due date management and overdue detection  
✅ Automated reminder notifications  
✅ Full audit trail  
✅ Multi-tenant support  
✅ Comprehensive indexing for performance  
✅ RESTful API with Swagger documentation  
✅ Scheduled job for overdue reminders  
✅ Integration with existing notification system  

No build, lint, or test execution was performed as per instructions.
