# API Versioning Implementation Summary

## Overview

This document describes the comprehensive API versioning strategy implemented for the backend application, providing backward compatibility while introducing enhanced v2 endpoints.

## Components Implemented

### 1. Core Infrastructure

#### ApiVersionRequestMappingHandlerMapping
**Location:** `backend/src/main/java/com/example/backend/config/ApiVersionRequestMappingHandlerMapping.java`

Custom Spring MVC handler mapping that enables URL-based API versioning through annotations.

**Features:**
- Processes `@ApiVersion` annotations on controllers
- Automatically maps endpoints to versioned paths
- Supports multiple API versions simultaneously

#### ApiVersion Annotation
**Location:** `backend/src/main/java/com/example/backend/config/ApiVersion.java`

Annotation for marking controller classes with their API version.

**Usage:**
```java
@RestController
@ApiVersion("v2")
public class DossierControllerV2 {
    // endpoints automatically mapped to /api/v2/*
}
```

#### Deprecated Annotation
**Location:** `backend/src/main/java/com/example/backend/config/Deprecated.java`

Annotation for marking endpoints as deprecated with sunset dates.

**Attributes:**
- `sunsetDate`: Date when the endpoint will be removed
- `deprecationMessage`: Custom message for API consumers

#### DeprecationFilter
**Location:** `backend/src/main/java/com/example/backend/filter/DeprecationFilter.java`

Servlet filter that automatically adds HTTP deprecation headers to deprecated endpoints.

**Headers Added:**
- `Deprecation: true`
- `Sunset: <date>`
- `X-API-Warn: <message>`
- `Link: <migration-guide>; rel="deprecation"`

### 2. Version-Specific DTOs

#### V2 Response DTOs
**Location:** `backend/src/main/java/com/example/backend/dto/v2/`

Enhanced response DTOs with structured nested objects:

**DossierResponseV2:**
- `annonce` object: Groups annonce-related fields
- `lead` object: Groups lead contact information
- `audit` object: Groups timestamp and user attribution
- ISO-8601 timestamps with timezone support
- Additional metadata support

**AnnonceResponseV2:**
- `location` object: Groups address, city, postal code, country
- `details` object: Groups surface, rooms, bedrooms, bathrooms
- `pricing` object: Groups amount, currency, pricePerSqm (calculated)
- `audit` object: Groups timestamp and user attribution
- ISO-8601 timestamps with timezone support

**PartiePrenanteResponseV2:**
- Simplified response with ISO-8601 timestamps
- Consistent with other v2 DTOs

#### V2 Mappers
**Location:** `backend/src/main/java/com/example/backend/dto/v2/`

Mappers convert internal entities to v2 response DTOs:

**DossierMapperV2:**
- Maps flat entity to nested v2 structure
- Converts LocalDateTime to ISO-8601 Instant
- Loads related annonce data for nested object
- Handles null-safety for optional relationships

**AnnonceMapperV2:**
- Maps flat entity to nested v2 structure
- Calculates `pricePerSqm` automatically
- Converts LocalDateTime to ISO-8601 Instant
- Structures location, details, and pricing objects

**PartiePrenanteMapperV2:**
- Simple mapper with timestamp conversion
- Consistent formatting with other v2 mappers

### 3. V2 Controllers

#### DossierControllerV2
**Location:** `backend/src/main/java/com/example/backend/controller/v2/DossierControllerV2.java`

V2 implementation of dossiers API with enhanced responses.

**Endpoints:**
- `POST /api/v2/dossiers` - Create dossier
- `GET /api/v2/dossiers/{id}` - Get dossier by ID
- `GET /api/v2/dossiers` - List dossiers with pagination
- `PATCH /api/v2/dossiers/{id}/status` - Update status
- `DELETE /api/v2/dossiers/{id}` - Delete dossier

**Key Features:**
- Uses v2 mappers for response transformation
- Maintains same business logic as v1
- Enhanced Swagger documentation
- No deprecation headers

#### AnnonceControllerV2
**Location:** `backend/src/main/java/com/example/backend/controller/v2/AnnonceControllerV2.java`

V2 implementation of annonces API with structured responses.

**Endpoints:**
- `POST /api/v2/annonces` - Create annonce
- `GET /api/v2/annonces/{id}` - Get annonce by ID
- `PUT /api/v2/annonces/{id}` - Update annonce
- `GET /api/v2/annonces` - List annonces with pagination
- `GET /api/v2/annonces/cities` - Get distinct cities
- `DELETE /api/v2/annonces/{id}` - Delete annonce

**Key Features:**
- Structured nested responses
- Automatic pricePerSqm calculation
- Enhanced location and pricing data
- No deprecation headers

### 4. Service Layer Enhancements

#### Added Methods to DossierService
```java
public Dossier findEntityById(Long id)
public Page<Dossier> findAll(DossierStatus status, String leadPhone, Long annonceId, Pageable pageable)
```

#### Added Methods to AnnonceService
```java
public Annonce findEntityById(Long id)
public Page<Annonce> findAll(AnnonceStatus status, String q, String city, String type, Pageable pageable)
```

**Purpose:** Enable v2 controllers to retrieve entity objects for transformation to v2 DTOs while maintaining existing v1 logic.

### 5. V1 Deprecation Markers

