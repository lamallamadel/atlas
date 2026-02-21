# Production Observability & Monitoring - Complete Guide

## 📚 Documentation Overview

This directory contains comprehensive observability documentation for the outbound messaging system:

| Document | Purpose | Audience |
|----------|---------|----------|
| **[OBSERVABILITY_QUICK_START.md](OBSERVABILITY_QUICK_START.md)** | 5-minute setup guide | Developers, New team members |
| **[OBSERVABILITY_SETUP.md](OBSERVABILITY_SETUP.md)** | Complete setup and configuration | DevOps, Platform engineers |
| **[OUTBOUND_MESSAGING_RUNBOOK.md](OUTBOUND_MESSAGING_RUNBOOK.md)** | Incident response procedures | On-call engineers, SREs |

---

## 🎯 What's Implemented

### ✅ Prometheus Metrics
- **Queue depth gauges** by status and channel
- **Delivery latency histograms** with p50/p95/p99 percentiles
- **Throughput counters** (queued, sent, failed, retried)
- **WhatsApp quota tracking** (used, limit, remaining)
- **Failure rate metrics** by error code
- **Custom gauges** for DLQ size and retry counts

### ✅ Grafana Dashboards
- **21 comprehensive panels** covering all aspects
- **Real-time queue monitoring** with alerting thresholds
- **Latency analysis** across channels
- **Success rate tracking** with color-coded health
- **WhatsApp quota visualization** with gauges
- **Alert history** showing trends
- **Auto-refresh** every 30 seconds

### ✅ Structured Logging
- **JSON logging** for production (via Logstash encoder)
- **Correlation ID propagation** through all requests and workers
- **MDC context enrichment** (orgId, userId, messageId, channel)
- **Automatic context propagation** to async tasks
- **Color-coded console logs** for development

### ✅ Sentry Error Tracking
- **Automatic error capture** for exceptions
- **Context enrichment** with correlation IDs and tags
- **User identification** via orgId
- **Breadcrumb trail** from INFO+ logs
- **Performance monitoring** with transaction sampling
- **Release tracking** for deployments

### ✅ Alert Rules
- **11 Prometheus alert rules** for critical scenarios
- **Graduated severity levels** (warning, critical)
- **Runbook links** in alert annotations
- **Multi-channel alerting** ready (Slack, PagerDuty)

### ✅ Runbook Documentation
- **6 common incident scenarios** with step-by-step resolution
- **Troubleshooting guides** with SQL queries and commands
- **Alert response procedures** with priority levels
- **Emergency procedures** with escalation paths
- **Post-incident analysis** templates

---

## 🚀 Quick Start

### For Developers

```bash
# Start observability stack
cd infra
docker-compose up -d prometheus grafana

# Access Grafana
open http://localhost:3000
# Login: admin/admin

# View metrics
curl http://localhost:8080/actuator/prometheus | grep outbound_message
```

### For On-Call Engineers

1. **Dashboard**: http://localhost:3000/d/outbound-messaging-observability
2. **Runbook**: Read [OUTBOUND_MESSAGING_RUNBOOK.md](OUTBOUND_MESSAGING_RUNBOOK.md)
3. **Alerts**: Check Prometheus alerts at http://localhost:9090/alerts

### For Platform Engineers

1. **Setup Guide**: Follow [OBSERVABILITY_SETUP.md](OBSERVABILITY_SETUP.md)
2. **Prometheus Config**: Edit `infra/prometheus/prometheus.yml`
3. **Alert Rules**: Edit `infra/prometheus/alerts.yml`
4. **Grafana Provisioning**: Edit `infra/grafana/provisioning/`

---

## 📊 Key Metrics Reference

### Queue Health
```promql
# Total queued messages
outbound_message_total_queued

# Dead letter queue size
outbound_message_dead_letter_queue_size

# Queue depth by channel
outbound_message_queue_depth_by_channel{channel="whatsapp"}
```

### Performance
```promql
# P95 latency
histogram_quantile(0.95, rate(outbound_message_delivery_latency_seconds_bucket[5m]))

# Success rate
sum(rate(outbound_message_send_success_total[5m])) 
/ 
(sum(rate(outbound_message_send_success_total[5m])) + sum(rate(outbound_message_send_failure_total[5m])))
```

### WhatsApp Quota
```promql
# Current usage
whatsapp_quota_used

# Percentage used
(whatsapp_quota_used / whatsapp_quota_limit) * 100
```

---

## 🔔 Alert Scenarios

| Alert | Threshold | Severity | Response Time |
|-------|-----------|----------|---------------|
| High Queue Depth | > 1000 messages | Warning | 15 minutes |
| DLQ Growth | +50 in 10 min | Critical | Immediate |
| Low Success Rate | < 95% for 15 min | Critical | Immediate |
| High Latency P95 | > 30 seconds | Warning | 1 hour |
| WhatsApp Quota | > 90% used | Critical | 15 minutes |
| Stuck Messages | No activity 15 min | Critical | Immediate |

---

## 🛠 Infrastructure Components

### Stack Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Backend   │────▶│  Prometheus  │────▶│   Grafana   │
│   (Metrics) │     │  (Storage)   │     │ (Dashboard) │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │ Logs         ┌──────────────┐
       └─────────────▶│    Sentry    │
                      │ (Error Track)│
                      └──────────────┘
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| Backend | 8080 | Application + metrics endpoint |
| Prometheus | 9090 | Metrics collection and storage |
| Grafana | 3000 | Visualization and dashboards |
| Alertmanager | 9093 | Alert routing and notification (optional) |

### Storage

