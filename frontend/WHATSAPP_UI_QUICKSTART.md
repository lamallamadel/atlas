# WhatsApp Messaging UI - Quick Start Guide

## 🚀 Quick Integration (5 Minutes)

### Step 1: Component is Ready
The component is already registered in `app.module.ts`. No additional setup needed!

### Step 2: Add to Your Template
```html
<!-- In your dossier detail or messaging page -->
<app-whatsapp-messaging-ui
  [dossierId]="123"
  [recipientPhone]="'+33612345678'"
  [recipientName]="'Jean Dupont'">
</app-whatsapp-messaging-ui>
```

### Step 3: That's It!
The component is fully self-contained and will:
- ✅ Load messages automatically
- ✅ Check consent status
- ✅ Load templates
- ✅ Handle sending
- ✅ Update statuses

## 📋 Common Use Cases

### Use Case 1: In a Tab
```html
<mat-tab-group>
  <mat-tab label="Détails">
    <!-- Dossier details -->
  </mat-tab>
  
  <mat-tab label="WhatsApp">
    <app-whatsapp-messaging-ui
      [dossierId]="dossier.id"
      [recipientPhone]="dossier.leadPhone"
      [recipientName]="dossier.leadName">
    </app-whatsapp-messaging-ui>
  </mat-tab>
</mat-tab-group>
```

### Use Case 2: In a Card
```html
<mat-card>
  <mat-card-header>
    <mat-card-title>WhatsApp Messaging</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div style="height: 600px;">
      <app-whatsapp-messaging-ui
        [dossierId]="dossier.id"
        [recipientPhone]="dossier.leadPhone"
        [recipientName]="dossier.leadName">
      </app-whatsapp-messaging-ui>
    </div>
  </mat-card-content>
</mat-card>
```

### Use Case 3: Full Page
```html
<div class="page-container" style="height: 100vh; padding: 0;">
  <app-whatsapp-messaging-ui
    [dossierId]="dossierId"
    [recipientPhone]="recipientPhone"
    [recipientName]="recipientName">
  </app-whatsapp-messaging-ui>
</div>
```

### Use Case 4: In a Dialog
```typescript
import { MatDialog } from '@angular/material/dialog';
import { WhatsappMessagingDialogComponent } from './components/whatsapp-messaging-ui-example.component';

// In your component
constructor(private dialog: MatDialog) {}

openWhatsAppMessaging(): void {
  this.dialog.open(WhatsappMessagingDialogComponent, {
    width: '900px',
    maxWidth: '95vw',
    height: '700px',
    data: {
      dossierId: this.dossier.id,
      contactPhone: this.dossier.leadPhone,
      contactName: this.dossier.leadName
    }
  });
}
```

## 🎛️ Component Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `dossierId` | `number` | **Yes** | - | The dossier/conversation ID |
| `recipientPhone` | `string` | No | - | Phone number to display in header |
| `recipientName` | `string` | No | `'Contact WhatsApp'` | Name to display in header |

## 📤 Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `messageActionEvent` | `EventEmitter<{type: string, message: MessageResponse}>` | Fired when user performs action (retry, copy) |

### Handling Events (Optional)
```typescript
onMessageAction(event: {type: string, message: MessageResponse}): void {
  if (event.type === 'retry') {
    console.log('User retried message:', event.message.id);
  } else if (event.type === 'copy') {
    console.log('User copied message');
  }
}
```

## 🎨 Styling

### Container Height
The component needs a defined height to work properly:

```html
<!-- Good: Container has height -->
<div style="height: 600px;">
  <app-whatsapp-messaging-ui [dossierId]="123">
  </app-whatsapp-messaging-ui>
</div>

<!-- Good: In flex container -->
<div style="display: flex; flex-direction: column; height: 100vh;">
  <app-whatsapp-messaging-ui [dossierId]="123">
  </app-whatsapp-messaging-ui>
</div>

<!-- Bad: No height defined -->
<div>
  <app-whatsapp-messaging-ui [dossierId]="123">
  </app-whatsapp-messaging-ui>
</div>
```

### Custom Styling
Override styles in your component CSS:

```css
::ng-deep .whatsapp-messaging-ui {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

::ng-deep .messaging-header {
  background: #128C7E; /* Different green */
}
```

## 🔧 Configuration

### Template Configuration
Templates are loaded automatically from the API. Ensure your backend returns templates with:

```typescript
{
  id: 'template-id',
  name: 'Template Name',
  content: 'Hello {{name}}, your message {{message}}',
  variables: ['name', 'message'],
  channel: 'WHATSAPP'  // Must be WHATSAPP
}
```

### Consent Configuration
The component checks consent automatically. To set up consent in your backend:

```typescript
{
  dossierId: 123,
  channel: 'WHATSAPP',
  status: 'GRANTED'  // Must be GRANTED to send messages
}
```

## 🐛 Troubleshooting

