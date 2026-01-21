# Quick Reference: Status Codes and Case Types

## API Quick Reference

### Get Allowed Status Codes
```http
GET /api/v1/dossiers/allowed-status-codes?caseType=CRM_LEAD_BUY
```

### Create Dossier with Status Code
```http
POST /api/v1/dossiers
Content-Type: application/json

{
  "caseType": "CRM_LEAD_BUY",
  "statusCode": "CRM_NEW",
  "leadName": "John Doe",
  "leadPhone": "+33612345678",
  "source": "WEB"
}
```

### Update Status Code
```http
PATCH /api/v1/dossiers/{id}/status
Content-Type: application/json

{
  "status": "QUALIFIED",
  "statusCode": "CRM_QUALIFIED",
  "userId": "user123",
  "reason": "Client qualified after call"
}
```

## Common Case Types

| Code | Label | Description |
|------|-------|-------------|
| `CRM_LEAD_BUY` | Prospect Achat | Lead for property purchase |
| `CRM_LEAD_RENT` | Prospect Location | Lead for property rental |
| `CRM_OWNER_LEAD` | Prospect Propriétaire | Owner lead (sell/rent) |
| `CRM_SALE_TRANSACTION` | Transaction Vente | Sale transaction |
| `CRM_RENTAL_TRANSACTION` | Transaction Location | Rental transaction |

## Common Status Codes

| Code | Label | Description |
|------|-------|-------------|
| `CRM_NEW` | Nouveau | New case |
| `CRM_TRIAGED` | Trié | Triaged |
| `CRM_CONTACTED` | Contacté | Contacted |
| `CRM_UNREACHABLE` | Injoignable | Unreachable |
| `CRM_QUALIFIED` | Qualifié | Qualified |
| `CRM_DISQUALIFIED` | Disqualifié | Disqualified |
| `CRM_ON_HOLD` | En attente | On hold |
| `CRM_VISIT_PLANNED` | Visite planifiée | Visit planned |
| `CRM_VISIT_DONE` | Visite effectuée | Visit done |
| `CRM_NO_SHOW` | Absent | No show |
| `CRM_FOLLOW_UP` | Relance | Follow up |
| `CRM_OFFER_REQUESTED` | Offre demandée | Offer requested |
| `CRM_OFFER_RECEIVED` | Offre reçue | Offer received |
| `CRM_NEGOTIATION` | Négociation | Negotiation |
| `CRM_SIGNING_SCHEDULED` | Signature planifiée | Signing scheduled |
| `CRM_CLOSED_WON` | Gagné | Closed won |
| `CRM_CLOSED_LOST` | Perdu | Closed lost |

## Legacy Status Codes (Backward Compatibility)

| Code | Enum Equivalent | Label |
|------|----------------|-------|
| `NEW` | `DossierStatus.NEW` | Nouveau (Legacy) |
| `QUALIFYING` | `DossierStatus.QUALIFYING` | Qualification (Legacy) |
| `QUALIFIED` | `DossierStatus.QUALIFIED` | Qualifié (Legacy) |
| `APPOINTMENT` | `DossierStatus.APPOINTMENT` | Rendez-vous (Legacy) |
| `WON` | `DossierStatus.WON` | Gagné (Legacy) |
| `LOST` | `DossierStatus.LOST` | Perdu (Legacy) |
| `DRAFT` | `DossierStatus.DRAFT` | Brouillon (Legacy) |

## Validation Rules Cheat Sheet

### ✅ Valid Combinations
```json
// Case type with matching status code
{
  "caseType": "CRM_LEAD_BUY",
  "statusCode": "CRM_NEW"
}

// No case type (generic dossier)
{
  "statusCode": "CRM_NEW"
}

// Case type with legacy status code
{
  "caseType": "CRM_LEAD_BUY",
  "statusCode": "NEW"
}

// Backward compatible (enum only)
{
  "status": "NEW"
}
```

### ❌ Invalid Combinations
```json
// Non-existent case type
{
  "caseType": "INVALID_TYPE",
  "statusCode": "CRM_NEW"
}

// Non-existent status code
{
  "caseType": "CRM_LEAD_BUY",
  "statusCode": "INVALID_STATUS"
}

// Status code not allowed for case type (if workflow is defined)
{
  "caseType": "CRM_LEAD_BUY",
  "statusCode": "CRM_SIGNING_SCHEDULED"  // May not be allowed by workflow
}
```

