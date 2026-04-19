# API Migration Guide: v1 to v2

## Overview

API v2 introduces significant improvements to response structure, timestamp handling, and data organization. This guide will help you migrate from v1 to v2.

**Important Dates:**
- **v2 Launch:** 2024-01-15
- **v1 Deprecation:** 2025-06-30
- **v1 Sunset:** 2025-12-31

## Breaking Changes Summary

### 1. Timestamps Changed from LocalDateTime to ISO-8601 Instant

**v1:**
```json
{
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T14:20:00"
}
```

**v2:**
```json
{
  "audit": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z",
    "createdBy": "user@example.com",
    "updatedBy": "admin@example.com"
  }
}
```

**Migration Steps:**
- Update timestamp parsing to handle ISO-8601 format with timezone (`Z` suffix)
- Access timestamps via `audit` object instead of root level
- Audit information now includes user attribution (`createdBy`, `updatedBy`)

### 2. Structured Nested Objects

#### Dossiers API

**v1: Flat Structure**
```json
{
  "id": 1,
  "annonceId": 123,
  "annonceTitle": "Beautiful Apartment",
  "leadPhone": "+33612345678",
  "leadName": "John Doe",
  "leadSource": "Website",
  "createdAt": "2024-01-15T10:30:00"
}
```

**v2: Nested Structure**
```json
{
  "id": 1,
  "annonce": {
    "id": 123,
    "title": "Beautiful Apartment",
    "city": "Paris"
  },
  "lead": {
    "phone": "+33612345678",
    "name": "John Doe",
    "source": "Website"
  },
  "audit": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z",
    "createdBy": "user@example.com",
    "updatedBy": "admin@example.com"
  }
}
```

**Migration Steps:**
- Access `annonceId` via `annonce.id`
- Access `annonceTitle` via `annonce.title`
- Access lead information via `lead.*` object
- Access timestamps via `audit.*` object

#### Annonces API

**v1: Flat Structure**
```json
{
  "id": 123,
  "title": "Beautiful Apartment",
  "address": "123 Main Street",
  "city": "Paris",
  "price": 450000.00,
  "currency": "EUR",
  "surface": 85.5,
  "createdAt": "2024-01-15T10:30:00"
}
```

**v2: Nested Structure**
```json
{
  "id": 123,
  "title": "Beautiful Apartment",
  "location": {
    "address": "123 Main Street",
    "city": "Paris",
    "postalCode": "75001",
    "countryCode": "FR"
  },
  "details": {
    "surface": 85.5,
    "rooms": 4,
    "bedrooms": 3,
    "bathrooms": 2
  },
  "pricing": {
    "amount": 450000.00,
    "currency": "EUR",
    "pricePerSqm": 5263.16
  },
  "audit": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z",
    "createdBy": "agent@example.com",
    "updatedBy": "agent@example.com"
  }
}
```

**Migration Steps:**
- Access location data via `location.*` object
- Access property details via `details.*` object
- Access pricing data via `pricing.*` object
- **New:** `pricePerSqm` automatically calculated
- Access timestamps via `audit.*` object

## Endpoint Mapping

### Dossiers

| v1 Endpoint | v2 Endpoint | Changes |
|-------------|-------------|---------|
| `POST /api/v1/dossiers` | `POST /api/v2/dossiers` | Response structure changed |
| `GET /api/v1/dossiers/{id}` | `GET /api/v2/dossiers/{id}` | Response structure changed |
| `GET /api/v1/dossiers` | `GET /api/v2/dossiers` | Response structure changed |
| `PATCH /api/v1/dossiers/{id}/status` | `PATCH /api/v2/dossiers/{id}/status` | Response structure changed |
| `DELETE /api/v1/dossiers/{id}` | `DELETE /api/v2/dossiers/{id}` | No changes |

### Annonces

| v1 Endpoint | v2 Endpoint | Changes |
|-------------|-------------|---------|
| `POST /api/v1/annonces` | `POST /api/v2/annonces` | Response structure changed |
| `GET /api/v1/annonces/{id}` | `GET /api/v2/annonces/{id}` | Response structure changed |
| `PUT /api/v1/annonces/{id}` | `PUT /api/v2/annonces/{id}` | Response structure changed |
| `GET /api/v1/annonces` | `GET /api/v2/annonces` | Response structure changed |
| `GET /api/v1/annonces/cities` | `GET /api/v2/annonces/cities` | No changes |
| `DELETE /api/v1/annonces/{id}` | `DELETE /api/v2/annonces/{id}` | No changes |