### Messages Not Loading
```typescript
// Check console for errors
// Verify dossierId is set:
console.log('Dossier ID:', this.dossierId);

// Verify API is accessible:
// Open DevTools > Network > Filter by "messages"
```

### Send Button Disabled
Possible reasons:
1. ❌ No valid consent → Check consent API
2. ❌ Empty message → Type something
3. ❌ Template variables not filled → Fill all variables
4. ❌ Offline → Check connection

### Templates Not Showing
```typescript
// Verify templates are returned by API
// Check that templates have channel: 'WHATSAPP'
// Open DevTools > Network > Check /templates response
```

### Attachments Not Working
```typescript
// Check file type is allowed
// Supported: JPEG, PNG, WebP, PDF, Word
// Check file size
// Images: Max 5MB
// Documents: Max 16MB
```

## 💡 Tips & Tricks

### Tip 1: Pre-fill Recipient Info
```typescript
// In your component
dossier$ = this.dossierService.getById(this.dossierId);
```

```html
<app-whatsapp-messaging-ui
  *ngIf="dossier$ | async as dossier"
  [dossierId]="dossier.id"
  [recipientPhone]="dossier.leadPhone"
  [recipientName]="dossier.leadName">
</app-whatsapp-messaging-ui>
```

### Tip 2: Refresh Messages Programmatically
```typescript
@ViewChild(WhatsappMessagingUiComponent) messagingUI!: WhatsappMessagingUiComponent;

refreshMessages(): void {
  this.messagingUI.loadMessages();
}
```

### Tip 3: Scroll to Bottom
```typescript
@ViewChild(WhatsappMessagingUiComponent) messagingUI!: WhatsappMessagingUiComponent;

scrollToLatest(): void {
  this.messagingUI.scrollToBottom();
}
```

### Tip 4: Mobile Optimization
```css
/* Force full height on mobile */
@media (max-width: 768px) {
  .messaging-container {
    height: 100vh;
    height: 100dvh; /* For mobile browsers */
  }
}
```

## 📱 Mobile Best Practices

### 1. Full Viewport Height
```html
<div class="mobile-messaging" style="height: 100vh;">
  <app-whatsapp-messaging-ui [dossierId]="123">
  </app-whatsapp-messaging-ui>
</div>
```

### 2. Hide Other UI on Mobile
```html
<div class="desktop-sidebar" *ngIf="!isMobile">
  <!-- Sidebar content -->
</div>

<div class="messaging-area" [class.mobile]="isMobile">
  <app-whatsapp-messaging-ui [dossierId]="123">
  </app-whatsapp-messaging-ui>
</div>
```

### 3. Handle Keyboard
The component automatically handles mobile keyboard. No extra work needed!

## 🧪 Testing Your Integration

### Quick Test Checklist
- [ ] Component loads without errors
- [ ] Messages appear in thread
- [ ] Can select template
- [ ] Can fill template variables
- [ ] Preview updates as you type
- [ ] Send button enables/disables correctly
- [ ] Messages send successfully
- [ ] Status icons appear and update
- [ ] Attachments can be added
- [ ] Attachments can be removed
- [ ] Mobile view works
- [ ] Consent warning shows if needed

### Test with Different Scenarios

```typescript
// Test 1: With valid consent
dossierId: 123 // Has GRANTED consent

// Test 2: Without consent
dossierId: 456 // No consent

// Test 3: Denied consent
dossierId: 789 // Has DENIED consent

// Test 4: Many messages
dossierId: 100 // Has 100+ messages (test virtual scroll)

// Test 5: Mobile
// Open in Chrome DevTools mobile view
// Test swipe gestures
```

## 🎓 Learn More

### Full Documentation
See `WHATSAPP_MESSAGING_UI_README.md` for complete documentation.

### Code Examples
See `whatsapp-messaging-ui-example.component.ts` for advanced examples:
- Dialog implementation
- Service integration
- Event handling

### Component Code
See `whatsapp-messaging-ui.component.ts` for implementation details.

## 🆘 Need Help?

### Check the Logs
```typescript
// Component logs errors to console
// Open DevTools > Console
// Look for errors starting with:
// "Error loading messages"
// "Error loading consent"
// "Error sending message"
```

### Common Issues

**Issue**: Component is blank
**Solution**: Set a height on the container

**Issue**: Can't send messages
**Solution**: Check consent status in API

**Issue**: Templates not loading
**Solution**: Verify API returns templates with channel='WHATSAPP'

**Issue**: Status icons not updating
**Solution**: Check that API returns deliveryStatus field

## 🎉 You're Ready!

The WhatsApp Messaging UI component is fully implemented and ready to use. Just drop it into your template with a `dossierId` and you're good to go!

```html
<app-whatsapp-messaging-ui [dossierId]="123">
</app-whatsapp-messaging-ui>
```

That's it! 🚀
