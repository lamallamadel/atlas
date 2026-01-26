# Calendar View Component

## Overview

The Calendar View Component provides a comprehensive calendar interface for managing appointments using FullCalendar.js. It supports multiple views (day, week, month, list), drag-and-drop functionality, conflict detection, filtering, and iCal export.

## Features

### 1. Multiple Calendar Views
- **Month View** (`dayGridMonth`): Overview of all appointments in a month
- **Week View** (`timeGridWeek`): Detailed week view with time slots
- **Day View** (`timeGridDay`): Single day view with hourly slots
- **List View** (`listWeek`): List format showing appointments for the week

### 2. Interactive Appointment Management

#### Create Appointments
- Click and drag on any empty time slot to create a new appointment
- Opens `AppointmentFormDialogComponent` with pre-filled start and end times
- Validates that a dossier is selected before creation

#### Edit Appointments
- Click on any appointment to open the edit dialog
- Modify time, location, assignee, notes, or status
- Real-time validation of time ranges

#### Drag-and-Drop
- Drag appointments to different time slots or dates
- Automatically detects and prevents conflicts with existing appointments
- Reverts changes if conflicts are detected or API call fails

#### Resize Events
- Drag the bottom edge of an appointment to change its duration
- Includes conflict detection and validation
- Updates the appointment via API call

### 3. Conflict Detection

The component automatically detects scheduling conflicts when:
- Creating a new appointment
- Moving an appointment (drag-and-drop)
- Resizing an appointment

**Conflict Rules:**
- Checks appointments for the same assignee only
- Ignores cancelled appointments
- Validates time overlap (start < other.end && end > other.start)
- Shows warning message and reverts the change if conflict detected

### 4. Filtering System

#### Filter by Assignee
- Dropdown showing all assignees from loaded appointments
- Updates calendar display in real-time
- Maintains filter state when switching views

#### Filter by Status
- Options: All, Scheduled, Completed, Cancelled
- Reloads appointments from server with status filter
- Affects both calendar display and export

### 5. Color Coding by Status

Appointments are color-coded based on their status:
- **Scheduled** (Blue): `#2196F3`
- **Completed** (Green): `#4CAF50`
- **Cancelled** (Gray): `#9E9E9E`

Color legend is displayed at the top of the calendar for reference.

### 6. iCal Export

Export appointments to iCal (.ics) format for use with external calendar applications:
- Respects current filters (assignee and status)
- Generates RFC 5545 compliant iCalendar format
- Includes appointment details: time, location, assignee, notes
- Sets status as CANCELLED or CONFIRMED based on appointment status
- Downloads as `appointments_YYYY-MM-DD.ics`

**Compatible with:**
- Google Calendar
- Microsoft Outlook
- Apple Calendar
- Mozilla Thunderbird
- Any RFC 5545 compliant calendar application

### 7. Bidirectional Synchronization

The calendar maintains synchronization with the appointments list:
- All CRUD operations update both the calendar and internal state
- Filters apply to both calendar view and list data
- Real-time updates when appointments are created, updated, or deleted
- Extracts and updates available assignees dynamically

## Usage

### Basic Integration

```typescript
import { CalendarViewComponent } from './components/calendar-view.component';

// In routes
{ path: 'calendar', component: CalendarViewComponent }
```

### Navigation

```html
<a routerLink="/calendar">Calendrier</a>
```

### Programmatic Control

```typescript
@ViewChild(CalendarViewComponent) calendarView!: CalendarViewComponent;

// Refresh data
this.calendarView.refreshCalendar();

// Change view
this.calendarView.changeView('dayGridMonth');

// Navigate
this.calendarView.goToToday();
this.calendarView.goToNext();
this.calendarView.goToPrev();

// Apply filters
this.calendarView.onFilterByAssignedToChange('John Doe');
this.calendarView.onFilterByStatusChange(AppointmentStatus.SCHEDULED);

// Export
this.calendarView.exportToICal();
```

## Component API

### Inputs
None (self-contained component)

### Outputs
None (uses internal state and services)

### Public Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `loadAppointments()` | None | Loads appointments from API with current filters |
| `refreshCalendar()` | None | Reloads all appointments and updates display |
| `createAppointment(data)` | `AppointmentFormData` | Creates a new appointment |
| `updateAppointment(data)` | `AppointmentFormData` | Updates an existing appointment |
| `deleteAppointment(id)` | `number` | Deletes an appointment after confirmation |
| `exportToICal()` | None | Exports filtered appointments to iCal format |
| `changeView(viewType)` | `string` | Changes calendar view type |
| `goToToday()` | None | Navigates to today's date |
| `goToNext()` | None | Navigates to next period |
| `goToPrev()` | None | Navigates to previous period |
| `onFilterByAssignedToChange(assignee)` | `string \| null` | Filters by assignee |
| `onFilterByStatusChange(status)` | `AppointmentStatus \| null` | Filters by status |

## Configuration

### Calendar Options

The component uses the following FullCalendar configuration:

```typescript
calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, iCalendarPlugin],
  initialView: 'timeGridWeek',
  locale: 'fr',
  firstDay: 1, // Monday
  slotMinTime: '08:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  editable: true,
  selectable: true,
  selectMirror: true,
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00'
  }
}
```