## Request Body Compatibility

✅ **Good News:** Request bodies remain unchanged between v1 and v2. Only response structures are affected.

- `DossierCreateRequest` - Same for both versions
- `AnnonceCreateRequest` - Same for both versions
- `AnnonceUpdateRequest` - Same for both versions
- `DossierStatusPatchRequest` - Same for both versions

## Code Migration Examples

### JavaScript/TypeScript

**v1 Code:**
```typescript
// Accessing dossier data
const dossierTitle = response.annonceTitle;
const leadPhone = response.leadPhone;
const createdDate = new Date(response.createdAt);
```

**v2 Code:**
```typescript
// Accessing dossier data with nested structure
const dossierTitle = response.annonce?.title;
const leadPhone = response.lead.phone;
const createdDate = new Date(response.audit.createdAt);
```

### Java

**v1 Code:**
```java
// Accessing dossier data
String title = response.getAnnonceTitle();
String phone = response.getLeadPhone();
LocalDateTime created = response.getCreatedAt();
```

**v2 Code:**
```java
// Accessing dossier data with nested structure
String title = response.getAnnonce() != null ? 
    response.getAnnonce().getTitle() : null;
String phone = response.getLead().getPhone();
Instant created = response.getAudit().getCreatedAt();
```

### Python

**v1 Code:**
```python
# Accessing annonce data
title = response['title']
city = response['city']
price = response['price']
created = datetime.fromisoformat(response['createdAt'])
```

**v2 Code:**
```python
# Accessing annonce data with nested structure
title = response['title']
city = response['location']['city']
price = response['pricing']['amount']
price_per_sqm = response['pricing']['pricePerSqm']
created = datetime.fromisoformat(response['audit']['createdAt'])
```

## Testing Your Migration

### 1. Run Requests in Parallel

During migration, test both v1 and v2 endpoints with the same data:

```bash
# v1 request
curl https://api.example.com/api/v1/dossiers/123

# v2 request (compare response structure)
curl https://api.example.com/api/v2/dossiers/123
```

### 2. Check HTTP Headers

v1 endpoints return deprecation headers:

```
Deprecation: true
Sunset: Wed, 31 Dec 2025 23:59:59 GMT
X-API-Warn: API v1 is deprecated. Please migrate to /api/v2/dossiers
Link: <https://docs.example.com/api-migration>; rel="deprecation"
```

### 3. Integration Tests

Update your integration tests to validate:
- Nested object access
- ISO-8601 timestamp parsing
- Null safety for optional nested objects

## Benefits of v2

1. **Better Organization:** Related data grouped in nested objects
2. **Timezone Support:** ISO-8601 timestamps with explicit UTC timezone
3. **Enhanced Audit Trail:** User attribution for all create/update operations
4. **Calculated Fields:** Automatic `pricePerSqm` calculation
5. **Future-Proof:** Easier to extend without breaking changes

## Rollback Strategy

If issues arise during migration:

1. **Revert to v1:** Simply change endpoint base path from `/api/v2/` to `/api/v1/`
2. **Monitor Deprecation Headers:** v1 endpoints remain functional until sunset date
3. **Gradual Migration:** Migrate endpoints one at a time, not all at once

## Support

- **Documentation:** [https://docs.example.com/api](https://docs.example.com/api)
- **OpenAPI Spec v1:** [https://api.example.com/v3/api-docs/v1-deprecated](https://api.example.com/v3/api-docs/v1-deprecated)
- **OpenAPI Spec v2:** [https://api.example.com/v3/api-docs/v2-current](https://api.example.com/v3/api-docs/v2-current)
- **Support Email:** support@example.com

## FAQ

**Q: Will v1 continue to work after migration to v2?**
A: Yes, until the sunset date (2025-12-31). Both versions run in parallel.

**Q: Do I need to update request bodies?**
A: No, request bodies remain unchanged. Only response structures are affected.

**Q: Can I mix v1 and v2 in the same application?**
A: Yes, but we recommend migrating all endpoints together for consistency.

**Q: What happens after the sunset date?**
A: v1 endpoints will return HTTP 410 Gone starting January 1, 2026.

**Q: Are there rate limit differences between v1 and v2?**
A: No, rate limits apply equally to both API versions.
