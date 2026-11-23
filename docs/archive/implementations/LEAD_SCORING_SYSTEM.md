# Lead Scoring and Qualification Automation System

## Overview

The Lead Scoring and Qualification Automation system provides intelligent, automated lead prioritization and qualification based on configurable scoring rules. It helps sales teams focus on the most promising leads by automatically calculating scores based on multiple factors and transitioning high-scoring leads through the sales pipeline.

## Features

### 1. **LeadScoringEngine**
Calculates lead scores based on configurable weights across four key dimensions:

#### Source Score
- **Referral**: 25 points (default)
- **Phone**: 20 points
- **Walk-in**: 18 points
- **Web**: 15 points
- **Mobile**: 15 points
- **Social Media**: 12 points
- **Email**: 10 points
- **Unknown**: 5 points

#### Response Time Score
- **Fast Response** (<60 minutes): Full weight (20 points default)
- **Medium Response** (60-240 minutes): Half weight (10 points)
- **Slow Response** (>240 minutes): 0 points

#### Engagement Score
- **Inbound Messages**: 5 points per message (max 5 messages)
- **Outbound Messages**: 2 points per message (max 10 messages)
- **Appointments**: 15 points per appointment
- **Maximum**: 50 points

#### Property Match Score
- **Has Property**: 10 points
- **Has Price Info**: 5 points
- **Has Photos**: 5 points
- **No Property**: 0 points

### 2. **AutoQualificationService**
Scheduled service that runs every 5 minutes (configurable) to:
- Scan all NEW status dossiers
- Calculate lead scores
- Auto-transition dossiers from NEW to QUALIFYING when score >= threshold (default: 70)
- Records status transitions with audit trail

**Configuration:**
```yaml
lead:
  qualification:
    check:
      interval: 300000  # 5 minutes in milliseconds
      initial:
        delay: 60000    # 1 minute initial delay
```

### 3. **EmailDigestService**
Sends daily email digests to agents with high-priority leads.

**Features:**
- Runs Monday-Friday at 8:00 AM (configurable via cron)
- Groups leads by organization
- Filters leads above qualification threshold
- Shows top 20 high-priority leads per organization
- Color-coded urgency indicators:
  - **Urgent** (score >= threshold + 20): Red
  - **High** (score >= threshold + 10): Orange
  - **Medium** (score >= threshold): Blue

**Configuration:**
```yaml
lead:
  digest:
    cron: "0 0 8 * * MON-FRI"  # 8 AM weekdays
```

**Email Template:**
- HTML and plain text versions
- Lead details: name, phone, email, source, creation time
- Score breakdown for each lead
- Direct links to view dossiers

### 4. **LeadScoringConfigController**
RESTful API for managing scoring configurations and viewing prioritized leads.

#### Endpoints

**Configuration Management:**
```
GET    /api/lead-scoring/config              # List all configurations
GET    /api/lead-scoring/config/active       # Get active configuration
GET    /api/lead-scoring/config/{id}         # Get specific configuration
POST   /api/lead-scoring/config              # Create new configuration
PUT    /api/lead-scoring/config/{id}         # Update configuration
DELETE /api/lead-scoring/config/{id}         # Delete configuration
```

**Scoring Operations:**
```
POST   /api/lead-scoring/calculate/{dossierId}  # Calculate score for dossier
GET    /api/lead-scoring/score/{dossierId}      # Get score for dossier
GET    /api/lead-scoring/priority-queue?limit=50 # Get prioritized leads
POST   /api/lead-scoring/recalculate-all        # Recalculate all scores
```

### 5. **LeadPriorityQueue Component** (Frontend)
Interactive dashboard displaying prioritized leads.

**Features:**
- Real-time priority queue sorted by score
- Color-coded urgency indicators
- Score breakdown visualization
- Quick actions: view, refresh, recalculate
- Responsive design for mobile/desktop
- Relative timestamps (e.g., "2h ago", "3d ago")

**Visual Indicators:**
- **Urgent**: Red border, light red background
- **High**: Orange border, light orange background
- **Medium**: Blue border, light blue background
- **Low**: Gray border

### 6. **LeadScoringConfigDialog Component** (Frontend)
Admin interface for tuning scoring weights.

**Features:**
- Tabbed interface for different weight categories
- Interactive sliders for weight adjustment
- Real-time weight display
- Active/inactive configuration toggle
- Auto-qualification threshold setting
- Response time thresholds configuration

## Database Schema

### `lead_scoring_config` Table
```sql
id                              BIGSERIAL PRIMARY KEY
org_id                          VARCHAR(255) NOT NULL
config_name                     VARCHAR(255) NOT NULL
is_active                       BOOLEAN DEFAULT true
auto_qualification_threshold    INTEGER DEFAULT 70
source_weights                  JSONB
engagement_weights              JSONB
property_match_weights          JSONB
response_time_weight            INTEGER DEFAULT 20
fast_response_minutes           INTEGER DEFAULT 60
medium_response_minutes         INTEGER DEFAULT 240
created_at                      TIMESTAMP NOT NULL
updated_at                      TIMESTAMP NOT NULL
```

