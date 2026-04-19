# API Marketplace - Documentation Index

Complete guide to the API Marketplace implementation.

## Quick Navigation

### Getting Started
- **[Quick Start Guide](./API_MARKETPLACE_QUICKSTART.md)** - Get up and running in 5 minutes
- **[Implementation Summary](./API_MARKETPLACE_SUMMARY.md)** - Overview of what was built

### Comprehensive Guides
- **[Implementation Guide](./API_MARKETPLACE_IMPLEMENTATION.md)** - Complete technical documentation
- **[Webhook Integration](./backend/src/main/resources/docs/WEBHOOK_INTEGRATION_GUIDE.md)** - Webhook setup and verification
- **[Event Integration](./WEBHOOK_EVENT_INTEGRATION.md)** - Integrate webhooks into services

### API Reference
- **Swagger UI**: http://localhost:8080/swagger-ui
  - Select "Public API (Third-Party)" for public endpoints
  - Select "Developer Portal" for management API

### Developer Portal
- **UI**: http://localhost:4200/developer-portal
- **Features**: API keys, webhooks, usage analytics

## Document Structure

```
API_MARKETPLACE_INDEX.md                    ← You are here
│
├── Quick Start
│   └── API_MARKETPLACE_QUICKSTART.md       5-minute guide
│
├── Implementation
│   ├── API_MARKETPLACE_IMPLEMENTATION.md   Complete guide
│   ├── API_MARKETPLACE_SUMMARY.md          What was built
│   └── WEBHOOK_EVENT_INTEGRATION.md        Service integration
│
└── Reference
    └── WEBHOOK_INTEGRATION_GUIDE.md        Webhook details
```

## Features by Category

### 🔑 API Key Management
- Create/revoke API keys
- Three tiers: Free/Pro/Enterprise
- Usage tracking
- Expiration support

