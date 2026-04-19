# WhatsApp Rate Limiting and Cost Tracking

This document describes the WhatsApp rate limiting implementation with hierarchical quotas and cost tracking based on Meta's pricing model.

## Overview

The system enforces WhatsApp messaging limits using a tiered quota system and tracks conversation costs according to Meta's pricing structure.

## Quota Tiers

The system supports four quota tiers based on Meta's business limits:

| Tier | Daily Limit | Description |
|------|-------------|-------------|
| 1 | 1,000 | Default tier for new organizations |
| 2 | 10,000 | Medium volume tier |
| 3 | 100,000 | High volume tier |
| 4 | Unlimited | Enterprise tier (no daily limit) |

## Conversation Types and Pricing

Cost per conversation is based on Meta's pricing model:

| Type | Cost per Conversation | Description |
|------|----------------------|-------------|
| MARKETING | $0.042 | Promotional messages |
| UTILITY | $0.014 | Order confirmations, updates |
| AUTHENTICATION | $0.012 | OTP, verification codes |
| SERVICE | $0.004 | Customer support messages |

## Architecture

### Components

1. **WhatsAppRateLimitService**: Core service for quota enforcement
   - Manages hierarchical quota limits per organization
   - Uses Redis for high-performance counters with database fallback
   - Emits Prometheus metrics for quota utilization

2. **QuotaExceededHandler**: Handles quota exceeded scenarios
   - Sets message status to THROTTLED when quota is exceeded
   - Queues messages for retry when quota resets

3. **WhatsAppCostTrackingService**: Tracks conversation costs
   - Records cost per conversation based on type
   - Calculates projected monthly costs
   - Provides cost breakdown by conversation type

4. **WhatsAppQuotaResetScheduler**: Scheduled task
   - Checks for quota resets every 5 minutes
   - Requeues throttled messages when quota window resets

5. **WhatsAppDiagnosticsController**: Admin API endpoints
   - `GET /api/v1/admin/whatsapp/quota-usage`: Real-time quota usage and cost projections
   - `POST /api/v1/admin/whatsapp/quota-tier`: Update organization quota tier

### Database Schema

**organization_settings table**:
- Added `whatsapp_quota_tier` column (default: 1)

**whatsapp_cost_tracking table**:
- Tracks individual conversation costs
- Fields: org_id, message_id, conversation_type, cost_per_conversation, phone_number, timestamps

### Message Flow

1. **Outbound Message Processing**:
   ```
   OutboundJobWorker → WhatsAppRateLimitService.checkAndConsumeQuota()
   ├─ Quota Available → Send message → Track cost
   └─ Quota Exceeded → QuotaExceededHandler.handleQuotaExceeded()
                     → Status = THROTTLED
                     → Next retry = quota reset time
   ```

2. **Quota Reset**:
   ```
   WhatsAppQuotaResetScheduler (every 5 min)
   └─ Check reset_at timestamp
      └─ Reset quota → Requeue THROTTLED messages → Status = QUEUED
   ```

3. **Cost Tracking**:
   ```
   Message Sent Successfully → WhatsAppCostTrackingService.trackConversationCost()
   └─ Store: conversation_type, cost, phone_number, timestamp
   ```

## Prometheus Metrics

The system emits the following Prometheus metrics:

- `whatsapp_quota_utilization{org_id}`: Quota utilization percentage (0-100%)
- `whatsapp_quota_used{org_id}`: Number of messages sent in current window
- `whatsapp_quota_limit{org_id}`: Total quota limit for the organization
- `whatsapp_quota_remaining{org_id}`: Remaining quota in current window

## API Endpoints

### Get Quota Usage

```http
GET /api/v1/admin/whatsapp/quota-usage?orgId={optional}
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "organizations": [
    {
      "orgId": "org-123",
      "quotaTier": 2,
      "quotaLimit": 10000,
      "messagesSent": 5234,
      "remainingQuota": 4766,
      "utilizationPercentage": 52.34,
      "resetAt": "2024-01-15T00:00:00",
      "throttled": false,
      "costProjection": {
        "totalCostToday": 12.45,
        "totalCostThisMonth": 245.67,
        "projectedMonthlyCost": 368.50,
        "conversationCountToday": 312,
        "conversationCountThisMonth": 6142,
        "costBreakdown": {
          "marketing": {
            "conversationType": "marketing",
            "count": 2000,
            "totalCost": 84.00
          },
          "utility": {
            "conversationType": "utility",
            "count": 3000,
            "totalCost": 42.00
          }
        }
      }
    }
  ],
  "timestamp": "2024-01-14T15:30:00"
}
```

### Update Quota Tier

```http
POST /api/v1/admin/whatsapp/quota-tier?orgId=org-123&tier=3
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "success": true,
  "orgId": "org-123",
  "tier": 3,
  "quotaLimit": 100000,
  "message": "Quota tier updated to 3 for organization org-123"
}
```

## Configuration

### Redis Configuration

The service uses Redis for high-performance quota counters with TTL matching the quota window (24 hours).

Redis keys:
- `whatsapp:ratelimit:counter:{orgId}`: Message counter
- `whatsapp:ratelimit:limit:{orgId}`: Quota limit
- `whatsapp:ratelimit:throttle:{orgId}`: Throttle timestamp

### Fallback Behavior

If Redis is unavailable, the service automatically falls back to database-based quota tracking using the `whatsapp_rate_limit` table.

## Monitoring

Monitor these key metrics in production:

1. **Quota Utilization**: Track organizations approaching their limits
2. **Throttled Messages**: Monitor THROTTLED status to identify capacity issues
3. **Cost Trends**: Watch for unexpected cost spikes
4. **Quota Resets**: Verify scheduled requeue operations are working

## Example Scenarios

### Scenario 1: Quota Exceeded

1. Organization sends 1000 messages (tier 1 limit)
2. Next message triggers quota check
3. Message status set to THROTTLED
4. Message queued for retry at next quota reset (00:00 UTC)
5. Scheduler requeues message when quota resets

### Scenario 2: Tier Upgrade

1. Admin calls `POST /api/v1/admin/whatsapp/quota-tier?orgId=org-123&tier=2`
2. `organization_settings.whatsapp_quota_tier` updated to 2
3. `whatsapp_rate_limit.quota_limit` updated to 10,000
4. Redis limit key updated
5. Organization can now send 10,000 messages/day

### Scenario 3: Cost Tracking

1. Message sent successfully
2. `WhatsAppCostTrackingService.trackConversationCost()` called
3. Conversation type determined (e.g., UTILITY)
4. Cost recorded: $0.014
5. Monthly cost projection updated
6. Cost breakdown available via `/quota-usage` endpoint

## Migration

Database migration: `V139__Add_whatsapp_quota_tier_and_cost_tracking.sql`

Run with:
```bash
cd backend
mvn flyway:migrate
```

## Testing

Key test scenarios:
1. Quota enforcement at tier boundaries
2. Redis fallback to database
3. THROTTLED message requeuing
4. Cost calculation accuracy
5. Tier upgrade/downgrade
6. Prometheus metrics emission
