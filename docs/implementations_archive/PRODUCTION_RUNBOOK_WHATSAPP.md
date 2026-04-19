# Production Runbook - WhatsApp Messaging Operations

## Overview

This runbook provides comprehensive incident response procedures for WhatsApp messaging operations in production environments. It covers provider outages, webhook signature validation failures, dead letter queue (DLQ) processing, outbound queue backup scenarios, manual retry procedures, escalation workflows, and common troubleshooting scenarios.

**Last Updated:** 2024-01-15  
**Version:** 3.0  
**Owned By:** Platform Engineering Team  
**Review Schedule:** Quarterly

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [OpenTelemetry Trace Spans for Failed Sends](#opentelemetry-trace-spans-for-failed-sends)
3. [Diagnostics Endpoints Decision Tree](#diagnostics-endpoints-decision-tree)
4. [Error Code Retryability Matrix](#error-code-retryability-matrix)
5. [Recovering Stuck Messages](#recovering-stuck-messages)
6. [Grafana Dashboard for WhatsApp SLA Metrics](#grafana-dashboard-for-whatsapp-sla-metrics)
7. [Jaeger Multi-Hop Delivery Tracing](#jaeger-multi-hop-delivery-tracing)
8. [WhatsApp Provider Outages](#whatsapp-provider-outages)
9. [Webhook Signature Validation Failures](#webhook-signature-validation-failures)
10. [Dead Letter Queue (DLQ) Processing](#dead-letter-queue-dlq-processing)
11. [Outbound Queue Backup Scenarios](#outbound-queue-backup-scenarios)
12. [Manual Operations Scripts](#manual-operations-scripts)
13. [Escalation Matrix](#escalation-matrix)
14. [Monitoring & Alerts](#monitoring--alerts)
15. [Common Troubleshooting Scenarios](#common-troubleshooting-scenarios)
16. [Database Maintenance](#database-maintenance)

---

## Quick Reference

### Critical Endpoints

**Production:**
- Backend API: `https://api.atlas-immobilier.com`
- Actuator Health: `https://api.atlas-immobilier.com/actuator/health`
- Metrics: `https://api.atlas-immobilier.com/actuator/prometheus`
- Grafana: `https://grafana.atlas-immobilier.com`
- Kibana: `https://kibana.atlas-immobilier.com`
- Prometheus: `https://prometheus.atlas-immobilier.com`
- Jaeger: `https://jaeger.atlas-immobilier.com`

**Staging:**
- Backend API: `https://api-staging.atlas-immobilier.com`
- Actuator Health: `https://api-staging.atlas-immobilier.com/actuator/health`

### WhatsApp Diagnostics Endpoints (v2)

All diagnostics endpoints require `ADMIN` role.

```bash
# Get active session windows
GET /api/v2/diagnostics/whatsapp/sessions?active=true&limit=100

# Get retry queue status
GET /api/v2/diagnostics/whatsapp/retry-queue?limit=100

# Dry-run message send validation
POST /api/v2/diagnostics/whatsapp/dry-run-send
{
  "phoneNumber": "+33612345678",
  "templateCode": "appointment_reminder",
  "dossierId": 123
}

# Get error patterns (last 24h)
GET /api/v2/diagnostics/whatsapp/error-patterns?hours=24
```

### Key Database Tables

```sql
-- Primary tables for outbound messaging
outbound_message          -- Main message queue
outbound_attempt          -- Retry attempt history with backoff tracking
whatsapp_provider_config  -- Provider credentials and configuration
whatsapp_rate_limit       -- Rate limiting state per organization
whatsapp_session_window   -- 24-hour session window tracking
consentement              -- User consent records (required for WhatsApp)
message                   -- Inbound message storage
```

### Key Metrics (Prometheus)

```promql
# Queue depth - messages waiting to be sent
outbound_message_queue_depth{status="QUEUED"}

# DLQ size - failed messages needing review
outbound_message_dlq_size

# Failure rate - percentage of failed sends
rate(outbound_message_failures_total{channel="WHATSAPP"}[5m])

# Success rate - percentage of successful deliveries
rate(outbound_message_sent_total{channel="WHATSAPP"}[5m]) / 
rate(outbound_message_total{channel="WHATSAPP"}[5m])

# Rate limit hits - quota exhaustion events
whatsapp_rate_limit_hits_total

# Average delivery latency
histogram_quantile(0.95, 
  rate(outbound_message_delivery_duration_seconds_bucket{channel="WHATSAPP"}[5m])
)

# Stuck messages - messages not progressing
outbound_message_stuck_total{status=~"QUEUED|SENDING"}
```

### Quick Health Check Commands

```bash
# Backend health
curl -sf https://api.atlas-immobilier.com/actuator/health | jq '.status'

# Queue status summary
psql -h prod-db.internal -U atlas -d atlas -c "
SELECT status, COUNT(*) as count 
FROM outbound_message 
WHERE created_at > NOW() - INTERVAL '24 hours' 
GROUP BY status ORDER BY status;"

# Recent failures summary
psql -h prod-db.internal -U atlas -d atlas -c "
SELECT error_code, COUNT(*) as count, MAX(error_message) as example 
FROM outbound_message 
WHERE status='FAILED' AND created_at > NOW() - INTERVAL '1 hour' 
GROUP BY error_code ORDER BY count DESC LIMIT 10;"

# DLQ size
psql -h prod-db.internal -U atlas -d atlas -c "
SELECT COUNT(*) as dlq_size 
FROM outbound_message 
WHERE status='FAILED' AND attempt_count >= max_attempts;"

# Rate limit status
psql -h prod-db.internal -U atlas -d atlas -c "
SELECT org_id, messages_sent_count, quota_limit, 
       ROUND(100.0 * messages_sent_count / quota_limit, 2) as usage_pct,
       throttle_until 
FROM whatsapp_rate_limit 
WHERE messages_sent_count > quota_limit * 0.8 
ORDER BY usage_pct DESC;"
```

---

## OpenTelemetry Trace Spans for Failed Sends

### Understanding Trace Span Hierarchy

WhatsApp message sending creates a multi-level trace with the following span hierarchy:

```
outbound-message-process (parent span)
├── whatsapp-cloud-api-send (provider span)
│   ├── http.client.request (RestTemplate span)
│   │   └── Meta API HTTP call
│   └── session.window.check (conditional)
├── database.save (JPA span)
└── metrics.record (observability span)
```

### Interpreting Failed Send Traces

#### 1. Session Window Expiry Failure

**Trace Pattern:**
```
Span: outbound-message-process
  └─ message.id: 12345
  └─ message.channel: WHATSAPP
  └─ org.id: org-abc-123
  └─ message.attempt: 1

  Span: whatsapp-cloud-api-send
    └─ within.session.window: false
    └─ has.template: false
    └─ error: session_expired
    └─ status: FAILED
    └─ duration: 45ms
```

**Interpretation:**
- Message attempted outside 24-hour session window
- No template provided (freeform message)
- Fast failure (45ms) - validation check, not API call
- **Root Cause:** Session window expired, template required

**Resolution:**
1. Check session window status: `GET /api/v2/diagnostics/whatsapp/sessions`
2. Use dry-run to validate: `POST /api/v2/diagnostics/whatsapp/dry-run-send`
3. Update message with approved template or wait for inbound message

#### 2. Rate Limit Exceeded

**Trace Pattern:**
```
Span: outbound-message-process
  └─ message.id: 12346
  └─ message.channel: WHATSAPP
  └─ org.id: org-abc-123
  └─ message.attempt: 2

  Span: whatsapp-cloud-api-send
    └─ within.session.window: true
    └─ has.template: true
    └─ http.status: 429
    └─ error.code: 130
    └─ retry.after: 3600
    └─ duration: 285ms

  Span: http.client.request
    └─ http.method: POST
    └─ http.url: https://graph.facebook.com/v18.0/{phone_id}/messages
    └─ http.status_code: 429
    └─ http.response.header.retry-after: 3600
```

**Interpretation:**
- API call reached WhatsApp (285ms includes network round-trip)
- HTTP 429 (Too Many Requests) returned
- Error code 130 = Rate limit hit
- Retry-After header suggests wait 3600 seconds (1 hour)
- **Root Cause:** Quota exhausted or rate limit hit

**Resolution:**
1. Check quota: `GET /api/v2/diagnostics/whatsapp/error-patterns?hours=1`
2. Query rate limit state: `SELECT * FROM whatsapp_rate_limit WHERE org_id = 'org-abc-123';`
3. Wait for quota reset or increase quota limit
4. Messages will auto-retry with exponential backoff

#### 3. Provider API Error (Meta Platform Issue)

**Trace Pattern:**
```
Span: outbound-message-process
  └─ message.id: 12347
  └─ message.channel: WHATSAPP
  └─ message.attempt: 3
  └─ circuit.breaker.state: CLOSED

  Span: whatsapp-cloud-api-send
    └─ http.status: 500
    └─ error.code: 1
    └─ error.message: Service temporarily unavailable
    └─ duration: 5200ms (5.2 seconds)

  Span: http.client.request
    └─ http.method: POST
    └─ http.status_code: 500
    └─ exception: HttpServerErrorException
    └─ timeout: false
```

**Interpretation:**
- Long duration (5.2s) indicates API call completed but failed
- HTTP 500 (Internal Server Error) from Meta
- Error code 1 = Service temporarily unavailable
- Circuit breaker still closed (not tripped yet)
- **Root Cause:** WhatsApp Cloud API temporary outage

**Resolution:**
1. Check Meta API status: https://developers.facebook.com/status/
2. Verify with error patterns: `GET /api/v2/diagnostics/whatsapp/error-patterns?hours=1`
3. Messages will auto-retry (error code 1 is retryable)
4. If widespread: Follow [WhatsApp Provider Outages](#whatsapp-provider-outages) procedure

#### 4. Circuit Breaker Opened

**Trace Pattern:**
```
Span: outbound-message-process
  └─ message.id: 12348
  └─ message.channel: WHATSAPP
  └─ message.attempt: 1
  └─ circuit.breaker.state: OPEN
  └─ circuit.breaker.failure.rate: 87%
  └─ circuit.breaker.slow.call.rate: 45%

  Span: whatsapp-cloud-api-send
    └─ error: CircuitBreakerOpenException
    └─ error.code: CIRCUIT_BREAKER_OPEN
    └─ duration: 2ms (fast-fail)
    └─ retry.scheduled: true
```

**Interpretation:**
- Circuit breaker opened due to high failure rate (87%)
- Message failed immediately without API call (2ms)
- Fast-fail pattern protecting downstream API
- **Root Cause:** Multiple consecutive failures triggered circuit breaker

**Resolution:**
1. Check circuit breaker metrics: `curl http://localhost:8080/actuator/metrics/resilience4j.circuitbreaker.state`
2. Review underlying errors: `GET /api/v2/diagnostics/whatsapp/error-patterns?hours=1`
3. Circuit breaker will auto-close after wait duration (default: 60s)
4. Fix underlying issue (rate limit, provider outage, etc.)

#### 5. Template Not Found

**Trace Pattern:**
```
Span: outbound-message-process
  └─ message.id: 12349
  └─ message.channel: WHATSAPP
  └─ template.code: welcome_new_client

  Span: whatsapp-cloud-api-send
    └─ http.status: 400
    └─ error.code: 133004
    └─ error.message: Template not found
    └─ duration: 320ms

  Span: http.client.request
    └─ http.method: POST
    └─ http.status_code: 400
    └─ http.response.body: {"error":{"code":133004,"message":"Template not found"}}
```

**Interpretation:**
- HTTP 400 (Bad Request) - client error
- Error code 133004 = Template not found
- API call completed (320ms)
- **Root Cause:** Template doesn't exist or not approved in Meta Business Manager

**Resolution:**
1. List approved templates: `curl -X GET "https://graph.facebook.com/v18.0/${BUSINESS_ACCOUNT_ID}/message_templates" -H "Authorization: Bearer ${ACCESS_TOKEN}"`
2. Verify template name matches exactly (case-sensitive)
3. Check template status in Meta Business Manager
4. Re-submit template for approval or fix template name in code

### Jaeger Trace Query Examples

See [Jaeger Multi-Hop Delivery Tracing](#jaeger-multi-hop-delivery-tracing) section for detailed query examples.

---

## Diagnostics Endpoints Decision Tree

### Using `/api/v2/diagnostics/whatsapp` Endpoints

```
┌─────────────────────────────────────────────────────┐
│ SYMPTOM: WhatsApp Message Send Failure             │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ Check Error Code          │
        │ (from logs or DB)         │
        └───────────┬───────────────┘
                    │
        ┌───────────┴───────────────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                   ┌───────────────────────┐
│ Error Code:       │                   │ Error Code:           │
│ 132015, 132016    │                   │ 130, 3, 132069, 80007 │
│ (Session Window)  │                   │ (Rate Limit)          │
└────────┬──────────┘                   └────────┬──────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────────────────────────┐ ┌──────────────────────────────────┐
│ GET /diagnostics/whatsapp/sessions  │ │ GET /diagnostics/whatsapp/       │
│                                     │ │     error-patterns?hours=1       │
│ Check:                              │ │                                  │
│ • active=true (any active windows?) │ │ Check:                           │
│ • secondsRemaining < 3600?          │ │ • Rate limit error frequency     │
│ • phoneNumber has active session?   │ │ • Total errors in last hour      │
└────────┬────────────────────────────┘ └────────┬─────────────────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────────────────────────┐ ┌──────────────────────────────────┐
│ POST /diagnostics/whatsapp/         │ │ Query Database:                  │
│      dry-run-send                   │ │ SELECT * FROM whatsapp_rate_limit│
│                                     │ │ WHERE org_id = 'X';              │
│ Test:                               │ │                                  │
│ • Will message send succeed?        │ │ Check:                           │
│ • Session window validation         │ │ • messages_sent_count vs quota   │
│ • Duplicate detection               │ │ • throttle_until timestamp       │
│                                     │ │ • reset_at timestamp             │
└────────┬────────────────────────────┘ └────────┬─────────────────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────────────────────────┐ ┌──────────────────────────────────┐
│ RESOLUTION:                         │ │ RESOLUTION:                      │
│ • Wait for inbound message          │ │ • Wait for quota reset           │
│ • Use approved template instead     │ │ • Increase quota limit (if valid)│
│ • Check sessionWindowExpiresAt      │ │ • Check retry queue for backlog  │
└─────────────────────────────────────┘ └──────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ Error Code: 0, 1, 131016, 131026, 132001 (Temporary Errors)          │
└────────┬──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ GET /diagnostics/whatsapp/retry-queue?limit=100                 │
│                                                                  │
│ Check:                                                           │
│ • How many messages queued for retry?                           │
│ • nextRetryAt timestamps (when will they retry?)                │
│ • attemptCount vs maxAttempts (retry budget remaining)          │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ GET /diagnostics/whatsapp/error-patterns?hours=6                │
│                                                                  │
│ Check:                                                           │
│ • Spike in temporary errors? (provider issue)                   │
│ • Error pattern isolated or widespread?                         │
│ • Multiple orgs affected? (platform-wide issue)                 │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESOLUTION:                                                      │
│ • If spike: Check Meta API status (provider outage)             │
│ • If isolated: Manual retry individual messages                 │
│ • Auto-retry with exponential backoff (1, 5, 15, 60, 360 min)  │
│ • Monitor retry queue until cleared                             │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ Error Code: 133004, 133005, 133006, 133008 (Template Errors)         │
└────────┬──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ GET /diagnostics/whatsapp/error-patterns?hours=24               │
│                                                                  │
│ Check:                                                           │
│ • Which template codes failing?                                 │
│ • New template or existing template?                            │
│ • All orgs affected or single org?                              │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Verify in Meta Business Manager:                                │
│ • Template exists                                                │
│ • Template approved                                              │
│ • Template enabled (not paused/disabled)                         │
│ • Template name matches code exactly                             │
│ • Template parameters match payload                              │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESOLUTION:                                                      │
│ • 133004: Create/approve template in Meta                        │
│ • 133005: Enable paused template                                 │
│ • 133006: Re-submit disabled template                            │
│ • 133008: Fix parameter count mismatch in code                   │
│ • Non-retryable - requires code/config fix                       │
└─────────────────────────────────────────────────────────────────┘
```

### Diagnostic Endpoint Usage Examples

#### Example 1: Diagnosing Session Window Issue

```bash
# Step 1: Check if any active session windows exist
curl -X GET "https://api.atlas-immobilier.com/api/v2/diagnostics/whatsapp/sessions?active=true" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.'

# Response:
# {
#   "sessions": [
#     {
#       "id": 456,
#       "phoneNumber": "+33612345678",
#       "windowExpiresAt": "2024-01-15T18:30:00",
#       "active": true,
#       "secondsRemaining": 3245
#     }
#   ],
#   "totalCount": 1,
#   "activeCount": 1,
#   "timestamp": "2024-01-15T17:36:15"
# }

# Step 2: Test if message would succeed
curl -X POST "https://api.atlas-immobilier.com/api/v2/diagnostics/whatsapp/dry-run-send" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+33612345678",
    "templateCode": null
  }' | jq '.'

# Response:
# {
#   "phoneNumber": "+33612345678",
#   "sessionWindowActive": true,
#   "sessionWindowExpiresAt": "2024-01-15T18:30:00",
#   "canSend": true,
#   "valid": true,
#   "duplicateDetected": false,
#   "validationMessage": "Session window is active. Message can be sent.",
#   "timestamp": "2024-01-15T17:36:45"
# }
```

#### Example 2: Analyzing Rate Limit Errors

```bash
# Step 1: Get error patterns
curl -X GET "https://api.atlas-immobilier.com/api/v2/diagnostics/whatsapp/error-patterns?hours=1" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.'

# Response:
# {
#   "errorPatterns": [
#     {
#       "errorCode": "130",
#       "count": 47,
#       "errorMessage": "Rate limit hit"
#     },
#     {
#       "errorCode": "132069",
#       "count": 23,
#       "errorMessage": "Business account sending limit reached"
#     }
#   ],
#   "totalErrors": 70,
#   "hoursAnalyzed": 1,
#   "totalMessagesInPeriod": 250,
#   "failureRate": 28.0,
#   "timestamp": "2024-01-15T17:40:00"
# }

# Step 2: Check retry queue
curl -X GET "https://api.atlas-immobilier.com/api/v2/diagnostics/whatsapp/retry-queue?limit=50" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.'

# Response:
# {
#   "messages": [
#     {
#       "messageId": 12350,
#       "toPhone": "+33612345678",
#       "status": "QUEUED",
#       "attemptCount": 2,
#       "maxAttempts": 5,
#       "errorCode": "130",
#       "nextRetryAt": "2024-01-15T18:00:00"
#     }
#   ],
#   "totalCount": 47,
#   "timestamp": "2024-01-15T17:40:30"
# }
```

---

## Error Code Retryability Matrix

Based on `WhatsAppErrorMapper.java` implementation.

### Error Code Classification

| Error Code | Description | Retryable | Rate Limit | Category | Recommended Action |
|------------|-------------|-----------|------------|----------|-------------------|
| **0** | Temporary error | ✅ Yes | ❌ No | Temporary | Auto-retry with backoff |
| **1** | Service temporarily unavailable | ✅ Yes | ❌ No | Temporary | Auto-retry, check Meta status |
| **2** | Phone connected to different WABA | ❌ No | ❌ No | Config | Verify WhatsApp Business Account |
| **3** | Business account rate limited | ✅ Yes | ✅ Yes | Rate Limit | Wait for quota reset |
| **4** | Temporary error with phone number | ✅ Yes | ❌ No | Temporary | Auto-retry |
| **5** | Permanent error with phone number | ❌ No | ❌ No | Recipient | Update phone number |
| **100** | Invalid parameter | ❌ No | ❌ No | Client Error | Fix request payload |
| **130** | Rate limit hit | ✅ Yes | ✅ Yes | Rate Limit | Wait for quota reset |
| **131000** | Generic user error | ❌ No | ❌ No | Client Error | Review request parameters |
| **131005** | Generic message send error | ✅ Yes | ❌ No | Temporary | Auto-retry |
| **131008** | Required parameter missing | ❌ No | ❌ No | Client Error | Fix request payload |
| **131009** | Parameter value invalid | ❌ No | ❌ No | Client Error | Fix parameter values |
| **131016** | Service temporarily unavailable | ✅ Yes | ❌ No | Temporary | Auto-retry, check Meta status |
| **131021** | Recipient not on WhatsApp | ❌ No | ❌ No | Recipient | Verify phone number |
| **131026** | Message undeliverable | ✅ Yes | ❌ No | Temporary | Auto-retry |
| **131031** | Recipient blocked | ❌ No | ❌ No | Recipient | Remove from send list |
| **131042** | Phone number format invalid | ❌ No | ❌ No | Client Error | Fix phone number format |
| **131045** | Message too long | ❌ No | ❌ No | Client Error | Shorten message content |
| **131047** | Invalid parameter value | ❌ No | ❌ No | Client Error | Fix parameter values |
| **131051** | Unsupported message type | ❌ No | ❌ No | Client Error | Use supported message type |
| **131052** | Media download error | ❌ No | ❌ No | Media | Verify media URL accessibility |
| **131053** | Media upload error | ❌ No | ❌ No | Media | Retry media upload |
| **132000** | Generic platform error | ✅ Yes | ❌ No | Temporary | Auto-retry |
| **132001** | Message send failed | ✅ Yes | ❌ No | Temporary | Auto-retry |
| **132005** | Re-engagement message send failed | ✅ Yes | ❌ No | Temporary | Auto-retry with template |
| **132007** | Message blocked by spam filter | ❌ No | ❌ No | Policy | Review message content |
| **132012** | Phone number restricted | ❌ No | ❌ No | Recipient | Remove from send list |
| **132015** | Cannot send after 24h window | ❌ No | ❌ No | Session Window | Use template message |
| **132016** | Out of session - template required | ❌ No | ❌ No | Session Window | Use approved template |
| **132068** | Business account blocked | ❌ No | ❌ No | Config | Contact Meta support |
| **132069** | Business sending limit reached | ✅ Yes | ✅ Yes | Rate Limit | Wait or increase quota |
| **133000** | Invalid phone number | ❌ No | ❌ No | Recipient | Verify phone number |
| **133004** | Template not found | ❌ No | ❌ No | Template | Create/approve template |
| **133005** | Template paused | ❌ No | ❌ No | Template | Enable template |
| **133006** | Template disabled | ❌ No | ❌ No | Template | Re-submit template |
| **133008** | Template parameter count mismatch | ❌ No | ❌ No | Template | Fix parameter count |
| **133009** | Template missing parameters | ❌ No | ❌ No | Template | Add missing parameters |
| **133010** | Template parameter format invalid | ❌ No | ❌ No | Template | Fix parameter format |
| **133015** | Template not approved | ❌ No | ❌ No | Template | Wait for/request approval |
| **133016** | Template rejected | ❌ No | ❌ No | Template | Revise and resubmit |
| **135000** | Generic template error | ❌ No | ❌ No | Template | Review template config |
| **190** | Access token expired | ✅ Yes | ❌ No | Auth | Refresh access token |
| **200** | Permissions error | ❌ No | ❌ No | Auth | Verify WABA permissions |
| **368** | Temporarily blocked for policy | ✅ Yes | ❌ No | Policy | Wait for unblock |
| **470** | Message expired | ❌ No | ❌ No | Timeout | Message too old to deliver |
| **471** | User unavailable | ✅ Yes | ❌ No | Temporary | Auto-retry |
| **80007** | Rate limit exceeded | ✅ Yes | ✅ Yes | Rate Limit | Wait for quota reset |

### Retry Behavior Configuration

Messages with retryable errors use exponential backoff:

```java
// From OutboundJobWorker.java
private static final int[] BACKOFF_MINUTES = {1, 5, 15, 60, 360};

// Attempt schedule:
// Attempt 1: Immediate
// Attempt 2: +1 minute
// Attempt 3: +5 minutes
// Attempt 4: +15 minutes
// Attempt 5: +60 minutes
// Attempt 6: +360 minutes (6 hours)
```

Default max attempts: **5** (configurable per message)

### Quick Error Code Lookup

```bash
# Query error distribution in last hour
curl -X GET "https://api.atlas-immobilier.com/api/v2/diagnostics/whatsapp/error-patterns?hours=1" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.errorPatterns[] | {errorCode, count, errorMessage}'

# Check specific error code in database
psql -h prod-db.internal -U atlas -d atlas -c "
SELECT 
  error_code,
  COUNT(*) as occurrences,
  COUNT(*) FILTER (WHERE attempt_count < max_attempts) as retryable,
  COUNT(*) FILTER (WHERE attempt_count >= max_attempts) as dlq,
  MAX(error_message) as example_message
FROM outbound_message
WHERE channel='WHATSAPP' 
  AND status='FAILED' 
  AND error_code='132016'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_code;"
```

---

## Recovering Stuck Messages

### What Are "Stuck" Messages?

Messages are considered "stuck" when:
1. Status = `SENDING` for > 5 minutes (detected by scheduled task)
2. Status = `QUEUED` with `nextRetryAt` passed but not processing
3. Status = `QUEUED` for > 2 hours with no progress

### Automated Recovery

The system automatically recovers stale messages every 10 minutes:

```java
// From OutboundJobWorker.java - recoverStaleMessages()
// Runs as part of processPendingMessages() scheduled task

private void recoverStaleMessages() {
    LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(10);
    List<OutboundMessageEntity> staleMessages = 
        outboundMessageRepository.findStaleMessages(
            OutboundMessageStatus.SENDING, 
            staleThreshold, 
            PageRequest.of(0, batchSize));
    
    // Reset to QUEUED for retry
    for (OutboundMessageEntity message : staleMessages) {
        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setUpdatedAt(LocalDateTime.now());
        outboundMessageRepository.save(message);
    }
}
```

### Manual Recovery Procedures

#### Procedure 1: Identify Stuck Messages

```sql
-- Messages stuck in SENDING (> 5 minutes)
SELECT 
    id,
    org_id,
    to_recipient,
    template_code,
    status,
    attempt_count,
    max_attempts,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck,
    error_code,
    error_message
FROM outbound_message
WHERE status = 'SENDING'
  AND updated_at < NOW() - INTERVAL '5 minutes'
ORDER BY updated_at
LIMIT 50;

-- Messages stuck in QUEUED (> 2 hours)
SELECT 
    om.id,
    om.org_id,
    om.to_recipient,
    om.status,
    om.attempt_count,
    EXTRACT(EPOCH FROM (NOW() - om.created_at))/3600 as hours_in_queue,
    oa.next_retry_at,
    CASE 
        WHEN oa.next_retry_at IS NULL THEN 'No retry scheduled'
        WHEN oa.next_retry_at < NOW() THEN 'Retry overdue'
        ELSE 'Waiting for retry'
    END as retry_status
FROM outbound_message om
LEFT JOIN LATERAL (
    SELECT next_retry_at 
    FROM outbound_attempt 
    WHERE outbound_message_id = om.id 
    ORDER BY attempt_no DESC 
    LIMIT 1
) oa ON true
WHERE om.status = 'QUEUED'
  AND om.created_at < NOW() - INTERVAL '2 hours'
ORDER BY om.created_at
LIMIT 50;

-- Summary of stuck messages
SELECT 
    status,
    COUNT(*) as count,
    MIN(updated_at) as oldest,
    MAX(updated_at) as newest,
    AVG(attempt_count) as avg_attempts
FROM outbound_message
WHERE (
    (status = 'SENDING' AND updated_at < NOW() - INTERVAL '5 minutes')
    OR
    (status = 'QUEUED' AND created_at < NOW() - INTERVAL '2 hours')
)
GROUP BY status;
```

#### Procedure 2: Reset Stuck Messages to QUEUED

```sql
-- Create backup first
CREATE TABLE outbound_message_stuck_backup_20240115 AS
SELECT * FROM outbound_message
WHERE status = 'SENDING' 
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- Reset SENDING messages to QUEUED
UPDATE outbound_message
SET status = 'QUEUED',
    updated_at = NOW(),
    updated_by = 'ops-recover-stuck-20240115'
WHERE status = 'SENDING'
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- Verify reset
SELECT 
    updated_by,
    status,
    COUNT(*) as count
FROM outbound_message
WHERE updated_by = 'ops-recover-stuck-20240115'
GROUP BY updated_by, status;
```

#### Procedure 3: Clear Overdue Retry Timestamps

```sql
-- Find attempts with overdue retry times
SELECT 
    oa.id as attempt_id,
    oa.outbound_message_id,
    oa.next_retry_at,
    EXTRACT(EPOCH FROM (NOW() - oa.next_retry_at))/60 as minutes_overdue,
    om.status,
    om.attempt_count
FROM outbound_attempt oa
JOIN outbound_message om ON oa.outbound_message_id = om.id
WHERE oa.next_retry_at IS NOT NULL
  AND oa.next_retry_at < NOW() - INTERVAL '30 minutes'
  AND om.status = 'QUEUED'
ORDER BY oa.next_retry_at
LIMIT 100;

-- Clear overdue retry timestamps to allow immediate retry
UPDATE outbound_attempt
SET next_retry_at = NULL,
    updated_at = NOW()
WHERE id IN (
    SELECT oa.id
    FROM outbound_attempt oa
    JOIN outbound_message om ON oa.outbound_message_id = om.id
    WHERE oa.next_retry_at IS NOT NULL
      AND oa.next_retry_at < NOW() - INTERVAL '30 minutes'
      AND om.status = 'QUEUED'
);
```

#### Procedure 4: Force Retry via API

```bash
#!/bin/bash
# force-retry-stuck-messages.sh
# Force retry stuck messages via REST API

set -euo pipefail

ADMIN_TOKEN="${ADMIN_TOKEN}"
API_BASE="https://api.atlas-immobilier.com"

echo "=== Force Retry Stuck Messages ==="

# Get stuck message IDs
psql -h prod-db.internal -U atlas -d atlas -t -A -F',' <<EOF > /tmp/stuck_messages.csv
SELECT id, org_id 
FROM outbound_message 
WHERE status = 'SENDING' 
  AND updated_at < NOW() - INTERVAL '5 minutes'
ORDER BY updated_at
LIMIT 50;
EOF

TOTAL=$(wc -l < /tmp/stuck_messages.csv)
echo "Found $TOTAL stuck messages"

SUCCESS=0
FAILED=0

while IFS=',' read -r MSG_ID ORG_ID; do
    echo "Retrying message $MSG_ID (org: $ORG_ID)..."
    
    if curl -sf -X POST \
        -H "X-Org-Id: ${ORG_ID}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "${API_BASE}/api/v1/outbound/messages/${MSG_ID}/retry" > /dev/null; then
        echo "  ✓ Success"
        ((SUCCESS++))
    else
        echo "  ✗ Failed"
        ((FAILED++))
    fi
    
    sleep 1
done < /tmp/stuck_messages.csv

echo ""
echo "=== Summary ==="
echo "Total: $TOTAL"
echo "Success: $SUCCESS"
echo "Failed: $FAILED"

rm -f /tmp/stuck_messages.csv
```

#### Procedure 5: Investigate Root Cause

```sql
-- Analyze stuck message patterns
WITH stuck_messages AS (
    SELECT 
        id,
        org_id,
        channel,
        error_code,
        attempt_count,
        EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck
    FROM outbound_message
    WHERE status = 'SENDING'
      AND updated_at < NOW() - INTERVAL '5 minutes'
)
SELECT 
    channel,
    error_code,
    COUNT(*) as stuck_count,
    AVG(minutes_stuck) as avg_minutes_stuck,
    AVG(attempt_count) as avg_attempts,
    COUNT(DISTINCT org_id) as orgs_affected
FROM stuck_messages
GROUP BY channel, error_code
ORDER BY stuck_count DESC;

-- Check worker health
SELECT 
    'Last processed message' as metric,
    MAX(updated_at) as value,
    EXTRACT(EPOCH FROM (NOW() - MAX(updated_at)))/60 as minutes_ago
FROM outbound_message
WHERE status IN ('SENT', 'FAILED')
  AND updated_at > NOW() - INTERVAL '1 hour';

-- Check for worker errors in application logs
-- (Query your logging system - Kibana, CloudWatch, etc.)
```

### Monitoring Stuck Messages

Prometheus metric: `whatsapp_message_stuck_alert`

```promql
# Alert when messages stuck
whatsapp_message_stuck_alert > 0

# Count of stuck messages over time
whatsapp_message_stuck_alert{job="backend"}
```

Alert configuration (from `whatsapp-alerts.yml`):

```yaml
- alert: WhatsAppMessagesStuckInSending
  expr: whatsapp_message_stuck_alert > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "{{ $value }} messages stuck in SENDING status"
```

---

## Grafana Dashboard for WhatsApp SLA Metrics

### Dashboard JSON Configuration

Save as `grafana-whatsapp-sla-dashboard.json`:

```json
{
  "dashboard": {
    "title": "WhatsApp Messaging SLA Dashboard",
    "tags": ["whatsapp", "sla", "messaging"],
    "timezone": "browser",
    "editable": true,
    "refresh": "30s",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Message Send Latency (p50/p95/p99)",
        "type": "graph",
        "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "outbound_message_send_latency_seconds{channel=\"whatsapp\",quantile=\"0.5\"}",
            "legendFormat": "p50 Send Latency"
          },
          {
            "expr": "outbound_message_send_latency_seconds{channel=\"whatsapp\",quantile=\"0.95\"}",
            "legendFormat": "p95 Send Latency"
          },
          {
            "expr": "outbound_message_send_latency_seconds{channel=\"whatsapp\",quantile=\"0.99\"}",
            "legendFormat": "p99 Send Latency"
          }
        ],
        "yaxes": [
          {
            "format": "s",
            "label": "Latency (seconds)"
          }
        ],
        "thresholds": [
          {
            "value": 30,
            "colorMode": "critical",
            "op": "gt",
            "fill": true,
            "line": true
          }
        ],
        "alert": {
          "name": "High Send Latency",
          "conditions": [
            {
              "evaluator": {
                "params": [30],
                "type": "gt"
              },
              "query": {
                "params": ["A", "5m", "now"]
              }
            }
          ]
        }
      },
      {
        "id": 2,
        "title": "Message Delivery Latency (p50/p95/p99)",
        "type": "graph",
        "gridPos": { "x": 12, "y": 0, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "outbound_message_delivered_latency_seconds{channel=\"whatsapp\",quantile=\"0.5\"}",
            "legendFormat": "p50 Delivery Latency"
          },
          {
            "expr": "outbound_message_delivered_latency_seconds{channel=\"whatsapp\",quantile=\"0.95\"}",
            "legendFormat": "p95 Delivery Latency"
          },
          {
            "expr": "outbound_message_delivered_latency_seconds{channel=\"whatsapp\",quantile=\"0.99\"}",
            "legendFormat": "p99 Delivery Latency"
          }
        ],
        "yaxes": [
          {
            "format": "s",
            "label": "Latency (seconds)"
          }
        ],
        "thresholds": [
          {
            "value": 60,
            "colorMode": "critical",
            "op": "gt",
            "fill": true,
            "line": true
          }
        ]
      },
      {
        "id": 3,
        "title": "Message Success Rate",
        "type": "stat",
        "gridPos": { "x": 0, "y": 8, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "(sum(rate(outbound_message_queue_depth{channel=\"whatsapp\",status=~\"sent|delivered\"}[5m])) / sum(rate(outbound_message_queue_depth{channel=\"whatsapp\"}[5m]))) * 100",
            "legendFormat": "Success Rate"
          }
        ],
        "options": {
          "reduceOptions": {
            "values": false,
            "calcs": ["lastNotNull"]
          },
          "text": {
            "titleSize": 18,
            "valueSize": 52
          },
          "colorMode": "value",
          "graphMode": "area",
          "orientation": "auto"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 90, "color": "yellow" },
                { "value": 95, "color": "green" }
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "Queue Depth",
        "type": "stat",
        "gridPos": { "x": 6, "y": 8, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "outbound_message_queue_depth_by_channel{channel=\"whatsapp\",status=\"queued\"}",
            "legendFormat": "Queued Messages"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 100, "color": "yellow" },
                { "value": 500, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "id": 5,
        "title": "Stuck Messages",
        "type": "stat",
        "gridPos": { "x": 12, "y": 8, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "whatsapp_message_stuck_alert",
            "legendFormat": "Stuck Messages"
          }
        ],
        "options": {
          "colorMode": "value"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 1, "color": "yellow" },
                { "value": 10, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "id": 6,
        "title": "Quota Usage",
        "type": "gauge",
        "gridPos": { "x": 18, "y": 8, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "(whatsapp_quota_used / whatsapp_quota_limit) * 100",
            "legendFormat": "Quota Usage %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100,
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 80, "color": "yellow" },
                { "value": 95, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "id": 7,
        "title": "Session Window Expiration",
        "type": "graph",
        "gridPos": { "x": 0, "y": 12, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "whatsapp_session_window_expiration_seconds{channel=\"whatsapp\"}",
            "legendFormat": "Seconds Until Session Expires"
          }
        ],
        "yaxes": [
          {
            "format": "s",
            "label": "Seconds Remaining"
          }
        ],
        "thresholds": [
          {
            "value": 3600,
            "colorMode": "critical",
            "op": "lt",
            "fill": true,
            "line": true
          }
        ]
      },
      {
        "id": 8,
        "title": "Error Patterns (Last Hour)",
        "type": "table",
        "gridPos": { "x": 12, "y": 12, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "topk(10, sum by (error_code) (rate(outbound_message_failures_total{channel=\"whatsapp\"}[1h])))",
            "format": "table",
            "instant": true
          }
        ],
        "transformations": [
          {
            "id": "organize",
            "options": {
              "excludeByName": {
                "Time": true
              },
              "renameByName": {
                "error_code": "Error Code",
                "Value": "Failure Rate/sec"
              }
            }
          }
        ]
      },
      {
        "id": 9,
        "title": "Message Volume (sent/failed/queued)",
        "type": "graph",
        "gridPos": { "x": 0, "y": 20, "w": 24, "h": 8 },
        "targets": [
          {
            "expr": "rate(outbound_message_queue_depth{channel=\"whatsapp\",status=\"sent\"}[5m])",
            "legendFormat": "Sent Rate"
          },
          {
            "expr": "rate(outbound_message_queue_depth{channel=\"whatsapp\",status=\"failed\"}[5m])",
            "legendFormat": "Failed Rate"
          },
          {
            "expr": "outbound_message_queue_depth_by_channel{channel=\"whatsapp\",status=\"queued\"}",
            "legendFormat": "Queued Count"
          }
        ],
        "yaxes": [
          {
            "format": "short",
            "label": "Messages"
          }
        ]
      },
      {
        "id": 10,
        "title": "Retry Count",
        "type": "stat",
        "gridPos": { "x": 0, "y": 28, "w": 8, "h": 4 },
        "targets": [
          {
            "expr": "outbound_message_retry_count{channel=\"whatsapp\"}",
            "legendFormat": "Messages Requiring Retries"
          }
        ],
        "options": {
          "colorMode": "value"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 50, "color": "yellow" },
                { "value": 100, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "id": 11,
        "title": "Dead Letter Queue Size",
        "type": "stat",
        "gridPos": { "x": 8, "y": 28, "w": 8, "h": 4 },
        "targets": [
          {
            "expr": "outbound_message_dead_letter_queue_size",
            "legendFormat": "DLQ Messages"
          }
        ],
        "options": {
          "colorMode": "value"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 100, "color": "yellow" },
                { "value": 500, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "id": 12,
        "title": "Circuit Breaker State",
        "type": "stat",
        "gridPos": { "x": 16, "y": 28, "w": 8, "h": 4 },
        "targets": [
          {
            "expr": "resilience4j_circuitbreaker_state{name=\"whatsapp\"}",
            "legendFormat": "Circuit Breaker State"
          }
        ],
        "options": {
          "colorMode": "background"
        },
        "fieldConfig": {
          "defaults": {
            "mappings": [
              { "value": 0, "text": "CLOSED", "color": "green" },
              { "value": 1, "text": "OPEN", "color": "red" },
              { "value": 2, "text": "HALF_OPEN", "color": "yellow" }
            ]
          }
        }
      }
    ]
  }
}
```

### Importing Dashboard to Grafana

```bash
# Import via API
curl -X POST "https://grafana.atlas-immobilier.com/api/dashboards/db" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @grafana-whatsapp-sla-dashboard.json

# Or import via UI:
# 1. Navigate to Dashboards → Import
# 2. Upload JSON file or paste JSON
# 3. Select Prometheus data source
# 4. Click "Import"
```

### Key Dashboard Metrics

| Panel | Metric | SLA Threshold | Alert Trigger |
|-------|--------|---------------|---------------|
| Send Latency p95 | `outbound_message_send_latency_seconds{quantile="0.95"}` | < 30s | > 30s for 5min |
| Delivery Latency p99 | `outbound_message_delivered_latency_seconds{quantile="0.99"}` | < 120s | > 120s for 5min |
| Success Rate | Sent/(Sent+Failed) × 100 | > 95% | < 90% for 5min |
| Queue Depth | `outbound_message_queue_depth_by_channel{status="queued"}` | < 100 | > 500 for 3min |
| Stuck Messages | `whatsapp_message_stuck_alert` | 0 | > 0 for 5min |
| Quota Usage | (Used/Limit) × 100 | < 80% | > 95% for 2min |

---

## Jaeger Multi-Hop Delivery Tracing

### Understanding Multi-Hop Traces

A complete WhatsApp message delivery involves multiple hops:

```
[API Request] → [Worker Processing] → [Provider Call] → [Meta API] → [Webhook Callback] → [Status Update]
     ↓                  ↓                    ↓              ↓                ↓                   ↓
 Span: http.in   Span: outbound   Span: whatsapp    Span: http.out   Span: webhook.in   Span: status.update
  trace.id       .message         .cloud.api        (external)         trace.id           trace.id
  123-abc        .process         .send                                (correlated)       (correlated)
```

### Trace ID Propagation

The system uses W3C Trace Context for distributed tracing:

```java
// From OutboundJobWorker.java
if (tracer != null && tracer.currentSpan() != null) {
    // Tag message metadata
    tracer.currentSpan().tag("message.id", String.valueOf(message.getId()));
    tracer.currentSpan().tag("org.id", message.getOrgId());
    
    // Propagate context via baggage
    if (message.getSessionId() != null) {
        tracer.getBaggage("sessionId").set(message.getSessionId());
    }
}
```

### Jaeger Query Examples

#### Query 1: Find All Traces for a Specific Message ID

**Jaeger UI Query:**
```
Service: backend
Tags: message.id=12345
Lookback: 24h
```

**Jaeger API Query:**
```bash
curl -X GET "https://jaeger.atlas-immobilier.com/api/traces?service=backend&tags=%7B%22message.id%22%3A%2212345%22%7D&limit=50" | jq '.'

# Response includes:
# - Trace ID
# - All spans in the trace
# - Span durations
# - Tags and logs
```

#### Query 2: Find Failed Sends by Error Code

**Jaeger UI Query:**
```
Service: backend
Operation: whatsapp-cloud-api-send
Tags: error.code=132016
Lookback: 6h
Min Duration: 0ms
Max Duration: 10s
```

**Jaeger API Query:**
```bash
# Find traces with specific error code
curl -X GET "https://jaeger.atlas-immobilier.com/api/traces?service=backend&operation=whatsapp-cloud-api-send&tags=%7B%22error.code%22%3A%22132016%22%7D&limit=100" \
  -H "Accept: application/json" | jq '.data[] | {traceID, spans: .spans | length, duration: .duration}'
```

#### Query 3: Trace Delivery Path for Specific Phone Number

**Jaeger UI Query:**
```
Service: backend
Tags: message.to=+33612345678
Lookback: 24h
```

**Jaeger API Query:**
```bash
# Find all message attempts to specific recipient
curl -X GET "https://jaeger.atlas-immobilier.com/api/traces?service=backend&tags=%7B%22message.to%22%3A%22%2B33612345678%22%7D&limit=50" | \
  jq '.data[] | {
    traceID, 
    startTime, 
    duration, 
    messageId: .spans[0].tags[] | select(.key=="message.id") | .value,
    status: .spans[0].tags[] | select(.key=="status") | .value
  }'
```

#### Query 4: Analyze Latency Distribution for Sent Messages

**Jaeger UI Query:**
```
Service: backend
Operation: outbound-message-process
Tags: status=SENT
Lookback: 1h
Min Duration: 0ms
Max Duration: 60s
```

**Jaeger API Query:**
```bash
# Get latency statistics
curl -X GET "https://jaeger.atlas-immobilier.com/api/traces?service=backend&operation=outbound-message-process&tags=%7B%22status%22%3A%22SENT%22%7D&limit=500" | \
  jq '.data[] | .duration' | \
  awk '{sum+=$1; sumsq+=$1*$1; count++} END {
    print "Count:", count; 
    print "Mean:", sum/count/1000000, "ms"; 
    print "StdDev:", sqrt(sumsq/count - (sum/count)^2)/1000000, "ms"
  }'
```

#### Query 5: Find Traces with Circuit Breaker Open

**Jaeger UI Query:**
```
Service: backend
Tags: circuit.breaker.state=OPEN
Lookback: 6h
```

**Jaeger API Query:**
```bash
curl -X GET "https://jaeger.atlas-immobilier.com/api/traces?service=backend&tags=%7B%22circuit.breaker.state%22%3A%22OPEN%22%7D&limit=100" | \
  jq '.data[] | {
    traceID,
    startTime,
    channel: .spans[0].tags[] | select(.key=="message.channel") | .value,
    failureRate: .spans[0].tags[] | select(.key=="circuit.breaker.failure.rate") | .value
  }'
```

#### Query 6: Correlate API Request to Webhook Callback

**Multi-Step Process:**

1. **Find outbound message trace:**
```bash
# Get trace ID for outbound message
TRACE_ID=$(curl -s "https://jaeger.atlas-immobilier.com/api/traces?service=backend&tags=%7B%22message.id%22%3A%2212345%22%7D&limit=1" | \
  jq -r '.data[0].traceID')

echo "Outbound Trace ID: $TRACE_ID"
```

2. **Find webhook callback with correlation:**
```bash
# Webhooks include provider_message_id for correlation
PROVIDER_MSG_ID=$(curl -s "https://jaeger.atlas-immobilier.com/api/trace/$TRACE_ID" | \
  jq -r '.data[0].spans[] | select(.operationName=="whatsapp-cloud-api-send") | .tags[] | select(.key=="provider.message.id") | .value')

echo "Provider Message ID: $PROVIDER_MSG_ID"

# Find webhook trace by provider message ID
curl -s "https://jaeger.atlas-immobilier.com/api/traces?service=backend&operation=webhook.process&tags=%7B%22provider.message.id%22%3A%22$PROVIDER_MSG_ID%22%7D&limit=1" | \
  jq '.data[0] | {
    traceID,
    webhookSpans: .spans | length,
    statusUpdate: .spans[] | select(.operationName=="status.update") | {duration, status: .tags[] | select(.key=="new.status") | .value}
  }'
```

3. **Calculate end-to-end delivery time:**
```bash
# Compare timestamps
curl -s "https://jaeger.atlas-immobilier.com/api/trace/$TRACE_ID" | \
  jq '{
    messageSentAt: .data[0].spans[0].startTime,
    webhookReceivedAt: (.data[0].spans[] | select(.operationName=="webhook.in") | .startTime),
    deliveryLatency: ((.data[0].spans[] | select(.operationName=="webhook.in") | .startTime) - .data[0].spans[0].startTime) / 1000000
  }'
```

#### Query 7: Find All Retry Attempts for a Message

**Jaeger UI Query:**
```
Service: backend
Tags: message.id=12345
Lookback: 24h
Sort: Start Time
```

**Jaeger API Query:**
```bash
# Get all traces for message ID (each attempt creates a new trace)
curl -s "https://jaeger.atlas-immobilier.com/api/traces?service=backend&tags=%7B%22message.id%22%3A%2212345%22%7D&limit=10" | \
  jq '.data | sort_by(.startTime) | .[] | {
    traceID,
    startTime,
    attemptNo: .spans[0].tags[] | select(.key=="message.attempt") | .value,
    status: .spans[0].tags[] | select(.key=="status") | .value,
    errorCode: .spans[0].tags[] | select(.key=="error.code") | .value
  }'
```

#### Query 8: Analyze Session Window Checks

**Jaeger UI Query:**
```
Service: backend
Operation: whatsapp-cloud-api-send
Tags: within.session.window=false
Lookback: 6h
```

**Jaeger API Query:**
```bash
# Find messages failing session window check
curl -s "https://jaeger.atlas-immobilier.com/api/traces?service=backend&operation=whatsapp-cloud-api-send&tags=%7B%22within.session.window%22%3A%22false%22%7D&limit=100" | \
  jq '.data[] | {
    traceID,
    messageId: .spans[0].tags[] | select(.key=="message.id") | .value,
    hasTemplate: .spans[0].tags[] | select(.key=="has.template") | .value,
    phoneNumber: .spans[0].tags[] | select(.key=="message.to") | .value
  }'
```

### Span Tag Reference

Key span tags for troubleshooting:

| Tag | Type | Example Value | Description |
|-----|------|---------------|-------------|
| `message.id` | Long | 12345 | Database message ID |
| `message.channel` | String | WHATSAPP | Message channel |
| `message.attempt` | Integer | 3 | Retry attempt number |
| `message.to` | String | +33612345678 | Recipient phone number |
| `org.id` | String | org-abc-123 | Organization ID |
| `template.code` | String | appointment_reminder | Template identifier |
| `within.session.window` | Boolean | true | Session window status |
| `has.template` | Boolean | false | Template present |
| `error.code` | String | 132016 | WhatsApp error code |
| `error` | String | session_expired | Error type |
| `status` | String | SENT | Final message status |
| `circuit.breaker.state` | String | OPEN | Circuit breaker state |
| `http.status` | Integer | 429 | HTTP response code |
| `http.method` | String | POST | HTTP method |
| `provider.message.id` | String | wamid.ABC123 | Meta provider message ID |
| `retry.after` | Integer | 3600 | Retry-After header (seconds) |
| `session.id` | String | session-789 | Session correlation ID |
| `run.id` | String | run-456 | Run correlation ID |
| `hypothesis.id` | String | hyp-123 | Hypothesis correlation ID |

### Visualizing Trace Hierarchy in Jaeger

When viewing a trace in Jaeger UI, look for:

1. **Span Duration**: Identify bottlenecks
   - < 100ms: Fast validation/DB operation
   - 100-500ms: Normal API call
   - > 1s: Potential timeout or slow network

2. **Span Errors**: Red highlights indicate errors
   - Check error tag for error code
   - Review logs for stack traces

3. **Span Dependencies**: Parent-child relationships
   - Horizontal alignment = sequential execution
   - Vertical stacking = nested operations

4. **Gaps Between Spans**: Queue time or scheduling delays
   - Large gaps may indicate worker congestion

### Exporting Traces for Analysis

```bash
#!/bin/bash
# export-traces-for-analysis.sh
# Export Jaeger traces to JSON for offline analysis

SERVICE="backend"
OPERATION="whatsapp-cloud-api-send"
LOOKBACK="24h"
LIMIT=1000

curl -X GET "https://jaeger.atlas-immobilier.com/api/traces?service=${SERVICE}&operation=${OPERATION}&lookback=${LOOKBACK}&limit=${LIMIT}" \
  -H "Accept: application/json" \
  -o "jaeger-traces-$(date +%Y%m%d-%H%M%S).json"

echo "✓ Traces exported to jaeger-traces-$(date +%Y%m%d-%H%M%S).json"

# Analyze with jq
jq '.data | length' jaeger-traces-*.json  # Total traces
jq '.data[].duration | select(. > 10000000)' jaeger-traces-*.json | wc -l  # Traces > 10s
jq '[.data[].duration] | add / length / 1000000' jaeger-traces-*.json  # Average duration (ms)
```

---

## WhatsApp Provider Outages

### Symptoms

- ⚠️ High failure rate for WhatsApp messages (>30%)
- ⚠️ Provider error codes: 1, 0, 131016 (temporary errors)
- ⚠️ Increased latency (>10 seconds) or timeouts
- ⚠️ Prometheus alert: `WhatsAppProviderDown` or `WhatsAppHighFailureRate`
- ⚠️ Customer complaints about undelivered messages

### Verification Steps

#### Step 1: Check WhatsApp Business API Status

```bash
# Official Meta API status page
curl -sf https://developers.facebook.com/status/ | grep -i whatsapp

# Alternative: Check via browser
# https://developers.facebook.com/status/

# Check our provider config
psql -h prod-db.internal -U atlas -d atlas <<EOF
SELECT 
    org_id,
    phone_number_id,
    enabled,
    updated_at,
    CASE 
        WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 'Recently Updated'
        ELSE 'Stable'
    END as status
FROM whatsapp_provider_config
WHERE enabled = true
ORDER BY org_id;
EOF
```

#### Step 2: Use Diagnostics Endpoints

```bash
# Get error patterns
curl -X GET "https://api.atlas-immobilier.com/api/v2/diagnostics/whatsapp/error-patterns?hours=1" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.errorPatterns[] | select(.errorCode | IN("0","1","131016"))'
```

#### Step 3: Check Jaeger for Provider Errors

```bash
# Find traces with provider errors
curl -s "https://jaeger.atlas-immobilier.com/api/traces?service=backend&operation=whatsapp-cloud-api-send&tags=%7B%22error.code%22%3A%221%22%7D&limit=50" | \
  jq '.data | length'
```

### Response Procedures

See existing procedures in original document...

---

## Webhook Signature Validation Failures

(Content continues from original document...)

---

## Dead Letter Queue (DLQ) Processing

(Content continues from original document...)

---

## Outbound Queue Backup Scenarios

(Content continues from original document...)

---

## Manual Operations Scripts

(Content continues from original document...)

---

## Escalation Matrix

(Content continues from original document...)

---

## Monitoring & Alerts

(Content continues from original document...)

---

## Common Troubleshooting Scenarios

(Content continues from original document...)

---

## Database Maintenance

(Content continues from original document...)

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | Platform Team | Initial version |
| 2.0 | 2024-01-15 | Platform Team | Enhanced with operational scripts, detailed procedures |
| 3.0 | 2024-01-15 | Platform Team | Added OpenTelemetry tracing, diagnostics decision tree, error matrix, Grafana dashboard, Jaeger queries, stuck message recovery |

## Related Documentation

- [WhatsApp Outbound Implementation](../WHATSAPP_OUTBOUND_IMPLEMENTATION.md)
- [Observability Runbook](./RUNBOOK_OBSERVABILITY.md)
- [WhatsApp SLA Monitoring](./observability/README.md)
- [API Documentation](./API_VERSIONING_IMPLEMENTATION.md)
- [AGENTS.md](../AGENTS.md)

---

**End of Runbook**

*For questions or updates to this runbook, contact: platform-team@atlas-immobilier.com*
