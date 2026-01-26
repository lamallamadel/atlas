# Real-time Collaboration Features Implementation

## Overview

This document describes the implementation of real-time collaboration features for the dossier detail page using WebSocket with Spring STOMP broker.

## Features Implemented

### 1. Presence Indicators
- **Purpose**: Show which users are currently viewing the same dossier
- **Location**: Top of dossier detail page
- **Components**:
  - `CollaborationPresenceComponent` - Displays user avatars with color-coded indicators
  - Real-time join/leave notifications
  - Viewer count display
  - Recent activity pulse animation

### 2. Live Cursors and Typing Indicators
- **Purpose**: Show where other users are typing in shared note fields
- **Location**: Below shared notes textarea
- **Components**:
  - `CollaborationCursorComponent` - Displays typing indicators with user colors
  - Debounced cursor position updates (300ms)
  - Auto-hide after 3 seconds of inactivity
  - Fade-in animations for smooth appearance

### 3. Optimistic UI Updates with Conflict Resolution
- **Purpose**: Provide immediate feedback while handling concurrent edits
- **Features**:
  - Version-based conflict detection
  - Optimistic local updates
  - Server-side version validation
  - Automatic conflict notification with resolution UI
  - Last-write-wins strategy with user notification

### 4. Activity Stream Auto-refresh
- **Purpose**: Display real-time updates without polling
- **Location**: Collaboration tab
- **Components**:
  - `CollaborationActivityStreamComponent` - Live activity feed
  - WebSocket-pushed activity updates
  - Animated new activity indicators
  - Activity type icons and color coding
  - Smart timestamp formatting (relative time)

### 5. Collaborative Filtering
- **Purpose**: Share filter presets with team members in real-time
- **Location**: Collaboration tab
- **Components**:
  - `CollaborationFilterShareComponent` - Filter sharing UI
  - Real-time filter preset notifications
  - One-click apply functionality
  - Team-wide or targeted user sharing

## Technical Architecture

### Backend

#### Dependencies Added
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

#### Configuration
- **WebSocketConfig**: Configures STOMP broker and endpoints
  - Endpoint: `/ws` with SockJS fallback
  - Application prefix: `/app`
  - Broker destinations: `/topic`, `/queue`
  - User destination prefix: `/user`

#### Services
- **CollaborationService**: Core service managing collaboration state
  - User presence tracking (ConcurrentHashMap)
  - Version control for optimistic updates
  - Color assignment for users
  - Broadcast methods for all collaboration events

#### Controllers
- **CollaborationController**: STOMP message handlers
  - `@MessageMapping` for WebSocket messages
  - REST endpoints for state queries
  - Conflict resolution endpoint

#### DTOs
- **CollaborationPresenceDto**: User join/leave events
- **CollaborationCursorDto**: Cursor position updates
- **CollaborationEditDto**: Field edit events with versioning
- **CollaborationActivityDto**: General activity events
- **SharedFilterPresetDto**: Filter preset sharing
- **ConflictResolution**: Conflict resolution data

### Frontend

#### Dependencies Added
```json
{
  "sockjs-client": "^1.6.1",
  "stompjs": "^2.3.3",
  "@types/sockjs-client": "^1.5.4",
  "@types/stompjs": "^2.3.9"
}
```

#### Services
- **WebSocketService**: Low-level WebSocket connection management
  - SockJS connection with automatic reconnection
  - STOMP protocol handling
  - Message subject management
  - Subscription lifecycle

- **CollaborationService**: High-level collaboration features
  - Dossier-specific initialization
  - Edit versioning and conflict detection
  - Activity broadcasting
  - Filter preset sharing
  - Observable streams for all collaboration events

#### Components
- **CollaborationPresenceComponent**: Real-time viewer list
- **CollaborationCursorComponent**: Live typing indicators
- **CollaborationActivityStreamComponent**: Activity feed
- **CollaborationFilterShareComponent**: Filter sharing UI

## WebSocket Topics and Destinations

### Topics (Broadcast)
- `/topic/dossier/{dossierId}/presence` - User presence updates
- `/topic/dossier/{dossierId}/viewers` - Current viewer list
- `/topic/dossier/{dossierId}/cursor` - Cursor position updates
- `/topic/dossier/{dossierId}/edit` - Field edit events
- `/topic/dossier/{dossierId}/activity` - Activity updates
- `/topic/dossier/{dossierId}/conflict` - Conflict resolutions
- `/topic/filter-presets` - Team-wide filter sharing

### Queues (User-specific)
- `/user/{userId}/queue/filter-presets` - Direct filter sharing

### Application Destinations (Send)
- `/app/dossier/{dossierId}/join` - Join dossier session
- `/app/dossier/{dossierId}/leave` - Leave dossier session
- `/app/dossier/{dossierId}/cursor` - Update cursor position
- `/app/dossier/{dossierId}/edit` - Broadcast edit
- `/app/dossier/{dossierId}/activity` - Broadcast activity
- `/app/filter-preset/share` - Share filter preset

## REST Endpoints

