# Testing Flyway Configuration After H2 Refactoring

## Quick Start

To test the Flyway configuration with H2 after refactoring:

```bash
cd backend
mvn clean verify -Pbackend-e2e-h2
```

## What This Tests

The `backend-e2e-h2` Maven profile activates:
- `backend-e2e` - Base E2E configuration
- `backend-e2e-h2` - H2-specific configuration

### Test Execution Flow

1. **Configuration Loading**
   - `application.yml` (base configuration)
   - `application-backend-e2e.yml` (E2E base settings)
   - `application-backend-e2e-h2.yml` (H2-specific settings)

2. **Database Initialization**
   - H2 in-memory database starts in PostgreSQL compatibility mode
   - Connection: `jdbc:h2:mem:e2edb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`

3. **Flyway Migration Execution**
   - Location: `classpath:db/migration,classpath:db/e2e`
   - Placeholder: `json_type=JSON`
   - Migrations V1 through V37+ execute sequentially

4. **Test Execution**
   - `FlywayMigrationBackendE2ETest` validates migration success
   - Other E2E tests verify application functionality

## Validation Checklist

The test suite verifies:

### ✓ Migration Execution
- [ ] All migrations V1-V37+ execute successfully
- [ ] No SQL syntax errors occur
- [ ] Migration order is correct (sequential)

### ✓ Configuration
- [ ] Flyway uses `json_type=JSON` placeholder
- [ ] Flyway locations do NOT include `migration-h2` directory
- [ ] Flyway locations include `db/migration` and `db/e2e`

### ✓ Database Schema
- [ ] All expected tables are created
- [ ] JSON columns exist (photos_json, rules_json, etc.)
- [ ] JSON columns use correct type (JSON, not JSONB)
- [ ] Indexes are created successfully

### ✓ Flyway Metadata
- [ ] `flyway_schema_history` table exists
- [ ] Migration records are in correct order
- [ ] No baseline migration exists (starts from V1)
- [ ] No failed migrations

## Test Output

### Expected Success Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║ H2 Test Configuration: Configuring Flyway for H2 Database                 ║
╠════════════════════════════════════════════════════════════════════════════╣
║ json_type placeholder: JSON (for H2 compatibility)                         ║
║ Locations: classpath:db/migration,classpath:db/e2e                         ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║ STEP 2: Starting Flyway Database Migrations (H2)                           ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Database: H2 In-Memory (PostgreSQL Mode)                                   ║
║ JSON Type: JSON                                                             ║
╚════════════════════════════════════════════════════════════════════════════╝

  → Executing Migration #1: V1 - Initial_schema
  ✓ Migration completed successfully
  → Executing Migration #2: V2 - Add_jsonb_and_missing_columns
  ✓ Migration completed successfully
  ...
  → Executing Migration #37: V37 - Add_smart_suggestions
  ✓ Migration completed successfully

╔════════════════════════════════════════════════════════════════════════════╗
║ Flyway Migrations Completed Successfully (H2)                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Total Migrations: 37+                                                       ║
╚════════════════════════════════════════════════════════════════════════════╝

[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Checking Specific Test

To run only the Flyway migration test:

```bash
mvn test -Pbackend-e2e-h2 -Dtest=FlywayMigrationBackendE2ETest
```

## Troubleshooting

### Issue: "Unknown data type: JSONB"

**Cause**: Migration file contains hardcoded `JSONB` instead of `${json_type}` placeholder.

**Solution**: 
1. Locate the migration file with the error
2. Replace `JSONB` with `${json_type}`
3. Ensure the file is in `db/migration` (not `db/migration-h2`)

### Issue: "Migration checksum mismatch"

**Cause**: Migration file was modified after initial execution.

**Solution**:
1. This is expected during development if migrations were updated
2. H2 uses in-memory database, so restart test to clear state
3. For production, create a new migration instead of modifying existing ones

### Issue: "Flyway locations include migration-h2"

**Cause**: Configuration still references old `migration-h2` directory.

**Solution**:
1. Check `application-backend-e2e-h2.yml`
2. Ensure `locations` does NOT include `classpath:db/migration-h2`
3. Should only include: `classpath:db/migration,classpath:db/e2e`

### Issue: Tests pass but schema_version shows wrong order

**Cause**: Migration version numbers are not sequential.

**Solution**:
1. Verify no V200+ migrations exist in `db/migration`
2. All migrations should be V1, V2, V3, ... V37, V38, V39, etc.
3. Check `flyway_schema_history` table: 
   ```sql
   SELECT version, description, installed_rank 
   FROM flyway_schema_history 
   ORDER BY installed_rank;
   ```

## Comparison: H2 vs PostgreSQL

| Aspect | H2 Profile | PostgreSQL Profile |
|--------|-----------|-------------------|
| Database | In-memory (fast) | Testcontainers (slower, realistic) |
| JSON Type | JSON | JSONB |
| Placeholder | `json_type=JSON` | `json_type=JSONB` |
| Command | `mvn verify -Pbackend-e2e-h2` | `mvn verify -Pbackend-e2e-postgres` |
| Docker Required | No | Yes |
| Use Case | Fast feedback, CI/CD | Production-like testing |

## Next Steps

After successful H2 testing:

1. **Run PostgreSQL Tests**
   ```bash
   mvn clean verify -Pbackend-e2e-postgres
   ```

2. **Verify Schema Consistency**
   - Compare table structures between H2 and PostgreSQL
   - Ensure indexes are created correctly
   - Validate constraints are enforced

3. **Clean Up Deprecated Directories**
   ```bash
   # Optional: Remove migration-h2 directory
   rm -rf backend/src/main/resources/db/migration-h2
   ```

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run H2 E2E Tests
  run: mvn clean verify -Pbackend-e2e-h2
  
- name: Run PostgreSQL E2E Tests
  run: mvn clean verify -Pbackend-e2e-postgres
```

## References

- [Flyway H2 Refactoring Documentation](src/main/resources/db/migration/FLYWAY_H2_REFACTORING.md)
- [AGENTS.md](../AGENTS.md) - Full project testing guide
- [Flyway Documentation](https://flywaydb.org/documentation/)
