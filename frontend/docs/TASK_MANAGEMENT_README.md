# Task Management System

## Overview

The Task Management system provides a complete solution for creating, managing, and tracking tasks within the application. It includes list and calendar views, filtering capabilities, and priority-based organization.

## Features

### 1. Task List Component (`task-list.component.ts`)

Main container component that manages the task collection and provides:

- **View Modes:**
  - List view: Grid layout with task cards
  - Calendar view: FullCalendar integration showing tasks by due date

- **Filters:**
  - **Assignment Filter:**
    - All Tasks: Show all tasks in the system
    - Assigned to Me: Show only tasks assigned to current user
  
  - **Status Filter:**
    - All: Show all tasks
    - Overdue: Tasks past due date (not completed)
    - Upcoming: Tasks with future due dates (not completed)
    - Completed: Tasks marked as complete

- **Actions:**
  - Create new task
  - Edit existing task
  - Delete task
  - Mark task as complete/incomplete

### 2. Task Card Component (`task-card.component.ts`)

Individual task display with:

- **Visual Elements:**
  - Title with completion checkbox
  - Priority badge (High/Medium/Low) with color coding:
    - High: Red (#e74c3c)
    - Medium: Orange (#f39c12)
    - Low: Green (#27ae60)
  - Due date with intelligent labels:
    - "Overdue by X days" (red, with pulse animation)
    - "Due today"
    - "Due tomorrow"
    - "Due in X days"
    - Warning icon for approaching deadlines (within 3 days)
  - Assigned user
  - Completion timestamp (when completed)

- **Animations:**
  - Overdue tasks: Red border with pulse animation
  - Warning icon: Blinking animation for approaching deadlines
  - Hover effect: Slight elevation and shadow

- **Actions:**
  - Edit task (opens form dialog)
  - Delete task (with confirmation)
  - Toggle completion status

### 3. Task Form Dialog Component (`task-form-dialog.component.ts`)

Reactive form for creating/editing tasks:

- **Fields:**
  - Title (required, max 200 characters)
  - Description (optional, max 1000 characters with character counter)
  - Assigned To (dropdown from user list)
  - Due Date (date picker)
  - Priority (dropdown: High/Medium/Low)

- **Validation:**
  - Required field validation
  - Max length validation
  - Real-time error messages

- **Modes:**
  - Create mode: Empty form
  - Edit mode: Pre-populated with task data

### 4. Task API Service (`task-api.service.ts`)

Service layer for backend communication:

- **Endpoints:**
  - `GET /api/v1/tasks` - List tasks with filtering
  - `GET /api/v1/tasks/:id` - Get task details
  - `POST /api/v1/tasks` - Create new task
  - `PATCH /api/v1/tasks/:id` - Update task
  - `DELETE /api/v1/tasks/:id` - Delete task
  - `POST /api/v1/tasks/:id/complete` - Mark as complete
  - `POST /api/v1/tasks/:id/uncomplete` - Mark as incomplete
  - `GET /api/v1/users` - Get user list for assignment

- **Models:**
  - `TaskResponse`: Full task object
  - `TaskCreateRequest`: Create payload
  - `TaskUpdateRequest`: Update payload (partial)
  - `TaskListParams`: Query parameters
  - `User`: User object for assignments

- **Enums:**
  - `TaskPriority`: LOW, MEDIUM, HIGH
  - `TaskStatus`: PENDING, IN_PROGRESS, COMPLETED

## Calendar Integration

Uses FullCalendar library (`@fullcalendar/angular`) with:

- **Plugins:**
  - `dayGridPlugin`: Month and week views
  - `interactionPlugin`: Click and drag interactions

- **Features:**
  - Click event to edit task
  - Click date to create task with pre-set due date
  - Color coding by priority and status:
    - Completed: Green (#4caf50)
    - Overdue: Dark red (#c0392b)
    - High priority: Red (#e74c3c)
    - Medium priority: Orange (#f39c12)
    - Low priority: Green (#27ae60)

## Styling

### Priority Badges
```css
.priority-high: Red background with red border
.priority-medium: Orange background with orange border
.priority-low: Green background with green border
```

### Overdue Tasks
```css
- Red left border (4px)
- Pulse animation (box-shadow)
- Red text for due date
```

### Approaching Deadlines
```css
- Orange text for due date
- Blinking warning icon
```

### Completed Tasks
```css
- Reduced opacity (0.7)
- Gray background
- Strikethrough text for title
```

## Responsive Design

- **Desktop (>768px):**
  - Grid layout with auto-fill columns
  - Side-by-side toolbar filters

- **Tablet (599-768px):**
  - Single column task cards
  - Stacked toolbar filters

- **Mobile (<599px):**
  - Full-width cards
  - Stacked filters and controls
  - Bottom-aligned action buttons

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators (2px solid primary color)
- Screen reader announcements for status changes
- Minimum touch target size (40x40px)
- High contrast color schemes

## Navigation

Task Management is accessible via:
- Route: `/tasks`
- Side navigation menu: "Tâches" with task icon
- Protected by AuthGuard

## Dependencies

### Required npm packages:
```json
{
  "@fullcalendar/angular": "^6.1.9",
  "@fullcalendar/core": "^6.1.9",
  "@fullcalendar/daygrid": "^6.1.9",
  "@fullcalendar/interaction": "^6.1.9"
}
```

### Angular Material modules:
- MatCardModule
- MatCheckboxModule
- MatButtonModule
- MatIconModule
- MatDialogModule
- MatFormFieldModule
- MatInputModule
- MatSelectModule
- MatDatepickerModule
- MatNativeDateModule
- MatButtonToggleModule
- MatProgressSpinnerModule
- MatSnackBarModule

## Usage Example

```typescript
// Navigate to tasks page
this.router.navigate(['/tasks']);

// Create task programmatically
const task: TaskCreateRequest = {
  title: 'Complete project documentation',
  description: 'Write comprehensive README files',
  assignedTo: 'user-123',
  dueDate: '2024-12-31',
  priority: TaskPriority.HIGH
};

this.taskApiService.create(task).subscribe(
  (createdTask) => console.log('Task created:', createdTask)
);

// Filter tasks
const params: TaskListParams = {
  status: TaskStatus.PENDING,
  priority: TaskPriority.HIGH,
  assignedTo: currentUserId
};

this.taskApiService.list(params).subscribe(
  (page) => console.log('Tasks:', page.content)
);
```

## Backend Requirements

The backend should implement the following API endpoints:

1. **GET /api/v1/tasks**
   - Query params: status, priority, assignedTo, dueDateFrom, dueDateTo, page, size, sort
   - Returns: Page<TaskResponse>

2. **POST /api/v1/tasks**
   - Body: TaskCreateRequest
   - Returns: TaskResponse

3. **PATCH /api/v1/tasks/:id**
   - Body: TaskUpdateRequest
   - Returns: TaskResponse

4. **DELETE /api/v1/tasks/:id**
   - Returns: 204 No Content

5. **POST /api/v1/tasks/:id/complete**
   - Returns: TaskResponse (with completedAt timestamp)

6. **POST /api/v1/tasks/:id/uncomplete**
   - Returns: TaskResponse (with completedAt cleared)

7. **GET /api/v1/users**
   - Returns: User[] (for assignment dropdown)

## Future Enhancements

- Task comments/notes
- Task attachments
- Recurring tasks
- Task dependencies
- Bulk operations (complete multiple, reassign)
- Task templates
- Email notifications for due dates
- Time tracking
- Subtasks
- Task history/audit log
