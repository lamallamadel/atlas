# E2E Test Scenarios Documentation

## Overview

This document describes all E2E test scenarios implemented for the application.

## Test Files

### 1. dossier-message.spec.ts
Tests the complete message creation workflow in a dossier.

**Test: Scenario 1 - Message Creation Flow**
- **Given**: User is authenticated and on the dashboard
- **When**: User navigates to dossiers → opens a dossier → switches to Messages tab → adds a new message
- **Then**: 
  - Message appears in the timeline
  - Message displays correct timestamp (formatted as DD/MM/YYYY HH:mm)
  - Message displays correct channel badge (EMAIL, SMS, PHONE, WHATSAPP, CHAT, IN_APP)
  - Message displays correct direction badge (INBOUND/OUTBOUND)
  - Message content is displayed correctly

**Key Validations**:
- Timeline view shows messages in chronological order
- Channel badge styling and text
- Direction badge shows "Entrant" for INBOUND, "Sortant" for OUTBOUND
- Message content is truncated with "Voir plus" if > 200 characters

---

### 2. dossier-appointment.spec.ts
Tests appointment creation and audit trail verification.

**Test: Scenario 2 - Appointment Creation and Audit**
- **Given**: User is authenticated and on a dossier detail page
- **When**: User switches to Rendez-vous tab → creates a new appointment
- **Then**:
  - Appointment appears in the list with correct details
  - Appointment shows correct status (Planifié/SCHEDULED)
  - Appointment displays location, assigned agent, and times

**When**: User switches to Historique tab
- **Then**:
  - Audit event for appointment creation exists
  - Audit event has action=CREATED (displayed as "Création")
  - Audit event has entityType=APPOINTMENT or related type
  - Audit event shows timestamp, user, and changes

**Test: Scenario 2b - Audit Event Details**
- Validates audit event structure
- Tests filtering by action (Création/CREATED)
- Tests filtering by entity type
- Verifies audit event table columns

**Key Validations**:
- Appointment table shows: Date/Heure, Lieu, Assigné à, Statut, Notes, Actions
- Status badge colors and labels
- Audit table shows: Date/Heure, Action, Type d'entité, ID entité, Utilisateur, Changements
- Pagination works correctly
- Filters work correctly

---

### 3. dossier-full-workflow.spec.ts
Tests a complete end-to-end workflow combining multiple features.

**Test: Complete Workflow**
- **Given**: User is authenticated
- **When**: User creates/opens a dossier → adds a message → adds an appointment → verifies audit trail
- **Then**:
  - All entities are created successfully
  - All entities persist across tab switches
  - Audit trail contains events for all actions
  - Filters work correctly in audit tab

**Key Validations**:
- Data persistence across tab navigation
- Multiple entity creation in same session
- Audit trail completeness
- Filter functionality
- Message and appointment co-existence

---

### 4. dossier-pom.spec.ts
Tests using Page Object Model pattern for better maintainability.

**Test: Add message using POM**
- Uses DossiersListPage and DossierDetailPage classes
- Demonstrates clean separation of concerns
- Easier to maintain and update

**Test: Add appointment and verify audit using POM**
- Uses page object methods for all interactions
- More readable test code
- Reusable page methods

---

## Test Data

### Message Data
```typescript
{
  channel: 'EMAIL' | 'SMS' | 'PHONE' | 'WHATSAPP' | 'CHAT' | 'IN_APP',
  direction: 'INBOUND' | 'OUTBOUND',
  content: string,
  timestamp: ISO8601 datetime string
}
```

### Appointment Data
```typescript
{
  startTime: ISO8601 datetime string,
  endTime: ISO8601 datetime string,
  location: string,
  assignedTo: string,
  notes: string,
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
}
```

### Audit Event Data
```typescript
{
  entityType: 'ANNONCE' | 'DOSSIER' | 'PARTIE_PRENANTE' | 'CONSENTEMENT' | 'MESSAGE' | 'USER' | 'ORGANIZATION',
  entityId: number,
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'VIEWED' | 'EXPORTED' | 'IMPORTED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'RESTORED',
  userId: string,
  diff: Record<string, any>,
  createdAt: ISO8601 datetime string
}
```

---

## Selectors Reference

### Common Selectors
- Material tabs: `.mat-tab-label:has-text("TabName")`
- Material dialogs: `mat-dialog-container`
- Data tables: `table.data-table`
- Action buttons: `button:has-text("ButtonText")`

### Messages Tab
- New message button: `button:has-text("Nouveau message")`
- Message cards: `.message-card`
- Channel badge: `.channel-badge`
- Direction badge: `.direction-badge`
- Message timestamp: `.message-timestamp`
- Message content: `.message-content`

### Appointments Tab
- Planifier button: `button:has-text("Planifier")`
- Appointments table: `table.data-table`
- Status badge: `.status-badge`
- Edit button: `button.btn-edit`
- Delete button: `button.btn-delete`
- Complete button: `button.btn-complete`

### Audit Tab
- Audit table: `table.audit-table`
- Entity type filter: `select#entity-type-filter`
- Action filter: `select#action-filter`
- Audit action badge: `.audit-action-badge`
- Date cell: `td.audit-date`
- Changes cell: `td.audit-changes`

---

## Test Environment Requirements

### Backend
- Spring Boot application running on http://localhost:8080
- PostgreSQL database (or H2 for testing)
- Test data: At least one organization (ORG-001)

### Frontend
- Angular development server on http://localhost:4200
- Proxy configuration for API calls
- Mock authentication enabled

### External Services
- None required (uses mock authentication)

---

## Known Limitations

1. **Authentication**: Tests use mock authentication. Real OAuth2/OIDC flow not tested.
2. **Data Cleanup**: Tests do not clean up created data. May accumulate test data over time.
3. **Timing**: Uses fixed timeouts in some places. May need adjustment for slower environments.
4. **Browser Support**: Tested on Chromium, Firefox, and WebKit. Mobile browsers not covered.

---

## Future Enhancements

1. Add data cleanup after tests
2. Test file upload scenarios
3. Test export/import functionality
4. Test real OAuth2/OIDC flow
5. Add mobile responsive tests
6. Add accessibility (a11y) tests
7. Add performance tests
8. Add visual regression tests
9. Test error handling scenarios
10. Test concurrent user scenarios

---

## Maintenance Guide

### Adding New Tests
1. Create new spec file in `e2e/` directory
2. Import auth fixture: `import { test, expect } from './auth.fixture'`
3. Use page objects when available
4. Follow existing naming conventions
5. Add documentation to this file

### Updating Selectors
1. Check if selector is used in page objects
2. Update page object if needed
3. Update all tests using the selector
4. Run tests to verify changes

### Debugging Failed Tests
1. Run with `--debug` flag: `npx playwright test --debug`
2. Check screenshots in `test-results/`
3. Check traces in `test-results/`
4. Use Playwright Inspector
5. Check browser console logs

### CI/CD Integration
1. Use example workflow: `ci-example.yml`
2. Ensure backend and database are running
3. Set CI=true environment variable
4. Upload artifacts on failure
5. Set appropriate timeouts
