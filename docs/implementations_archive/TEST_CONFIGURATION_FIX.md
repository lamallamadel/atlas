# Test Configuration Fix - Database Type Compatibility

## Problem

Backend tests were failing with 345 errors on PostgreSQL and 234 errors on H2 due to incorrect Flyway placeholder configuration for the `json_type` parameter.

## Root Cause

1. **Missing Flyway Configuration**: The profile-specific configuration files (`application-backend-e2e-h2.yml` and `application-backend-e2e-postgres.yml`) were missing Flyway placeholder configuration.

2. **Profile Activation Mismatch**: The Maven profiles were activating incorrect Spring profiles:
   - H2 profile was activating `spring.profiles.active=test` 
   - PostgreSQL profile was activating `spring.profiles.active=e2e-postgres`
   - But the YAML files were named for profiles `backend-e2e-h2` and `backend-e2e-postgres`

3. **Incomplete Configuration**: The profile-specific files were missing security, management, and logging configurations that were present in the base file.

## Solution

### 1. Added Flyway Placeholder Configuration

**File: `backend/src/test/resources/application-backend-e2e-h2.yml`**
- Added Flyway configuration with `json_type: JSON` (H2 uses JSON, not JSONB)

**File: `backend/src/test/resources/application-backend-e2e-postgres.yml`**
- Added Flyway configuration with `json_type: JSONB` (PostgreSQL uses JSONB)

### 2. Fixed Maven Profile Activation

**File: `backend/pom.xml`**
- Changed H2 profile: `spring.profiles.active=backend-e2e,backend-e2e-h2`
- Changed PostgreSQL profile: `spring.profiles.active=backend-e2e,backend-e2e-postgres`

This ensures both the base configuration (`backend-e2e`) and the database-specific configuration are loaded.

### 3. Added Missing Configuration Sections

Both profile-specific files now include:
- Security configuration (OAuth2 mock JWT)
- Task scheduling configuration (disabled)
- Management endpoints configuration
- Health check configuration (Elasticsearch and Mail disabled)
- Logging configuration

## Database Type Parameter Usage

The `${json_type}` placeholder is used in Flyway migrations to handle the difference between H2 and PostgreSQL:

- **H2**: Uses `JSON` type
- **PostgreSQL**: Uses `JSONB` type

### Migration Files Using `${json_type}`:

1. `V2__Add_jsonb_and_missing_columns.sql`:
   - `annonce.photos_json`
   - `annonce.rules_json`
   - `partie_prenante.meta_json`
   - `consentement.meta_json`
   - `audit_event.diff_json`

2. `V3__Complete_schema_and_constraints.sql`:
   - `annonce.meta_json`

3. `V6__Add_notification_system.sql`:
   - `notification.variables`

## Configuration Hierarchy

The Spring profile loading now works as follows:

1. **Base Profile** (`application-backend-e2e.yml`):
   - Default `json_type: JSONB`
   - Security, management, logging, task scheduling settings
   - Loaded for all E2E tests

2. **H2-Specific Profile** (`application-backend-e2e-h2.yml`):
   - Overrides `json_type: JSON`
   - H2 datasource configuration
   - H2 dialect and settings
   - Loaded when Maven profile `backend-e2e-h2` is active

3. **PostgreSQL-Specific Profile** (`application-backend-e2e-postgres.yml`):
   - Overrides `json_type: JSONB`
   - PostgreSQL datasource configuration
   - PostgreSQL dialect and settings
   - Loaded when Maven profile `backend-e2e-postgres` is active

## Files Changed

1. **backend/pom.xml**
   - Updated `spring.profiles.active` for both Maven profiles
   - Changed from single profile to comma-separated list

2. **backend/src/test/resources/application-backend-e2e-h2.yml**
   - Added Flyway configuration with `json_type: JSON`
   - Added security configuration
   - Added management configuration
   - Added logging configuration
   - Added task scheduling configuration

3. **backend/src/test/resources/application-backend-e2e-postgres.yml**
   - Added Flyway configuration with `json_type: JSONB`
   - Added security configuration
   - Added management configuration
   - Added logging configuration
   - Added task scheduling configuration

## Testing

To verify the fix:

### H2 Tests
```bash
cd backend
.\mvn-java17.cmd verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-h2
```

Expected: All tests pass, Flyway migrations execute with JSON type

### PostgreSQL Tests
```bash
cd backend
mvn verify -s .\settings.xml -t .\toolchains.xml -Pbackend-e2e-postgres
```

Expected: All tests pass, Flyway migrations execute with JSONB type

## Verification Checklist

- [x] Flyway placeholder `json_type` configured for H2 (JSON)
- [x] Flyway placeholder `json_type` configured for PostgreSQL (JSONB)
- [x] Maven profiles activate correct Spring profiles
- [x] Security configuration present in both profiles
- [x] Management configuration present in both profiles
- [x] Logging configuration present in both profiles
- [x] PostgresTestContainerConfig uses correct profile name
- [x] @BackendE2ETest annotation uses base profile
- [x] Profile hierarchy loads correctly (base + specific)

## Expected Results

After this fix:
- ✅ H2 tests should pass with 0 failures (was 234 failures)
- ✅ PostgreSQL tests should pass with 0 failures (was 345 failures)
- ✅ Flyway migrations execute correctly with appropriate JSON type
- ✅ All database-dependent tests work on both databases

## Additional Notes

- The base profile (`application-backend-e2e.yml`) has `json_type: JSONB` as default
- Profile-specific files override this value when loaded
- H2 runs in PostgreSQL compatibility mode for better compatibility
- Both databases now use the same migration scripts with dynamic type resolution
