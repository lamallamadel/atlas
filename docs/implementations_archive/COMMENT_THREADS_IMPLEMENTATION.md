# Comment Threads and Collaborative Annotations - Implementation Guide

## Overview

This document describes the implementation of a comprehensive comment threads system with collaborative annotations, user mentions with autocomplete, real-time notifications, thread resolution, full-text search, and export capabilities.

## Features

### ✅ Core Features
- **Comment Threads**: Attachable to Annonce, Dossier, and Appointment entities
- **User Mentions**: @username autocomplete with real-time suggestions
- **Real-time Notifications**: Notifications for mentions and thread participation
- **Thread Resolution**: Mark threads as resolved/unresolved
- **Full-text Search**: PostgreSQL full-text search on comment content
- **Export History**: Export threads to TXT or CSV format

## Architecture

### Backend Components

#### Database Schema (V36__Add_comment_threads.sql)

**comment_thread table:**
- `id`: Primary key
- `entity_type`: ANNONCE, DOSSIER, or APPOINTMENT
- `entity_id`: ID of the entity
- `title`: Optional thread title
- `resolved`: Boolean status
- `resolved_at`, `resolved_by`: Resolution metadata
- Multi-tenant support with `org_id`

**comment table:**
- `id`: Primary key
- `thread_id`: Foreign key to comment_thread
- `content`: Comment text
- `mentions_json`: JSONB array of mentioned usernames
- Multi-tenant support with `org_id`

**Indexes:**
- Entity lookup: `idx_comment_thread_entity`
- Full-text search: `idx_comment_content_fulltext` (PostgreSQL GIN index)
- Performance indexes on org_id, resolved status, created_at

#### Entities

**CommentThreadEntity.java:**
```java
@Entity
@Table(name = "comment_thread")
public class CommentThreadEntity extends BaseEntity {
    private CommentEntityType entityType;  // ANNONCE, DOSSIER, APPOINTMENT
    private Long entityId;
    private String title;
    private Boolean resolved;
    private LocalDateTime resolvedAt;
    private String resolvedBy;
    private List<CommentEntity> comments;
}
```

**CommentEntity.java:**
```java
@Entity
@Table(name = "comment")
public class CommentEntity extends BaseEntity {
    private CommentThreadEntity thread;
    private String content;
    private List<String> mentions;  // JSONB array
}
```

#### Service Layer

**CommentService.java:**
- `createThread()`: Create new thread with optional initial comment
- `addComment()`: Add comment to thread with mention extraction
- `resolveThread()` / `unresolveThread()`: Thread resolution management
- `searchComments()`: Full-text search using PostgreSQL
- `getThreadsForEntity()`: Get all threads for an entity
- Automatic mention notification
- Participant notification for new comments

**CommentExportService.java:**
- `exportThreadToText()`: Export single thread to formatted text
- `exportThreadToCsv()`: Export single thread to CSV
- `exportAllThreadsForEntity()`: Export all threads for an entity

**NotificationService.java** (extended):
- `createMentionNotification()`: Notify mentioned users
- `createCommentNotification()`: Notify thread participants

#### Controller

**CommentController.java:**
- `POST /api/comments/threads`: Create thread
- `POST /api/comments`: Add comment
- `GET /api/comments/threads`: Get threads for entity
- `GET /api/comments/threads/{id}`: Get single thread
- `POST /api/comments/threads/{id}/resolve`: Resolve thread
- `POST /api/comments/threads/{id}/unresolve`: Unresolve thread
- `DELETE /api/comments/threads/{id}`: Delete thread
- `GET /api/comments/search`: Full-text search
- `GET /api/comments/count/unresolved`: Count unresolved threads
- `GET /api/comments/export/threads/{id}`: Export thread
- `GET /api/comments/export/entity`: Export all threads for entity

### Frontend Components

#### Service Layer

**comment.service.ts:**
- TypeScript interfaces for CommentThread, Comment
- HTTP methods for all API endpoints
- `downloadFile()`: Helper for file downloads
- Export methods for TXT and CSV formats

#### Main Component

**CommentThreadComponent** (`comment-thread.component.ts/html/css`):

