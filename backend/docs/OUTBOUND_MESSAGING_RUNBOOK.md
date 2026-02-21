# Outbound Messaging System - Production Runbook

## Table of Contents
1. [System Overview](#system-overview)
2. [Monitoring & Dashboards](#monitoring--dashboards)
3. [Common Incident Scenarios](#common-incident-scenarios)
4. [Alert Response Procedures](#alert-response-procedures)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Emergency Procedures](#emergency-procedures)
7. [Post-Incident Analysis](#post-incident-analysis)

---

## System Overview

### Architecture Components
- **OutboundJobWorker**: Background scheduler processing queued messages
- **OutboundMessageService**: API service for creating outbound messages
- **Provider Implementations**: SMS, Email, WhatsApp integrations
- **Dead Letter Queue (DLQ)**: Failed messages after max retries
- **Rate Limiting**: WhatsApp quota tracking and enforcement

### Key Metrics
- Queue depth by status (QUEUED, SENDING, SENT, FAILED)
- Delivery latency percentiles (p50, p95, p99)
- Failure rates by error code
- WhatsApp quota consumption
- Retry counts by channel

### Dependencies
- PostgreSQL database
- Redis (for rate limiting)
- External provider APIs (Twilio, SendGrid, WhatsApp Cloud API)

---

## Monitoring & Dashboards

### Grafana Dashboard
**Location**: `/grafana/d/outbound-messaging`

**Key Panels**:
- Queue Depth by Status (real-time)
- Delivery Latency Percentiles
- Failure Rate Trends by Error Code
- DLQ Size with Alerting Thresholds
- WhatsApp Quota Consumption

### Prometheus Metrics Endpoint
**URL**: `https://api.example.com/actuator/prometheus`

**Key Metrics**:
```promql
# Queue depth
outbound_message_queue_depth{status="queued"}
outbound_message_dead_letter_queue_size

# Latency
histogram_quantile(0.95, rate(outbound_message_delivery_latency_seconds_bucket[5m]))

# Throughput
rate(outbound_message_send_success_total[5m])
rate(outbound_message_send_failure_total[5m])

# WhatsApp quota
whatsapp_quota_used
whatsapp_quota_remaining
```

### Sentry Error Tracking
**Dashboard**: `https://sentry.io/organizations/yourorg/projects/backend/`

**Key Tags**:
- `correlation_id`: Trace requests across services
- `channel`: Message channel (SMS, EMAIL, WHATSAPP)
- `error_code`: Provider error codes
- `worker_type`: Background worker identification

---

## Common Incident Scenarios

### 1. High Queue Depth

**Symptoms**:
- `outbound_message_queue_depth{status="queued"}` > 1000
- Dashboard shows increasing queue size
- Alert: "High Queue Depth Alert" triggered

**Root Causes**:
- Provider API slowness or downtime
- Rate limiting throttle active
- Worker processing disabled
- Database performance issues

**Response Steps**:
1. **Check worker status**:
   ```bash
   # Check logs for worker activity
   kubectl logs -f deployment/backend --tail=100 | grep "OutboundJobWorker"
   ```

2. **Verify provider health**:
   - Check Twilio status page: https://status.twilio.com
   - Check SendGrid status: https://status.sendgrid.com
   - Check WhatsApp API status: https://developers.facebook.com/status

3. **Review rate limiting**:
   ```sql
   SELECT * FROM whatsapp_rate_limit WHERE throttle_until > NOW();
   ```

4. **Check database performance**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

5. **Temporary mitigation**:
   - Increase worker batch size: Update `OUTBOUND_WORKER_BATCH_SIZE` env var
   - Scale horizontally: Increase pod replicas
   - Disable non-critical channels temporarily

**Prevention**:
- Monitor provider API latency
- Implement circuit breakers
- Set up auto-scaling based on queue depth

---

### 2. Dead Letter Queue Growth

**Symptoms**:
- `outbound_message_dead_letter_queue_size` > 100
- Dashboard shows DLQ panel in red
- Alert: "Dead Letter Growth Alert" triggered

**Root Causes**:
- Persistent provider API errors
- Invalid recipient data (bad phone numbers, emails)
- Provider account issues (suspended, quota exceeded)
- Message format validation failures

**Response Steps**:
1. **Analyze DLQ messages**:
   ```sql
   SELECT 
     channel, 
     error_code, 
     COUNT(*) as count,
     MAX(updated_at) as last_occurrence
   FROM outbound_message 
   WHERE status = 'FAILED' 
     AND attempt_count >= max_attempts
   GROUP BY channel, error_code
   ORDER BY count DESC
   LIMIT 20;
   ```

2. **Identify error patterns**:
   ```sql
   SELECT 
     error_code, 
     error_message,
     to_recipient,
     template_code
   FROM outbound_message 
   WHERE status = 'FAILED' 
     AND attempt_count >= max_attempts
   ORDER BY updated_at DESC 
   LIMIT 100;
   ```

3. **Common error code resolutions**:

   | Error Code | Cause | Resolution |
   |------------|-------|------------|
   | `INVALID_PHONE_NUMBER` | Bad phone format | Fix data validation, clean recipient data |
   | `QUOTA_EXCEEDED` | Provider quota hit | Upgrade plan or wait for quota reset |
   | `ACCOUNT_SUSPENDED` | Provider account issue | Contact provider support |
   | `TEMPLATE_NOT_APPROVED` | WhatsApp template not live | Submit template for approval |
   | `RATE_LIMIT_EXCEEDED` | Hitting provider rate limits | Implement backoff, reduce throughput |

4. **Manual reprocessing** (if errors are resolved):
   ```sql
   UPDATE outbound_message 
   SET status = 'QUEUED', 
       attempt_count = 0,
       error_code = NULL,
       error_message = NULL,
       updated_at = NOW()
   WHERE status = 'FAILED' 
     AND error_code = 'TEMPORARY_ERROR'
     AND updated_at > NOW() - INTERVAL '1 hour';
   ```

5. **Archive old DLQ messages**:
   ```sql
   -- Move to archive table for investigation
   INSERT INTO outbound_message_archive 
   SELECT * FROM outbound_message 
   WHERE status = 'FAILED' 
     AND updated_at < NOW() - INTERVAL '7 days';
   
   DELETE FROM outbound_message 
   WHERE status = 'FAILED' 
     AND updated_at < NOW() - INTERVAL '7 days';
   ```

**Prevention**:
- Implement recipient data validation at ingestion
- Set up provider account monitoring
- Create alerts for specific error codes
- Regular DLQ review and cleanup

---

### 3. High Failure Rate

**Symptoms**:
- Success rate < 95% for 15+ minutes
- `rate(outbound_message_send_failure_total[5m])` spiking
- Alert: "High Failure Rate Alert" triggered
- Specific error codes dominating failures

**Response Steps**:
1. **Identify failing channel**:
   ```promql
   sum by (channel) (rate(outbound_message_send_failure_total[5m]))
   ```

2. **Check error distribution**:
   ```promql
   sum by (error_code) (rate(outbound_message_send_failure_total[5m]))
   ```

3. **Review recent changes**:
   - Check recent deployments
   - Review configuration changes
   - Verify provider API key rotation

4. **Provider-specific checks**:

   **For SMS (Twilio)**:
   ```bash
   # Check Twilio API health
   curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
     -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
   ```

   **For Email (SendGrid)**:
   ```bash
   # Check SendGrid API health
   curl -X GET "https://api.sendgrid.com/v3/stats" \
     -H "Authorization: Bearer $SENDGRID_API_KEY"
   ```

   **For WhatsApp**:
   ```bash
   # Check WhatsApp Business API health
   curl -X GET "https://graph.facebook.com/v18.0/$WHATSAPP_PHONE_NUMBER_ID" \
     -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
   ```

5. **Correlation ID tracing**:
   ```bash
   # Find failed messages and trace through logs
   kubectl logs deployment/backend | grep "correlation_id=XXXX"
   ```

6. **Temporary mitigation**:
   - Disable failing channel if < 50% success rate
   - Switch to backup provider if available
   - Implement circuit breaker to prevent cascading failures

**Prevention**:
- Implement health checks for each provider
- Set up provider API monitoring
- Maintain backup providers for critical channels
- Implement gradual rollout for config changes

---

### 4. WhatsApp Quota Exhaustion

**Symptoms**:
- `whatsapp_quota_remaining` approaching 0
- `whatsapp_quota_used / whatsapp_quota_limit` > 0.9
- Alert: "WhatsApp Quota High Usage Alert" triggered
- WhatsApp messages failing with `RATE_LIMIT_EXCEEDED`

**Response Steps**:
1. **Check current quota status**:
   ```sql
   SELECT 
     org_id,
     messages_sent_count,
     quota_limit,
     (quota_limit - messages_sent_count) as remaining,
     reset_at,
     throttle_until
   FROM whatsapp_rate_limit
   WHERE org_id = 'ORG_ID';
   ```

2. **Identify high-volume senders**:
   ```sql
   SELECT 
     dossier_id,
     COUNT(*) as message_count
   FROM outbound_message
   WHERE channel = 'WHATSAPP'
     AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY dossier_id
   ORDER BY message_count DESC
   LIMIT 20;
   ```

3. **Immediate actions**:
   - **Option A: Upgrade quota** (if using Meta Business verification)
     - Contact Meta to request quota increase
     - Typical tiers: 1K, 10K, 100K, Unlimited
   
   - **Option B: Implement stricter rate limiting**
     ```sql
     -- Temporarily reduce quota to slow consumption
     UPDATE whatsapp_rate_limit 
     SET quota_limit = quota_limit * 0.5
     WHERE org_id = 'ORG_ID';
     ```
   
   - **Option C: Defer non-urgent messages**
     ```sql
     -- Pause non-urgent WhatsApp messages
     UPDATE outbound_message 
     SET status = 'QUEUED',
         updated_at = NOW() + INTERVAL '4 hours'
     WHERE channel = 'WHATSAPP'
       AND status = 'QUEUED'
       AND template_code NOT IN ('urgent_alert', 'appointment_reminder');
     ```

4. **Monitor quota reset**:
   - WhatsApp quotas reset every 24 hours
   - Check `reset_at` field in `whatsapp_rate_limit` table

5. **Long-term solutions**:
   - Request business verification for higher quota
   - Implement message prioritization
   - Batch non-urgent communications
   - Use alternative channels (SMS, Email) for low-priority messages

**Prevention**:
- Set up quota alerts at 70%, 85%, 95%
- Implement message prioritization framework
- Monitor daily usage trends
- Plan quota increases before major campaigns

---

### 5. Stuck Messages (High Retry Count)

**Symptoms**:
- Messages in QUEUED state with `attempt_count >= 3`
- Not progressing to SENT or FAILED
- Alert: "Stuck Messages Alert" triggered
- Messages older than 2 hours still queued

**Response Steps**:
1. **Identify stuck messages**:
   ```sql
   SELECT 
     id,
     channel,
     status,
     attempt_count,
     max_attempts,
     created_at,
     updated_at,
     error_code,
     error_message
   FROM outbound_message
   WHERE status = 'QUEUED'
     AND attempt_count >= 3
     AND updated_at < NOW() - INTERVAL '2 hours'
   ORDER BY attempt_count DESC, created_at ASC
   LIMIT 100;
   ```

2. **Check retry schedule**:
   ```sql
   SELECT 
     om.id as message_id,
     om.channel,
     om.attempt_count,
     oa.attempt_no,
     oa.next_retry_at,
     oa.error_code,
     oa.error_message
   FROM outbound_message om
   JOIN outbound_attempt oa ON oa.outbound_message_id = om.id
   WHERE om.status = 'QUEUED'
     AND om.attempt_count >= 3
   ORDER BY oa.next_retry_at DESC;
   ```

3. **Common causes**:
   - Worker not picking up messages (check worker logs)
   - `next_retry_at` set too far in future
   - Database connection issues
   - Transaction deadlocks

4. **Reset stuck messages**:
   ```sql
   -- Reset messages stuck in limbo
   UPDATE outbound_message 
   SET status = 'QUEUED',
       updated_at = NOW()
   WHERE status = 'SENDING'
     AND updated_at < NOW() - INTERVAL '10 minutes';
   ```

5. **Force immediate retry**:
   ```sql
   -- Clear next_retry_at to allow immediate processing
   UPDATE outbound_attempt 
   SET next_retry_at = NULL
   WHERE outbound_message_id IN (
     SELECT id FROM outbound_message 
     WHERE status = 'QUEUED' 
       AND attempt_count < max_attempts
       AND updated_at < NOW() - INTERVAL '1 hour'
   );
   ```

6. **Check worker health**:
   ```bash
   # Verify worker is running
   kubectl get pods -l app=backend
   
   # Check worker logs
   kubectl logs -f deployment/backend | grep "OutboundJobWorker"
   
   # Look for processing activity
   kubectl logs deployment/backend --since=10m | grep "Processing.*pending outbound messages"
   ```

**Prevention**:
- Implement automatic stale message recovery (already in place)
- Monitor worker health and restart if unhealthy
- Set up alerts for worker inactivity
- Implement message age limits

---

### 6. High Delivery Latency

**Symptoms**:
- P95 delivery latency > 30 seconds
- P99 delivery latency > 60 seconds
- Alert: "High Delivery Latency Alert" triggered
- User complaints about delayed messages

**Response Steps**:
1. **Check latency by channel**:
   ```promql
   histogram_quantile(0.95, sum by (channel, le) (rate(outbound_message_delivery_latency_seconds_bucket[5m])))
   ```

2. **Identify bottleneck**:
   - Check provider API response times
   - Review database query performance
   - Check network latency

3. **Provider API latency check**:
   ```bash
   # Measure API response time
   time curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$ACCOUNT_SID/Messages.json" \
     -u "$ACCOUNT_SID:$AUTH_TOKEN" \
     -d "From=$FROM_NUMBER" \
     -d "To=$TO_NUMBER" \
     -d "Body=Test message"
   ```

4. **Database query optimization**:
   ```sql
   -- Check slow queries
   SELECT 
     query,
     mean_exec_time,
     calls
   FROM pg_stat_statements
   WHERE query LIKE '%outbound_message%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

5. **Temporary mitigation**:
   - Increase worker concurrency
   - Reduce batch size to decrease transaction time
   - Scale database read replicas

**Prevention**:
- Monitor provider API SLAs
- Optimize database indexes
- Implement caching where appropriate
- Set up provider API latency alerts

---

## Alert Response Procedures

### Alert Priority Levels

| Priority | Response Time | Examples |
|----------|---------------|----------|
| **P0 (Critical)** | Immediate (< 5 min) | Complete system outage, all messages failing |
| **P1 (High)** | < 15 minutes | Single channel down, DLQ > 500 |
| **P2 (Medium)** | < 1 hour | High queue depth, elevated failure rate |
| **P3 (Low)** | < 4 hours | Quota warnings, minor latency increases |

### Alert Response Template

**Step 1: Acknowledge**
- Update incident ticket status
- Post in #incidents Slack channel
- Tag relevant team members

**Step 2: Assess**
- Check Grafana dashboard for visual overview
- Review Sentry for recent errors
- Examine logs for correlation IDs

**Step 3: Diagnose**
- Follow scenario-specific runbook steps
- Document findings in incident ticket
- Identify root cause

**Step 4: Mitigate**
- Implement temporary fixes
- Restore service functionality
- Monitor metrics for improvement

**Step 5: Resolve**
- Apply permanent fix
- Verify metrics return to normal
- Update incident ticket
- Schedule post-mortem if P0/P1

---

## Troubleshooting Guide

### Debugging with Correlation IDs

1. **Find correlation ID from user report**:
   ```bash
   # Search logs by message ID
   kubectl logs deployment/backend | grep "messageId=12345"
   ```

2. **Trace full request flow**:
   ```bash
   # Use correlation ID to trace across services
   kubectl logs deployment/backend | grep "correlationId=abc-123-def"
   ```

3. **Check in Sentry**:
   - Go to Sentry dashboard
   - Filter by tag: `correlation_id=abc-123-def`
   - View full error context with stack traces

### Database Investigation Queries

**Message processing status**:
```sql
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM outbound_message
GROUP BY status;
```

**Channel performance**:
```sql
SELECT 
  channel,
  status,
  COUNT(*) as count,
  AVG(attempt_count) as avg_attempts
FROM outbound_message
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY channel, status;
```

**Error analysis**:
```sql
SELECT 
  error_code,
  COUNT(*) as occurrences,
  COUNT(DISTINCT dossier_id) as affected_dossiers,
  MAX(updated_at) as last_seen
FROM outbound_message
WHERE status = 'FAILED'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_code
ORDER BY occurrences DESC;
```

### Log Search Patterns

**Worker activity**:
```bash
kubectl logs deployment/backend --since=1h | grep "OutboundJobWorker" | grep "Processing"
```

**Message failures**:
```bash
kubectl logs deployment/backend --since=1h | grep "handleFailure" | grep "errorCode"
```

**Provider API errors**:
```bash
kubectl logs deployment/backend --since=1h | grep -E "(Twilio|SendGrid|WhatsApp)" | grep "ERROR"
```

---

## Emergency Procedures

### Emergency Contacts

| Role | Primary | Backup | Contact |
|------|---------|--------|---------|
| On-Call Engineer | John Doe | Jane Smith | Slack: @oncall |
| Backend Lead | Alice Johnson | Bob Williams | Slack: @backend-lead |
| DevOps Lead | Charlie Brown | Diana Prince | Slack: @devops-lead |
| Provider Support | Twilio | SendGrid | support@providers.com |

### Escalation Path

1. **Level 1**: On-call engineer attempts resolution (15 min)
2. **Level 2**: Escalate to backend lead if unresolved (30 min)
3. **Level 3**: Escalate to CTO for critical business impact (1 hour)
4. **Level 4**: Contact external provider support if provider issue

### Circuit Breaker Activation

**When to activate**:
- Provider success rate < 50% for 10+ minutes
- Provider API consistently timing out
- Preventing cascading failures

**How to activate**:
```bash
# Disable channel temporarily
kubectl set env deployment/backend OUTBOUND_WORKER_ENABLED=false

# Or disable specific channel
kubectl set env deployment/backend WHATSAPP_PROVIDER_ENABLED=false
```

**How to restore**:
```bash
# Re-enable after issue resolved
kubectl set env deployment/backend OUTBOUND_WORKER_ENABLED=true
```

### Rollback Procedure

**If recent deployment caused issues**:
```bash
# Rollback to previous version
kubectl rollout undo deployment/backend

# Check rollback status
kubectl rollout status deployment/backend

# Verify metrics return to normal
```

---

## Post-Incident Analysis

### Post-Mortem Template

**Incident Summary**:
- Date/Time: 
- Duration:
- Severity: P0/P1/P2/P3
- Impact: (users affected, messages lost, revenue impact)

**Timeline**:
- Detection time:
- Response time:
- Mitigation time:
- Resolution time:

**Root Cause**:
- Technical cause:
- Contributing factors:
- Why monitoring didn't catch earlier:

**Resolution**:
- Immediate actions taken:
- Permanent fix applied:

**Lessons Learned**:
- What went well:
- What could be improved:
- Action items:

**Follow-Up Actions**:
- [ ] Update runbook
- [ ] Add monitoring/alerts
- [ ] Implement preventive measures
- [ ] Schedule team review

### Metrics to Track

- **MTTD (Mean Time To Detect)**: Time from incident start to detection
- **MTTR (Mean Time To Resolve)**: Time from detection to resolution
- **Incident frequency**: Number of incidents per week/month
- **False positive rate**: Alert accuracy

---

## Appendix

### Useful Commands Cheatsheet

```bash
# View real-time logs
kubectl logs -f deployment/backend --tail=100

# Check pod health
kubectl get pods -l app=backend
kubectl describe pod <pod-name>

# Port forward to local
kubectl port-forward svc/backend 8080:8080

# Execute SQL query
kubectl exec -it postgres-0 -- psql -U postgres -d atlas -c "SELECT COUNT(*) FROM outbound_message WHERE status='QUEUED';"

# Check metrics endpoint
curl http://localhost:8080/actuator/prometheus | grep outbound_message

# Restart backend pods
kubectl rollout restart deployment/backend
```

### Configuration References

**Environment Variables**:
- `OUTBOUND_WORKER_ENABLED`: Enable/disable worker (default: true)
- `OUTBOUND_WORKER_BATCH_SIZE`: Messages per batch (default: 10)
- `OUTBOUND_WORKER_POLL_INTERVAL_MS`: Polling frequency (default: 5000)
- `OUTBOUND_METRICS_UPDATE_INTERVAL_MS`: Metrics update frequency (default: 10000)

**Database Tables**:
- `outbound_message`: Main message queue
- `outbound_attempt`: Retry history
- `whatsapp_rate_limit`: Quota tracking

**Key Indexes** (for query optimization):
- `idx_outbound_message_status_created`: (status, created_at)
- `idx_outbound_message_channel_status`: (channel, status)
- `idx_outbound_attempt_retry_at`: (next_retry_at) WHERE next_retry_at IS NOT NULL

---

## Document Maintenance

**Last Updated**: 2024-01-15  
**Next Review**: 2024-02-15  
**Maintainer**: Backend Team  
**Version**: 1.0

**Change Log**:
- 2024-01-15: Initial version created