- **Prometheus**: Time-series data (15-day retention by default)
- **Grafana**: Dashboard definitions and configs
- **Backend Logs**: JSON files in `/var/log/atlas/` (14-day retention)

---

## 🔍 Troubleshooting Checklist

### Metrics Not Showing Up

- [ ] Backend is running and healthy
- [ ] Prometheus is scraping (check http://localhost:9090/targets)
- [ ] Metrics endpoint is accessible: http://localhost:8080/actuator/prometheus
- [ ] Wait 10-30 seconds for initial metrics collection

### Dashboard Shows "No Data"

- [ ] Grafana datasource is configured correctly
- [ ] Prometheus URL is reachable from Grafana container
- [ ] Time range is appropriate (try "Last 1 hour")
- [ ] Generate test traffic to populate metrics

### Correlation IDs Not in Logs

- [ ] `CorrelationIdFilter` is enabled (check not in test profile)
- [ ] `AsyncConfig` with `MdcTaskDecorator` is active
- [ ] MDC keys are used in log statements

### Sentry Not Receiving Events

- [ ] `SENTRY_ENABLED=true` is set
- [ ] DSN is correct and valid
- [ ] Application has network access to sentry.io
- [ ] Minimum log level is ERROR (by default)

---

## 📈 Performance Impact

### Metrics Collection

- **CPU overhead**: < 1% in typical workloads
- **Memory overhead**: ~50MB for metric storage
- **Network overhead**: ~5KB/scrape (every 15s)

### Logging

- **Disk I/O**: Managed by rolling file appender
- **Log rotation**: Daily rotation, 14-day retention, 2GB cap
- **JSON serialization**: ~5-10µs per log statement

### Sentry

- **Transaction sampling**: 10% by default (configurable)
- **Event rate limiting**: Automatic (handled by Sentry)
- **Network I/O**: Async, non-blocking

---

## 🔐 Security Considerations

### Metrics Endpoint

⚠️ **Important**: The `/actuator/prometheus` endpoint exposes operational metrics but does NOT include sensitive data like:
- User credentials
- API keys
- Message content
- Personal information

However, it should still be:
- Protected by authentication in production
- Not exposed to the public internet
- Restricted to monitoring systems

### Log Sanitization

Logs automatically exclude:
- Passwords
- API keys
- Credit card numbers
- Personal identifiable information (PII)

Review `logback-spring.xml` for sanitization filters.

### Sentry Data Scrubbing

Sentry automatically scrubs:
- Authorization headers
- Cookies
- Session tokens
- Query parameters matching common patterns

Additional scrubbing rules can be configured in Sentry project settings.

---

## 🧪 Testing Observability

### Local Testing

```bash
# 1. Start infrastructure
cd infra
docker-compose up -d

# 2. Generate test traffic
curl -X POST http://localhost:8080/api/outbound-messages \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: test-$(date +%s)" \
  -d '{"dossierId":1,"channel":"EMAIL","to":"test@example.com","subject":"Test"}'

# 3. View metrics
curl http://localhost:8080/actuator/prometheus | grep outbound_message

# 4. Check Grafana
open http://localhost:3000

# 5. Search logs by correlation ID
docker logs backend | grep "correlationId=test-"
```

### Integration Tests

See `backend/src/test/java/com/example/backend/observability/` for metric tests.

---

## 📞 Support & Escalation

### Primary Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| On-Call Engineer | @oncall | 24/7 |
| Backend Lead | @backend-lead | Business hours |
| DevOps Lead | @devops-lead | Business hours |
| CTO | @cto | Critical incidents |

### Communication Channels

- **Incidents**: #incidents on Slack
- **Monitoring**: #monitoring on Slack
- **Questions**: #backend on Slack

### External Support

- **Twilio**: https://support.twilio.com
- **SendGrid**: https://support.sendgrid.com
- **Meta (WhatsApp)**: https://business.facebook.com/support
- **Sentry**: https://sentry.io/support

---

## 🔄 Maintenance

### Regular Tasks

**Daily**:
- [ ] Review dashboard for anomalies
- [ ] Check DLQ size and clean up if needed

**Weekly**:
- [ ] Review alert history and false positives
- [ ] Update runbook based on incidents

**Monthly**:
- [ ] Review metrics retention and storage
- [ ] Update Grafana dashboards with new panels
- [ ] Test alert routing and escalation

**Quarterly**:
- [ ] Review and update alert thresholds
- [ ] Conduct observability drill/game day
- [ ] Update documentation

---

## 📚 Additional Resources

### Official Documentation

- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Micrometer Documentation](https://micrometer.io/docs)
- [Sentry Spring Boot](https://docs.sentry.io/platforms/java/guides/spring-boot/)

### Internal Resources

- [Backend README](../README.md)
- [Outbound Messaging Documentation](OUTBOUND_MESSAGING_README.md)
- [Architecture Decision Records](./architecture/)

### Training

- Prometheus Fundamentals: https://training.promlabs.com/
- Grafana Essentials: https://grafana.com/tutorials/
- Incident Response: Internal wiki link

---

## 🏗 Future Enhancements

### Planned Features

- [ ] OpenTelemetry distributed tracing integration
- [ ] Log aggregation with ELK Stack (already in docker-compose)
- [ ] Custom Grafana plugins for business metrics
- [ ] Automated runbook execution (self-healing)
- [ ] Cost tracking for provider APIs
- [ ] Predictive alerting with anomaly detection

### Feedback

Have suggestions? Create an issue or reach out to the Backend Team.

---

**Last Updated**: 2024-01-15  
**Version**: 1.0  
**Maintainer**: Backend Team  
**License**: Internal Use Only
