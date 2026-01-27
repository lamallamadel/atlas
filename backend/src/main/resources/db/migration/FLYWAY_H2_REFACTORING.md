# Flyway H2 Refactoring Documentation

## Overview

This document describes the refactoring of Flyway migrations to consolidate H2-specific migrations into the main migration directory using placeholders.

## Background

Previously, the project maintained separate migration directories:
- `db/migration` - Main migrations (PostgreSQL-specific)
- `db/migration-h2` - H2-specific migrations (V200+)

This approach created maintenance overhead and potential inconsistencies.

## Refactoring Changes

### 1. Consolidated Migration Directory

All migrations now reside in `db/migration`. The H2-specific migrations have been:
- **V200__Add_update_column_surface.sql** → **V38__Add_update_column_surface.sql**
- **V201__Add_Index_metadata.sql** → **V39__Add_Index_metadata.sql**

### 2. JSON Type Placeholder

All migrations now use the `${json_type}` placeholder instead of hardcoded `JSONB` or `JSON`:

```sql
-- Old (PostgreSQL-specific)
ALTER TABLE annonce ADD COLUMN photos_json JSONB;

-- New (Database-agnostic)
ALTER TABLE annonce ADD COLUMN photos_json ${json_type};
```

### 3. Configuration

#### PostgreSQL Configuration
```yaml
# application-backend-e2e-postgres.yml or similar
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration,classpath:db/e2e
    placeholders:
      json_type: JSONB
```

#### H2 Configuration
```yaml
# application-backend-e2e-h2.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration,classpath:db/e2e
    placeholders:
      json_type: JSON
```

### 4. Maven Profiles

#### H2 E2E Tests
```bash
mvn clean verify -Pbackend-e2e-h2
```

Activates profiles:
- `backend-e2e` (base configuration)
- `backend-e2e-h2` (H2-specific configuration)

#### PostgreSQL E2E Tests
```bash
mvn clean verify -Pbackend-e2e-postgres
```

Activates profiles:
- `backend-e2e` (base configuration)
- `backend-e2e-postgres` (PostgreSQL-specific configuration with Testcontainers)

## Migration Verification

The `FlywayMigrationBackendE2ETest` class validates:

1. ✓ All migrations V1-V37+ execute successfully
2. ✓ No references to `migration-h2` directory in Flyway locations
3. ✓ Flyway `flyway_schema_history` table shows correct migration order
4. ✓ No SQL syntax errors for JSON types
5. ✓ `json_type` placeholder is correctly configured
6. ✓ JSON columns are created with correct types

## Benefits

1. **Single Source of Truth**: All migrations in one directory
2. **Database Portability**: Easy to support multiple databases
3. **Reduced Maintenance**: No need to maintain parallel migration sets
4. **Clearer Version History**: Sequential version numbers
5. **Test Coverage**: Comprehensive E2E tests validate both H2 and PostgreSQL

## Migration Checklist

When creating new migrations:

- [ ] Use `${json_type}` placeholder instead of hardcoded `JSONB` or `JSON`
- [ ] Test with both H2 and PostgreSQL profiles
- [ ] Place migration in `db/migration` directory (not `db/migration-h2`)
- [ ] Use sequential version numbers
- [ ] Document any database-specific behavior in comments

## Deprecated Directories

- `db/migration-h2` - Contains `.deleted` marker file. Can be safely removed.

## Example Migration Template

```sql
-- V{version}__{description}.sql
-- Description: {what this migration does}
-- Database compatibility: PostgreSQL (JSONB), H2 (JSON)

-- Add JSON column using placeholder
ALTER TABLE my_table ADD COLUMN data_json ${json_type};

-- Add index (database-agnostic)
CREATE INDEX idx_my_table_data ON my_table(data_json);

-- Add constraints
ALTER TABLE my_table ADD CONSTRAINT chk_data_not_null CHECK (data_json IS NOT NULL);
```

## Troubleshooting

### Issue: Migrations fail with "Unknown column type"

**Solution**: Ensure the correct profile is active and `json_type` placeholder is configured.

### Issue: H2 tests fail with JSONB syntax error

**Solution**: Check that no hardcoded `JSONB` references exist in migrations. All should use `${json_type}`.

### Issue: Migration version conflicts

**Solution**: Ensure all migrations are in `db/migration` with sequential version numbers. No V200+ versions should exist.

## References

- Flyway Documentation: https://flywaydb.org/documentation/
- H2 Database JSON Support: https://www.h2database.com/html/datatypes.html#json_type
- PostgreSQL JSONB Type: https://www.postgresql.org/docs/current/datatype-json.html
