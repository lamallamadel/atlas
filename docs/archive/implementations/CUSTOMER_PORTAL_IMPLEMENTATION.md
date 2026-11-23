# Customer Portal Implementation Guide

## Overview

The Customer Portal is a comprehensive white-label client-facing application that allows property buyers, sellers, and tenants to access their dossiers, communicate with agents, manage appointments, and view property recommendations through a secure, passwordless authentication system.

## Features Implemented

### 1. Authentication & Security
- **Magic Link Authentication**: Passwordless login via email/SMS/WhatsApp
- **End-to-End Encryption**: Secure messaging using Web Crypto API (AES-GCM 256-bit)
- **JWT Token Management**: Secure token-based session management
- **Automatic Token Expiration**: 24-hour token validity with cleanup

### 2. Core Components

#### Backend Services (Spring Boot)

**Entities:**
- `ClientAuthToken`: Manages magic link tokens for client authentication
- `ClientSecureMessage`: Stores encrypted messages between clients and agents
- `ClientAppointmentRequest`: Handles appointment scheduling requests
- `ClientSatisfactionSurvey`: Collects client feedback and ratings

**Services:**
- `CustomerPortalService`: Main service for client data access
- `MagicLinkAuthService`: Generates and validates magic link tokens
- `OutboundMessageService`: Sends magic links via email/SMS/WhatsApp

**Controller:**
- `CustomerPortalController`: REST API endpoints for customer portal
  - `POST /api/customer-portal/auth/validate`: Validate magic link token
  - `GET /api/customer-portal/dossier/{dossierId}`: Get dossier details
  - `GET /api/customer-portal/messages/{dossierId}`: Get secure messages
  - `POST /api/customer-portal/messages/{dossierId}`: Send encrypted message
  - `GET /api/customer-portal/appointments/{dossierId}`: Get appointment requests
  - `POST /api/customer-portal/appointments/{dossierId}`: Create appointment request
  - `POST /api/customer-portal/surveys/{dossierId}`: Submit satisfaction survey
  - `GET /api/customer-portal/consents/{dossierId}`: Get communication preferences
  - `PUT /api/customer-portal/consents/{consentId}`: Update consent preferences
  - `GET /api/customer-portal/branding/{orgId}`: Get white-label branding
  - `GET /api/customer-portal/documents/{documentId}/download`: Download document
  - `GET /api/customer-portal/recommendations/{dossierId}`: Get property recommendations

#### Frontend Components (Angular)

**Services:**
- `CustomerPortalService`: Main service for API communication
- `CryptoService`: Web Crypto API wrapper for E2E encryption

**Components:**
1. **CustomerPortalAuthComponent**: Handles magic link validation and authentication
2. **CustomerPortalDashboardComponent**: Main dashboard with tabbed navigation
3. **DossierTimelineViewComponent**: Client-visible activity timeline
4. **ClientDocumentLibraryComponent**: Document viewing and downloading
5. **SecureMessageThreadComponent**: Encrypted messaging with agents
6. **AppointmentRequestComponent**: Propose and track appointment requests
7. **ClientSatisfactionSurveyComponent**: Rate agent performance and experience
8. **ConsentManagementComponent**: Manage communication preferences
9. **PropertyRecommendationComponent**: View recommended properties

### 3. White-Label Branding

Agencies can customize the portal with:
- Custom logo (light and dark variants)
- Primary, secondary, and accent colors
- Custom CSS for advanced styling
- Organization-specific domain names
- Email branding (from name, address, footer)

### 4. Database Schema

**Migration: V115__Add_customer_portal_tables.sql**

Tables created:
- `client_auth_token`: Magic link tokens with expiration
- `client_secure_message`: Encrypted messages with IV
- `client_appointment_request`: Client appointment proposals
- `client_satisfaction_survey`: Multi-dimensional feedback ratings

All tables include:
- Proper indexing for performance
- `org_id` for multi-tenancy
- `dossier_id` foreign key relationships
- Created/updated timestamps

### 5. Security Features

**Encryption:**
- AES-GCM 256-bit encryption for messages
- Random initialization vectors (IV) per message
- PBKDF2 key derivation (100,000 iterations)
- Base64 encoding for transport