**Features:**
- Two-column layout: thread list sidebar + detail view
- Create new thread with optional title
- Add comments to threads
- User mention autocomplete (@username)
- Resolve/unresolve threads
- Delete threads (with confirmation)
- Export threads (TXT or CSV)
- Show/hide resolved threads toggle
- Unresolved count badge
- Real-time mention detection and dropdown
- Formatted comment display with highlighted mentions

**Key Methods:**
- `onCommentInput()`: Detects @ and shows user suggestions
- `selectMention()`: Inserts selected user into comment
- `extractMentions()`: Parses @username from content
- `formatComment()`: Highlights mentions in display

#### Search Component

**CommentSearchComponent** (`comment-search.component.ts/html/css`):

**Features:**
- Full-text search across all comments
- Result highlighting with `<mark>` tags
- Entity type and ID display
- Navigate to thread from results
- Responsive design

## Usage

### Backend Usage

#### Create a Thread
```java
CreateCommentThreadRequest request = new CreateCommentThreadRequest();
request.setEntityType(CommentEntityType.DOSSIER);
request.setEntityId(123L);
request.setTitle("Budget Discussion");
request.setInitialComment("We need to review the budget for @john");

CommentThreadDTO thread = commentService.createThread(request, "org1", "alice");
```

#### Add a Comment
```java
CreateCommentRequest request = new CreateCommentRequest();
request.setThreadId(threadId);
request.setContent("I agree with @alice, let's schedule a meeting");

CommentDTO comment = commentService.addComment(request, "org1", "bob");
```

#### Search Comments
```java
List<CommentSearchResult> results = commentService.searchComments("budget meeting");
```

#### Export Thread
```java
byte[] textExport = commentExportService.exportThreadToText(threadId);
byte[] csvExport = commentExportService.exportThreadToCsv(threadId);
byte[] allExport = commentExportService.exportAllThreadsForEntity(
    CommentEntityType.DOSSIER, 123L
);
```

### Frontend Usage

#### Embed in a Component
```html
<app-comment-thread 
  [entityType]="'DOSSIER'" 
  [entityId]="dossierId">
</app-comment-thread>
```

#### Search Comments
```html
<app-comment-search></app-comment-search>
```

#### Using the Service Directly
```typescript
import { CommentService, CommentEntityType } from './services/comment.service';

constructor(private commentService: CommentService) {}

loadComments() {
  this.commentService.getThreadsForEntity(CommentEntityType.DOSSIER, this.dossierId)
    .subscribe(threads => {
      this.threads = threads;
    });
}

exportThread() {
  this.commentService.exportThread(threadId, 'csv').subscribe(blob => {
    this.commentService.downloadFile(blob, 'comments.csv');
  });
}
```

## API Endpoints

### Create Thread
```http
POST /api/comments/threads
Content-Type: application/json

{
  "entityType": "DOSSIER",
  "entityId": 123,
  "title": "Budget Discussion",
  "initialComment": "Let's discuss the Q4 budget"
}
```

### Add Comment
```http
POST /api/comments
Content-Type: application/json

{
  "threadId": 456,
  "content": "I agree with @john on this point",
  "mentions": ["john"]
}
```

### Get Threads for Entity
```http
GET /api/comments/threads?entityType=DOSSIER&entityId=123
```

### Search Comments
```http
GET /api/comments/search?query=budget
```

### Resolve Thread
```http
POST /api/comments/threads/456/resolve
```

### Export Thread
```http
GET /api/comments/export/threads/456?format=csv
```

### Export All Threads for Entity
```http
GET /api/comments/export/entity?entityType=DOSSIER&entityId=123
```

## Database Performance

### Full-Text Search Index
PostgreSQL GIN index on comment content for fast full-text search:
```sql
CREATE INDEX idx_comment_content_fulltext 
ON comment USING gin(to_tsvector('french', content));
```

### Query Performance
- Entity lookup: O(log n) with B-tree indexes
- Full-text search: O(log n) with GIN indexes
- Thread resolution filter: Partial index on resolved status

## Notification System

