# Messaging Tab Implementation

## Overview

This document describes the implementation of the outbound messaging UI components for the dossier detail page. The messaging tab provides functionality to compose and send WhatsApp messages using templates, view sent messages in a timeline format, and retry failed messages.

## Components

### 1. MessagingTabComponent

**Location:** `messaging-tab.component.ts`

Main container component that orchestrates the messaging functionality.

**Inputs:**
- `dossierId: number` - The dossier ID
- `recipientPhone?: string` - The recipient's phone number
- `leadName?: string` - The lead's name for pre-filling template variables

**Features:**
- Integrates the form and list components
- Handles message sent notifications
- Manages retry confirmation dialogs
- Displays success/error messages via Material Snackbar

### 2. OutboundMessageFormComponent

**Location:** `outbound-message-form.component.ts`

Form component for composing and sending WhatsApp messages.

**Inputs:**
- `dossierId: number` - The dossier ID
- `recipientPhone?: string` - The recipient's phone number (pre-filled and disabled)
- `leadName?: string` - The lead's name (used to pre-fill name variables)

**Outputs:**
- `messageSent: EventEmitter<void>` - Emitted when a message is successfully sent

**Features:**
- Template selector dropdown with predefined message templates
- Dynamic template variable inputs with intelligent pre-filling
- Real-time message preview showing variable substitution
- Custom message composition (without template)
- Form validation (recipient, content, required variables)
- Character counter for message content
- Send and reset actions
- Error display for failed submissions