### Customization

To customize the calendar:

1. **Business Hours**: Modify `businessHours` in `calendarOptions`
2. **Time Range**: Change `slotMinTime` and `slotMaxTime`
3. **Colors**: Update `getStatusColor()` method
4. **Views**: Add/remove view types in `headerToolbar.right`

## Dependencies

### Required NPM Packages

```json
{
  "@fullcalendar/angular": "^6.1.9",
  "@fullcalendar/core": "^6.1.9",
  "@fullcalendar/daygrid": "^6.1.9",
  "@fullcalendar/timegrid": "^6.1.9",
  "@fullcalendar/list": "^6.1.9",
  "@fullcalendar/interaction": "^6.1.9",
  "@fullcalendar/icalendar": "^6.1.9"
}
```

### Angular Material Modules

- `MatCardModule`
- `MatButtonModule`
- `MatIconModule`
- `MatFormFieldModule`
- `MatSelectModule`
- `MatTooltipModule`
- `MatProgressSpinnerModule`
- `MatDialogModule`

### Services

- `AppointmentApiService`: Backend API communication
- `ToastNotificationService`: User notifications
- `MatDialog`: Dialog management

## Styling

The component includes comprehensive CSS with:
- Responsive design (mobile/tablet/desktop)
- Material Design theming
- FullCalendar customization
- Print-friendly styles
- Dark mode support (via theme service)

### CSS Classes

- `.calendar-view-container`: Main container
- `.calendar-card`: Material card wrapper
- `.filters-section`: Filter controls area
- `.legend-section`: Status color legend
- `.calendar-wrapper`: FullCalendar container
- `.loading-state`: Loading indicator
- `.help-text`: User help information

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support via FullCalendar
- Screen reader announcements for state changes
- Sufficient color contrast ratios
- Tooltips for icon-only buttons

## Performance Considerations

1. **Large Dataset Handling**:
   - Default page size: 1000 appointments
   - Consider implementing date range filtering for very large datasets
   - Use backend pagination for optimal performance

2. **Real-time Updates**:
   - Component uses RxJS `takeUntil` for proper subscription cleanup
   - Implements `OnDestroy` lifecycle hook
   - Prevents memory leaks with `destroy$` subject

3. **Conflict Detection**:
   - Client-side conflict check for immediate feedback
   - Backend should implement server-side validation
   - Consider caching assignee schedules for large datasets

## Testing

The component includes comprehensive unit tests:
- Loading and displaying appointments
- Filtering by assignee and status
- Color coding validation
- Conflict detection logic
- CRUD operations
- iCal export generation
- Error handling

Run tests:
```bash
cd frontend
npm test -- --include='**/calendar-view.component.spec.ts'
```

## Troubleshooting

### Common Issues

1. **Calendar not rendering**:
   - Verify FullCalendar modules are imported in `app.module.ts`
   - Check that `FullCalendarModule` is in the imports array
   - Ensure all required plugins are installed

2. **Drag-and-drop not working**:
   - Verify `interactionPlugin` is loaded
   - Check that `editable: true` and `selectable: true` are set
   - Ensure user has proper permissions

3. **iCal export failing**:
   - Check browser console for errors
   - Verify appointments array is not empty
   - Ensure date formatting is correct (ISO 8601)

4. **Conflicts not detected**:
   - Verify assignedTo field is populated
   - Check that time comparison logic is correct
   - Ensure timezone handling is consistent

## Future Enhancements

Potential improvements for future versions:

1. **Recurring Appointments**: Support for repeating events
2. **Reminders**: Email/SMS notifications before appointments
3. **Resource Scheduling**: Multi-calendar view for different resources
4. **External Calendar Sync**: Two-way sync with Google/Outlook
5. **Timezone Support**: Handle appointments across timezones
6. **Print View**: Optimized printing with custom layouts
7. **Batch Operations**: Bulk edit/delete appointments
8. **Templates**: Quick appointment creation from templates
9. **Color Customization**: User-defined color schemes
10. **Mobile App**: Native mobile calendar integration

## Related Components

- `AppointmentFormDialogComponent`: Create/edit appointment dialog
- `ConfirmDeleteDialogComponent`: Delete confirmation
- `TaskListComponent`: Related task management
- `DossierDetailComponent`: Appointment context

## API Endpoints

The component uses the following API endpoints:

- `GET /api/v1/appointments`: List appointments (with filters)
- `GET /api/v1/appointments/{id}`: Get appointment details
- `POST /api/v1/appointments`: Create appointment
- `PUT /api/v1/appointments/{id}`: Update appointment
- `DELETE /api/v1/appointments/{id}`: Delete appointment

Query parameters for filtering:
- `dossierId`: Filter by dossier
- `status`: Filter by appointment status
- `assignedTo`: Filter by assignee
- `startTimeFrom`: Filter by start time range (from)
- `startTimeTo`: Filter by start time range (to)
- `page`: Pagination page number
- `size`: Pagination page size
- `sort`: Sort order

## License

Part of the Real Estate CRM application. See main project LICENSE file.