#### Updated V1 Controllers
Both `DossierController` and `AnnonceController` now include:
- `@Deprecated` annotation with sunset date
- Updated Swagger documentation noting deprecation
- Automatic deprecation header responses via filter

### 6. OpenAPI Configuration

#### OpenApiConfig
**Location:** `backend/src/main/java/com/example/backend/config/OpenApiConfig.java`

Configures Swagger UI with separate API groups:

**API Groups:**
- **v1-deprecated:** All `/api/v1/**` endpoints
- **v2-current:** All `/api/v2/**` endpoints
- **all:** Combined view of all endpoints

**Features:**
- Separate documentation for each version
- Clear labeling of current vs deprecated
- Server configuration for local and production
- Contact and license information

**Access URLs:**
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- v1 Spec: `http://localhost:8080/v3/api-docs/v1-deprecated`
- v2 Spec: `http://localhost:8080/v3/api-docs/v2-current`

### 7. Migration Documentation

#### API Migration Guide
**Location:** `docs/API_MIGRATION_V1_TO_V2.md`

Comprehensive guide covering:
- Breaking changes summary
- Timestamp format changes
- Structured response examples
- Endpoint mapping table
- Code migration examples (JavaScript, Java, Python)
- Testing strategies
- Benefits of v2
- FAQ section

### 8. Integration Tests

#### ApiVersioningIntegrationTest
**Location:** `backend/src/test/java/com/example/backend/ApiVersioningIntegrationTest.java`

Comprehensive test suite verifying:
- V1 endpoints continue to work with flat structure
- V2 endpoints return nested structure
- Deprecation headers present only on v1
- Both versions access same underlying data
- ISO-8601 timestamp format in v2
- Backward compatibility maintained
- Response structure differences

**Test Coverage:**
- ✅ V1 dossiers flat structure
- ✅ V2 dossiers nested structure
- ✅ V1 annonces flat structure
- ✅ V2 annonces nested structure
- ✅ Same resource accessible via both APIs
- ✅ ISO-8601 timestamp validation
- ✅ Deprecation header validation

## Breaking Changes

### 1. Response Structure
**v1:** Flat objects with all fields at root level
**v2:** Nested objects grouping related fields

### 2. Timestamps
**v1:** `LocalDateTime` (e.g., `2024-01-15T10:30:00`)
**v2:** `Instant` with timezone (e.g., `2024-01-15T10:30:00Z`)

### 3. Field Locations
Many fields moved to nested objects - see migration guide for details.

## Backward Compatibility

✅ **Maintained:**
- V1 endpoints fully functional
- Same request body formats
- Same business logic
- Same validation rules
- Same authentication/authorization
- Same rate limits

⚠️ **Changed:**
- Response structure (v2 only)
- Timestamp format (v2 only)

## Timeline

- **v2 Launch:** 2024-01-15
- **v1 Deprecation:** 2025-06-30 (headers start appearing)
- **v1 Sunset:** 2025-12-31 (v1 endpoints removed)

## Usage Recommendations

### For New Projects
Use v2 endpoints exclusively:
- Better structured data
- Future-proof
- Enhanced features
- No deprecation warnings

### For Existing Projects
Migrate gradually:
1. Add v2 endpoint support alongside v1
2. Test both versions in parallel
3. Monitor deprecation headers
4. Complete migration before sunset date

### For API Consumers
Watch for deprecation headers in responses:
- `Deprecation: true`
- `Sunset: 2025-12-31`
- `X-API-Warn: <message>`
- `Link: <migration-guide>`

## Implementation Notes

### Design Decisions

1. **URL Versioning:** Chosen over header-based versioning for simplicity and cache-ability
2. **Nested Objects:** Improves organization and allows future enhancements
3. **ISO-8601 Timestamps:** Standard format with timezone support
4. **Separate DTOs:** Decouples internal entities from API contracts
5. **Separate Controllers:** Clean separation, easier maintenance

### Performance Considerations

- **Minimal Overhead:** V2 mappers add negligible transformation time
- **Same Database Queries:** Both versions use identical service layer
- **No Duplication:** Entity objects shared between versions
- **Efficient Serialization:** Jackson handles nested objects efficiently

### Future Enhancements

The new structure allows easy addition of:
- Pagination metadata in responses
- HATEOAS links
- Additional nested objects
- Computed fields
- Partial response support (field filtering)

## Maintenance

### Adding New Fields

**To v1 (if necessary):**
Add to existing response DTO - maintains flat structure

**To v2:**
Add to appropriate nested object - maintains organization

### Deprecating Additional Endpoints

1. Add `@Deprecated` annotation
2. Update Swagger documentation
3. DeprecationFilter automatically adds headers
4. Document in migration guide

### Version Sunset Process

When removing v1:
1. Update all controllers to return HTTP 410 Gone
2. Keep endpoints mapped for error messages
3. Provide migration guide link in error response
4. Monitor analytics for remaining v1 usage

## Conclusion

This implementation provides a robust, maintainable API versioning strategy that:
- ✅ Maintains backward compatibility
- ✅ Enables gradual migration
- ✅ Improves API structure
- ✅ Supports future enhancements
- ✅ Follows industry best practices
- ✅ Includes comprehensive documentation
- ✅ Has thorough test coverage