## Code Snippets

### Java: Create Dossier with Status Code
```java
DossierCreateRequest request = new DossierCreateRequest();
request.setCaseType("CRM_LEAD_BUY");
request.setStatusCode("CRM_NEW");
request.setLeadName("John Doe");
request.setLeadPhone("+33612345678");
request.setSource(DossierSource.WEB);

DossierResponse response = dossierService.create(request);
```

### Java: Get Allowed Status Codes
```java
List<String> allowedCodes = statusCodeValidationService
    .getAllowedStatusCodesForCaseType("CRM_LEAD_BUY");
```

### Java: Validate Status Code
```java
try {
    statusCodeValidationService.validateStatusCodeForCaseType(
        "CRM_LEAD_BUY", "CRM_NEW");
    // Valid
} catch (IllegalArgumentException e) {
    // Invalid - handle error
}
```

### JavaScript: Fetch Allowed Status Codes
```javascript
const response = await fetch(
  '/api/v1/dossiers/allowed-status-codes?caseType=CRM_LEAD_BUY',
  {
    headers: { 'Authorization': 'Bearer ' + token }
  }
);
const allowedCodes = await response.json();
// ["CRM_NEW", "CRM_QUALIFIED", "CRM_CLOSED_WON", ...]
```

### JavaScript: Create Dossier
```javascript
const response = await fetch('/api/v1/dossiers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    caseType: 'CRM_LEAD_BUY',
    statusCode: 'CRM_NEW',
    leadName: 'John Doe',
    leadPhone: '+33612345678',
    source: 'WEB'
  })
});
const dossier = await response.json();
```

## Error Messages

### Invalid Case Type
```
Invalid caseType: 'INVALID_TYPE'. Case type does not exist in CASE_TYPE referential.
```

### Invalid Status Code
```
Invalid statusCode: 'INVALID_CODE'. Status code does not exist in CASE_STATUS referential.
```

### Status Code Not Allowed
```
Invalid statusCode: 'CRM_SIGNING_SCHEDULED' for caseType: 'CRM_LEAD_BUY'. 
Allowed status codes for this case type are: CRM_NEW, CRM_QUALIFIED, CRM_VISIT_PLANNED
```

### Inactive Status Code
```
Invalid statusCode: 'CRM_ARCHIVED'. Status code is not active.
```

## Migration Checklist

### For Existing API Consumers
- [ ] No changes required
- [ ] Continue using `DossierStatus` enum
- [ ] Optionally adopt `statusCode` for new features

### For New Implementations
- [ ] Set `caseType` for workflow-driven dossiers
- [ ] Set `statusCode` explicitly
- [ ] Use `/allowed-status-codes` endpoint for UI dropdowns
- [ ] Handle validation errors gracefully

### For Backend Developers
- [ ] Import `DossierStatusCodeValidationService` when needed
- [ ] Call validation before persisting dossiers
- [ ] Use `deriveStatusCodeFromEnumStatus()` for compatibility
- [ ] Add unit tests for validation logic

## Best Practices

1. **Always provide case type** for workflow-driven dossiers
2. **Fetch allowed status codes** before showing UI dropdowns
3. **Handle validation errors** with user-friendly messages
4. **Use explicit status codes** rather than relying on defaults
5. **Keep legacy enum** for backward compatibility
6. **Test both approaches** (enum and referential)

## Troubleshooting

### Problem: Status code validation fails
**Solution**: Check if status code exists in referential and is active

### Problem: Status code not allowed for case type
**Solution**: Check workflow definitions for the case type

### Problem: Case type validation fails
**Solution**: Verify case type exists in CASE_TYPE referential

### Problem: Null status code in response
**Solution**: Check if dossier has `status` enum set (fallback mechanism)

## Support

For issues or questions:
1. Check `backend/docs/REFERENTIAL_STATUS_SYSTEM.md` for detailed documentation
2. Check `backend/docs/IMPLEMENTATION_SUMMARY.md` for technical details
3. Review workflow definitions in database
4. Check seeded referentials (V15 and V27 migrations)
