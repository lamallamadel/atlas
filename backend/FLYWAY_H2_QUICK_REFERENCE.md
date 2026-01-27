# Flyway H2 Configuration - Quick Reference

## TL;DR

```bash
# Verify setup
cd backend
.\verify-flyway-h2-refactoring.ps1

# Run H2 E2E tests
mvn clean verify -Pbackend-e2e-h2

# Run only Flyway tests
mvn test -Pbackend-e2e-h2 -Dtest=FlywayMigrationBackendE2ETest
```

## Configuration Structure

```
backend/
├── src/main/resources/
│   ├── application-backend-e2e.yml         # Base E2E config
│   ├── application-backend-e2e-h2.yml      # H2: json_type=JSON
│   └── application-backend-e2e-postgres.yml # PostgreSQL: json_type=JSONB
│
├── src/test/java/com/example/backend/
│   ├── config/
│   │   └── H2TestConfiguration.java        # H2 Flyway callbacks
│   └── FlywayMigrationBackendE2ETest.java  # 12 validation tests
│
└── FLYWAY_H2_REFACTORING_SUMMARY.md        # Full documentation
```

## Key Points

| Aspect | Value |
|--------|-------|
| **H2 JSON Type** | `JSON` |
| **PostgreSQL JSON Type** | `JSONB` |
| **Migration Location** | `db/migration` (NOT `migration-h2`) |
| **Maven Profile** | `backend-e2e-h2` |
| **Spring Profiles** | `backend-e2e,backend-e2e-h2` |

## What Gets Validated

✓ 37+ migrations execute successfully  
✓ No migration-h2 references  
✓ Correct json_type placeholder (JSON)  
✓ Sequential migration order  
✓ No SQL syntax errors  
✓ All expected tables created  

## Common Commands

```bash
# Run all E2E tests (H2)
mvn clean verify -Pbackend-e2e-h2

# Run all E2E tests (PostgreSQL)
mvn clean verify -Pbackend-e2e-postgres

# Run specific test
mvn test -Pbackend-e2e-h2 -Dtest=FlywayMigrationBackendE2ETest

# Verify configuration
.\verify-flyway-h2-refactoring.ps1
```

## Expected Result

```
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Unknown data type: JSONB" | Check H2 config has `json_type: JSON` |
| "migration-h2 not found" | Normal - directory is deprecated |
| "Migration checksum mismatch" | Expected in dev - H2 is in-memory |

## Documentation

- **Testing Guide**: [FLYWAY_H2_TESTING.md](FLYWAY_H2_TESTING.md)
- **Technical Details**: [FLYWAY_H2_REFACTORING.md](src/main/resources/db/migration/FLYWAY_H2_REFACTORING.md)
- **Full Summary**: [FLYWAY_H2_REFACTORING_SUMMARY.md](FLYWAY_H2_REFACTORING_SUMMARY.md)

## Quick Checks

```powershell
# 1. Verify config file exists
Test-Path src/main/resources/application-backend-e2e-h2.yml

# 2. Check json_type setting
Select-String -Path src/main/resources/application-backend-e2e-h2.yml -Pattern "json_type: JSON"

# 3. Verify test class exists
Test-Path src/test/java/com/example/backend/FlywayMigrationBackendE2ETest.java

# 4. Run verification script
.\verify-flyway-h2-refactoring.ps1
```

## Creating New Migrations

```sql
-- V{version}__{description}.sql
-- Always use ${json_type} placeholder

-- ✓ Correct
ALTER TABLE my_table ADD COLUMN data_json ${json_type};

-- ✗ Wrong - hardcoded type
ALTER TABLE my_table ADD COLUMN data_json JSONB;
```

## FAQ

**Q: Why use H2 instead of PostgreSQL?**  
A: Faster tests (no Docker), suitable for CI/CD. PostgreSQL tests validate production compatibility.

**Q: Do I need Docker?**  
A: No for H2 tests, yes for PostgreSQL tests.

**Q: Where are H2-specific migrations?**  
A: Consolidated into `db/migration` with placeholders. No separate H2 directory needed.

**Q: What happened to migration-h2 directory?**  
A: Deprecated. Migrations moved to main directory (V38, V39).

---

**Ready to test?** Run: `mvn clean verify -Pbackend-e2e-h2`
