# Production Runbook - WhatsApp Messaging Operations

## Overview

This runbook provides comprehensive incident response procedures for WhatsApp messaging operations in production environments. It covers provider outages, webhook signature validation failures, dead letter queue (DLQ) processing, outbound queue backup scenarios, manual retry procedures, escalation workflows, and common troubleshooting scenarios.

**Last Updated:** 2024-01-15  
**Version:** 2.0  
**Owned By:** Platform Engineering Team  
**Review Schedule:** Quarterly

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [WhatsApp Provider Outages](#whatsapp-provider-outages)
3. [Webhook Signature Validation Failures](#webhook-signature-validation-failures)
4. [Dead Letter Queue (DLQ) Processing](#dead-letter-queue-dlq-processing)
5. [Outbound Queue Backup Scenarios](#outbound-queue-backup-scenarios)
6. [Manual Operations Scripts](#manual-operations-scripts)
7. [Escalation Matrix](#escalation-matrix)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Common Troubleshooting Scenarios](#common-troubleshooting-scenarios)
10. [Database Maintenance](#database-maintenance)

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

**Staging:**
- Backend API: `https://api-staging.atlas-immobilier.com`
- Actuator Health: `https://api-staging.atlas-immobilier.com/actuator/health`

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

#### Step 2: Query Recent Failure Patterns

```sql
-- Failure breakdown by error code (last hour)
SELECT 
    error_code,
    COUNT(*) as failure_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage,
    MAX(error_message) as sample_error,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen
FROM outbound_message 
WHERE channel = 'WHATSAPP' 
  AND status = 'FAILED'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY error_code
ORDER BY failure_count DESC;

-- Failure rate over time (last 6 hours, grouped by hour)
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'FAILED') / COUNT(*), 2) as failure_rate_pct
FROM outbound_message
WHERE channel = 'WHATSAPP'
  AND created_at > NOW() - INTERVAL '6 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Affected organizations
SELECT 
    org_id,
    COUNT(*) as failures,
    COUNT(DISTINCT to_recipient) as unique_recipients,
    COUNT(DISTINCT error_code) as unique_error_codes
FROM outbound_message
WHERE channel = 'WHATSAPP'
  AND status = 'FAILED'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY org_id
ORDER BY failures DESC
LIMIT 10;
```

#### Step 3: Check Outbound Metrics via API

```bash
# Get overall health metrics
curl -sf -H "X-Org-Id: system-admin" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  https://api.atlas-immobilier.com/api/v1/dashboard/outbound/health | jq '.'

# Get WhatsApp-specific metrics
curl -sf -H "X-Org-Id: system-admin" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  https://api.atlas-immobilier.com/api/v1/dashboard/outbound/health | \
  jq '.channelMetrics.WHATSAPP'

# Example output:
# {
#   "channel": "WHATSAPP",
#   "totalMessages": 1523,
#   "successfulMessages": 1089,
#   "failedMessages": 434,
#   "successRate": 71.5,
#   "averageLatencyMs": 2341
# }
```

### Response Procedures

#### Procedure 1: Manual Retry for Temporary Failures

**When to Use:** Provider returns temporary errors (codes: 0, 1, 131016, 131026, 132001)

**Estimated Time:** 15-30 minutes  
**Risk Level:** Low  
**Rollback:** Not needed (idempotent retries)

**Steps:**

**1. Identify Retryable Failed Messages:**

```sql
-- Get list of retryable messages with details
SELECT 
    id,
    org_id,
    to_recipient,
    template_code,
    error_code,
    error_message,
    attempt_count,
    max_attempts,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM outbound_message
WHERE channel = 'WHATSAPP'
  AND status = 'FAILED'
  AND error_code IN ('0', '1', '131016', '131026', '132001')  -- Temporary errors
  AND attempt_count < max_attempts
  AND created_at > NOW() - INTERVAL '4 hours'  -- Recent failures only
ORDER BY created_at DESC
LIMIT 100;

-- Count by error code
SELECT 
    error_code,
    COUNT(*) as retryable_count
FROM outbound_message
WHERE channel = 'WHATSAPP'
  AND status = 'FAILED'
  AND error_code IN ('0', '1', '131016', '131026', '132001')
  AND attempt_count < max_attempts
  AND created_at > NOW() - INTERVAL '4 hours'
GROUP BY error_code;
```

**2. Retry Messages via REST API:**

**Single Message Retry:**
```bash
#!/bin/bash
# retry-single-message.sh

MESSAGE_ID="$1"
ORG_ID="$2"
ADMIN_TOKEN="${ADMIN_TOKEN}"  # Set via environment

if [[ -z "$MESSAGE_ID" || -z "$ORG_ID" ]]; then
    echo "Usage: $0 <message_id> <org_id>"
    exit 1
fi

echo "Retrying message ID: $MESSAGE_ID for org: $ORG_ID"

RESPONSE=$(curl -sf -X POST \
    -H "X-Org-Id: ${ORG_ID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.atlas-immobilier.com/api/v1/outbound/messages/${MESSAGE_ID}/retry")

if [[ $? -eq 0 ]]; then
    echo "✓ Retry successful"
    echo "$RESPONSE" | jq '.'
else
    echo "✗ Retry failed"
    exit 1
fi
```

**Bulk Retry Script:**
```bash
#!/bin/bash
# bulk-retry-temporary-failures.sh
# Retries all messages with temporary error codes

set -euo pipefail

ADMIN_TOKEN="${ADMIN_TOKEN:-}"  # Must be set via environment
DRY_RUN="${DRY_RUN:-false}"      # Set to 'true' for testing
BATCH_SIZE=10
DELAY_SECONDS=2

if [[ -z "$ADMIN_TOKEN" ]]; then
    echo "Error: ADMIN_TOKEN environment variable not set"
    exit 1
fi

echo "=== Bulk Retry Script ==="
echo "Dry Run: $DRY_RUN"
echo "Batch Size: $BATCH_SIZE"
echo "Delay: ${DELAY_SECONDS}s between messages"
echo ""

# Get message IDs and org IDs
psql -h prod-db.internal -U atlas -d atlas -t -A -F',' <<EOF > /tmp/retry_messages.csv
SELECT id, org_id 
FROM outbound_message 
WHERE status='FAILED' 
  AND error_code IN ('0','1','131016','131026','132001')
  AND attempt_count < max_attempts
  AND created_at > NOW() - INTERVAL '4 hours'
ORDER BY created_at DESC
LIMIT $BATCH_SIZE;
EOF

TOTAL_COUNT=$(wc -l < /tmp/retry_messages.csv)
echo "Found $TOTAL_COUNT messages to retry"

if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN - Would retry these messages:"
    cat /tmp/retry_messages.csv
    exit 0
fi

SUCCESS_COUNT=0
FAIL_COUNT=0

while IFS=',' read -r MSG_ID ORG_ID; do
    echo "Retrying message $MSG_ID (org: $ORG_ID)..."
    
    if curl -sf -X POST \
        -H "X-Org-Id: ${ORG_ID}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "https://api.atlas-immobilier.com/api/v1/outbound/messages/${MSG_ID}/retry" > /dev/null; then
        echo "  ✓ Success"
        ((SUCCESS_COUNT++))
    else
        echo "  ✗ Failed"
        ((FAIL_COUNT++))
    fi
    
    sleep "$DELAY_SECONDS"
done < /tmp/retry_messages.csv

echo ""
echo "=== Retry Summary ==="
echo "Total: $TOTAL_COUNT"
echo "Success: $SUCCESS_COUNT"
echo "Failed: $FAIL_COUNT"

rm -f /tmp/retry_messages.csv
```

**3. Monitor Retry Progress:**

```bash
#!/bin/bash
# monitor-retry-progress.sh
# Watch queue status in real-time

watch -n 5 "psql -h prod-db.internal -U atlas -d atlas -c \"
SELECT 
    status,
    COUNT(*) as count,
    MIN(updated_at) as oldest_update,
    MAX(updated_at) as newest_update
FROM outbound_message 
WHERE channel='WHATSAPP' 
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY status 
ORDER BY status;\""
```

**4. Verify Success Rate:**

```sql
-- Check retry success rate
WITH recent_retries AS (
    SELECT 
        id,
        status,
        attempt_count,
        updated_at
    FROM outbound_message
    WHERE channel = 'WHATSAPP'
      AND updated_at > NOW() - INTERVAL '30 minutes'
      AND attempt_count > 0
)
SELECT 
    CASE 
        WHEN status IN ('SENT', 'DELIVERED') THEN 'SUCCESS'
        WHEN status = 'FAILED' THEN 'FAILED'
        ELSE 'PENDING'
    END as outcome,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM recent_retries
GROUP BY outcome
ORDER BY count DESC;
```

**Recovery Criteria:**
- ✅ Retry success rate > 80%
- ✅ Failure rate drops below 10%
- ✅ Queue depth stabilizing or decreasing
- ✅ No new temporary errors in last 10 minutes

#### Procedure 2: Provider Failover Strategy

**Status:** ⚠️ **Future Enhancement** - Not yet implemented

**Current State:** Only WhatsApp Cloud API (Meta) provider is implemented.

**Planned Architecture:**
- **Primary:** WhatsApp Cloud API (Meta)
- **Secondary:** Twilio WhatsApp API
- **Tertiary:** MessageBird WhatsApp API

**Manual Workaround - Channel Fallback:**

When WhatsApp provider is completely down, convert critical messages to alternative channels:

**1. Export Failed Critical Messages:**

```sql
-- Export high-priority failed WhatsApp messages
COPY (
    SELECT 
        om.id,
        om.org_id,
        om.dossier_id,
        om.to_recipient,
        om.template_code,
        om.subject,
        om.payload_json,
        d.lead_name,
        d.lead_email,
        om.created_at
    FROM outbound_message om
    LEFT JOIN dossier d ON om.dossier_id = d.id
    WHERE om.channel = 'WHATSAPP'
      AND om.status = 'FAILED'
      AND om.created_at > NOW() - INTERVAL '2 hours'
      AND om.template_code IN ('appointment_reminder', 'urgent_notification')  -- Critical templates
    ORDER BY om.created_at DESC
) TO '/tmp/critical_whatsapp_failures.csv' CSV HEADER;
```

**2. Convert to SMS Fallback:**

```sql
-- Create SMS messages as fallback for failed WhatsApp messages
INSERT INTO outbound_message (
    org_id,
    dossier_id,
    channel,
    direction,
    to_recipient,
    subject,
    status,
    idempotency_key,
    attempt_count,
    max_attempts,
    created_at,
    updated_at,
    created_by
)
SELECT 
    org_id,
    dossier_id,
    'SMS' as channel,
    'OUTBOUND' as direction,
    to_recipient,
    CONCAT('[WhatsApp Fallback] ', subject) as subject,
    'QUEUED' as status,
    CONCAT(idempotency_key, '-sms-fallback-', DATE_PART('epoch', NOW())::bigint) as idempotency_key,
    0 as attempt_count,
    5 as max_attempts,
    NOW() as created_at,
    NOW() as updated_at,
    'ops-whatsapp-fallback' as created_by
FROM outbound_message
WHERE channel = 'WHATSAPP'
  AND status = 'FAILED'
  AND error_code IN ('0', '1', '131016')  -- Only temporary failures
  AND created_at > NOW() - INTERVAL '2 hours'
  AND template_code IN ('appointment_reminder', 'urgent_notification')
ON CONFLICT (idempotency_key) DO NOTHING;  -- Prevent duplicates

-- Log the fallback action
SELECT 
    'Fallback created' as action,
    COUNT(*) as messages_converted
FROM outbound_message
WHERE created_by = 'ops-whatsapp-fallback'
  AND created_at > NOW() - INTERVAL '5 minutes';
```

#### Procedure 3: Rate Limit Backoff and Management

**When to Use:** Error codes 130, 3, 132069, 80007 (rate limit/quota errors)

**Estimated Time:** 5-15 minutes  
**Risk Level:** Medium  
**Rollback:** Can revert quota changes

**Steps:**

**1. Check Current Rate Limit State:**

```sql
-- Comprehensive rate limit status
SELECT 
    org_id,
    messages_sent_count,
    quota_limit,
    ROUND(100.0 * messages_sent_count / NULLIF(quota_limit, 0), 2) as usage_percentage,
    reset_at,
    CASE 
        WHEN reset_at > NOW() THEN EXTRACT(EPOCH FROM (reset_at - NOW()))/3600
        ELSE 0
    END as hours_until_reset,
    throttle_until,
    CASE 
        WHEN throttle_until IS NOT NULL AND throttle_until > NOW() THEN 
            EXTRACT(EPOCH FROM (throttle_until - NOW()))/60
        ELSE 0
    END as minutes_throttled,
    last_request_at,
    updated_at
FROM whatsapp_rate_limit
WHERE messages_sent_count > quota_limit * 0.7  -- Show orgs using >70% quota
ORDER BY usage_percentage DESC;

-- Rate limit errors in last hour
SELECT 
    org_id,
    COUNT(*) as rate_limit_errors,
    MAX(created_at) as most_recent_error
FROM outbound_message
WHERE status = 'FAILED'
  AND error_code IN ('130', '3', '132069', '80007')
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY org_id
ORDER BY rate_limit_errors DESC;
```

**2. Increase Quota Limit (if justified):**

```sql
-- IMPORTANT: Only increase quota for legitimate high-volume use cases
-- Requires approval from Product/Engineering Lead

-- Check current usage pattern
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as messages_sent
FROM outbound_message
WHERE org_id = 'ORG-ID-HERE'
  AND channel = 'WHATSAPP'
  AND status IN ('SENT', 'DELIVERED')
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Increase quota (example: 1000 -> 5000)
UPDATE whatsapp_rate_limit
SET quota_limit = 5000,
    updated_at = NOW(),
    updated_by = 'ops-quota-increase-TICKET-NUMBER'
WHERE org_id = 'ORG-ID-HERE';

-- Verify update
SELECT 
    org_id,
    quota_limit,
    messages_sent_count,
    ROUND(100.0 * messages_sent_count / quota_limit, 2) as new_usage_pct,
    updated_by,
    updated_at
FROM whatsapp_rate_limit
WHERE org_id = 'ORG-ID-HERE';
```

**Recovery Criteria:**
- ✅ No rate limit errors for 15 minutes
- ✅ Messages sending successfully
- ✅ Quota usage within acceptable range (<80%)
- ✅ No throttle_until set

---

## Webhook Signature Validation Failures

### Symptoms

- ⚠️ 401 Unauthorized responses to WhatsApp webhooks
- ⚠️ Inbound messages not being processed
- ⚠️ Logs show "Invalid webhook signature" errors
- ⚠️ Alert: `whatsapp_webhook_signature_failures_total > 10`
- ⚠️ Session windows not updating despite inbound messages

### Verification Steps

#### Step 1: Check Recent Signature Failures

```bash
# Check application logs
kubectl logs -l app=backend --tail=100 | grep -i "Invalid webhook signature"

# Or via Kibana
# Query: service:backend AND message:"Invalid webhook signature" AND @timestamp:[now-1h TO now]
```

#### Step 2: Verify Webhook Configuration

```sql
-- Check webhook configuration for all enabled providers
SELECT 
    org_id,
    phone_number_id,
    business_account_id,
    enabled,
    LENGTH(webhook_secret_encrypted) as secret_length_bytes,
    webhook_secret_encrypted IS NOT NULL as has_secret,
    updated_at,
    updated_by,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/86400 as days_since_update
FROM whatsapp_provider_config
WHERE enabled = true
ORDER BY org_id;

-- Check for recent configuration changes
SELECT 
    org_id,
    updated_at,
    updated_by
FROM whatsapp_provider_config
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;
```

### Response Procedures

#### Procedure 1: Webhook Secret Rotation (Zero-Downtime)

**When to Use:** Secret compromised, validation consistently failing, or scheduled rotation

**Estimated Time:** 15-30 minutes  
**Risk Level:** Medium  
**Rollback:** Keep old secret for 7 days

**Steps:**

**1. Generate New Cryptographically Secure Secret:**

```bash
#!/bin/bash
# generate-webhook-secret.sh
# Generate a strong 256-bit secret for webhook validation

NEW_SECRET=$(openssl rand -hex 32)
echo "New webhook secret generated (64 hex characters):"
echo "$NEW_SECRET"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "  - Store this secret securely (e.g., in password manager or vault)"
echo "  - Do NOT commit to git"
echo "  - Do NOT share in plain text via email/Slack"
echo "  - Do NOT log this value"
```

**2. Update Secret in Database (with encryption):**

```sql
-- Get current secret first (for rollback)
CREATE TEMP TABLE webhook_secret_backup AS
SELECT 
    org_id,
    webhook_secret_encrypted,
    updated_at,
    updated_by
FROM whatsapp_provider_config
WHERE org_id = 'ORG-ID-HERE';

-- Update with new secret
-- Note: Replace 'NEW-SECRET-HERE' with the actual generated secret
-- Note: Replace 'ENCRYPTION-KEY' with your database encryption key
UPDATE whatsapp_provider_config
SET webhook_secret_encrypted = pgp_sym_encrypt('NEW-SECRET-HERE', 'ENCRYPTION-KEY'),
    updated_at = NOW(),
    updated_by = 'ops-webhook-rotation-TICKET-NUMBER'
WHERE org_id = 'ORG-ID-HERE';

-- Verify update (check that encrypted value changed)
SELECT 
    org_id,
    webhook_secret_encrypted != (SELECT webhook_secret_encrypted FROM webhook_secret_backup) as secret_changed,
    updated_at,
    updated_by
FROM whatsapp_provider_config
WHERE org_id = 'ORG-ID-HERE';
```

**3. Update WhatsApp Business Manager Settings:**

Manual steps:
1. Open Meta Business Manager: https://business.facebook.com
2. Navigate to WhatsApp → Settings → Webhooks
3. Update webhook secret to the new value
4. Click "Verify and Save"
5. Test webhook functionality

**4. Monitor for 30 Minutes:**

```bash
#!/bin/bash
# monitor-webhook-health.sh
# Monitor webhook processing after secret rotation

DURATION_MINUTES=30
CHECK_INTERVAL_SECONDS=60

echo "Monitoring webhook health for ${DURATION_MINUTES} minutes..."

for ((i=1; i<=DURATION_MINUTES; i++)); do
    echo "[$(date +'%H:%M:%S')] Check $i/$DURATION_MINUTES"
    
    # Check inbound messages in last 5 minutes
    INBOUND_COUNT=$(psql -h prod-db.internal -U atlas -d atlas -t -c "
        SELECT COUNT(*) 
        FROM message 
        WHERE channel='WHATSAPP' 
          AND direction='INBOUND' 
          AND created_at > NOW() - INTERVAL '5 minutes'
    ")
    echo "  Inbound messages (last 5 min): $INBOUND_COUNT"
    
    # Check for signature validation failures
    SIG_FAILURES=$(kubectl logs -l app=backend --since=5m 2>/dev/null | \
        grep -c "Invalid webhook signature" || echo "0")
    echo "  Signature failures (last 5 min): $SIG_FAILURES"
    
    if [[ "$SIG_FAILURES" -gt 0 ]]; then
        echo "  ⚠️  WARNING: Signature validation failures detected"
    fi
    
    echo ""
    sleep "$CHECK_INTERVAL_SECONDS"
done

echo "✓ Monitoring complete"
```

**Recovery Criteria:**
- ✅ Signature validation success rate > 99.9%
- ✅ Inbound messages processing normally
- ✅ No 401 Unauthorized errors in logs
- ✅ Session windows updating correctly
- ✅ Zero signature validation failures for 30 minutes

---

## Dead Letter Queue (DLQ) Processing

### Overview

Messages enter the Dead Letter Queue (DLQ) when:
- `attempt_count >= max_attempts` (default: 5 attempts)
- Status = `FAILED`
- Non-retryable error codes (e.g., invalid phone number, blocked recipient)
- Exceeded retry backoff window

### Symptoms

- ⚠️ Alert: `outbound_message_dlq_size > 100`
- ⚠️ Increased customer complaints about missed notifications
- ⚠️ Prometheus metric: `outbound_message_dlq_messages{channel="WHATSAPP"} > threshold`
- ⚠️ Dashboard shows growing DLQ size over time

### Verification Steps

#### Step 1: Get DLQ Size and Composition

```sql
-- Total DLQ size
SELECT COUNT(*) as dlq_total_size
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts;

-- Breakdown by channel and error code
SELECT 
    channel,
    error_code,
    error_message,
    COUNT(*) as message_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message,
    COUNT(DISTINCT org_id) as affected_orgs
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
GROUP BY channel, error_code, error_message
ORDER BY message_count DESC;

-- DLQ growth trend (by day for last 7 days)
SELECT 
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) as daily_dlq_additions,
    COUNT(DISTINCT org_id) as orgs_affected
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC;
```

#### Step 2: Analyze Error Distribution

```sql
-- Top error codes with categorization
WITH error_categories AS (
    SELECT 
        error_code,
        CASE 
            WHEN error_code IN ('131021', '131031', '133000', '470') THEN 'Invalid Recipient'
            WHEN error_code IN ('133004', '133005', '133006', '133008', '133009', '133010') THEN 'Template Error'
            WHEN error_code IN ('0', '1', '131016', '131026', '132001') THEN 'Temporary Error'
            WHEN error_code IN ('130', '3', '132069', '80007') THEN 'Rate Limit'
            ELSE 'Other'
        END as category,
        error_message,
        COUNT(*) as frequency
    FROM outbound_message
    WHERE status = 'FAILED'
      AND attempt_count >= max_attempts
    GROUP BY error_code, error_message
)
SELECT 
    category,
    error_code,
    error_message,
    frequency,
    ROUND(frequency * 100.0 / SUM(frequency) OVER(), 2) as percentage
FROM error_categories
ORDER BY category, frequency DESC;

-- Retryable vs non-retryable breakdown
SELECT 
    CASE 
        WHEN error_code IN ('0', '1', '131016', '131026', '132001') THEN 'Retryable'
        ELSE 'Non-Retryable'
    END as retry_status,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
GROUP BY retry_status;
```

### Response Procedures

#### Procedure 1: Manual Review & Triage

**When to Use:** Regular DLQ cleanup, investigation of failure patterns

**Estimated Time:** 30-60 minutes  
**Risk Level:** Low  
**Frequency:** Daily or when DLQ > 50 messages

**Steps:**

**1. Export DLQ Messages for Analysis:**

```bash
#!/bin/bash
# export-dlq-messages.sh
# Export DLQ messages to CSV for detailed analysis

EXPORT_FILE="/tmp/dlq_export_$(date +%Y%m%d_%H%M%S).csv"

echo "Exporting DLQ messages to: $EXPORT_FILE"

psql -h prod-db.internal -U atlas -d atlas <<EOF
\COPY (
    SELECT 
        om.id,
        om.org_id,
        om.dossier_id,
        om.channel,
        om.to_recipient,
        om.template_code,
        om.subject,
        om.error_code,
        om.error_message,
        om.attempt_count,
        om.max_attempts,
        om.created_at,
        om.updated_at,
        EXTRACT(EPOCH FROM (NOW() - om.created_at))/86400 as days_in_dlq,
        d.lead_name,
        d.lead_email
    FROM outbound_message om
    LEFT JOIN dossier d ON om.dossier_id = d.id
    WHERE om.status = 'FAILED'
      AND om.attempt_count >= om.max_attempts
    ORDER BY om.created_at DESC
) TO '$EXPORT_FILE' CSV HEADER;
EOF

echo "✓ Export complete: $(wc -l < $EXPORT_FILE) messages"
```

**2. Categorize by Error Type:**

```sql
-- Detailed categorization with actionable insights
WITH categorized_errors AS (
    SELECT 
        id,
        org_id,
        error_code,
        error_message,
        CASE 
            -- Non-retryable recipient errors
            WHEN error_code IN ('131021', '131031') THEN 'Invalid Phone Number'
            WHEN error_code = '133000' THEN 'Blocked/Opted Out'
            WHEN error_code = '470' THEN 'Session Expired'
            
            -- Template errors
            WHEN error_code = '133004' THEN 'Template Not Found'
            WHEN error_code = '133005' THEN 'Template Rejected'
            WHEN error_code = '133006' THEN 'Template Paused'
            WHEN error_code = '133008' THEN 'Template Parameter Missing'
            WHEN error_code = '133009' THEN 'Template Parameter Invalid'
            WHEN error_code = '133010' THEN 'Template Not Approved'
            
            -- Temporary errors (retry candidates)
            WHEN error_code IN ('0', '1') THEN 'Generic Temporary Error'
            WHEN error_code = '131016' THEN 'Service Unavailable'
            WHEN error_code = '131026' THEN 'Message Undeliverable'
            WHEN error_code = '132001' THEN 'Rate Limit Parameter Invalid'
            
            -- Rate limit errors
            WHEN error_code IN ('130', '3', '132069', '80007') THEN 'Rate Limit Exceeded'
            
            ELSE 'Uncategorized'
        END as error_category,
        CASE 
            WHEN error_code IN ('0', '1', '131016', '131026', '132001') THEN 'YES'
            ELSE 'NO'
        END as retryable,
        CASE 
            WHEN error_code IN ('131021', '131031') THEN 'Update recipient phone number'
            WHEN error_code = '133000' THEN 'Respect opt-out, do not retry'
            WHEN error_code = '470' THEN 'Use template message or wait for session'
            WHEN error_code IN ('133004', '133005', '133006', '133010') THEN 'Fix/approve template in Meta'
            WHEN error_code IN ('133008', '133009') THEN 'Fix template parameters in code'
            WHEN error_code IN ('0', '1', '131016', '131026', '132001') THEN 'Retry after 24 hours'
            WHEN error_code IN ('130', '3', '132069', '80007') THEN 'Increase quota or wait for reset'
            ELSE 'Manual investigation required'
        END as recommended_action
    FROM outbound_message
    WHERE status = 'FAILED'
      AND attempt_count >= max_attempts
)
SELECT 
    error_category,
    retryable,
    recommended_action,
    COUNT(*) as message_count,
    COUNT(DISTINCT org_id) as orgs_affected,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM categorized_errors
GROUP BY error_category, retryable, recommended_action
ORDER BY message_count DESC;
```

#### Procedure 2: Bulk Retry for Temporary Errors

**When to Use:** Large number of messages failed due to temporary provider issues

**Estimated Time:** 15-45 minutes  
**Risk Level:** Low  
**Rollback:** Database backup created automatically

**Steps:**

**1. Identify Retry Candidates:**

```sql
-- Messages eligible for retry (temporary errors, 24+ hours old)
SELECT 
    id,
    org_id,
    to_recipient,
    template_code,
    error_code,
    error_message,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_since_last_attempt,
    attempt_count,
    max_attempts
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
  AND error_code IN ('0', '1', '131016', '131026', '132001')  -- Temporary errors only
  AND updated_at < NOW() - INTERVAL '24 hours'  -- Wait 24h cooling period
ORDER BY updated_at
LIMIT 1000;

-- Count by error code
SELECT 
    error_code,
    COUNT(*) as retry_candidates,
    MIN(updated_at) as oldest,
    MAX(updated_at) as newest
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
  AND error_code IN ('0', '1', '131016', '131026', '132001')
  AND updated_at < NOW() - INTERVAL '24 hours'
GROUP BY error_code;
```

**2. Create Backup and Reset for Retry:**

```sql
-- Create timestamped backup table
CREATE TABLE outbound_message_dlq_backup_20240115 AS
SELECT * FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
  AND error_code IN ('0', '1', '131016', '131026', '132001');

-- Reset messages for retry
UPDATE outbound_message
SET status = 'QUEUED',
    attempt_count = 0,
    error_code = NULL,
    error_message = NULL,
    updated_at = NOW(),
    updated_by = 'ops-dlq-retry-20240115'
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
  AND error_code IN ('0', '1', '131016', '131026', '132001')
  AND updated_at < NOW() - INTERVAL '24 hours';

-- Check affected rows
SELECT 
    'Messages reset for retry' as action,
    COUNT(*) as messages_reset 
FROM outbound_message 
WHERE updated_by = 'ops-dlq-retry-20240115';
```

**3. Monitor Retry Progress:**

```bash
# Watch for next 30 minutes
watch -n 30 "psql -h prod-db.internal -U atlas -d atlas -c \"
SELECT 
    status,
    COUNT(*) as count
FROM outbound_message
WHERE updated_by = 'ops-dlq-retry-20240115'
GROUP BY status
ORDER BY status\""
```

**4. Verify Success Rate:**

```sql
SELECT 
    CASE 
        WHEN status IN ('SENT', 'DELIVERED') THEN 'SUCCESS'
        WHEN status = 'FAILED' THEN 'FAILED'
        ELSE 'PENDING'
    END as outcome,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM outbound_message
WHERE updated_by = 'ops-dlq-retry-20240115'
GROUP BY outcome;
```

#### Procedure 3: DLQ Archival & Cleanup

**When to Use:** DLQ has old messages (>30 days) with no recovery path

**Steps:**

**1. Identify Archival Candidates:**

```sql
SELECT 
    id,
    org_id,
    channel,
    error_code,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as days_old
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
  AND created_at < NOW() - INTERVAL '30 days'
ORDER BY created_at
LIMIT 100;
```

**2. Archive to Long-term Storage:**

```bash
#!/bin/bash
# archive-old-dlq-messages.sh
# Archive DLQ messages older than 30 days

ARCHIVE_FILE="dlq_archive_$(date +%Y%m%d_%H%M%S).csv"

psql -h prod-db.internal -U atlas -d atlas -c "COPY (
    SELECT 
        id, org_id, dossier_id, channel, direction, to_recipient,
        template_code, subject, payload_json, status, provider_message_id,
        idempotency_key, attempt_count, max_attempts, error_code,
        error_message, created_at, updated_at
    FROM outbound_message
    WHERE status = 'FAILED'
      AND attempt_count >= max_attempts
      AND created_at < NOW() - INTERVAL '30 days'
) TO '/tmp/${ARCHIVE_FILE}' CSV HEADER"

# Upload to S3 or archive storage
aws s3 cp /tmp/${ARCHIVE_FILE} s3://atlas-archives/dlq/${ARCHIVE_FILE} --sse AES256

echo "✓ Archived $(wc -l < /tmp/${ARCHIVE_FILE}) messages to S3"
```

**3. Delete Archived Messages:**

```sql
-- Safety check: ensure archive exists
-- Then delete
DELETE FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count >= max_attempts
  AND created_at < NOW() - INTERVAL '30 days';

-- Vacuum table
VACUUM ANALYZE outbound_message;
```

---

## Outbound Queue Backup Scenarios

### Symptoms

- ⚠️ Queue depth increasing rapidly
- ⚠️ Alert: `outbound_message_queue_depth > 1000`
- ⚠️ Worker processing slowed or stopped
- ⚠️ Messages stuck in QUEUED state for >2 hours

### Verification Steps

```sql
-- Check queue depth
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message,
    AVG(attempt_count) as avg_attempts
FROM outbound_message
WHERE status IN ('QUEUED', 'SENDING')
GROUP BY status;

-- Check for stuck messages
SELECT 
    id,
    org_id,
    to_recipient,
    status,
    attempt_count,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_in_queue
FROM outbound_message
WHERE status = 'QUEUED'
  AND created_at < NOW() - INTERVAL '2 hours'
ORDER BY created_at
LIMIT 20;
```

### Response Procedures

#### Procedure 1: Database Checkpoint & Backup

**Steps:**

```bash
#!/bin/bash
# create-queue-backup.sh
# Create point-in-time backup of outbound queue

BACKUP_FILE="outbound_queue_backup_$(date +%Y%m%d_%H%M%S).sql"

# PostgreSQL: Create manual checkpoint
psql -h prod-db.internal -U atlas -d atlas -c "CHECKPOINT;"

# Create logical backup
pg_dump -h prod-db.internal -U atlas -d atlas \
    -t outbound_message -t outbound_attempt \
    -t whatsapp_rate_limit -t whatsapp_session_window \
    > /backup/${BACKUP_FILE}

# Compress and upload
gzip /backup/${BACKUP_FILE}
aws s3 cp /backup/${BACKUP_FILE}.gz s3://atlas-backups/database/${BACKUP_FILE}.gz --sse AES256

echo "✓ Backup created: ${BACKUP_FILE}.gz"
```

#### Procedure 2: Scale Worker Processing

**When to Use:** Queue backed up but system healthy, just needs more processing power

**Steps:**

```bash
# Increase worker batch size
kubectl set env deployment/backend OUTBOUND_WORKER_BATCH_SIZE=50

# Scale horizontally
kubectl scale deployment/backend --replicas=5

# Monitor queue depth
watch -n 30 "psql -h prod-db.internal -U atlas -d atlas -t -c \"
SELECT COUNT(*) FROM outbound_message WHERE status='QUEUED'\""

# Revert after queue cleared
kubectl set env deployment/backend OUTBOUND_WORKER_BATCH_SIZE=10
kubectl scale deployment/backend --replicas=2
```

---

## Manual Operations Scripts

### Message Retry Script

Save as `scripts/ops/retry-messages.sh`:

```bash
#!/bin/bash
# retry-messages.sh - Manual message retry utility

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_HOST="${DB_HOST:-prod-db.internal}"
DB_USER="${DB_USER:-atlas}"
DB_NAME="${DB_NAME:-atlas}"

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Manual message retry utility for WhatsApp outbound messages

OPTIONS:
    -e, --error-codes    Comma-separated error codes to retry (default: 0,1,131016)
    -l, --limit          Maximum number of messages to retry (default: 100)
    -a, --age-hours      Minimum age in hours since last attempt (default: 24)
    -d, --dry-run        Show what would be retried without executing
    -h, --help           Show this help message

EXAMPLES:
    # Retry up to 100 messages with temporary errors
    $0 --limit 100

    # Dry run to see what would be retried
    $0 --dry-run

    # Retry specific error codes
    $0 --error-codes "131016,131026" --limit 50

EOF
    exit 1
}

# Parse arguments
ERROR_CODES="0,1,131016"
LIMIT=100
AGE_HOURS=24
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--error-codes)
            ERROR_CODES="$2"
            shift 2
            ;;
        -l|--limit)
            LIMIT="$2"
            shift 2
            ;;
        -a|--age-hours)
            AGE_HOURS="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

echo "=== Message Retry Utility ==="
echo "Error Codes: $ERROR_CODES"
echo "Limit: $LIMIT"
echo "Min Age: ${AGE_HOURS}h"
echo "Dry Run: $DRY_RUN"
echo ""

# Build error codes array for SQL
IFS=',' read -ra ERROR_ARRAY <<< "$ERROR_CODES"
ERROR_SQL="("
for code in "${ERROR_ARRAY[@]}"; do
    ERROR_SQL+="'$code',"
done
ERROR_SQL="${ERROR_SQL%,})"

# Query retry candidates
QUERY="
SELECT 
    id,
    org_id,
    to_recipient,
    template_code,
    error_code,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_old
FROM outbound_message
WHERE status = 'FAILED'
  AND attempt_count < max_attempts
  AND error_code IN $ERROR_SQL
  AND updated_at < NOW() - INTERVAL '${AGE_HOURS} hours'
ORDER BY updated_at
LIMIT $LIMIT;
"

if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN - Would retry these messages:"
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$QUERY"
    exit 0
fi

# Execute retry
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -A -F',' -c "$QUERY" | while IFS=',' read -r id org_id rest; do
    echo "Retrying message $id (org: $org_id)..."
    
    curl -sf -X POST \
        -H "X-Org-Id: ${org_id}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "https://api.atlas-immobilier.com/api/v1/outbound/messages/${id}/retry" > /dev/null
    
    sleep 0.5
done

echo "✓ Retry complete"
```

### DLQ Analysis Script

Save as `scripts/ops/analyze-dlq.sh`:

```bash
#!/bin/bash
# analyze-dlq.sh - DLQ analysis and reporting tool

set -euo pipefail

DB_HOST="${DB_HOST:-prod-db.internal}"
DB_USER="${DB_USER:-atlas}"
DB_NAME="${DB_NAME:-atlas}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp}"

REPORT_FILE="${OUTPUT_DIR}/dlq_analysis_$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" <<EOF
================================================================================
DLQ Analysis Report
Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
================================================================================

EOF

echo "Generating DLQ analysis report..."

# Total DLQ size
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t <<'SQL' >> "$REPORT_FILE"
SELECT 'Total DLQ Messages: ' || COUNT(*) FROM outbound_message WHERE status='FAILED' AND attempt_count >= max_attempts;
SQL

echo "" >> "$REPORT_FILE"
echo "Error Code Distribution:" >> "$REPORT_FILE"
echo "------------------------" >> "$REPORT_FILE"

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<'SQL' >> "$REPORT_FILE"
SELECT 
    error_code,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM outbound_message
WHERE status = 'FAILED' AND attempt_count >= max_attempts
GROUP BY error_code
ORDER BY count DESC
LIMIT 10;
SQL

echo "" >> "$REPORT_FILE"
echo "Age Distribution:" >> "$REPORT_FILE"
echo "----------------" >> "$REPORT_FILE"

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<'SQL' >> "$REPORT_FILE"
SELECT 
    CASE 
        WHEN created_at > NOW() - INTERVAL '24 hours' THEN '< 1 day'
        WHEN created_at > NOW() - INTERVAL '7 days' THEN '1-7 days'
        WHEN created_at > NOW() - INTERVAL '30 days' THEN '7-30 days'
        ELSE '> 30 days'
    END as age,
    COUNT(*) as count
FROM outbound_message
WHERE status = 'FAILED' AND attempt_count >= max_attempts
GROUP BY age
ORDER BY MIN(created_at);
SQL

echo "" >> "$REPORT_FILE"
echo "Affected Organizations:" >> "$REPORT_FILE"
echo "----------------------" >> "$REPORT_FILE"

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<'SQL' >> "$REPORT_FILE"
SELECT 
    org_id,
    COUNT(*) as failed_messages
FROM outbound_message
WHERE status = 'FAILED' AND attempt_count >= max_attempts
GROUP BY org_id
ORDER BY failed_messages DESC
LIMIT 10;
SQL

echo "" >> "$REPORT_FILE"
echo "Recommendations:" >> "$REPORT_FILE"
echo "---------------" >> "$REPORT_FILE"
echo "1. Review and fix template errors" >> "$REPORT_FILE"
echo "2. Archive messages older than 30 days" >> "$REPORT_FILE"
echo "3. Retry temporary failures after 24-hour cooling period" >> "$REPORT_FILE"
echo "4. Update phone number validation logic" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "✓ Report generated: $REPORT_FILE"
cat "$REPORT_FILE"
```

---

## Escalation Matrix

### On-Call Contacts

#### Level 1: Platform Engineering (First Response)
**Response Time: 15 minutes**

| Role | Contact Method | Backup |
|------|----------------|---------|
| Platform Engineer (Primary) | PagerDuty: platform-oncall | Platform Engineer (Secondary) |
| Platform Engineer (Secondary) | PagerDuty: platform-oncall-backup | Tech Lead |

**Responsibilities:**
- Initial triage and assessment
- Execute runbook procedures
- Gather diagnostic information
- Escalate if beyond scope

**Escalation Criteria:**
- Issue not resolved within 30 minutes
- Requires architecture changes
- Multi-system impact
- Security implications
- Database corruption suspected

#### Level 2: Senior Engineering / Tech Lead
**Response Time: 30 minutes**

| Role | Contact Method | Backup |
|------|----------------|---------|
| Tech Lead | PagerDuty: tech-lead-oncall | Engineering Manager |
| Senior Backend Engineer | PagerDuty: senior-eng-oncall | Tech Lead |

**Responsibilities:**
- Complex troubleshooting
- Code hotfixes if needed
- Architecture decisions
- Coordinate with other teams

**Escalation Criteria:**
- Critical business impact
- Data loss risk
- Security breach suspected
- Requires emergency deployment
- Vendor escalation needed (Meta/WhatsApp)

#### Level 3: Engineering Manager / VP Engineering
**Response Time: 1 hour**

| Role | Contact Method |
|------|----------------|
| Engineering Manager | PagerDuty: eng-manager-oncall |
| VP Engineering | Phone: [Secure Contact] |

**Responsibilities:**
- Executive decision making
- Vendor management (Meta Business Support)
- Cross-organizational coordination
- Customer communication approval

### Escalation Decision Tree

```
├─ WhatsApp Provider Outage
│  ├─ L1: Initial response (verify, retry temporary failures)
│  ├─ L2: If >30% failure rate or >30 min
│  └─ L3: If provider-wide or >2 hour outage
│
├─ Webhook Signature Failures
│  ├─ L1: Rotate secrets, verify configuration
│  ├─ L2: If multiple orgs affected or rotation fails
│  └─ L3: If security breach suspected
│
├─ DLQ Overflow (>500 messages)
│  ├─ L1: Analyze errors, bulk retry if appropriate
│  ├─ L2: If systemic issue or >1000 in DLQ
│  └─ L3: If data loss occurred or >2000 in DLQ
│
├─ Queue Backup (>1000 queued)
│  ├─ L1: Check worker, scale if needed
│  ├─ L2: If database issues or >5000 queued
│  └─ L3: If requires emergency drain or >10000 queued
│
└─ Data Corruption
   ├─ L1: Immediate escalation (DO NOT ATTEMPT FIXES)
   ├─ L2: Assess impact, prepare restore
   └─ L3: Authorize restore, customer communication
```

---

## Monitoring & Alerts

### Prometheus Alert Rules

```yaml
groups:
  - name: whatsapp_critical
    rules:
      - alert: WhatsAppHighFailureRate
        expr: |
          rate(outbound_message_failures_total{channel="WHATSAPP"}[5m]) > 0.30
        for: 5m
        labels:
          severity: critical
          channel: whatsapp
        annotations:
          summary: "WhatsApp failure rate above 30%"
          description: "{{ $value }}% of WhatsApp messages are failing"

      - alert: WhatsAppDLQOverflow
        expr: |
          outbound_message_dlq_messages{channel="WHATSAPP"} > 500
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "WhatsApp DLQ contains {{ $value }} messages"

      - alert: WhatsAppQueueBackup
        expr: |
          outbound_message_queue_depth{status="QUEUED"} > 2000
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Outbound queue has {{ $value }} messages"

      - alert: WhatsAppWebhookSignatureFailures
        expr: |
          rate(whatsapp_webhook_signature_failures_total[5m]) > 0.05
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "WhatsApp webhook signature validation failing"
```

---

## Common Troubleshooting Scenarios

### Issue 1: Messages Stuck in SENDING Status

**Symptoms:** Messages remain in SENDING for >30 minutes

**Diagnosis:**
```sql
SELECT 
    id,
    to_recipient,
    status,
    attempt_count,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck
FROM outbound_message
WHERE status = 'SENDING'
  AND updated_at < NOW() - INTERVAL '30 minutes'
ORDER BY updated_at;
```

**Solution:**
```sql
-- Reset to QUEUED for retry
UPDATE outbound_message
SET status = 'QUEUED',
    updated_at = NOW(),
    updated_by = 'ops-stuck-fix'
WHERE status = 'SENDING'
  AND updated_at < NOW() - INTERVAL '30 minutes';
```

### Issue 2: Template Not Found Errors

**Symptoms:** Error code: 133004, consistent failures for specific templates

**Solution:**
1. Verify template exists in WhatsApp Business Manager
2. Check template approval status
3. Verify template name matches code exactly (case-sensitive)
4. Re-sync templates if needed

```bash
# Get list of approved templates from Meta
curl -X GET \
  "https://graph.facebook.com/v18.0/${BUSINESS_ACCOUNT_ID}/message_templates" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.data[] | {name: .name, status: .status}'
```

### Issue 3: Rate Limit Not Resetting

**Symptoms:** All messages failing with rate limit error, reset_at timestamp passed but still throttled

**Solution:**
```sql
-- Force rate limit reset
UPDATE whatsapp_rate_limit
SET messages_sent_count = 0,
    reset_at = NOW() + INTERVAL '24 hours',
    throttle_until = NULL,
    updated_at = NOW(),
    updated_by = 'ops-rate-limit-reset'
WHERE org_id = 'ORG-ID-HERE';
```

---

## Database Maintenance

### Regular Maintenance Tasks

#### Weekly: Vacuum and Analyze

```sql
-- Vacuum outbound tables to reclaim space
VACUUM ANALYZE outbound_message;
VACUUM ANALYZE outbound_attempt;
VACUUM ANALYZE whatsapp_rate_limit;

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE '%outbound%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Monthly: Index Maintenance

```sql
-- Reindex for optimal performance
REINDEX TABLE outbound_message;
REINDEX TABLE outbound_attempt;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%outbound%'
ORDER BY idx_scan DESC;
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | Platform Team | Initial version |
| 2.0 | 2024-01-15 | Platform Team | Enhanced with operational scripts, detailed procedures |

## Related Documentation

- [WhatsApp Outbound Implementation](../WHATSAPP_OUTBOUND_IMPLEMENTATION.md)
- [Observability Runbook](./RUNBOOK_OBSERVABILITY.md)
- [API Documentation](./API_VERSIONING_IMPLEMENTATION.md)
- [AGENTS.md](../AGENTS.md)

---

**End of Runbook**

*For questions or updates to this runbook, contact: platform-team@atlas-immobilier.com*
