# Calendar View Setup Instructions

## Quick Start

The calendar view has been fully implemented and configured. Follow these steps to set it up:

### 1. Install Dependencies

Navigate to the frontend directory and install the new FullCalendar packages:

```bash
cd frontend
npm install
```

This will install the following new packages:
- `@fullcalendar/timegrid@^6.1.9`
- `@fullcalendar/list@^6.1.9`
- `@fullcalendar/icalendar@^6.1.9`

(Note: `@fullcalendar/angular`, `@fullcalendar/core`, `@fullcalendar/daygrid`, and `@fullcalendar/interaction` were already installed)

### 2. Start the Development Server

```bash
npm start
```

The application will be available at `http://localhost:4200`

### 3. Access the Calendar

Once the application is running, you can access the calendar view in several ways:

#### Option A: Navigation Menu
- Click on "Calendrier" in the left sidebar navigation menu

#### Option B: Direct URL
- Navigate to: `http://localhost:4200/calendar`

#### Option C: Keyboard Shortcut
- Press `g` then `c` from anywhere in the application

#### Option D: Command Palette
- Press `Ctrl+K` (or `Cmd+K` on Mac)
- Type "calendrier" or "calendar"
- Press Enter

### 4. Verify Installation

To verify that everything is working correctly:

1. Open the calendar view
2. You should see:
   - Calendar toolbar with view options (Month, Week, Day, List)
   - Filter dropdowns (Assigné, Statut)
   - Color legend (Planifié, Terminé, Annulé)
   - Export iCal button
   - Help text at the bottom

3. Test basic functionality:
   - Click and drag to create an appointment
   - Click on a time slot to create an appointment
   - Use the view switcher buttons

## Troubleshooting

### Issue: "Cannot find module '@fullcalendar/timegrid'"

**Solution**: Run `npm install` in the frontend directory.

### Issue: Calendar not rendering

**Solution**: 
1. Check browser console for errors
2. Verify all FullCalendar imports are present
3. Clear browser cache and reload

### Issue: Drag-and-drop not working

**Solution**: 
1. Ensure `@fullcalendar/interaction` is installed
2. Check that `editable: true` is set in calendar options
3. Verify no JavaScript errors in console

### Issue: Styles look broken

**Solution**:
1. Verify `@import` statements in `src/styles.css`
2. Rebuild the application: `npm run build`
3. Clear browser cache

## Configuration

The calendar is pre-configured with sensible defaults:

- **Default View**: Week view with time grid
- **Business Hours**: Monday-Friday, 9:00-18:00
- **Visible Hours**: 8:00-20:00
- **Locale**: French (fr)
- **First Day of Week**: Monday

To customize these settings, edit `frontend/src/app/components/calendar-view.component.ts` and modify the `calendarOptions` object.

## Features Overview

### Views
- **Month View**: Overview of entire month
- **Week View**: Time-slotted week view (default)
- **Day View**: Single day with hourly slots
- **List View**: Agenda-style list

### Interactions
- **Create**: Click and drag on empty slots
- **Edit**: Click on appointment
- **Move**: Drag appointment to new time
- **Resize**: Drag bottom edge to adjust duration
- **Delete**: Open appointment and use delete button

### Filters
- **By Assignee**: Filter appointments by assigned person
- **By Status**: Filter by Scheduled/Completed/Cancelled

### Export
- **iCal Export**: Download appointments in iCalendar format
- Compatible with Google Calendar, Outlook, Apple Calendar

### Conflict Detection
- Automatically prevents overlapping appointments
- Checks only for same assignee
- Shows warning message on conflict

## Production Build

To build for production:

```bash
cd frontend
npm run build
```

The built application will be in `frontend/dist/frontend/`

## Testing

To run unit tests for the calendar component:

```bash
cd frontend
npm test -- --include='**/calendar-view.component.spec.ts'
```

## Documentation

Additional documentation is available in:

- **Component README**: `frontend/src/app/components/CALENDAR_VIEW_README.md`
- **Integration Examples**: `frontend/src/app/components/CALENDAR_INTEGRATION_EXAMPLE.md`
- **Implementation Summary**: `CALENDAR_VIEW_IMPLEMENTATION_SUMMARY.md` (root directory)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the documentation files
3. Check browser console for error messages
4. Verify API endpoints are accessible

## Next Steps

After setup:
1. Create test appointments to familiarize yourself with the UI
2. Test drag-and-drop functionality
3. Try different calendar views
4. Test filters and export functionality
5. Review documentation for integration examples

## Backend Requirements

The calendar view requires the following backend API endpoints to be available:

- `GET /api/v1/appointments` - List appointments
- `POST /api/v1/appointments` - Create appointment
- `PUT /api/v1/appointments/{id}` - Update appointment
- `DELETE /api/v1/appointments/{id}` - Delete appointment

These endpoints should already be implemented in the Spring Boot backend.

## Browser Compatibility

The calendar view is tested and compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- Default load limit: 1000 appointments
- Filters are applied client-side (assignee) or server-side (status)
- Calendar rerenders on state changes
- No real-time updates (manual refresh required)

For production environments with large datasets, consider implementing:
- Date range filtering
- Pagination
- Virtual scrolling
- Server-side rendering

Enjoy using the Calendar View! 📅
