# Migration V15 & V102 Test Verification Guide

## Quick Start

To verify that migrations V15 and V102 execute successfully, run the following commands:

### Windows (PowerShell)

```powershell
# Set Java 17
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Test with H2 (V15 only)
cd backend
mvn verify -Pbackend-e2e-h2

# Test with PostgreSQL (V15 + V102)
mvn verify -Pbackend-e2e-postgres
```

### Windows (Command Prompt)

```cmd
REM Use the provided wrapper scripts
.\run-tests-h2.cmd
.\run-tests-postgres.cmd
```

### Linux/Mac

```bash
# Set Java 17
export JAVA_HOME=/path/to/jdk-17

# Test with H2 (V15 only)
cd backend
mvn verify -Pbackend-e2e-h2

# Test with PostgreSQL (V15 + V102)
mvn verify -Pbackend-e2e-postgres
```

## What to Look For

### Successful H2 Execution

Look for these log entries:
```
[INFO] Flyway Community Edition 9.x.x by Redgate
[INFO] Database: jdbc:h2:mem:e2edb (H2 2.x)
[INFO] Successfully validated 15 migrations (execution time 00:00.xxx)
[INFO] Current version of schema "PUBLIC": 14
[INFO] Migrating schema "PUBLIC" to version "15 - Seed default referentials"
[INFO] Successfully applied 1 migration to schema "PUBLIC"
```

### Successful PostgreSQL Execution  

Look for these log entries:
```
[INFO] Flyway Community Edition 9.x.x by Redgate
[INFO] Database: jdbc:postgresql://localhost:xxxxx/test (PostgreSQL 15.x)
[INFO] Successfully validated 16 migrations (execution time 00:00.xxx)
[INFO] Current version of schema "public": 15
[INFO] Migrating schema "public" to version "102 - Seed referentials dynamic"
[INFO] Successfully applied 1 migration to schema "public"
```

### Test Results

Both test suites should show:
```
[INFO] Tests run: XX, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

## Troubleshooting

### JAVA_HOME Not Set

**Error**: `The JAVA_HOME environment variable is not defined correctly`

**Solution**: Use the provided wrapper scripts or set JAVA_HOME:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

### Port 5432 Already in Use

**Error**: PostgreSQL tests fail with port conflict

**Solution**: Stop local PostgreSQL or let Testcontainers use random port

### Flyway Validation Errors

**Error**: `Migration checksum mismatch`

**Solution**: Run `mvn clean` then retry

## Expected Migration Count

- **H2**: 15 migrations (V1-V15, excluding V102)
- **PostgreSQL**: 16 migrations (V1-V15 + V102)

## Verification Steps

After tests pass, you can verify the data was seeded:

### H2 Verification (during test execution)
Add a breakpoint or logging in a test:
```java
@Test
void verifyReferentialsSeeded() {
    long count = referentialRepository.count();
    assertTrue(count >= 79, "Should have at least 79 referentials for DEFAULT-ORG");
}
```

### PostgreSQL Verification
Connect to the test database and run:
```sql
SELECT org_id, category, COUNT(*) as count
FROM referential
GROUP BY org_id, category
ORDER BY org_id, category;
```

Expected results for DEFAULT-ORG:
- CASE_TYPE: 5 records
- CASE_STATUS: 24 records  
- LEAD_SOURCE: 13 records
- LOSS_REASON: 12 records
- WON_REASON: 7 records
- **Total**: 79 records per org_id