**See**: [Implementation Guide § API Key Management](./API_MARKETPLACE_IMPLEMENTATION.md#1-api-key-management)

### 🪝 Webhook System
- 8 event types
- HMAC-SHA256 signatures
- Retry policies
- Delivery tracking

**See**: [Webhook Integration Guide](./backend/src/main/resources/docs/WEBHOOK_INTEGRATION_GUIDE.md)

### 🚀 Public API
- Versioned endpoints (`/api/public/v1/*`)
- Rate limiting
- OpenAPI docs
- Usage analytics

**See**: [Implementation Guide § Public API Endpoints](./API_MARKETPLACE_IMPLEMENTATION.md#3-public-api-endpoints)

### 📊 Developer Portal
- API key management UI
- Webhook configuration
- Usage dashboard
- Delivery logs

**See**: [Implementation Guide § Developer Portal Features](./API_MARKETPLACE_IMPLEMENTATION.md#4-developer-portal-features)

### 🔐 Security
- API key hashing (BCrypt)
- Webhook signatures (HMAC-SHA256)
- Rate limiting
- HTTPS enforcement

**See**: [Implementation Guide § Security](./API_MARKETPLACE_IMPLEMENTATION.md#6-security-)

## Common Tasks

### Create Your First API Key
```bash
# 1. Open Developer Portal
http://localhost:4200/developer-portal

# 2. Click "Create API Key"
# 3. Fill form and submit
# 4. Copy the key (shown once!)
```
**Guide**: [Quick Start § Step 2](./API_MARKETPLACE_QUICKSTART.md#step-2-create-an-api-key)

### Test the Public API
```bash
curl -X GET http://localhost:8080/api/public/v1/dossiers \
  -H "X-API-Key: YOUR_KEY"
```
**Guide**: [Quick Start § Step 3](./API_MARKETPLACE_QUICKSTART.md#step-3-test-the-public-api)

### Set Up a Webhook
```bash
# 1. Create subscription in Developer Portal
# 2. Copy signing secret
# 3. Verify signatures in your app
```
**Guide**: [Webhook Integration § Setting Up](./backend/src/main/resources/docs/WEBHOOK_INTEGRATION_GUIDE.md#setting-up-a-webhook)

### Integrate Events into Service
```java
@Autowired
private WebhookEventService webhookEventService;

public Dossier create(...) {
    Dossier saved = repository.save(dossier);
    webhookEventService.triggerDossierCreated(saved);
    return saved;
}
```
**Guide**: [Event Integration § Quick Integration](./WEBHOOK_EVENT_INTEGRATION.md#quick-integration)

## Integration Examples

### Zapier
- Webhook trigger → Actions
- API polling → Data sync

**Guide**: [Implementation § Zapier Integration](./API_MARKETPLACE_IMPLEMENTATION.md#zapier)

### Make (Integromat)
- Custom webhooks
- HTTP modules
- Routers for events

**Guide**: [Implementation § Make Integration](./API_MARKETPLACE_IMPLEMENTATION.md#make-formerly-integromat-integration)

### n8n
- Self-hosted workflows
- Webhook + HTTP nodes
- JSON import

**Guide**: [Implementation § n8n Integration](./API_MARKETPLACE_IMPLEMENTATION.md#n8n-integration)

### Custom (Node.js, Python)
- SDK examples
- Signature verification
- Error handling

**Guide**: [Implementation § Node.js SDK](./API_MARKETPLACE_IMPLEMENTATION.md#nodejs-sdk-example)

## Rate Limits

| Tier | Requests/Min | Requests/Day |
|------|--------------|--------------|
| Free | 60 | 86,400 |
| Pro | 600 | 864,000 |
| Enterprise | 6000 | 8,640,000 |

**Details**: [Implementation § Rate Limiting](./API_MARKETPLACE_IMPLEMENTATION.md#rate-limiting)

## Webhook Events

Available event types:
- `dossier.created`
- `dossier.updated`
- `dossier.status_changed`
- `message.received`
- `message.sent`
- `appointment.scheduled`
- `appointment.updated`
- `appointment.cancelled`

**Schemas**: [Webhook Guide § Payload Schemas](./backend/src/main/resources/docs/WEBHOOK_INTEGRATION_GUIDE.md#webhook-payload-schemas)

## Technical Architecture

### Backend Stack
- Spring Boot 3.2.1
- Spring Authorization Server
- Springdoc OpenAPI
- Bucket4j (rate limiting)
- BCrypt (key hashing)

### Frontend Stack
- Angular (standalone components)
- TypeScript
- Tailwind CSS (styling)

### Database
- PostgreSQL (production)
- H2 (development/testing)
- Flyway migrations

**Details**: [Implementation § Architecture](./API_MARKETPLACE_IMPLEMENTATION.md#architecture)

## Testing

### Manual Testing
1. **API Keys**: Developer Portal → Create key
2. **Public API**: curl with API key
3. **Webhooks**: webhook.site for delivery
4. **Analytics**: Check usage dashboard

### Automated Testing
- Unit tests for services
- Integration tests for controllers
- E2E tests for full flows

**Guide**: [Implementation § Testing](./API_MARKETPLACE_IMPLEMENTATION.md#testing)

## Troubleshooting

### Common Issues

**API Key Not Working**
- Check status is ACTIVE
- Verify correct header
- Check rate limits

**Webhook Not Delivering**
- Verify status is ACTIVE
- Check URL accessibility
- Review delivery logs
- Verify signature logic

**Rate Limit Exceeded**
- Wait 60 seconds
- Implement backoff
- Consider upgrading

**Complete Guide**: [Quick Start § Troubleshooting](./API_MARKETPLACE_QUICKSTART.md#troubleshooting)

## Next Steps

### Immediate Actions
1. ✅ Review implementation summary
2. ✅ Run through quick start guide
3. ✅ Test API key creation
4. ✅ Test webhook delivery
5. ✅ Check developer portal UI

### Integration Tasks
1. Add webhook triggers to DossierService
2. Add webhook triggers to MessageService
3. Add webhook triggers to AppointmentService
4. Test end-to-end flows
5. Monitor delivery health

### Enhancement Ideas
1. OAuth2 client credentials
2. GraphQL public API
3. SDK generation
4. Webhook filtering
5. Team management
6. Usage quotas

**Roadmap**: [Summary § Next Steps](./API_MARKETPLACE_SUMMARY.md#next-steps)

## Support & Resources

### Documentation
- **This Index**: Overview and navigation
- **Quick Start**: 5-minute setup
- **Implementation**: Complete technical docs
- **Webhook Guide**: Integration details
- **Event Integration**: Service integration

### Interactive
- **Swagger UI**: http://localhost:8080/swagger-ui
- **Developer Portal**: http://localhost:4200/developer-portal

### Code Examples
- Node.js SDK
- Python SDK
- Signature verification
- Integration samples

### Community
- GitHub Issues
- Documentation PRs
- Feature requests

## Feedback

Found an issue or have a suggestion?
- Update documentation
- Submit bug report
- Request feature
- Contribute example

---

**Start Here**: [Quick Start Guide](./API_MARKETPLACE_QUICKSTART.md)