**Authentication:**
- JWT tokens with 24-hour expiration
- Secure token generation using UUID
- Token validation on every API call
- Automatic cleanup of expired tokens

**Access Control:**
- Tokens scoped to specific dossiers
- Organization validation on all requests
- Document access restricted to dossier owner
- Activity visibility filtering (CLIENT_VISIBLE only)

### 6. User Experience Features

**Progress Tracking:**
- Visual progress bar showing dossier completion
- Client-friendly status labels (vs. internal CRM statuses)
- Percentage-based milestone tracking

**Communication Preferences:**
- Email opt-in/opt-out
- SMS opt-in/opt-out
- WhatsApp opt-in/opt-out
- Phone opt-in/opt-out
- Essential communications always enabled

**Appointment Management:**
- Propose multiple time slots
- Specify preferred location
- Add notes for context
- Track request status (Pending/Accepted/Declined)
- View agent responses

**Satisfaction Surveys:**
- 5-star rating system
- Multiple dimensions: Overall, Communication, Responsiveness, Professionalism
- Optional comments
- Triggered on appointment completion or deal closure

**Document Management:**
- Categorized document library
- Visual file type icons
- File size formatting
- Direct download capability
- Only shared documents visible

**Property Recommendations:**
- Based on client preferences
- Similar properties suggestion
- Visual property cards with images
- Price, location, and features display
- Quick contact button

### 7. Responsive Design

All components are fully responsive:
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly UI elements
- Optimized for tablets and phones
- Accessible keyboard navigation

### 8. Internationalization

Portal supports French by default with easy translation:
- Client-friendly status translations
- Date/time formatting
- Currency formatting (EUR)
- Extensible to other languages

## API Configuration

### Environment Variables

```yaml
customer-portal:
  jwt:
    secret: "customer-portal-secret-key-change-in-production-minimum-256-bits"
  magic-link:
    expiration-hours: 24
  base-url: "http://localhost:4200"
```

### Backend Dependencies

All required dependencies already included in `pom.xml`:
- `io.jsonwebtoken:jjwt-api:0.12.3`
- `io.jsonwebtoken:jjwt-impl:0.12.3`
- `io.jsonwebtoken:jjwt-jackson:0.12.3`
- Spring Boot Security
- Spring Boot Mail
- Spring Boot WebFlux

## Usage Guide

### For Agents (Sending Magic Links)

1. Navigate to a dossier in the CRM
2. Click "Send Portal Access" button
3. Choose channel: Email, SMS, or WhatsApp
4. System generates magic link and sends to client
5. Link valid for 24 hours

### For Clients (Accessing Portal)

1. Receive magic link via email/SMS/WhatsApp
2. Click link to authenticate
3. Automatic redirection to dashboard
4. View dossier status and progress
5. Access features via tabbed navigation:
   - **Vue d'ensemble**: Timeline and documents
   - **Messages**: Secure encrypted messaging
   - **Rendez-vous**: Request and track appointments
   - **Documents**: View and download shared files
   - **Recommandations**: Browse suggested properties
   - **Évaluation**: Rate agent and experience
   - **Préférences**: Manage communication settings

## Security Best Practices

### Production Deployment

1. **Change default JWT secret**:
   ```yaml
   customer-portal.jwt.secret: "${CUSTOMER_PORTAL_JWT_SECRET}"
   ```

2. **Use environment-specific secrets**:
   - Generate strong random key (256+ bits)
   - Store in secure vault (AWS Secrets Manager, Azure Key Vault)
   - Never commit secrets to version control

3. **Enable HTTPS**:
   - SSL/TLS required for production
   - Encrypt data in transit
   - Use secure cookies

4. **Implement rate limiting**:
   - Limit magic link generation
   - Throttle authentication attempts
   - Prevent brute force attacks

5. **Set up monitoring**:
   - Track failed authentication attempts
   - Monitor token usage patterns
   - Alert on suspicious activity

### Encryption Key Management

The current implementation uses a hardcoded encryption key for demonstration. In production:

1. **Generate unique keys per organization**:
   ```java
   SecretKey key = KeyGenerator.getInstance("AES").generateKey();
   ```

2. **Store keys securely**:
   - Use hardware security modules (HSM)
   - Or secure key management service
   - Rotate keys periodically