### Collaboration API
- `GET /api/collaboration/dossier/{dossierId}/viewers` - Get current viewers
- `GET /api/collaboration/dossier/{dossierId}/version` - Get current version
- `GET /api/collaboration/user/{userId}/color` - Get user color
- `POST /api/collaboration/dossier/{dossierId}/conflict/resolve` - Resolve conflict

## Usage Example

### Initialize Collaboration
```typescript
// In DossierDetailComponent.ngOnInit()
await this.collaborationService.initializeForDossier(
  dossierId,
  currentUserId,
  currentUsername
);

// Subscribe to updates
this.collaborationService.getEditUpdates().subscribe(edit => {
  this.handleRemoteEdit(edit);
});
```

### Broadcast Edit
```typescript
// When user edits a field
const edit = this.collaborationService.broadcastEdit(
  'notes',
  newValue,
  oldValue
);
```

### Handle Remote Edit
```typescript
private handleRemoteEdit(edit: CollaborationEdit): void {
  if (edit.version > this.localVersion) {
    // Apply remote edit
    this.applyEdit(edit);
  } else {
    // Conflict detected
    this.showConflictResolution(edit);
  }
}
```

## Performance Optimizations

### Debouncing
- Cursor updates: 300ms debounce to reduce WebSocket traffic
- Note edits: 1000ms debounce before broadcasting

### Throttling
- Activity updates: Max 1 per second per user
- Presence updates: Only on actual join/leave

### Memory Management
- Automatic cleanup on component destroy
- Timeout-based cursor removal (3 seconds)
- Limited activity history (20 items max)

### Network Efficiency
- Delta updates instead of full state
- Compression via SockJS
- Heartbeat for connection health

## Security Considerations

### Authentication
- WebSocket connections require valid session
- User identity passed in connection headers
- Server validates user permissions

### Authorization
- Dossier access checked before join
- Filter sharing respects team boundaries
- Activity visibility based on user role

### Data Validation
- Input sanitization on all WebSocket messages
- Version validation for edit conflicts
- Rate limiting on broadcast operations

## Browser Compatibility

### WebSocket Support
- Modern browsers: Native WebSocket
- Legacy browsers: SockJS fallback (XHR/JSONP)

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Connection Issues
1. Check backend WebSocket endpoint is accessible
2. Verify CORS configuration for WebSocket
3. Check firewall/proxy WebSocket support
4. Enable SockJS debug logging

### State Sync Issues
1. Verify version increments correctly
2. Check conflict resolution logic
3. Monitor server-side state maps
4. Review client subscription lifecycle

### Performance Issues
1. Monitor WebSocket message rate
2. Check debounce/throttle configuration
3. Review activity stream size limits
4. Optimize data payload sizes

## Future Enhancements

### Planned Features
- Operational transformation for true concurrent editing
- Cursor highlighting in rich text editors
- Video/audio chat integration
- Screen sharing for remote assistance
- Collaborative drawing/annotation
- Persistent activity history with search
- Advanced conflict resolution strategies
- Mobile app WebSocket support

### Scalability
- Redis pub/sub for multi-instance support
- Message queue for reliable delivery
- Horizontal scaling with sticky sessions
- WebSocket load balancing

## Development Commands

### Backend
```bash
# Build with WebSocket support
cd backend
mvn clean package

# Run with WebSocket enabled
mvn spring-boot:run
```

### Frontend
```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm start

# Build for production
npm run build
```

## Testing

### Manual Testing
1. Open dossier in two different browsers
2. Verify presence indicators appear
3. Type in notes field and check typing indicators
4. Make concurrent edits and verify conflict handling
5. Create filter preset and share with team
6. Monitor activity stream for real-time updates

### Automated Testing
```bash
# Backend WebSocket tests
cd backend
mvn test -Dtest=CollaborationControllerTest

# Frontend collaboration tests
cd frontend
npm run test -- --include='collaboration'
```

## Monitoring

### Metrics
- Active WebSocket connections
- Message throughput (messages/second)
- Average message latency
- Connection error rate
- Conflict resolution frequency

### Logging
- WebSocket connection events
- Edit conflicts and resolutions
- Activity broadcast events
- Performance warnings

## Configuration

### Backend Properties
```yaml
# application.yml
websocket:
  max-connections: 1000
  idle-timeout: 300000  # 5 minutes
  max-message-size: 64KB
  
collaboration:
  cursor-timeout: 3000  # 3 seconds
  max-activity-items: 20
  version-cleanup-interval: 3600000  # 1 hour
```

### Frontend Configuration
```typescript
// WebSocket connection URL
const WS_URL = environment.production 
  ? 'wss://api.example.com/ws'
  : 'ws://localhost:8080/ws';

// Debounce timings
const CURSOR_DEBOUNCE_MS = 300;
const EDIT_DEBOUNCE_MS = 1000;

// Activity settings
const MAX_ACTIVITY_ITEMS = 20;
const ACTIVITY_BADGE_TIMEOUT_MS = 3000;
```

## License

This implementation follows the same license as the main project.

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