### Mention Notifications
When a user is mentioned with @username:
- Notification is created via `NotificationService.createMentionNotification()`
- Recipient receives in-app notification
- Message: "{user} mentioned you in a comment on {entity} #{id}"
- Action URL links directly to the comment thread

### Thread Participant Notifications
When a comment is added to a thread:
- All previous commenters (except current user) are notified
- Message: "{user} added a comment to a thread you're participating in"
- Prevents notification spam to author

## Export Formats

### Text Format
```
================================================================================
COMMENT THREAD EXPORT
================================================================================

Thread ID: 123
Title: Budget Discussion
Entity Type: DOSSIER
Entity ID: 456
Status: OPEN
Created At: 2024-01-15 10:30:00
Created By: alice

================================================================================
COMMENTS (3 total)
================================================================================

--------------------------------------------------------------------------------
Comment #1
--------------------------------------------------------------------------------
ID: 789
Author: alice
Date: 2024-01-15 10:30:00

Content:
Let's discuss the Q4 budget
```

### CSV Format
```csv
Thread ID,Comment ID,Author,Date,Content,Mentions
123,789,alice,2024-01-15 10:30:00,"Let's discuss the Q4 budget",
123,790,bob,2024-01-15 11:00:00,"I agree with @alice",alice
```

## Multi-Tenant Support

All tables include `org_id` column with:
- Hibernate filter: `@Filter(name = "orgIdFilter")`
- Automatic filtering based on X-Org-Id header
- Index on org_id for performance

## Security Considerations

1. **Input Validation**: All DTOs use Bean Validation (@NotNull, @NotBlank)
2. **SQL Injection**: JPA/Hibernate prevents SQL injection
3. **XSS Prevention**: Frontend sanitizes HTML via Angular's DomSanitizer
4. **Authorization**: Implement role-based access control in controller
5. **Multi-tenant Isolation**: Hibernate filters ensure org separation

## Testing

### Backend Tests
```java
@Test
void testCreateThreadWithMentions() {
    CreateCommentThreadRequest request = new CreateCommentThreadRequest();
    request.setEntityType(CommentEntityType.DOSSIER);
    request.setEntityId(1L);
    request.setInitialComment("Hello @john");
    
    CommentThreadDTO thread = commentService.createThread(request, "org1", "alice");
    
    assertNotNull(thread.getId());
    assertEquals(1, thread.getComments().size());
    assertTrue(thread.getComments().get(0).getMentions().contains("john"));
}
```

### Frontend Tests
```typescript
it('should extract mentions from content', () => {
  const content = 'Hello @john and @jane, let\'s meet';
  const mentions = component['extractMentions'](content);
  expect(mentions).toEqual(['john', 'jane']);
});
```

## Responsive Design

- Desktop: Two-column layout with sidebar
- Tablet: Same layout with adjusted widths
- Mobile: Stacked layout with collapsible sidebar

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

### Backend
- Spring Boot 3.2.1
- PostgreSQL 12+ (for full-text search)
- Hibernate 6.x
- Jakarta Validation

### Frontend
- Angular 15+
- Angular Material
- RxJS

## Future Enhancements

1. **Rich Text Editor**: Replace textarea with WYSIWYG editor
2. **Emoji Support**: Add emoji picker for comments
3. **File Attachments**: Allow attaching files to comments
4. **Real-time Updates**: WebSocket for live comment updates
5. **Reactions**: Add emoji reactions to comments
6. **Threading**: Support nested replies
7. **Moderation**: Admin tools for comment moderation
8. **Analytics**: Track engagement metrics

## Troubleshooting

### Full-Text Search Not Working
Ensure PostgreSQL version is 12+ and the GIN index is created:
```sql
SELECT * FROM pg_indexes WHERE tablename = 'comment';
```

### Mentions Not Detected
Check regex pattern matches @username format:
- Pattern: `@(\w+)`
- Valid: @john, @user123
- Invalid: @john-doe (hyphens not supported)

### Export Download Fails
Verify Content-Disposition header is set:
```java
headers.setContentDispositionFormData("attachment", filename);
```

## Support

For issues or questions:
1. Check backend logs for SQL errors
2. Check browser console for API errors
3. Verify database migrations are applied
4. Test API endpoints with Postman/curl