3. **Implement key derivation**:
   - Derive per-session keys
   - Use organization-specific salts
   - Implement forward secrecy

## Testing

### Backend Tests

```bash
# Run unit tests
cd backend
mvn test

# Run integration tests
mvn verify -Pbackend-e2e-h2
mvn verify -Pbackend-e2e-postgres
```

### Frontend Tests

```bash
# Run unit tests
cd frontend
npm test

# Run E2E tests
npm run e2e
```

### Manual Testing Scenarios

1. **Magic Link Flow**:
   - Generate link via CRM
   - Receive and click link
   - Verify authentication
   - Check session persistence

2. **Secure Messaging**:
   - Send message as client
   - Verify encryption
   - Receive message as agent
   - Verify decryption

3. **Appointment Requests**:
   - Submit request with details
   - Agent accepts/declines
   - Verify status update
   - Check notifications

4. **Document Access**:
   - Upload document in CRM
   - Mark as client-visible
   - Verify appears in portal
   - Test download

5. **Satisfaction Survey**:
   - Complete appointment
   - Survey auto-triggers
   - Submit ratings
   - Verify stored in database

## Troubleshooting

### Common Issues

**Token Validation Fails:**
- Check token expiration (24 hours)
- Verify JWT secret matches
- Ensure organization ID matches
- Check database token record

**Messages Not Decrypting:**
- Verify encryption key consistency
- Check IV (initialization vector) stored
- Ensure Base64 encoding correct
- Validate Web Crypto API support

**Documents Not Visible:**
- Check document category
- Verify client-visible flag
- Ensure dossier association
- Check permissions

**Magic Link Not Sent:**
- Verify email/SMS/WhatsApp config
- Check outbound message service
- Review rate limits
- Check provider credentials

**Branding Not Applied:**
- Verify white-label config exists
- Check organization ID match
- Validate CSS syntax
- Review color hex values

## Future Enhancements

Potential additions:
- Push notifications for real-time updates
- Video call integration
- Digital signature capability
- Payment processing
- Mobile app (iOS/Android)
- Offline mode support
- Multi-language support
- Advanced property filters
- Saved searches
- Favorite properties
- Sharing capabilities
- Print-friendly views

## Performance Considerations

### Optimizations Implemented

1. **Database Indexing**:
   - Token lookup by token value
   - Messages by dossier and creation date
   - Appointments by status
   - Surveys by trigger type

2. **API Efficiency**:
   - Single endpoint for dossier with relations
   - Lazy loading of messages
   - Paginated recommendations
   - Cached branding configuration

3. **Frontend Performance**:
   - Lazy loading of tabs
   - Component-level change detection
   - Debounced search inputs
   - Optimized re-renders

### Scalability

The architecture supports scaling:
- Stateless API design
- JWT-based authentication (no session storage)
- Database sharding by organization
- CDN for static assets
- Redis caching for branding
- Message queue for notifications

## Support & Maintenance

### Monitoring Metrics

Track these KPIs:
- Magic link generation rate
- Authentication success rate
- Message encryption/decryption time
- Appointment request response time
- Survey completion rate
- Document download count
- Average session duration

### Logging

Key events to log:
- Authentication attempts (success/failure)
- Token generation and validation
- Message sending (encrypted, not content)
- Appointment requests
- Survey submissions
- Document access
- Consent changes

### Maintenance Tasks

Regular tasks:
- Clean up expired tokens (scheduled job)
- Archive old messages (data retention)
- Backup encryption keys
- Review security logs
- Update dependencies
- Rotate secrets

## Compliance

### GDPR Compliance

Features supporting GDPR:
- Explicit consent management
- Right to access data
- Right to be forgotten (data deletion)
- Data portability (export)
- Encryption at rest and in transit
- Audit trail of data access
- Privacy by design

### Data Retention

Recommended policies:
- Active tokens: 24 hours
- Expired tokens: Delete immediately
- Messages: Retain per regulation
- Surveys: Anonymize after period
- Audit logs: Minimum 1 year

## Conclusion

The Customer Portal provides a complete, secure, and user-friendly experience for clients to interact with their real estate dossiers. The implementation follows security best practices, supports white-label branding, and scales to enterprise needs.

For questions or support, refer to the main project documentation or contact the development team.
