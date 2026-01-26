# Shepherd.js Guided Tour System Implementation

## Overview

Complete implementation of an interactive guided tour system using Shepherd.js with 5 core tours, progress tracking, backend persistence, and analytics.

## Architecture

### Frontend Components

#### 1. TourDefinitionService (`services/tour-definition.service.ts`)
- **Purpose**: Centralized repository for all tour definitions
- **Features**:
  - 5 core tours: Dashboard Overview, Create Dossier, Message Workflow, Status Transitions, Reports
  - Category-based tour organization (core, feature, advanced)
  - Estimated time tracking
  - Route requirements validation
  - Comprehensive step definitions with HTML content

#### 2. OnboardingTourService (`services/onboarding-tour.service.ts`)
- **Purpose**: Tour execution engine and state management
- **Features**:
  - Tour lifecycle management (start, complete, cancel, abandon)
  - LocalStorage persistence for offline capability
  - Backend synchronization via UserPreferences API
  - Analytics tracking with step-by-step abandonment rates
  - Google Analytics 4 integration support
  - Auto-start tours based on route navigation
  - Abandonment tracking at specific steps

#### 3. TourProgressComponent (`components/tour-progress.component.ts`)
- **Purpose**: Visual dashboard for tour completion tracking
- **Features**:
  - Overall completion percentage display
  - Individual tour status (completed/pending)
  - Card-based UI with tour metadata (duration, steps count)
  - Start/restart/reset tour actions
  - Responsive grid layout
  - Dark theme support

### Backend API

#### 1. UserPreferencesEntity (`entity/UserPreferencesEntity.java`)
- **New Field**: `tour_progress` (JSONB)
- **Purpose**: Persist tour state across sessions and devices

#### 2. UserPreferencesController (`controller/UserPreferencesController.java`)
- **New Endpoints**:
  - `PUT /api/v1/user-preferences/{userId}/tour-progress` - Update tour progress
  - `GET /api/v1/user-preferences/{userId}/tour-progress` - Get tour progress

#### 3. Database Migration (`V107__add_tour_progress_to_user_preferences.sql`)
- **Changes**:
  - Added `tour_progress` JSONB column
  - GIN index for efficient JSON queries
  - Column documentation

### User Interface Integration

#### App Layout (`layout/app-layout/app-layout.component.html`)
- **Tour Controls in User Menu**:
  - Completion percentage badge
  - Quick access to all 5 core tours
  - Skip/Restart all tours actions
  - Visual completion indicators
  - Submenu with progress tracking

#### Help Menu
- **Existing Integration**:
  - Tour launcher buttons for each core tour
  - Reset all tours option
  - Accessible via help icon in toolbar

## Tour Definitions

### 1. Dashboard Overview Tour (`dashboard-overview`)
- **Duration**: 3 minutes
- **Steps**: 7
- **Coverage**:
  - KPI widgets explanation
  - Recent dossiers widget
  - My tasks widget
  - Global search bar
  - Navigation menu shortcuts
  - Notification center
- **Required Route**: `/dashboard`

### 2. Create Dossier Tour (`create-dossier`)
- **Duration**: 2 minutes
- **Steps**: 7
- **Coverage**:
  - Lead name field
  - Phone number with duplicate detection
  - Email address
  - Lead source selection
  - Annonce linking
  - Form submission
- **Required Route**: `/dossiers/create`

### 3. Message Workflow Tour (`message-workflow`)
- **Duration**: 4 minutes
- **Steps**: 7
- **Coverage**:
  - Message history
  - Channel selection (Email, SMS, WhatsApp)
  - Message templates
  - Delivery status tracking
  - Rate limiting information
- **Required Route**: None (can start anywhere)

### 4. Status Transitions Tour (`status-transitions`)
- **Duration**: 3 minutes
- **Steps**: 6
- **Coverage**:
  - Status badge explanation
  - Workflow progression
  - Terminal states (GAGNÉ/PERDU)
  - Status history audit trail
  - Automated actions
- **Required Route**: None (can start anywhere)

### 5. Reports Tour (`reports`)
- **Duration**: 4 minutes
- **Steps**: 8
- **Coverage**:
  - KPI cards
  - Date range filtering
  - Pipeline chart
  - Conversion funnel
  - Activity timeline
  - Data export options
  - Custom reports
- **Required Route**: `/reports`

## Analytics Tracking

### Tracked Events

#### Tour Lifecycle
- `started` - Tour initiated by user
- `completed` - Tour finished successfully
- `skipped` - User clicked skip before starting
- `abandoned` - User cancelled mid-tour
- `step_completed` - Individual step viewed
- `step_abandoned` - User abandoned at specific step

