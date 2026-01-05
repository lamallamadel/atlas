# Activity Timeline and Notes System Implementation

## Overview
Implemented a comprehensive activity timeline and notes system for tracking dossier activities with rich text support.

## Backend Implementation

### 1. Database Schema
**Migration:** `V9__Add_activity_timeline.sql`
- Created `activity` table with fields:
  - `id`: Primary key
  - `org_id`: Organization identifier
  - `type`: Activity type (NOTE, STATUS_CHANGE, APPOINTMENT_CREATED, MESSAGE_SENT)
  - `content`: Rich text content
  - `dossier_id`: Foreign key to dossier
  - `visibility`: INTERNAL or CLIENT_VISIBLE
  - `created_at`: Timestamp
  - `created_by`: User identifier
- Added indexes for performance optimization

### 2. Entity Layer
**Files Created:**
- `ActivityEntity.java`: JPA entity with multi-tenancy support
- `ActivityType.java`: Enum for activity types
- `ActivityVisibility.java`: Enum for visibility levels

### 3. Repository Layer
**File:** `ActivityRepository.java`
- Query methods for filtering by:
  - Dossier ID
  - Visibility
  - Date range (startDate, endDate)
- Supports pagination and sorting

### 4. Service Layer
**File:** `ActivityService.java`
- `create()`: Create new activity with org-id validation
- `getById()`: Retrieve single activity
- `list()`: List activities with filtering options
- `update()`: Update activity content/visibility
- `delete()`: Delete activity (soft delete support)
- Automatic user tracking via Spring Security context

### 5. DTO Layer
**Files Created:**
- `ActivityResponse.java`: Response DTO
- `ActivityCreateRequest.java`: Create request with validation
- `ActivityUpdateRequest.java`: Update request
- `ActivityMapper.java`: Entity-DTO mapper

### 6. Controller Layer
**File:** `ActivityController.java`
**Endpoints:**
- `POST /api/v1/activities` - Create activity
- `GET /api/v1/activities/{id}` - Get by ID
- `GET /api/v1/activities` - List with filters
  - Query params: dossierId, visibility, startDate, endDate, page, size, sort
- `PUT /api/v1/activities/{id}` - Update activity
- `DELETE /api/v1/activities/{id}` - Delete activity
- All endpoints protected with `@PreAuthorize` for ADMIN/PRO roles
- Swagger/OpenAPI documentation included

## Frontend Implementation

### 1. Service Layer
**File:** `activity-api.service.ts`
- Angular service for HTTP communication
- Type-safe interfaces for:
  - ActivityType enum
  - ActivityVisibility enum
  - ActivityResponse
  - ActivityCreateRequest
  - ActivityUpdateRequest
  - Page<T> interface
- CRUD methods with RxJS Observables

### 2. Component Layer
**File:** `activity-timeline.component.ts`
**Features:**
- Display chronological activity feed
- Rich text editor for notes with formatting toolbar
- Expandable/collapsible long notes (truncate at 200 chars)
- Visibility toggle (Internal/Client-visible)
- Delete functionality for notes
- Real-time updates
- Loading states and error handling

**Methods:**
- `loadActivities()`: Fetch activities from API
- `saveNote()`: Create new note with rich text
- `deleteActivity()`: Delete with confirmation dialog
- `toggleExpanded()`: Expand/collapse long content
- `formatText()`: Rich text formatting (bold, italic, underline, lists)
- Helper methods for labels, badges, and formatting

### 3. Template
**File:** `activity-timeline.component.html`
**Sections:**
1. **Header**: Title and "Add Note" button
2. **Note Form**: 
   - Rich text editor with formatting toolbar
   - Visibility selector
   - Save/Cancel actions
3. **Timeline Display**:
   - Vertical timeline with markers
   - Activity cards with type icons
   - Expandable content for long notes
   - Delete button for notes
   - Empty state when no activities

### 4. Styling
**File:** `activity-timeline.component.css`
**Features:**
- Timeline vertical line design
- Color-coded activity type markers:
  - Blue (NOTE)
  - Orange (STATUS_CHANGE)
  - Green (APPOINTMENT_CREATED)
  - Purple (MESSAGE_SENT)
- Rich text editor toolbar styling
- Visibility badges (Internal vs Client-visible)
- Responsive card layout
- Loading and empty states

### 5. Integration
**Updated Files:**
- `dossier-detail.component.html`: Added "Chronologie" tab with `<app-activity-timeline>`
- `app.module.ts`: Declared ActivityTimelineComponent

### 6. Testing
**Files Created:**
- `activity-timeline.component.spec.ts`: Component unit tests
- `activity-api.service.spec.ts`: Service unit tests

## Rich Text Editor

Implemented a lightweight rich text editor using native browser APIs:
- **Formatting Options:**
  - Bold
  - Italic
  - Underline
  - Bullet lists
  - Numbered lists
- **Implementation:**
  - ContentEditable div with custom toolbar
  - `document.execCommand()` for formatting
  - HTML content storage
  - Placeholder text support
  - Disabled state for saving

## Features

### Activity Types
1. **NOTE**: Manual notes with rich text
2. **STATUS_CHANGE**: Automatic on dossier status change
3. **APPOINTMENT_CREATED**: Automatic on appointment creation
4. **MESSAGE_SENT**: Automatic on message sent

### Visibility Levels
- **INTERNAL**: Only visible to internal users
- **CLIENT_VISIBLE**: Can be shared with clients

### Filtering Options
- By dossier ID
- By visibility level
- By date range (start/end dates)
- Pagination support
- Sortable by any field

### Security
- Multi-tenant isolation via org_id
- Role-based access control (ADMIN, PRO)
- Input validation
- XSS protection for rich text content

## Usage

### Backend API Examples

```bash
# Create a note
POST /api/v1/activities
{
  "type": "NOTE",
  "content": "<p>Client called to confirm <b>appointment</b></p>",
  "dossierId": 1,
  "visibility": "INTERNAL"
}

# List activities for a dossier
GET /api/v1/activities?dossierId=1&page=0&size=20&sort=createdAt,desc

# Filter by visibility
GET /api/v1/activities?dossierId=1&visibility=INTERNAL

# Filter by date range
GET /api/v1/activities?dossierId=1&startDate=2024-01-01T00:00:00&endDate=2024-12-31T23:59:59
```

### Frontend Usage

```typescript
// In dossier detail component template
<app-activity-timeline [dossierId]="dossier.id"></app-activity-timeline>
```

## Database Indexes
Created for optimal query performance:
- `idx_activity_org_id`: Organization filtering
- `idx_activity_dossier_id`: Dossier filtering
- `idx_activity_created_at`: Date sorting
- `idx_activity_type`: Type filtering
- `idx_activity_visibility`: Visibility filtering

## Future Enhancements (Not Implemented)
- Advanced rich text features (headings, links, images)
- Activity attachments
- @mentions for user notifications
- Activity templates
- Export activities to PDF
- Email notifications for client-visible activities
- Activity search/full-text search
- Activity categories/tags
- Bulk operations
