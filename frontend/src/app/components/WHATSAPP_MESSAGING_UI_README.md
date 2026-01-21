# WhatsApp Messaging UI Component

A comprehensive, production-ready WhatsApp messaging interface built with Angular Material, featuring bubble chat layout, real-time delivery tracking, template management, consent validation, and attachment support.

## Features

### 🎨 WhatsApp-Style UI
- **Bubble Chat Layout**: Authentic WhatsApp-style message bubbles
- **Color-Coded Messages**: Green bubbles for outbound, white for inbound
- **Date Dividers**: Automatic date separators (Today, Yesterday, dates)
- **Smooth Animations**: Message appearance animations and transitions
- **Background Pattern**: WhatsApp-style subtle background pattern

### 📱 Real-Time Delivery Status
- **Material Icons**: Visual status indicators using Material Design icons
  - `schedule` - Pending (gray)
  - `done` - Sent (gray)
  - `done_all` - Delivered (blue)
  - `done_all` - Read (blue)
  - `error` - Failed (red)
- **Auto-Refresh**: Automatic status updates every 5 seconds for pending messages
- **Color Coding**: Status-based icon coloring for quick visual feedback

### 📝 Template Management
- **Template Selector**: Bottom sheet with search functionality
- **Variable Preview**: Real-time preview as you fill in template variables
- **Auto-Population**: Variable fields auto-populated with type
- **Template Chip**: Visual indicator of selected template
- **Quick Edit**: Ability to change template without losing progress

### ✅ Consent Validation
- **Pre-Send Check**: Validates consent before enabling send button
- **Visual Warnings**: Yellow warning banner for missing/invalid consent
- **Status Messages**:
  - No consent recorded
  - Consent denied
  - Consent revoked
  - Consent expired
- **Automatic Blocking**: Send button disabled when consent not valid

### 📎 Attachment Support
- **Image Support**: JPEG, PNG, WebP
- **Document Support**: PDF, Word documents
- **Size Validation**:
  - Images: Max 5MB
  - Documents: Max 16MB
- **Preview Generation**: Automatic image thumbnails
- **Multi-Attachment**: Support for up to 10 files
- **Visual Feedback**: File name, size, and type indicators
- **Easy Removal**: One-click to remove attachments

### 📱 Mobile Responsive Design
- **Bottom Sheet**: Native mobile-style template selector
- **Touch Gestures**: Swipe actions for message options
- **Adaptive Layout**: Optimized for all screen sizes
- **Mobile Viewport**: Full-height on mobile devices
- **Keyboard Handling**: Enter to send on desktop, Shift+Enter for newline

### 🔄 Offline Support
- **Connection Status**: Real-time online/offline indicator
- **Visual Feedback**: WiFi icon with status color
- **Disabled State**: Proper handling when offline

### ⚡ Performance Optimizations
- **Virtual Scrolling**: CDK Virtual Scroll for large message lists
- **Lazy Loading**: Efficient rendering of messages
- **Change Detection**: Optimized update strategy
- **Debouncing**: Smooth text input handling

## Usage

### Basic Implementation

```html
<app-whatsapp-messaging-ui
  [dossierId]="dossierId"
  [recipientPhone]="contact.phone"
  [recipientName]="contact.name">
</app-whatsapp-messaging-ui>
```

### Full Configuration

```html
<app-whatsapp-messaging-ui
  [dossierId]="dossierId"
  [recipientPhone]="'+33612345678'"
  [recipientName]="'Jean Dupont'"
  (messageActionEvent)="handleMessageAction($event)">
</app-whatsapp-messaging-ui>
```

### Component Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `dossierId` | `number` | Yes | ID of the dossier/conversation |
| `recipientPhone` | `string` | No | Phone number to display |
| `recipientName` | `string` | No | Contact name to display |

### Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `messageActionEvent` | `EventEmitter<{type: string, message: MessageResponse}>` | Emitted on message actions (retry, copy) |

## Template System

### Template Structure

```typescript
interface OutboundMessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  channel: string;
}
```

### Template Example

```typescript
{
  id: 'appointment-reminder',
  name: 'Rappel de rendez-vous',
  content: 'Bonjour {{name}}, votre rendez-vous est prévu le {{date}} à {{time}}.',
  variables: ['name', 'date', 'time'],
  channel: 'WHATSAPP'
}
```

### Variable Replacement

Variables are defined using double curly braces: `{{variableName}}`

When the user fills in:
- `name` = "Jean"
- `date` = "15 janvier"
- `time` = "14h30"

The preview shows: "Bonjour Jean, votre rendez-vous est prévu le 15 janvier à 14h30."

## Consent Management

The component automatically:

1. **Loads Consent**: Fetches consent status on initialization
2. **Validates Before Send**: Checks consent status before enabling send
3. **Shows Warnings**: Displays appropriate warnings for each consent state
4. **Blocks Sending**: Prevents message sending without valid consent

### Consent States

| Status | Description | Can Send? |
|--------|-------------|-----------|
| `GRANTED` | User has given consent | ✅ Yes |
| `DENIED` | User has denied consent | ❌ No |
| `PENDING` | Consent request pending | ❌ No |
| `REVOKED` | User has revoked consent | ❌ No |
| `EXPIRED` | Consent has expired | ❌ No |

## Attachment Handling

### Supported File Types

**Images:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)

**Documents:**
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)

### Size Limits

- Images: 5 MB maximum
- Documents: 16 MB maximum
- Total attachments: 10 files maximum

