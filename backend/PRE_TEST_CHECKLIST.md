# Pre-Test Checklist

Before running `mvn verify -Pbackend-e2e-h2`, verify the following:

## Environment Setup

- [ ] Java 17 is installed at `C:\Environement\Java\jdk-17.0.5.8-hotspot` (Windows) or equivalent path
- [ ] Maven 3.6+ is installed and in PATH
- [ ] JAVA_HOME is set correctly (or will be set by wrapper script)

## Configuration Files

### Jackson Configuration
- [x] `backend/src/main/java/com/example/backend/config/JacksonConfig.java` exists
- [x] Configures ISO-8601 timestamp format
- [x] Configures enum name() serialization (uppercase)

### Test Configuration
- [x] `backend/src/test/java/com/example/backend/config/TestSecurityConfig.java` updated
- [x] Uses same ObjectMapper configuration as production
- [x] No custom timestamp formatters that conflict

### Application Configuration
- [x] `backend/src/test/resources/application-backend-e2e-h2.yml` configured for H2 PostgreSQL mode
- [x] `backend/src/test/resources/application-backend-e2e.yml` base configuration correct
- [x] No conflicting application.properties files

### Maven Configuration
- [x] `backend/pom.xml` has `backend-e2e-h2` profile
- [x] Profile includes correct test files (`**/*BackendE2ETest.java`)
- [x] Profile sets correct Spring profiles (`backend-e2e,backend-e2e-h2`)

## Database Configuration

### H2 Configuration
- [x] H2 dependency in pom.xml (scope: runtime)
- [x] H2 URL uses PostgreSQL mode: `MODE=PostgreSQL`
- [x] Database lowercase conversion: `DATABASE_TO_LOWER=TRUE`
- [x] NULL ordering compatibility: `DEFAULT_NULL_ORDERING=HIGH`

### Flyway Migrations
- [x] Flyway enabled for tests
- [x] Flyway placeholder for json_type set to `JSON` (H2) or `JSONB` (PostgreSQL)
- [x] All migrations are compatible with both H2 and PostgreSQL
- [x] No database-specific functions in migrations

## Entity Configuration

### Timestamp Fields
- [x] Entities use `@CreationTimestamp` and `@UpdateTimestamp` from Hibernate
- [x] Timestamp columns defined as `LocalDateTime`
- [x] No manual timestamp setting in @PrePersist/@PreUpdate hooks

### Enum Fields
- [x] All enums use `@Enumerated(EnumType.STRING)`
- [x] Enum values are uppercase (e.g., `SCHEDULED`, `EMAIL`, `INBOUND`)
- [x] No custom toString() methods that return lowercase

## Test Code

### Test Base Class
- [x] `BaseBackendE2ETest` provides helper methods
- [x] `createMockJwt()` methods available for security
- [x] `withTenantHeaders()` methods for tenant context

### Test Data Builder
- [x] `BackendE2ETestDataBuilder` available and injected
- [x] Builders support `.persist()` method
- [x] `deleteAllTestData()` cleanup method exists

### Test Assertions
- [x] Timestamp assertions use `startsWith()` or `exists()` matchers
- [x] Enum assertions use uppercase values
- [x] No exact timestamp comparisons with nanosecond precision

## Common Issues (Pre-Flight)

### Issue: Tests Fail Due to Missing JAVA_HOME
**Check:** Run `java -version` - should show Java 17
**Fix:** Set JAVA_HOME before running tests

### Issue: Port Conflicts
**Check:** Verify no services running on ports used by tests
**Fix:** Stop conflicting services or use random ports

### Issue: Stale Test Data
**Check:** Database is clean between test runs
**Fix:** Tests use `@Transactional` and rollback after each test

### Issue: Flyway Migrations Fail
**Check:** All migrations are numbered sequentially without gaps
**Fix:** Review migration files in `backend/src/main/resources/db/migration/`

## Running the Tests

### Option 1: Using Maven Directly
```bash
cd backend
mvn verify -Pbackend-e2e-h2
```

### Option 2: Using Helper Script (Windows)
```powershell
cd backend
.\test-e2e-h2.ps1
```

### Option 3: Manual JAVA_HOME Setup
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn verify -Pbackend-e2e-h2
```

## Expected Output

### Success Indicators
```
[INFO] Tests run: XX, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Common Test Patterns
- Appointment tests: Create, Update, List, Delete with status transitions
- Dossier tests: Create, Status transitions, History tracking
- Message tests: Create with channels (EMAIL, SMS, WHATSAPP, PHONE)
- Multi-tenant tests: Isolation verification

## Post-Test Validation

After tests complete successfully:
- [ ] All tests passed (0 failures, 0 errors)
- [ ] No warnings about timestamp format mismatches
- [ ] No warnings about enum deserialization
- [ ] No EntityNotFoundException errors
- [ ] Test execution time is reasonable (< 5 minutes typically)

## Troubleshooting

If tests fail, check `AGENTS.md` troubleshooting section for:
- Timestamp Format Mismatches
- Enum Serialization Issues
- Missing Test Data Issues
- H2 vs PostgreSQL Dialect Differences

## Documentation References

- `AGENTS.md` - Complete troubleshooting guide
- `TEST_FIXES_SUMMARY.md` - Summary of recent fixes
- `backend/src/test/java/com/example/backend/annotation/BaseBackendE2ETest.java` - Test base class
- `backend/src/test/java/com/example/backend/utils/BackendE2ETestDataBuilder.java` - Test data builder