### `lead_score` Table
```sql
id                      BIGSERIAL PRIMARY KEY
org_id                  VARCHAR(255) NOT NULL
dossier_id              BIGINT NOT NULL (FK -> dossier.id)
total_score             INTEGER NOT NULL DEFAULT 0
source_score            INTEGER DEFAULT 0
response_time_score     INTEGER DEFAULT 0
engagement_score        INTEGER DEFAULT 0
property_match_score    INTEGER DEFAULT 0
score_breakdown         JSONB
last_calculated_at      TIMESTAMP
created_at              TIMESTAMP NOT NULL
updated_at              TIMESTAMP NOT NULL
```

**Indexes:**
- `idx_lead_scoring_config_org_id` - Organization lookup
- `idx_lead_scoring_config_active` - Active config lookup
- `idx_lead_score_dossier_id` - Dossier score lookup
- `idx_lead_score_org_id` - Organization score lookup
- `idx_lead_score_total_score` - Priority queue sorting
- `idx_lead_score_dossier_unique` - One score per dossier

## Usage Examples

### Backend API Usage

**Get Priority Queue:**
```bash
curl -X GET http://localhost:8080/api/lead-scoring/priority-queue?limit=20
```

**Create Scoring Configuration:**
```bash
curl -X POST http://localhost:8080/api/lead-scoring/config \
  -H "Content-Type: application/json" \
  -d '{
    "configName": "High-Touch Sales",
    "isActive": true,
    "autoQualificationThreshold": 75,
    "sourceWeights": {
      "referral": 30,
      "phone": 25,
      "web": 15
    },
    "responseTimeWeight": 25,
    "fastResponseMinutes": 30
  }'
```

**Calculate Score for Dossier:**
```bash
curl -X POST http://localhost:8080/api/lead-scoring/calculate/123
```

**Recalculate All Scores:**
```bash
curl -X POST http://localhost:8080/api/lead-scoring/recalculate-all
```

### Frontend Integration

**Import LeadPriorityQueue Component:**
```typescript
import { LeadPriorityQueueComponent } from './components/lead-priority-queue.component';

@Component({
  imports: [LeadPriorityQueueComponent],
  template: `<app-lead-priority-queue></app-lead-priority-queue>`
})
export class DashboardComponent {}
```

**Open Scoring Config Dialog:**
```typescript
import { LeadScoringConfigDialogComponent } from './components/lead-scoring-config-dialog.component';

openConfigDialog() {
  const dialogRef = this.dialog.open(LeadScoringConfigDialogComponent, {
    width: '800px',
    data: { config: this.activeConfig }
  });
}
```

**Use Lead Scoring API Service:**
```typescript
import { LeadScoringApiService } from './services/lead-scoring-api.service';

constructor(private leadScoringApi: LeadScoringApiService) {}

loadPriorityLeads() {
  this.leadScoringApi.getPriorityQueue(50).subscribe(leads => {
    console.log('Priority leads:', leads);
  });
}
```

## Configuration

### Application Properties

**Auto-Qualification Job:**
```yaml
lead.qualification.check.interval: 300000      # Run every 5 minutes
lead.qualification.check.initial.delay: 60000  # Start after 1 minute
```

**Email Digest Job:**
```yaml
lead.digest.cron: "0 0 8 * * MON-FRI"  # Monday-Friday at 8 AM
```

### Default Configuration
When no active configuration exists, the system automatically creates a default configuration with balanced weights suitable for general real estate lead management.

## Monitoring and Logging

The system logs key operations:

```
INFO  - Calculated lead score for dossier 123: total=85, source=25, responseTime=20, engagement=25, propertyMatch=15
INFO  - Auto-qualified dossier 123 with score 85
INFO  - Starting auto-qualification job
INFO  - Auto-qualification job completed. Scored: 42, Qualified: 8
INFO  - Sent daily digest to agent@example.com for org ORG123 with 12 high-priority leads
```

## Performance Considerations

- Scores are cached and only recalculated on-demand or via scheduled job
- Priority queue queries use optimized indexes for fast sorting
- Email digests are sent asynchronously to avoid blocking
- Batch processing of dossiers limits to 100 per job run
- JSON columns efficiently store variable scoring weights

## Best Practices

1. **Tune Threshold Gradually**: Start with default threshold (70) and adjust based on conversion rates
2. **Review Regularly**: Weekly review of scoring accuracy vs. actual conversions
3. **Custom Configurations**: Create org-specific configurations for different market segments
4. **Monitor Email Digests**: Ensure agents are receiving and acting on daily digests
5. **Recalculate Periodically**: Use recalculate-all endpoint after configuration changes

## Security

- All endpoints respect organization isolation (multi-tenant)
- Configuration changes require admin privileges
- Email digests only sent to configured agent emails
- Audit trail maintained for status transitions

## Future Enhancements

- Machine learning-based dynamic weight adjustment
- A/B testing of different scoring configurations
- Integration with external data sources (credit scores, property values)
- Predictive conversion probability scoring
- Real-time notifications for urgent leads
- SMS/WhatsApp digest delivery options
