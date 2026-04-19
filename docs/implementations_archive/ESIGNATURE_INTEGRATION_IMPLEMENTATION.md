# Electronic Signature Integration Implementation

## Overview

This document describes the implementation of electronic signature integration using DocuSign eSignature API for real estate contracts.

## Architecture

### Backend Components

#### Entities

1. **ContractTemplateEntity** (`backend/src/main/java/com/example/backend/entity/ContractTemplateEntity.java`)
   - Stores PDF contract templates
   - Fields: template name, type, file storage path, signature field definitions
   - Supports multiple template types: MANDATE, PURCHASE_AGREEMENT, LISTING_AGREEMENT, LEASE_AGREEMENT

2. **SignatureRequestEntity** (`backend/src/main/java/com/example/backend/entity/SignatureRequestEntity.java`)
   - Tracks signature workflow lifecycle
   - Statuses: PENDING → SENT → VIEWED → SIGNED → COMPLETED
   - Alternative statuses: DECLINED, VOIDED, EXPIRED
   - Stores audit trail, signer information, and timestamps for each status transition

3. **SignatureStatus Enum** (`backend/src/main/java/com/example/backend/entity/enums/SignatureStatus.java`)
   - Defines all possible signature request states

#### Services

1. **ESignatureService** (`backend/src/main/java/com/example/backend/service/ESignatureService.java`)
   - Core service for DocuSign integration
   - Methods:
     - `createSignatureRequest()`: Creates signature request in database
     - `sendForSignature()`: Sends envelope to DocuSign
     - `handleWebhookEvent()`: Processes DocuSign webhook callbacks
     - `downloadAndStoreSignedDocument()`: Retrieves and stores signed contracts
     - `triggerWorkflowIfNeeded()`: Triggers dossier workflow transitions on completion
   - OAuth 2.0 JWT authentication with DocuSign
   - Automatic document retrieval and storage

2. **ContractTemplateService** (`backend/src/main/java/com/example/backend/service/ContractTemplateService.java`)
   - Manages PDF template upload and storage
   - Template activation/deactivation
   - Template retrieval by type and organization

#### Controllers

1. **ESignatureController** (`backend/src/main/java/com/example/backend/controller/ESignatureController.java`)
   - REST API endpoints:
     - `POST /api/v1/esignature/signature-requests`: Create signature request
     - `POST /api/v1/esignature/signature-requests/{id}/send`: Send for signature
     - `GET /api/v1/esignature/signature-requests/dossier/{dossierId}`: Get requests by dossier
     - `POST /api/v1/esignature/webhook`: DocuSign webhook callback
     - `POST /api/v1/esignature/templates`: Upload contract template
     - `GET /api/v1/esignature/templates`: Get active templates

#### Database Schema

Migration: `backend/src/main/resources/db/migration/V113__Add_esignature_system.sql`

Tables:
- `contract_template`: Stores template metadata and file references
- `signature_request`: Tracks signature workflows with full audit trail

Indexes:
- Organization and status-based indexes for efficient querying
- Envelope ID index for webhook processing
- Expiration index for automated cleanup

### Frontend Components

#### Models

**esignature.models.ts** (`frontend/src/app/models/esignature.models.ts`)
- TypeScript interfaces and enums matching backend DTOs
- `SignatureRequest`, `SignatureRequestCreate`, `ContractTemplate`, `SignerInfo`

#### Services

**ESignatureApiService** (`frontend/src/app/services/esignature-api.service.ts`)
- HTTP client for all eSignature API calls
- Automatic organization/user context injection via headers

#### Components

1. **ContractTemplateComponent** (`frontend/src/app/components/contract-template.component.ts`)
   - Admin interface for managing contract templates
   - PDF file upload with validation
   - Template listing with metadata
   - Template activation/deactivation

2. **SignatureStatusTrackerComponent** (`frontend/src/app/components/signature-status-tracker.component.ts`)
   - Visual workflow tracker showing signature progress
   - Real-time status updates with auto-refresh
   - Step visualization: Sent → Viewed → Signed → Completed
   - Displays signer information and timestamps
   - Shows declined/voided reasons
   - Download links for signed documents and certificates

3. **SignatureRequestDialogComponent** (`frontend/src/app/components/signature-request-dialog.component.ts`)
   - Modal dialog for creating signature requests
   - Template selection
   - Multiple signer support with routing order
   - Email subject/message customization
   - Expiration configuration

## Workflow Integration

### Dossier Status Transition

When a signature is completed, the system automatically:
1. Downloads signed document from DocuSign
2. Stores document in `DocumentEntity` with category `SIGNED_CONTRACT`
3. Downloads signing certificate
4. Triggers workflow transition: QUALIFIED → APPOINTMENT
5. Records transition in `DossierStatusHistory`

### Audit Trail

Complete audit trail stored in JSON format:
- All DocuSign webhook events
- Status transitions with timestamps
- Signer actions (viewed, signed, declined)
- Certificate information for legal compliance