### Validation Flow

1. User selects files
2. Component validates each file:
   - Check file type
   - Check file size
   - Generate preview (images only)
3. Show error snackbar for invalid files
4. Add valid files to attachment list
5. User can remove attachments before sending

## Message Actions

### Swipe Gestures (Mobile)

On mobile devices, swipe left on a message to reveal actions:
- **Retry**: For failed messages only
- **Copy**: Copy message content to clipboard

### Desktop Actions

Hover over messages to see action buttons.

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | ≥769px | Centered container, max-width 800px |
| Tablet | 481px - 768px | Full width, adjusted spacing |
| Mobile | ≤480px | Full viewport, compact UI |

## Styling Customization

### CSS Custom Properties

The component uses standard CSS. To customize:

```css
/* Override in your global styles */
.whatsapp-messaging-ui {
  /* Header background */
  --whatsapp-header-bg: #075e54;
  
  /* Outbound message bubble */
  --whatsapp-outbound-bg: #dcf8c6;
  
  /* Inbound message bubble */
  --whatsapp-inbound-bg: #ffffff;
}
```

### Theme Integration

The component uses Angular Material theme colors for buttons and form fields.

## Performance Considerations

### Virtual Scrolling

Messages use CDK Virtual Scroll for optimal performance with large conversations:
- Only renders visible messages
- Smooth scrolling
- Automatic scroll-to-bottom for new messages

### Status Refresh Strategy

- Pending/Sent messages: Refresh every 5 seconds
- Delivered/Read messages: No refresh needed
- Failed messages: No automatic refresh
- Manual refresh: Refresh button in header

### Change Detection

Component uses default change detection but optimizes with:
- Manual `detectChanges()` calls for status updates
- `trackBy` function for message list
- Debounced input handlers

## Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels on interactive elements
- ✅ Tooltip descriptions for icons
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ Color contrast compliance

## Dependencies

### Required Angular Material Modules

```typescript
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TextFieldModule } from '@angular/cdk/text-field';
```

### Required Services

- `MessageApiService` - Message CRUD operations
- `OutboundMessageApiService` - Template management
- `ConsentementApiService` - Consent validation

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile Safari | iOS 14+ | ✅ Full |
| Chrome Mobile | Android 8+ | ✅ Full |

## Known Limitations

1. **File Upload**: Component validates but doesn't actually upload files (implement backend separately)
2. **Message Deletion**: UI present but requires backend implementation
3. **Read Receipts**: Requires backend webhook integration for real-time updates
4. **Rich Media**: Only supports file attachments, not inline media in messages
5. **Message Editing**: Not supported (WhatsApp limitation)

## Future Enhancements

- [ ] Voice message support
- [ ] Video attachment support
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Group chat support
- [ ] Message search
- [ ] Export conversation
- [ ] Typing indicators
- [ ] Message threading/replies

## Troubleshooting

### Messages not loading
- Check `dossierId` is set correctly
- Verify API service is properly configured
- Check browser console for errors

### Send button disabled
- Verify consent is granted
- Check message content is not empty
- Ensure template variables are filled (if using template)
- Verify online status

### Templates not appearing
- Check API returns templates with `channel: 'WHATSAPP'`
- Verify `OutboundMessageApiService.listTemplates()` is working
- Check browser console for errors

### Attachments not working
- Verify file type is in allowed list
- Check file size is within limits
- Ensure file input is properly configured

## Examples

### Example 1: Basic Usage

```typescript
@Component({
  selector: 'app-dossier-messaging',
  template: `
    <app-whatsapp-messaging-ui
      [dossierId]="dossier.id"
      [recipientPhone]="dossier.leadPhone"
      [recipientName]="dossier.leadName">
    </app-whatsapp-messaging-ui>
  `
})
export class DossierMessagingComponent {
  dossier = {
    id: 123,
    leadPhone: '+33612345678',
    leadName: 'Jean Dupont'
  };
}
```

### Example 2: With Event Handling

```typescript
@Component({
  selector: 'app-dossier-messaging',
  template: `
    <app-whatsapp-messaging-ui
      [dossierId]="dossierId"
      [recipientPhone]="recipientPhone"
      [recipientName]="recipientName"
      (messageActionEvent)="handleAction($event)">
    </app-whatsapp-messaging-ui>
  `
})
export class DossierMessagingComponent {
  dossierId = 123;
  recipientPhone = '+33612345678';
  recipientName = 'Jean Dupont';

  handleAction(event: { type: string; message: MessageResponse }): void {
    console.log('Message action:', event.type, event.message);
    if (event.type === 'retry') {
      // Additional retry logic
    }
  }
}
```

### Example 3: In Dialog/Modal

```typescript
@Component({
  selector: 'app-messaging-dialog',
  template: `
    <h2 mat-dialog-title>WhatsApp - {{ data.contactName }}</h2>
    <mat-dialog-content>
      <app-whatsapp-messaging-ui
        [dossierId]="data.dossierId"
        [recipientPhone]="data.phone"
        [recipientName]="data.contactName">
      </app-whatsapp-messaging-ui>
    </mat-dialog-content>
  `
})
export class MessagingDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      dossierId: number;
      phone: string;
      contactName: string;
    }
  ) {}
}
```

## Testing

Run unit tests:

```bash
ng test --include='**/whatsapp-messaging-ui.component.spec.ts'
```

## License

This component is part of the application and follows the same license.