### Analytics Data Structure

```typescript
interface TourAnalytics {
  tourId: string;
  action: 'started' | 'completed' | 'skipped' | 'abandoned' | 'step_completed' | 'step_abandoned';
  step?: number;
  stepName?: string;
  timestamp: string;
  duration?: number;
  userId?: string;
}
```

### Abandonment Rate Calculation

```typescript
// Overall abandonment rate for a tour
abandonmentRate = (totalAbandonments / (totalStarts * totalSteps)) * 100

// Per-step abandonment rate
stepAbandonmentRate = (stepAbandonments / totalStarts) * 100
```

### Google Analytics 4 Integration

The system automatically sends tour events to GA4 if `window.gtag` is available:

```typescript
window.gtag('event', action, {
  event_category: 'Tour',
  event_label: tourId,
  tour_step: stepName || step,
  tour_duration: duration,
  user_id: userId
});
```

## Styling

### Shepherd.js Custom Theme (`styles.css`)
- **Custom Colors**: Purple gradient header (#667eea to #764ba2)
- **Rounded Corners**: 8px border radius
- **Enhanced Buttons**: Hover effects with transform
- **Modal Overlay**: 50% opacity black background
- **Target Highlighting**: 4px purple glow effect
- **Dark Theme Support**: Full dark mode compatibility

### Component Styles
- **TourProgressComponent**: Card-based grid layout with gradient overview section
- **User Menu**: Progress badge with gradient background
- **Tour Status Icons**: Green checkmarks for completed tours

## User Controls

### User Menu Submenu
1. **View All Tours** - Navigate to tour progress page
2. **Quick Tour Launchers** - Start any of the 5 core tours
3. **Skip All Tours** - Mark all as skipped
4. **Restart All Tours** - Reset all progress

### Tour Progress Page
1. **Overall Progress** - Visual progress bar and statistics
2. **Tour Cards** - Individual tour details with start/restart buttons
3. **Reset Actions** - Per-tour and global reset options

### Help Menu
1. **Interactive Guides Header** - Clear categorization
2. **Tour Launchers** - Quick access to core tours
3. **Reset All** - Global reset option

## Backend Persistence

### Storage Strategy
1. **LocalStorage** - Immediate persistence, offline support
2. **Backend API** - Cross-device synchronization
3. **Sync on Change** - Automatic sync after every progress update

### Data Sync Flow
```
User Action → LocalStorage Update → Backend API Call (async)
            ↓
    Analytics Tracking
```

### Conflict Resolution
- LocalStorage is source of truth
- Backend sync is best-effort (failures are logged but don't block UX)
- On login, backend state is loaded and merged with local state

## Tour State Management

### Progress Object Structure

```typescript
{
  "dashboard-overview": {
    "completed": true,
    "completedAt": "2024-01-15T10:30:00Z",
    "currentStep": 7,
    "skipped": false
  },
  "create-dossier": {
    "completed": false,
    "abandonedAt": "2024-01-15T10:45:00Z",
    "stepAbandonment": {
      "3": 2,  // Abandoned at step 3 twice
      "5": 1   // Abandoned at step 5 once
    }
  }
}
```

### State Transitions

```
NEW → STARTED → (COMPLETED | ABANDONED | SKIPPED)
                      ↓
              [step_completed events]
```

## Accessibility

### WCAG Compliance
- **Keyboard Navigation**: Full keyboard support via Shepherd.js
- **ARIA Labels**: Proper labeling of all interactive elements
- **Focus Management**: Automatic focus on tour steps
- **Screen Reader Support**: Semantic HTML in tour content
- **Skip Options**: Always available to exit tours

### Responsive Design
- **Mobile Support**: Touch-friendly buttons and overlays
- **Tablet Support**: Optimized layout for medium screens
- **Desktop Support**: Full-featured experience

## Usage Examples

### Start a Tour Programmatically

```typescript
// In a component
constructor(private onboardingTourService: OnboardingTourService) {}

startDashboardTour() {
  this.onboardingTourService.startManualTour('dashboard-overview');
}
```

### Check Tour Completion

```typescript
const isCompleted = this.onboardingTourService.isTourCompleted('create-dossier');
```

### Get Abandonment Rates

```typescript
// Overall abandonment rate
const rate = this.onboardingTourService.getAbandonmentRate('message-workflow');

// Per-step abandonment rates
const stepRates = this.onboardingTourService.getStepAbandonmentRates('message-workflow');
// Returns: { 0: 5.2, 1: 3.8, 2: 12.4, ... }
```

### Reset Tour Progress

```typescript
// Reset specific tour
this.onboardingTourService.resetTour('reports');

// Reset all tours
this.onboardingTourService.resetAllTours();
```

## Testing

### Unit Tests
- **TourDefinitionService**: Tour retrieval and structure validation
- **TourProgressComponent**: Component initialization and progress calculation
- **OnboardingTourService**: State management and analytics tracking

### Test Coverage
- Service instantiation
- Tour definitions validation
- Progress calculation
- Completion status checking
- Analytics event logging

## Future Enhancements

### Potential Additions
1. **Scheduled Tours**: Auto-start tours based on user tenure or feature usage
2. **Contextual Tours**: Dynamic tours based on user role or permissions
3. **Tour Recommendations**: ML-based suggestions for helpful tours
4. **Video Tutorials**: Integrate video content into tour steps
5. **Gamification**: Badges or rewards for completing tours
6. **A/B Testing**: Test different tour content and measure effectiveness
7. **Multi-language Support**: Internationalized tour content
8. **Tour Builder UI**: Admin interface to create custom tours without code

### Analytics Enhancements
1. **Heatmaps**: Visualize where users spend most time
2. **Completion Funnels**: Detailed drop-off analysis
3. **Cohort Analysis**: Compare tour effectiveness across user segments
4. **Retention Impact**: Measure correlation between tour completion and user retention

## Maintenance

### Adding New Tours
1. Define tour in `TourDefinitionService.initializeTours()`
2. Add tour ID to type union in `OnboardingTourService.startManualTour()`
3. Add menu item to user menu submenu (if core tour)
4. Update documentation

### Updating Tour Content
1. Locate tour definition in `TourDefinitionService`
2. Update step text, titles, or attachments
3. Test tour flow end-to-end
4. Update estimated time if necessary

### Monitoring Analytics
1. Check LocalStorage analytics key: `onboarding_tour_analytics`
2. Query backend for aggregated tour progress
3. Monitor GA4 dashboard for tour events
4. Analyze abandonment rates for optimization opportunities

## Dependencies

### NPM Packages
- `shepherd.js@^11.2.0` - Tour library

### Angular Services
- `HttpClient` - Backend API communication
- `Router` - Navigation and route detection
- `AuthService` - User identification

### Material Components
- `MatCard` - Tour progress cards
- `MatIcon` - Icons throughout UI
- `MatMenu` - User menu integration
- `MatProgressBar` - Progress visualization
- `MatButton` - Action buttons
- `MatChips` - Status indicators

## Files Created/Modified

### New Files
- `frontend/src/app/services/tour-definition.service.ts`
- `frontend/src/app/services/tour-definition.service.spec.ts`
- `frontend/src/app/components/tour-progress.component.ts`
- `frontend/src/app/components/tour-progress.component.html`
- `frontend/src/app/components/tour-progress.component.css`
- `frontend/src/app/components/tour-progress.component.spec.ts`
- `frontend/src/typings.d.ts`
- `backend/src/main/resources/db/migration/V107__add_tour_progress_to_user_preferences.sql`

### Modified Files
- `frontend/src/app/services/onboarding-tour.service.ts` - Enhanced with backend sync and analytics
- `frontend/src/app/layout/app-layout/app-layout.component.html` - Added tour submenu
- `frontend/src/app/layout/app-layout/app-layout.component.ts` - Added tour controls
- `frontend/src/styles.css` - Added Shepherd.js customization
- `backend/src/main/java/com/example/backend/entity/UserPreferencesEntity.java` - Added tour_progress field
- `backend/src/main/java/com/example/backend/dto/UserPreferencesDTO.java` - Added tour_progress field
- `backend/src/main/java/com/example/backend/service/UserPreferencesService.java` - Added tour progress methods
- `backend/src/main/java/com/example/backend/controller/UserPreferencesController.java` - Added tour progress endpoints

## Conclusion

The Shepherd.js guided tour system provides a comprehensive onboarding experience with:
- ✅ 5 detailed core tours covering all major features
- ✅ Real-time progress tracking with visual feedback
- ✅ Backend persistence for cross-device continuity
- ✅ Detailed analytics with step-by-step abandonment tracking
- ✅ User-friendly controls in menu dropdowns
- ✅ Skip and restart functionality
- ✅ Dark theme support
- ✅ Responsive design for all devices
- ✅ Google Analytics integration ready

The system is production-ready and can be extended with additional tours and features as needed.