**Template Variables:**
Supported template variables with smart labeling and placeholders:
- `name` - Nom (Ex: Jean Dupont)
- `date` - Date (Ex: 25/01/2024)
- `time` - Heure (Ex: 14:00)
- `location` - Lieu (Ex: 123 Rue de la Paix, Paris)
- `property` - Bien (Ex: Appartement 3 pièces)
- `documents` - Documents (Ex: pièce d'identité, justificatif de domicile)
- `amount` - Montant (Ex: 350 000 €)
- `phone` - Téléphone (Ex: +33612345678)

### 3. OutboundMessageListComponent

**Location:** `outbound-message-list.component.ts`

Timeline-based list component displaying sent messages with status tracking.

**Inputs:**
- `dossierId: number` - The dossier ID

**Outputs:**
- `retryMessage: EventEmitter<OutboundMessageResponse>` - Emitted when user clicks retry on a failed message

**Features:**
- Timeline visualization with status-based markers
- Real-time status polling (5-second intervals using RxJS)
- Status badges with icons:
  - ⏳ QUEUED - En attente (yellow)
  - 📤 SENDING - Envoi en cours (blue, pulsing animation)
  - ✓ SENT - Envoyé (green)
  - ✗ FAILED - Échec (red)
- Relative timestamps (e.g., "Il y a 5 min", "Il y a 2h")
- Template information display
- Attempt count tracking
- Failure reason display for failed messages
- Retry button for failed messages
- Manual refresh button
- Empty states and loading skeletons
- Responsive design (mobile-friendly)

**Status Badge Colors:**
- QUEUED: Yellow (#fef5e7 background, #975a16 text)
- SENDING: Blue (#ebf8ff background, #2c5282 text) with pulse animation
- SENT: Green (#f0fff4 background, #22543d text)
- FAILED: Red (#fff5f5 background, #c53030 text)

## Service Layer

### OutboundMessageApiService

**Location:** `services/outbound-message-api.service.ts`

API service for outbound message operations.

**Methods:**

```typescript
// List messages with filtering
list(params: OutboundMessageListParams): Observable<Page<OutboundMessageResponse>>

// Get single message by ID
getById(id: number): Observable<OutboundMessageResponse>

// Create new outbound message
create(request: OutboundMessageCreateRequest): Observable<OutboundMessageResponse>

// Retry failed message
retry(id: number): Observable<OutboundMessageResponse>

// List available templates
listTemplates(): Observable<OutboundMessageTemplate[]>
```

**Data Models:**

```typescript
// Message statuses
enum OutboundMessageStatus {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

// Create request
interface OutboundMessageCreateRequest {
  dossierId: number;
  recipientPhone: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  content: string;
  channel: string;
}

// Message response
interface OutboundMessageResponse {
  id: number;
  orgId: string;
  dossierId: number;
  recipientPhone: string;
  content: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  status: OutboundMessageStatus;
  channel: string;
  attemptCount: number;
  lastAttemptAt?: string;
  sentAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Template model
interface OutboundMessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  channel: string;
}
```

## Integration

### Module Registration

The components are registered in `app.module.ts`:

```typescript
import { MessagingTabComponent } from './pages/dossiers/messaging-tab.component';
import { OutboundMessageListComponent } from './pages/dossiers/outbound-message-list.component';
import { OutboundMessageFormComponent } from './pages/dossiers/outbound-message-form.component';

@NgModule({
  declarations: [
    // ... other components
    MessagingTabComponent,
    OutboundMessageListComponent,
    OutboundMessageFormComponent
  ]
})
```

### Usage in Dossier Detail

Added as a new tab in `dossier-detail.component.html`:

```html
<mat-tab label="Messages sortants" aria-label="Gestion des messages sortants WhatsApp">
  <div class="tab-content">
    <app-messaging-tab
      *ngIf="dossier"
      [dossierId]="dossier.id"
      [recipientPhone]="dossier.leadPhone"
      [leadName]="dossier.leadName">
    </app-messaging-tab>
  </div>
</mat-tab>
```

## Real-time Updates

The `OutboundMessageListComponent` implements automatic status polling:

1. **Polling Mechanism:**
   - Starts on component initialization
   - Polls every 5 seconds (configurable via `POLLING_INTERVAL`)
   - Uses RxJS `interval` + `switchMap` operators
   - Automatically stops on component destruction

2. **Manual Refresh:**
   - Refresh button available at the top of the list
   - Shows spinning animation during refresh
   - Useful for immediate updates without waiting for polling

3. **Error Handling:**
   - Silent error handling for polling (logs to console)
   - User-visible errors for manual refresh attempts
   - Prevents polling errors from disrupting the UI

## Retry Functionality

Failed messages can be retried with confirmation:

1. **User Flow:**
   - User clicks "Réessayer" button on a failed message
   - Confirmation dialog appears with message details
   - On confirmation, retry API call is made
   - Success/error message is displayed
   - List automatically updates via polling

2. **Implementation:**
   - Uses Material Dialog for confirmation
   - Reuses existing `ConfirmDeleteDialogComponent`
   - Retry only enabled for messages with FAILED status
   - Updates message status to QUEUED on retry

## Styling

### Layout

The messaging tab uses a two-column grid layout:
- **Left column:** Message composition form (sticky on desktop)
- **Right column:** Message timeline list

### Responsive Design

- **Desktop (>1024px):** Side-by-side layout, sticky form
- **Tablet (768-1024px):** Single column, stacked layout
- **Mobile (<768px):** Single column, optimized spacing

### Timeline Design

- Vertical timeline with colored markers
- Status-based marker colors and animations
- Card-based message display
- Hover effects for better interactivity
- Mobile-optimized spacing and font sizes

## Accessibility

All components follow accessibility best practices:

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly status announcements
- Proper form labeling
- Focus management

## Testing

Comprehensive test suites are provided:

- **API Service Tests:** `outbound-message-api.service.spec.ts`
  - Tests all API methods
  - Mocks HTTP responses
  - Verifies request parameters

- **Component Tests:** 
  - `messaging-tab.component.spec.ts`
  - `outbound-message-list.component.spec.ts`
  - `outbound-message-form.component.spec.ts`
  - Tests user interactions
  - Tests data binding
  - Tests event emissions

## API Endpoints

The service expects the following backend endpoints:

```
GET    /api/v1/outbound-messages
POST   /api/v1/outbound-messages
GET    /api/v1/outbound-messages/{id}
POST   /api/v1/outbound-messages/{id}/retry
GET    /api/v1/outbound-messages/templates
```

## Future Enhancements

Potential improvements:

1. **Message Filtering:** Add filters for status, date range, channel
2. **Bulk Actions:** Select and retry multiple failed messages
3. **Message Details:** Expand/collapse for full message details
4. **Delivery Reports:** Show detailed delivery status information
5. **Template Management:** In-app template creation and editing
6. **Scheduling:** Schedule messages for future delivery
7. **Rich Media:** Support for images, documents, and other media
8. **Message Search:** Full-text search within sent messages
9. **Export:** Export message history to CSV/Excel
10. **Analytics:** Message delivery statistics and charts
