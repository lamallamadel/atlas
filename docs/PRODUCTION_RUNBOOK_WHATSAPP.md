# Production Runbook - WhatsApp Messaging Operations

## Overview

This runbook provides incident response procedures for WhatsApp messaging operations, covering provider outages, webhook validation failures, DLQ processing, queue backup scenarios, and escalation procedures.

**Last Updated:** 2024-01-15  
**Version:** 1.0  
**Owned By:** Platform Engineering Team

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [WhatsApp Provider Outages](#whatsapp-provider-outages)
3. [Webhook Signature Validation Failures](#webhook-signature-validation-failures)
4. [Dead Letter Queue (DLQ) Processing](#dead-letter-queue-dlq-processing)
5. [Outbound Queue Backup Scenarios](#outbound-queue-backup-scenarios)
6. [Escalation Matrix](#escalation-matrix)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Common Issues & Solutions](#common-issues--solutions)

---

## Quick Reference

### Critical Endpoints
- Backend API: `https://api.example.com`
- Actuator Health: `https://api.example.com/actuator/health`
- Metrics: `https://api.example.com/actuator/prometheus`
- Grafana: `https://grafana.example.com`
- Kibana: `https://kibana.example.com`

### Key Database Tables
- `outbound_message` - Outbound message queue
- `outbound_attempt` - Retry attempt history
- `whatsapp_provider_config` - Provider credentials
- `whatsapp_rate_limit` - Rate limiting state
- `whatsapp_session_window` - 24-hour session tracking

### Key Metrics
```promql
# Queue depth
outbound_message_queue_depth{status="QUEUED"}

# DLQ size
outbound_message_dlq_size

# Failure rate
rate(outbound_message_failures_total{channel="WHATSAPP"}[5m])

# Rate limit hits
whatsapp_rate_limit_hits_total
```

---

## WhatsApp Provider Outages

### Symptoms
- High failure rate for WhatsApp messages (>30%)
- Error codes: 1, 0, 131016 (temporary errors)
- Increased latency or timeouts
- Prometheus alert: `whatsapp_provider_availability < 0.95`

### Verification Steps

1. **Check WhatsApp Business API Status**
   ```bash
   # Check Meta API status page
   curl -s https://developers.facebook.com/status/
   ```

2. **Query Recent Failures**
   ```sql
   SELECT 
       error_code, 
       COUNT(*) as count,
       error_message
   FROM outbound_message 
   WHERE channel = 'WHATSAPP' 
     AND status = 'FAILED'
     AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY error_code, error_message
   ORDER BY count DESC;
   ```

3. **Check Outbound Metrics**
   ```bash
   curl -s http://localhost:8080/api/v1/dashboard/outbound/health | jq '.channelMetrics.WHATSAPP'
   ```

### Response Procedures

#### Procedure 1: Manual Retry for Temporary Failures

**When:** Provider returns temporary errors (codes: 0, 1, 131016)

**Steps:**
1. Identify retryable failed messages:
   ```sql
   SELECT id, to_recipient, error_code, attempt_count
   FROM outbound_message
   WHERE channel = 'WHATSAPP'
     AND status = 'FAILED'
     AND error_code IN ('0', '1', '131016')
     AND attempt_count < max_attempts
     AND created_at > NOW() - INTERVAL '4 hours'
   ORDER BY created_at DESC;
   ```

2. Retry messages via API:
   ```bash
   # Single message retry
   curl -X POST \
     -H "X-Org-Id: ${ORG_ID}" \
     -H "Authorization: Bearer ${TOKEN}" \
     "https://api.example.com/api/v1/outbound/messages/${MESSAGE_ID}/retry"
   
   # Bulk retry script
   for id in $(psql -t -c "SELECT id FROM outbound_message WHERE status='FAILED' AND error_code IN ('0','1','131016')"); do
     curl -X POST \
       -H "X-Org-Id: ${ORG_ID}" \
       -H "Authorization: Bearer ${TOKEN}" \
       "https://api.example.com/api/v1/outbound/messages/${id}/retry"
     sleep 0.5
   done
   ```

3. Monitor retry success:
   ```bash
   watch -n 5 "psql -c \"SELECT status, COUNT(*) FROM outbound_message WHERE channel='WHATSAPP' GROUP BY status\""
   ```

**Rollback:** No rollback needed - retries are idempotent

#### Procedure 2: Provider Failover (Future Enhancement)

**Note:** Currently only WhatsApp Cloud API provider is implemented. Failover to alternate providers requires additional development.

**Planned Architecture:**
- Primary: WhatsApp Cloud API (Meta)
- Secondary: Twilio WhatsApp API
- Tertiary: MessageBird WhatsApp API

**Manual Workaround:**
1. Export failed messages:
   ```sql
   COPY (
     SELECT id, org_id, dossier_id, to_recipient, template_code, subject, payload_json
     FROM outbound_message
     WHERE channel = 'WHATSAPP'
       AND status = 'FAILED'
       AND created_at > NOW() - INTERVAL '24 hours'
   ) TO '/tmp/whatsapp_failed_messages.csv' CSV HEADER;
   ```

2. Use alternate channel (SMS/Email) for critical messages:
   ```bash
   # Convert WhatsApp to SMS
   psql -c "INSERT INTO outbound_message (org_id, dossier_id, channel, to_recipient, subject, status, idempotency_key, attempt_count, max_attempts, created_at, updated_at)
   SELECT org_id, dossier_id, 'SMS', to_recipient, subject, 'QUEUED', CONCAT(idempotency_key, '-sms-fallback'), 0, 5, NOW(), NOW()
   FROM outbound_message
   WHERE channel = 'WHATSAPP' AND status = 'FAILED' AND error_code IN ('0','1','131016')"
   ```

3. Notify stakeholders about channel switch

#### Procedure 3: Rate Limit Backoff

**When:** Error code 130, 3, 132069, 80007 (rate limit errors)

**Steps:**
1. Check current rate limit state:
   ```sql
   SELECT 
       org_id,
       messages_sent_count,
       quota_limit,
       reset_at,
       throttle_until,
       last_request_at
   FROM whatsapp_rate_limit
   ORDER BY messages_sent_count DESC;
   ```

2. Wait for throttle period to expire (usually in retry-after header):
   ```bash
   # Check throttle expiry
   psql -c "SELECT org_id, throttle_until, throttle_until - NOW() as time_remaining FROM whatsapp_rate_limit WHERE throttle_until > NOW()"
   ```

3. Increase quota limit if legitimate traffic:
   ```sql
   UPDATE whatsapp_rate_limit
   SET quota_limit = 5000,  -- Increase from default 1000
       updated_at = NOW()
   WHERE org_id = '${ORG_ID}';
   ```

4. Manual quota reset (use with caution):
   ```sql
   UPDATE whatsapp_rate_limit
   SET messages_sent_count = 0,
       reset_at = NOW() + INTERVAL '24 hours',
       throttle_until = NULL,
       updated_at = NOW()
   WHERE org_id = '${ORG_ID}';
   ```

### Recovery Verification
- [ ] WhatsApp failure rate < 5%
- [ ] Queue depth decreasing
- [ ] No rate limit errors in last 15 minutes
- [ ] Average latency < 3 seconds

---

## Webhook Signature Validation Failures

### Symptoms
- 401 Unauthorized responses to WhatsApp webhooks
- Inbound messages not processed
- Logs show "Invalid webhook signature"
- Alert: `whatsapp_webhook_signature_failures_total > 10`

### Verification Steps

1. **Check Recent Signature Failures**
   ```bash
   # Kibana query
   service:backend AND message:"Invalid webhook signature" AND @timestamp:[now-1h TO now]
   
   # Or check logs directly
   grep "Invalid webhook signature" /var/log/atlas/application.json | tail -20
   ```

2. **Verify Webhook Configuration**
   ```sql
   SELECT 
       org_id,
       phone_number_id,
       business_account_id,
       enabled,
       LENGTH(webhook_secret_encrypted) as secret_length,
       updated_at
   FROM whatsapp_provider_config
   WHERE enabled = true;
   ```

3. **Test Signature Validation**
   ```bash
   # Generate test signature
   PAYLOAD='{"entry":[{"changes":[{"value":{"messages":[{"from":"1234567890","text":{"body":"test"}}]}}]}]}'
   SECRET='your_webhook_secret'
   SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
   
   # Test webhook with signature
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
     -d "$PAYLOAD" \
     "https://api.example.com/api/v1/webhooks/whatsapp?orgId=test-org"
   ```

### Response Procedures

#### Procedure 1: Webhook Secret Rotation

**When:** Secret compromised or validation consistently failing

**Steps:**

1. **Generate New Secret**
   ```bash
   # Generate cryptographically secure secret (256-bit)
   NEW_SECRET=$(openssl rand -hex 32)
   echo "New secret: $NEW_SECRET"
   # Store securely: DO NOT commit to git or share in plain text
   ```

2. **Update Secret in Database**
   ```sql
   -- Encrypt and update secret
   -- Note: Replace with actual encryption function
   UPDATE whatsapp_provider_config
   SET webhook_secret_encrypted = pgp_sym_encrypt('${NEW_SECRET}', '${ENCRYPTION_KEY}'),
       updated_at = NOW(),
       updated_by = 'ops-rotation-${DATE}'
   WHERE org_id = '${ORG_ID}';
   ```

3. **Update WhatsApp Business Settings**
   - Log into Meta Business Manager: https://business.facebook.com
   - Navigate to WhatsApp → Settings → Webhooks
   - Update webhook secret to `${NEW_SECRET}`
   - Click "Verify and Save"

4. **Test New Configuration**
   ```bash
   # Wait 2 minutes for cache refresh
   sleep 120
   
   # Send test message to WhatsApp number
   # Verify inbound webhook processed successfully
   
   # Check logs for successful signature validation
   grep "Webhook signature validated successfully" /var/log/atlas/application.json | tail -5
   ```

5. **Monitor for 30 Minutes**
   ```bash
   watch -n 60 "psql -c \"SELECT COUNT(*) as inbound_count FROM message WHERE channel='WHATSAPP' AND direction='INBOUND' AND created_at > NOW() - INTERVAL '5 minutes'\""
   ```

**Rollback Steps:**
1. Keep old secret in secure backup for 7 days
2. If issues persist, revert to old secret:
   ```sql
   UPDATE whatsapp_provider_config
   SET webhook_secret_encrypted = pgp_sym_encrypt('${OLD_SECRET}', '${ENCRYPTION_KEY}'),
       updated_at = NOW()
   WHERE org_id = '${ORG_ID}';
   ```

#### Procedure 2: Disable Signature Validation (Emergency Only)

**WARNING:** This should ONLY be used in emergency situations with approval from Security team.

**Steps:**

1. **Get Approval**
   - Notify: Security team + Engineering Lead
   - Create incident ticket with justification
   - Set remediation deadline (max 4 hours)

2. **Temporary Bypass** (Code change required)
   ```java
   // In WhatsAppWebhookController.handleWebhook()
   // Comment out signature validation temporarily
   /*
   if (!signatureValidator.validateSignature(payload, signature, orgId)) {
       log.warn("Invalid webhook signature for org: {}", orgId);
       return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
   }
   */
   
   log.warn("SECURITY WARNING: Webhook signature validation DISABLED for org: {}", orgId);
   ```

3. **Deploy with Feature Flag**
   ```yaml
   # application-prod.yml
   whatsapp:
     webhook:
       signature-validation-enabled: false  # TEMPORARY - REVERT ASAP
   ```

4. **Monitor Closely**
   - All webhook requests logged
   - IP addresses tracked
   - Unusual patterns investigated immediately

5. **Remediation Within 4 Hours**
   - Fix root cause (rotate secret, fix configuration)
   - Re-enable validation
   - Post-incident review

#### Procedure 3: Multiple Organizations Affected

**When:** System-wide signature validation failures

**Steps:**

1. **Identify Root Cause**
   ```sql
   -- Check if encryption keys changed
   SELECT org_id, enabled, updated_at, updated_by
   FROM whatsapp_provider_config
   WHERE updated_at > NOW() - INTERVAL '24 hours'
   ORDER BY updated_at DESC;
   ```

2. **Check Application Configuration**
   ```bash
   # Verify encryption settings
   kubectl get configmap app-config -o yaml | grep -i encrypt
   
   # Check if secrets manager accessible
   curl -s http://vault.internal:8200/v1/sys/health
   ```

3. **Bulk Secret Rotation**
   ```bash
   # Generate new secrets for all orgs
   for org in $(psql -t -c "SELECT org_id FROM whatsapp_provider_config WHERE enabled=true"); do
     NEW_SECRET=$(openssl rand -hex 32)
     echo "Org: $org, Secret: $NEW_SECRET" >> /tmp/new_secrets.txt
     psql -c "UPDATE whatsapp_provider_config SET webhook_secret_encrypted = pgp_sym_encrypt('$NEW_SECRET', '${ENCRYPTION_KEY}') WHERE org_id = '$org'"
   done
   ```

4. **Coordinate with Meta Support**
   - Open priority support ticket
   - Request bulk webhook configuration update
   - Provide new secrets securely

### Recovery Verification
- [ ] Signature validation success rate > 99.9%
- [ ] Inbound messages processing normally
- [ ] No 401 errors in webhook logs
- [ ] Session windows updating correctly

---

## Dead Letter Queue (DLQ) Processing

### Overview

Messages enter DLQ when:
- `attempt_count >= max_attempts` (default: 5)
- Status = `FAILED`
- Non-retryable error codes

### Symptoms
- Alert: `outbound_message_dlq_size > 100`
- Increased customer complaints about missed messages
- Prometheus: `outbound_message_dlq_messages{channel="WHATSAPP"} > threshold`

### Verification Steps

1. **Get DLQ Size and Breakdown**
   ```sql
   -- Total DLQ size
   SELECT COUNT(*) as dlq_total
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts;
   
   -- Breakdown by channel and error code
   SELECT 
       channel,
       error_code,
       COUNT(*) as count,
       MIN(created_at) as oldest_message,
       MAX(created_at) as newest_message
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
   GROUP BY channel, error_code
   ORDER BY count DESC;
   ```

2. **Analyze Error Distribution**
   ```sql
   -- Top error codes in DLQ
   SELECT 
       error_code,
       error_message,
       COUNT(*) as frequency,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
   GROUP BY error_code, error_message
   ORDER BY frequency DESC
   LIMIT 20;
   ```

3. **Check DLQ Age**
   ```sql
   SELECT 
       CASE 
           WHEN created_at > NOW() - INTERVAL '1 hour' THEN '< 1 hour'
           WHEN created_at > NOW() - INTERVAL '6 hours' THEN '1-6 hours'
           WHEN created_at > NOW() - INTERVAL '24 hours' THEN '6-24 hours'
           WHEN created_at > NOW() - INTERVAL '7 days' THEN '1-7 days'
           ELSE '> 7 days'
       END as age_bucket,
       COUNT(*) as count
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
   GROUP BY age_bucket
   ORDER BY MIN(created_at);
   ```

### Response Procedures

#### Procedure 1: Manual Review & Triage

**Steps:**

1. **Export DLQ Messages for Analysis**
   ```sql
   COPY (
     SELECT 
         id,
         org_id,
         dossier_id,
         channel,
         to_recipient,
         template_code,
         subject,
         error_code,
         error_message,
         attempt_count,
         created_at,
         updated_at
     FROM outbound_message
     WHERE status = 'FAILED'
       AND attempt_count >= max_attempts
     ORDER BY created_at DESC
   ) TO '/tmp/dlq_messages_${DATE}.csv' CSV HEADER;
   ```

2. **Categorize by Error Type**
   ```sql
   -- Non-retryable recipient errors (no action needed)
   SELECT COUNT(*) as invalid_recipients
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND error_code IN ('131021', '131031', '133000', '470');  -- Invalid number, blocked, expired
   
   -- Template errors (requires template fix)
   SELECT COUNT(*) as template_errors
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND error_code IN ('133004', '133005', '133006', '133008', '133009', '133010');
   
   -- Temporary errors (candidates for retry)
   SELECT COUNT(*) as retryable_errors
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND error_code IN ('0', '1', '131016', '131026', '132001');
   ```

3. **Create Triage Report**
   ```bash
   cat > /tmp/dlq_triage_report_${DATE}.md <<EOF
   # DLQ Triage Report - ${DATE}
   
   ## Summary
   - Total DLQ Messages: $(psql -t -c "SELECT COUNT(*) FROM outbound_message WHERE status='FAILED' AND attempt_count>=max_attempts")
   - Age Range: $(psql -t -c "SELECT MIN(created_at) || ' to ' || MAX(created_at) FROM outbound_message WHERE status='FAILED' AND attempt_count>=max_attempts")
   
   ## Error Categories
   - Invalid Recipients: [Count from query above]
   - Template Errors: [Count from query above]
   - Retryable Errors: [Count from query above]
   
   ## Recommendations
   1. Archive invalid recipient messages (no retry)
   2. Fix templates and retry template error messages
   3. Retry temporary error messages after 24 hours
   
   ## Action Items
   - [ ] Review and fix template issues
   - [ ] Clean up invalid recipient entries
   - [ ] Bulk retry temporary failures
   - [ ] Update recipient contact validation
   EOF
   ```

#### Procedure 2: Bulk Retry for Specific Error Codes

**When:** Large number of messages failed due to temporary issues

**Steps:**

1. **Identify Retry Candidates**
   ```sql
   -- Messages with temporary errors that might succeed now
   SELECT 
       id,
       to_recipient,
       error_code,
       EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_since_failure
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND error_code IN ('0', '1', '131016', '131026', '132001')
     AND updated_at < NOW() - INTERVAL '24 hours'  -- Wait 24h before retry
   ORDER BY updated_at
   LIMIT 1000;
   ```

2. **Reset for Retry** (Database approach)
   ```sql
   -- Create backup first
   CREATE TABLE outbound_message_dlq_backup_${DATE} AS
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
       updated_by = 'ops-dlq-retry-${DATE}'
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND error_code IN ('0', '1', '131016', '131026', '132001')
     AND updated_at < NOW() - INTERVAL '24 hours';
   
   -- Check affected rows
   SELECT '${DATE}' as retry_batch, COUNT(*) as messages_reset FROM outbound_message WHERE updated_by = 'ops-dlq-retry-${DATE}';
   ```

3. **Monitor Retry Progress**
   ```bash
   # Watch for next 30 minutes
   watch -n 30 "psql -c \"
   SELECT 
       status,
       COUNT(*) as count
   FROM outbound_message
   WHERE updated_by = 'ops-dlq-retry-${DATE}'
   GROUP BY status
   ORDER BY status\""
   ```

4. **Verify Success Rate**
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
   WHERE updated_by = 'ops-dlq-retry-${DATE}'
   GROUP BY outcome;
   ```

**Rollback Steps:**
```sql
-- Restore from backup if needed
UPDATE outbound_message om
SET status = b.status,
    attempt_count = b.attempt_count,
    error_code = b.error_code,
    error_message = b.error_message,
    updated_at = b.updated_at
FROM outbound_message_dlq_backup_${DATE} b
WHERE om.id = b.id;
```

#### Procedure 3: Dead-Letter Analysis & Root Cause

**Steps:**

1. **Error Pattern Analysis**
   ```sql
   -- Temporal pattern: when do failures spike?
   SELECT 
       DATE_TRUNC('hour', created_at) as hour,
       COUNT(*) as failures
   FROM outbound_message
   WHERE status = 'FAILED'
     AND created_at > NOW() - INTERVAL '7 days'
   GROUP BY hour
   ORDER BY failures DESC
   LIMIT 20;
   
   -- Organization pattern: which orgs have most failures?
   SELECT 
       org_id,
       COUNT(*) as failures,
       COUNT(DISTINCT error_code) as unique_errors
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
   GROUP BY org_id
   ORDER BY failures DESC
   LIMIT 10;
   
   -- Template pattern: which templates fail most?
   SELECT 
       template_code,
       COUNT(*) as failures,
       COUNT(DISTINCT to_recipient) as unique_recipients
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND template_code IS NOT NULL
   GROUP BY template_code
   ORDER BY failures DESC
   LIMIT 10;
   ```

2. **Correlate with External Events**
   ```bash
   # Check if failures correlate with deployments
   kubectl get deployments -n production -o json | jq '.items[] | {name: .metadata.name, lastUpdate: .metadata.annotations."deployment.kubernetes.io/revision-history"}'
   
   # Check if failures correlate with rate limit hits
   psql -c "SELECT DATE_TRUNC('hour', updated_at) as hour, COUNT(*) as rate_limit_hits FROM whatsapp_rate_limit WHERE throttle_until IS NOT NULL AND updated_at > NOW() - INTERVAL '7 days' GROUP BY hour ORDER BY hour"
   ```

3. **Generate Root Cause Report**
   ```bash
   cat > /tmp/dlq_root_cause_${DATE}.md <<EOF
   # DLQ Root Cause Analysis - ${DATE}
   
   ## Failure Patterns Identified
   
   ### Temporal Pattern
   [Paste query results showing when failures spike]
   
   ### Organization Pattern
   [Paste query results showing which orgs affected]
   
   ### Template Pattern
   [Paste query results showing problematic templates]
   
   ## Potential Root Causes
   1. [ ] Provider API changes (check Meta changelog)
   2. [ ] Template approval status changed
   3. [ ] Rate limit quotas too low
   4. [ ] Incorrect phone number formatting
   5. [ ] Session window logic errors
   
   ## Remediation Actions
   1. [Action 1 with owner and deadline]
   2. [Action 2 with owner and deadline]
   
   ## Prevention Measures
   1. [ ] Update input validation
   2. [ ] Add pre-send template verification
   3. [ ] Implement phone number verification service
   4. [ ] Set up alerts for specific error codes
   EOF
   ```

#### Procedure 4: DLQ Archival & Cleanup

**When:** DLQ has old messages (>30 days) with no recovery path

**Steps:**

1. **Identify Archival Candidates**
   ```sql
   SELECT 
       id,
       org_id,
       dossier_id,
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

2. **Archive to Long-term Storage**
   ```bash
   # Export to S3 or archive storage
   ARCHIVE_FILE="dlq_archive_$(date +%Y%m%d_%H%M%S).csv"
   
   psql -c "COPY (
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
   
   # Upload to S3
   aws s3 cp /tmp/${ARCHIVE_FILE} s3://atlas-archives/dlq/${ARCHIVE_FILE} --sse AES256
   
   # Verify upload
   aws s3 ls s3://atlas-archives/dlq/${ARCHIVE_FILE}
   ```

3. **Log Archival Action**
   ```sql
   INSERT INTO audit_event (org_id, entity_type, entity_id, action, description, created_at, created_by)
   SELECT 
       org_id,
       'OUTBOUND_MESSAGE',
       id,
       'ARCHIVED',
       'Archived to S3: dlq_archive_${DATE}.csv',
       NOW(),
       'ops-dlq-cleanup-${DATE}'
   FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND created_at < NOW() - INTERVAL '30 days';
   ```

4. **Delete Archived Messages**
   ```sql
   -- Safety check: ensure archive exists
   -- Then delete
   DELETE FROM outbound_message
   WHERE status = 'FAILED'
     AND attempt_count >= max_attempts
     AND created_at < NOW() - INTERVAL '30 days';
   
   -- Log deletion count
   SELECT '${DATE}' as cleanup_date, COUNT(*) as deleted_count 
   FROM outbound_message WHERE false; -- Count was in DELETE result
   ```

5. **Vacuum Table**
   ```sql
   VACUUM ANALYZE outbound_message;
   ```

### Recovery Verification
- [ ] DLQ size < 100
- [ ] No messages older than 30 days in DLQ
- [ ] Root cause identified and documented
- [ ] Preventive measures implemented

---

## Outbound Queue Backup Scenarios

### Symptoms
- Queue depth increasing rapidly
- Alert: `outbound_message_queue_depth > 1000`
- Worker processing slowed or stopped
- Messages stuck in QUEUED state for >2 hours

### Verification Steps

1. **Check Queue Depth**
   ```sql
   SELECT 
       status,
       COUNT(*) as count,
       MIN(created_at) as oldest_message,
       MAX(created_at) as newest_message,
       AVG(attempt_count) as avg_attempts
   FROM outbound_message
   WHERE status IN ('QUEUED', 'SENDING')
   GROUP BY status;
   ```

2. **Check Worker Status**
   ```bash
   # Check if worker is enabled
   curl -s http://localhost:8080/actuator/configprops | jq '.["outbound.worker"]'
   
   # Check worker logs
   kubectl logs -f deployment/backend --tail=100 | grep OutboundJobWorker
   
   # Check worker metrics
   curl -s http://localhost:8080/actuator/metrics/outbound.worker.messages.processed
   ```

3. **Check Database Performance**
   ```sql
   -- Check for long-running queries
   SELECT 
       pid,
       now() - query_start as duration,
       state,
       query
   FROM pg_stat_activity
   WHERE state = 'active'
     AND query LIKE '%outbound_message%'
   ORDER BY duration DESC;
   
   -- Check table bloat
   SELECT 
       schemaname,
       tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
   FROM pg_tables
   WHERE tablename LIKE '%outbound%'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

### Response Procedures

#### Procedure 1: Database Checkpoint & Backup

**Steps:**

1. **Create Point-in-Time Backup**
   ```bash
   # PostgreSQL: Create manual checkpoint
   psql -c "CHECKPOINT;"
   
   # Create logical backup
   BACKUP_FILE="outbound_queue_backup_$(date +%Y%m%d_%H%M%S).sql"
   pg_dump -t outbound_message -t outbound_attempt -t whatsapp_rate_limit -t whatsapp_session_window \
     > /backup/${BACKUP_FILE}
   
   # Compress and upload
   gzip /backup/${BACKUP_FILE}
   aws s3 cp /backup/${BACKUP_FILE}.gz s3://atlas-backups/database/${BACKUP_FILE}.gz --sse AES256
   
   # Verify backup
   gunzip -t /backup/${BACKUP_FILE}.gz
   echo "Backup created: ${BACKUP_FILE}.gz"
   ```

2. **Create Emergency Snapshot** (Cloud provider)
   ```bash
   # AWS RDS snapshot
   aws rds create-db-snapshot \
     --db-instance-identifier atlas-production \
     --db-snapshot-identifier atlas-outbound-emergency-$(date +%Y%m%d-%H%M%S) \
     --tags Key=Purpose,Value=OutboundQueueBackup Key=CreatedBy,Value=ops-team
   
   # Wait for completion
   aws rds wait db-snapshot-completed \
     --db-snapshot-identifier atlas-outbound-emergency-$(date +%Y%m%d-%H%M%S)
   ```

3. **Document Backup**
   ```bash
   cat >> /var/log/atlas/backup_log.txt <<EOF
   Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
   Type: Emergency Outbound Queue Backup
   Backup File: ${BACKUP_FILE}.gz
   S3 Location: s3://atlas-backups/database/${BACKUP_FILE}.gz
   RDS Snapshot: atlas-outbound-emergency-$(date +%Y%m%d-%H%M%S)
   Queue Depth at Backup: $(psql -t -c "SELECT COUNT(*) FROM outbound_message WHERE status='QUEUED'")
   Reason: Queue backup scenario
   Created By: ${USER}
   EOF
   ```

#### Procedure 2: Recovery from Backup

**When:** Need to restore queue state after corruption or data loss

**Steps:**

1. **Verify Backup Integrity**
   ```bash
   # Download from S3
   aws s3 cp s3://atlas-backups/database/${BACKUP_FILE}.gz /tmp/
   
   # Verify compression
   gunzip -t /tmp/${BACKUP_FILE}.gz
   
   # Extract
   gunzip /tmp/${BACKUP_FILE}.gz
   
   # Verify SQL file
   head -20 /tmp/${BACKUP_FILE}
   tail -20 /tmp/${BACKUP_FILE}
   ```

2. **Prepare for Restore**
   ```sql
   -- Create backup of current state
   CREATE TABLE outbound_message_pre_restore_${DATE} AS SELECT * FROM outbound_message;
   CREATE TABLE outbound_attempt_pre_restore_${DATE} AS SELECT * FROM outbound_attempt;
   
   -- Disable worker during restore
   -- Set via environment: OUTBOUND_WORKER_ENABLED=false
   -- Then restart pods
   kubectl set env deployment/backend OUTBOUND_WORKER_ENABLED=false
   kubectl rollout status deployment/backend
   ```

3. **Restore from Backup**
   ```bash
   # Option A: Full table restore (destructive)
   psql <<EOF
   BEGIN;
   TRUNCATE TABLE outbound_message CASCADE;
   TRUNCATE TABLE outbound_attempt CASCADE;
   \i /tmp/${BACKUP_FILE}
   COMMIT;
   EOF
   
   # Option B: Selective restore (merge)
   psql <<EOF
   BEGIN;
   -- Import to temporary table
   CREATE TEMP TABLE outbound_message_restore AS SELECT * FROM outbound_message LIMIT 0;
   \COPY outbound_message_restore FROM '/tmp/${BACKUP_FILE}' CSV HEADER;
   
   -- Merge messages that don't exist
   INSERT INTO outbound_message
   SELECT * FROM outbound_message_restore r
   WHERE NOT EXISTS (
     SELECT 1 FROM outbound_message o WHERE o.id = r.id
   );
   COMMIT;
   EOF
   ```

4. **Verify Restore**
   ```sql
   -- Check record counts
   SELECT 
       'Current' as source,
       COUNT(*) as total_messages,
       COUNT(*) FILTER (WHERE status = 'QUEUED') as queued,
       COUNT(*) FILTER (WHERE status = 'FAILED') as failed
   FROM outbound_message
   UNION ALL
   SELECT 
       'Pre-restore' as source,
       COUNT(*) as total_messages,
       COUNT(*) FILTER (WHERE status = 'QUEUED') as queued,
       COUNT(*) FILTER (WHERE status = 'FAILED') as failed
   FROM outbound_message_pre_restore_${DATE};
   
   -- Check for duplicate messages
   SELECT idempotency_key, COUNT(*) as count
   FROM outbound_message
   GROUP BY idempotency_key
   HAVING COUNT(*) > 1;
   ```

5. **Re-enable Worker**
   ```bash
   kubectl set env deployment/backend OUTBOUND_WORKER_ENABLED=true
   kubectl rollout status deployment/backend
   
   # Monitor processing
   watch -n 10 "psql -t -c \"SELECT status, COUNT(*) FROM outbound_message WHERE status IN ('QUEUED','SENDING') GROUP BY status\""
   ```

**Rollback Steps:**
```sql
-- Restore pre-restore state
DROP TABLE outbound_message;
DROP TABLE outbound_attempt;
ALTER TABLE outbound_message_pre_restore_${DATE} RENAME TO outbound_message;
ALTER TABLE outbound_attempt_pre_restore_${DATE} RENAME TO outbound_attempt;
```

#### Procedure 3: Scale Worker Processing

**When:** Queue backed up but system healthy, just needs more processing power

**Steps:**

1. **Increase Worker Batch Size**
   ```bash
   # Update configuration
   kubectl set env deployment/backend OUTBOUND_WORKER_BATCH_SIZE=50  # Up from default 10
   kubectl rollout status deployment/backend
   ```

2. **Decrease Poll Interval**
   ```bash
   # Process more frequently
   kubectl set env deployment/backend OUTBOUND_WORKER_POLL_INTERVAL_MS=1000  # Up from default 5000
   kubectl rollout status deployment/backend
   ```

3. **Scale Horizontally** (if supported)
   ```bash
   # Increase replica count
   kubectl scale deployment/backend --replicas=5
   
   # Monitor queue depth
   watch -n 30 "psql -t -c \"SELECT COUNT(*) FROM outbound_message WHERE status='QUEUED'\""
   ```

4. **Monitor Database Load**
   ```sql
   -- Watch connection count
   SELECT COUNT(*) as connections, state 
   FROM pg_stat_activity 
   GROUP BY state;
   
   -- Watch query performance
   SELECT 
       query,
       calls,
       mean_exec_time,
       max_exec_time
   FROM pg_stat_statements
   WHERE query LIKE '%outbound_message%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

5. **Revert After Queue Cleared**
   ```bash
   # Return to normal scale
   kubectl set env deployment/backend OUTBOUND_WORKER_BATCH_SIZE=10
   kubectl set env deployment/backend OUTBOUND_WORKER_POLL_INTERVAL_MS=5000
   kubectl scale deployment/backend --replicas=2
   ```

#### Procedure 4: Emergency Queue Drain

**When:** Need to immediately clear queue (with approval)

**Steps:**

1. **Get Approval**
   - Notify: Engineering Manager + Product Owner
   - Document business justification
   - Confirm acceptable to lose messages

2. **Export Messages Before Deletion**
   ```bash
   DRAIN_FILE="queue_drain_export_$(date +%Y%m%d_%H%M%S).csv"
   
   psql -c "COPY (
     SELECT * FROM outbound_message WHERE status = 'QUEUED'
   ) TO '/tmp/${DRAIN_FILE}' CSV HEADER"
   
   aws s3 cp /tmp/${DRAIN_FILE} s3://atlas-archives/queue-drains/${DRAIN_FILE} --sse AES256
   ```

3. **Cancel Queued Messages**
   ```sql
   BEGIN;
   
   -- Log action
   INSERT INTO audit_event (org_id, entity_type, action, description, created_at, created_by)
   SELECT DISTINCT
       org_id,
       'OUTBOUND_MESSAGE',
       'CANCELLED',
       'Emergency queue drain - ${JUSTIFICATION}',
       NOW(),
       'ops-queue-drain-${DATE}'
   FROM outbound_message
   WHERE status = 'QUEUED';
   
   -- Cancel messages
   UPDATE outbound_message
   SET status = 'CANCELLED',
       error_message = 'Cancelled during emergency queue drain',
       updated_at = NOW(),
       updated_by = 'ops-queue-drain-${DATE}'
   WHERE status = 'QUEUED';
   
   COMMIT;
   
   -- Verify
   SELECT status, COUNT(*) FROM outbound_message GROUP BY status;
   ```

4. **Document Impact**
   ```bash
   cat > /tmp/queue_drain_report_${DATE}.md <<EOF
   # Emergency Queue Drain Report - ${DATE}
   
   ## Authorization
   - Approved By: [Name]
   - Reason: [Justification]
   - Ticket: [Incident ticket number]
   
   ## Impact
   - Messages Cancelled: $(psql -t -c "SELECT COUNT(*) FROM outbound_message WHERE updated_by='ops-queue-drain-${DATE}'")
   - Archive Location: s3://atlas-archives/queue-drains/${DRAIN_FILE}
   - Time Span: $(psql -t -c "SELECT MIN(created_at) || ' to ' || MAX(created_at) FROM outbound_message WHERE updated_by='ops-queue-drain-${DATE}'")
   
   ## Recovery
   Messages exported and archived. Can be replayed if needed by restoring from CSV.
   EOF
   ```

### Recovery Verification
- [ ] Queue depth < 100
- [ ] Worker processing normally
- [ ] Database performance normal
- [ ] No messages stuck for >15 minutes
- [ ] Backup/snapshot confirmed accessible

---

## Escalation Matrix

### On-Call Contacts

#### Level 1: Platform Engineering (First Response)
**Response Time: 15 minutes**

| Role | Name | Phone | Email | Slack | Backup |
|------|------|-------|-------|-------|--------|
| Platform Engineer (Primary) | [Name] | +33-XXX-XXX-XXX | engineer1@example.com | @engineer1 | Engineer 2 |
| Platform Engineer (Secondary) | [Name] | +33-XXX-XXX-XXX | engineer2@example.com | @engineer2 | Engineer 3 |

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

| Role | Name | Phone | Email | Slack | Backup |
|------|------|-------|-------|-------|--------|
| Tech Lead | [Name] | +33-XXX-XXX-XXX | techlead@example.com | @techlead | Engineering Manager |
| Senior Backend Engineer | [Name] | +33-XXX-XXX-XXX | senior-eng@example.com | @senior-eng | Tech Lead |

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

| Role | Name | Phone | Email | Slack |
|------|------|-------|-------|-------|
| Engineering Manager | [Name] | +33-XXX-XXX-XXX | eng-mgr@example.com | @eng-mgr |
| VP Engineering | [Name] | +33-XXX-XXX-XXX | vp-eng@example.com | @vp-eng |

**Responsibilities:**
- Executive decision making
- Vendor management (Meta Business Support)
- Cross-organizational coordination
- Customer communication approval

**Escalation Criteria:**
- Major incident (P0/P1)
- Extended outage (>2 hours)
- Requires vendor engagement
- Legal/compliance implications
- Media attention possible

#### Vendor Contacts

**Meta WhatsApp Business Support**
- Support Portal: https://business.facebook.com/business/support
- Priority Support: [Account Manager Name]
- Phone: [Account Manager Phone]
- Email: [Account Manager Email]
- Ticket Priority: P1 (Critical), P2 (High), P3 (Medium), P4 (Low)

**AWS Support (Infrastructure)**
- Support Console: https://console.aws.amazon.com/support
- Business Support: +1-xxx-xxx-xxxx
- Enterprise Support TAM: [TAM Name]
- Severity: Critical (15 min), Urgent (1 hour), High (4 hours)

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

### Escalation Templates

#### Email Template: L1 → L2 Escalation
```
Subject: [P1] WhatsApp Messaging Incident - Escalation Required

Hi [L2 Name],

I am escalating the following WhatsApp messaging incident:

Incident ID: INC-[NUMBER]
Severity: P1 / P2
Start Time: [TIMESTAMP]
Duration: [DURATION]

Issue Summary:
[Brief description of the issue]

Impact:
- Messages Affected: [COUNT]
- Customers Impacted: [COUNT]
- Channels Affected: [WHATSAPP/SMS/EMAIL]

Troubleshooting Attempted:
- [Action 1]
- [Action 2]
- [Action 3]

Escalation Reason:
[Why escalating - from criteria list]

Current Status:
[QUEUED: X, FAILED: Y, DLQ: Z]

Next Steps Needed:
[What you need from L2]

Thanks,
[Your Name]
Platform Engineering
```

#### Slack Template: Emergency Alert
```
@channel :rotating_light: WhatsApp Messaging Emergency

**Severity:** P1 - Critical
**Incident:** INC-[NUMBER]
**Start Time:** [TIMESTAMP]

**Issue:**
[One sentence description]

**Impact:**
• [Impact item 1]
• [Impact item 2]

**Status:** Investigating / Mitigating / Resolved

**War Room:** #incident-[number]
**Incident Commander:** @[name]

**Last Update:** [TIMESTAMP]
```

### After-Hours Escalation

**Weekdays (18:00 - 09:00) and Weekends:**

1. **Page via PagerDuty:**
   ```bash
   # Send high-urgency page
   curl -X POST https://events.pagerduty.com/v2/enqueue \
     -H 'Content-Type: application/json' \
     -d '{
       "routing_key": "[PD_ROUTING_KEY]",
       "event_action": "trigger",
       "payload": {
         "summary": "WhatsApp Messaging: [Issue Summary]",
         "severity": "critical",
         "source": "atlas-backend",
         "custom_details": {
           "queue_depth": "[COUNT]",
           "failure_rate": "[RATE]"
         }
       }
     }'
   ```

2. **Backup: Direct Call**
   - Call L1 On-Call: [Phone Number]
   - If no answer in 5 min, call L1 Backup
   - If no answer in 10 min, escalate to L2

3. **Emergency Override:**
   - For P0 incidents: Call VP Engineering directly
   - For security issues: Call Security team immediately

---

## Monitoring & Alerts

### Key Alerts Configuration

#### Critical Alerts (P1 - Page immediately)

```yaml
# Prometheus Alert Rules
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

      - alert: WhatsAppProviderDown
        expr: |
          whatsapp_provider_availability < 0.95
        for: 10m
        labels:
          severity: critical
          channel: whatsapp
        annotations:
          summary: "WhatsApp provider availability below 95%"

      - alert: WhatsAppDLQOverflow
        expr: |
          outbound_message_dlq_messages{channel="WHATSAPP"} > 500
        for: 15m
        labels:
          severity: critical
          channel: whatsapp
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
```

#### Warning Alerts (P2 - Investigate within 30 min)

```yaml
      - alert: WhatsAppElevatedFailureRate
        expr: |
          rate(outbound_message_failures_total{channel="WHATSAPP"}[10m]) > 0.10
        for: 10m
        labels:
          severity: warning
          channel: whatsapp
        annotations:
          summary: "WhatsApp failure rate above 10%"

      - alert: WhatsAppWebhookSignatureFailures
        expr: |
          rate(whatsapp_webhook_signature_failures_total[5m]) > 0.05
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "WhatsApp webhook signature validation failing"

      - alert: WhatsAppRateLimitHit
        expr: |
          rate(whatsapp_rate_limit_hits_total[5m]) > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "WhatsApp rate limits being hit"
```

### Dashboards

#### Grafana Dashboard: WhatsApp Operations

**Panels:**

1. **Message Volume**
   - Total messages sent (24h, 7d, 30d)
   - Messages per hour (time series)
   - By channel breakdown

2. **Success Metrics**
   - Success rate (gauge)
   - Failure rate (gauge)
   - Average delivery latency

3. **Queue Health**
   - Queue depth (time series)
   - Processing rate (messages/sec)
   - Stuck messages count

4. **Error Analysis**
   - Top error codes (bar chart)
   - Error trend (time series)
   - DLQ size (gauge)

5. **Provider Health**
   - Provider availability %
   - Rate limit hits
   - Session window expiry rate

**Example PromQL Queries:**

```promql
# Success Rate
sum(rate(outbound_message_sent_total{channel="WHATSAPP"}[5m])) /
sum(rate(outbound_message_total{channel="WHATSAPP"}[5m]))

# Queue Depth
sum(outbound_message_queue_depth{status="QUEUED"})

# Failure Rate by Error Code
topk(10,
  sum by (error_code) (
    rate(outbound_message_failures_total{channel="WHATSAPP"}[1h])
  )
)

# Average Delivery Latency
histogram_quantile(0.95,
  rate(outbound_message_delivery_duration_seconds_bucket{channel="WHATSAPP"}[5m])
)
```

#### Kibana Dashboard: WhatsApp Logs

**Saved Searches:**

1. **All WhatsApp Errors (Last Hour)**
   ```
   service:backend AND level:ERROR AND (message:*WhatsApp* OR message:*outbound*)
   @timestamp:[now-1h TO now]
   ```

2. **Webhook Signature Failures**
   ```
   service:backend AND message:"Invalid webhook signature"
   @timestamp:[now-1h TO now]
   ```

3. **Rate Limit Errors**
   ```
   service:backend AND error_code:(130 OR 3 OR 132069 OR 80007)
   @timestamp:[now-6h TO now]
   ```

4. **Message Send Attempts**
   ```
   service:backend AND message:"Sending outbound message"
   @timestamp:[now-15m TO now]
   ```

### Health Checks

**Automated Health Checks (every 5 minutes):**

```bash
#!/bin/bash
# /opt/atlas/healthcheck-whatsapp.sh

set -euo pipefail

# Check API health
if ! curl -sf http://localhost:8080/actuator/health | jq -e '.status == "UP"' > /dev/null; then
  echo "CRITICAL: Backend API is down"
  exit 2
fi

# Check queue depth
QUEUE_DEPTH=$(psql -t -c "SELECT COUNT(*) FROM outbound_message WHERE status='QUEUED'")
if [ "$QUEUE_DEPTH" -gt 2000 ]; then
  echo "CRITICAL: Queue depth is $QUEUE_DEPTH (threshold: 2000)"
  exit 2
elif [ "$QUEUE_DEPTH" -gt 1000 ]; then
  echo "WARNING: Queue depth is $QUEUE_DEPTH (threshold: 1000)"
  exit 1
fi

# Check DLQ size
DLQ_SIZE=$(psql -t -c "SELECT COUNT(*) FROM outbound_message WHERE status='FAILED' AND attempt_count >= max_attempts")
if [ "$DLQ_SIZE" -gt 500 ]; then
  echo "CRITICAL: DLQ size is $DLQ_SIZE (threshold: 500)"
  exit 2
elif [ "$DLQ_SIZE" -gt 200 ]; then
  echo "WARNING: DLQ size is $DLQ_SIZE (threshold: 200)"
  exit 1
fi

# Check worker is processing
LAST_PROCESSED=$(psql -t -c "SELECT EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) FROM outbound_message WHERE status IN ('SENT', 'DELIVERED') AND updated_at > NOW() - INTERVAL '10 minutes'")
if [ "${LAST_PROCESSED%.*}" -gt 600 ]; then
  echo "WARNING: No messages processed in last 10 minutes"
  exit 1
fi

echo "OK: All WhatsApp messaging health checks passed"
exit 0
```

---

## Common Issues & Solutions

### Issue 1: Messages Stuck in SENDING Status

**Symptoms:**
- Messages remain in SENDING for >30 minutes
- No corresponding attempts in outbound_attempt table

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

**Symptoms:**
- Error code: 133004
- Consistent failures for specific templates

**Diagnosis:**
```sql
SELECT 
    template_code,
    COUNT(*) as failure_count,
    MAX(error_message) as error_message
FROM outbound_message
WHERE status = 'FAILED'
  AND error_code = '133004'
GROUP BY template_code
ORDER BY failure_count DESC;
```

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

### Issue 3: Session Window Not Updating

**Symptoms:**
- Inbound messages received but session window not updated
- Freeform messages failing outside window

**Diagnosis:**
```sql
-- Check session windows
SELECT 
    org_id,
    phone_number,
    window_expires_at,
    last_inbound_message_at,
    last_outbound_message_at,
    CASE 
        WHEN window_expires_at > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as status
FROM whatsapp_session_window
ORDER BY last_inbound_message_at DESC
LIMIT 20;

-- Check inbound messages
SELECT 
    id,
    channel,
    direction,
    from_sender,
    created_at
FROM message
WHERE channel = 'WHATSAPP'
  AND direction = 'INBOUND'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

**Solution:**
```sql
-- Manually update session window
UPDATE whatsapp_session_window
SET window_opens_at = NOW(),
    window_expires_at = NOW() + INTERVAL '24 hours',
    last_inbound_message_at = NOW(),
    updated_at = NOW()
WHERE org_id = '${ORG_ID}'
  AND phone_number = '${PHONE_NUMBER}';
```

### Issue 4: Rate Limit Not Resetting

**Symptoms:**
- All messages failing with rate limit error
- reset_at timestamp passed but still throttled

**Diagnosis:**
```sql
SELECT 
    org_id,
    messages_sent_count,
    quota_limit,
    reset_at,
    reset_at < NOW() as should_reset,
    throttle_until,
    throttle_until < NOW() as throttle_expired
FROM whatsapp_rate_limit
WHERE throttle_until IS NOT NULL
   OR reset_at < NOW();
```

**Solution:**
```sql
-- Force rate limit reset
UPDATE whatsapp_rate_limit
SET messages_sent_count = 0,
    reset_at = NOW() + INTERVAL '24 hours',
    throttle_until = NULL,
    updated_at = NOW(),
    updated_by = 'ops-rate-limit-reset'
WHERE org_id = '${ORG_ID}';
```

### Issue 5: Duplicate Messages Being Sent

**Symptoms:**
- Same message sent multiple times
- Customers complaining about duplicates

**Diagnosis:**
```sql
-- Find potential duplicates
SELECT 
    idempotency_key,
    COUNT(*) as count,
    array_agg(id) as message_ids,
    array_agg(status) as statuses
FROM outbound_message
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY idempotency_key
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

**Solution:**
```sql
-- Cancel duplicate messages (keep oldest)
WITH duplicates AS (
    SELECT 
        idempotency_key,
        id,
        ROW_NUMBER() OVER (PARTITION BY idempotency_key ORDER BY created_at) as rn
    FROM outbound_message
    WHERE status IN ('QUEUED', 'SENDING')
)
UPDATE outbound_message
SET status = 'CANCELLED',
    error_message = 'Duplicate message - cancelled',
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);
```

---

## Appendix

### Quick Command Reference

```bash
# Queue Status
psql -c "SELECT status, COUNT(*) FROM outbound_message GROUP BY status"

# Recent Failures
psql -c "SELECT error_code, COUNT(*) FROM outbound_message WHERE status='FAILED' AND created_at > NOW() - INTERVAL '1 hour' GROUP BY error_code ORDER BY count DESC"

# DLQ Size
psql -c "SELECT COUNT(*) FROM outbound_message WHERE status='FAILED' AND attempt_count >= max_attempts"

# Worker Status
curl -s http://localhost:8080/actuator/metrics/outbound.worker.messages.processed

# Health Check
curl -s http://localhost:8080/api/v1/dashboard/outbound/health | jq

# Retry Failed Message
curl -X POST -H "X-Org-Id: ${ORG_ID}" "http://localhost:8080/api/v1/outbound/messages/${MSG_ID}/retry"
```

### Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | Platform Team | Initial version |

### Related Documentation

- [WhatsApp Provider Implementation](../backend/docs/WHATSAPP_PROVIDER_IMPLEMENTATION.md)
- [Outbound Messaging Implementation](../OUTBOUND_MESSAGING_IMPLEMENTATION.md)
- [Outbound Alerts Quick Start](../backend/OUTBOUND_ALERTS_QUICK_START.md)
- [Observability Runbook](./RUNBOOK_OBSERVABILITY.md)
- [API Documentation](./API_VERSIONING_IMPLEMENTATION.md)

---

**End of Runbook**

*For questions or updates to this runbook, contact: platform-team@example.com*