## Configuration

### DocuSign Settings

Add to `application.yml`:

```yaml
docusign:
  integration-key: ${DOCUSIGN_INTEGRATION_KEY}
  user-id: ${DOCUSIGN_USER_ID}
  account-id: ${DOCUSIGN_ACCOUNT_ID}
  base-path: https://demo.docusign.net/restapi  # Use production URL in prod
  oauth-base-path: account-d.docusign.com       # Use account.docusign.com in prod
  private-key-path: ${DOCUSIGN_PRIVATE_KEY_PATH}
```

### Environment Variables

```bash
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_PRIVATE_KEY_PATH=/path/to/private.key
```

### Webhook Configuration

Configure DocuSign Connect webhook:
- URL: `https://your-domain.com/api/v1/esignature/webhook`
- Events:
  - envelope-sent
  - envelope-delivered
  - recipient-viewing
  - recipient-signed
  - envelope-completed
  - envelope-declined
  - envelope-voided

## Usage

### Template Upload (Admin)

1. Navigate to Contract Templates admin page
2. Click "Upload New Template"
3. Select template type (MANDATE, PURCHASE_AGREEMENT, etc.)
4. Choose PDF file
5. Add description
6. Upload template

### Sending Contract for Signature

1. From dossier detail page, click "Request Signature"
2. Select contract template
3. Add signers with name and email
4. Customize email subject/message
5. Set expiration (default: 30 days)
6. Click "Create & Send"

### Tracking Signature Progress

The SignatureStatusTrackerComponent automatically displays:
- Current status with visual indicators
- Progress through workflow steps
- Timestamps for each action
- Signer information
- Download links when completed

## Security Features

1. **Certificate Validation**: All signed documents include DocuSign certificate
2. **Audit Trail**: Complete event history stored in database
3. **Secure Storage**: Signed documents stored with access controls
4. **OAuth 2.0 JWT**: Secure authentication with DocuSign
5. **Multi-tenant**: Organization-level isolation of all data

## Legal Compliance

The implementation includes:
- Complete audit trail for all signature events
- Certificate of completion from DocuSign
- Tamper-evident seals on signed documents
- Timestamp verification
- Signer authentication logs
- Compliant with eIDAS, ESIGN Act, and UETA

## Testing

### Local Testing

For local development without DocuSign:
1. Mock DocuSign API responses in tests
2. Use test templates without actual PDF processing
3. Simulate webhook events for status transitions

### Integration Testing

1. Configure DocuSign demo/sandbox account
2. Upload test templates
3. Create signature requests with test email addresses
4. Verify webhook processing
5. Test document download and storage

## Future Enhancements

1. **Advanced Signature Fields**
   - Custom field positioning in PDFs
   - Initial here tabs
   - Date signed fields
   - Checkbox agreements

2. **Template Variables**
   - Dynamic field replacement (names, addresses, dates)
   - Pre-fill from dossier data

3. **Bulk Signing**
   - Send multiple contracts at once
   - Batch status tracking

4. **Mobile Signing**
   - SMS notifications
   - Mobile-optimized signing experience

5. **Alternative Providers**
   - Adobe Sign integration
   - HelloSign/Dropbox Sign
   - Provider abstraction layer

## Dependencies

### Backend
- `docusign-esign-java:4.3.0` - DocuSign Java SDK

### Frontend
- Angular Material components
- RxJS for reactive programming
- HTTP client for API calls

## Migration

The database migration `V113__Add_esignature_system.sql` creates:
- 2 tables with proper relationships
- 9 indexes for query optimization
- Foreign key constraints for data integrity
- Support for both H2 (testing) and PostgreSQL (production)

## Troubleshooting

### Webhook Not Received
- Verify DocuSign Connect configuration
- Check webhook URL is publicly accessible
- Review application logs for errors

### Document Not Downloaded
- Verify DocuSign API credentials
- Check envelope status in DocuSign console
- Ensure proper OAuth token refresh

### Status Not Updating
- Check webhook payload format
- Verify envelope ID matching
- Review audit trail in database

## API Examples

### Create Signature Request

```bash
curl -X POST http://localhost:8080/api/v1/esignature/signature-requests \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: default" \
  -H "X-User-Id: user@example.com" \
  -d '{
    "dossierId": 123,
    "templateId": 1,
    "subject": "Please sign the mandate agreement",
    "emailMessage": "Review and sign the attached contract.",
    "signers": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "routingOrder": 1
      }
    ],
    "expirationDays": 30
  }'
```

### Get Signature Requests by Dossier

```bash
curl -X GET http://localhost:8080/api/v1/esignature/signature-requests/dossier/123 \
  -H "X-Org-Id: default"
```

## Conclusion

This implementation provides a complete electronic signature solution integrated with the dossier workflow, offering:
- Full lifecycle tracking
- Legal compliance
- Audit trail
- Automated workflow triggers
- User-friendly interfaces for both admins and end users
