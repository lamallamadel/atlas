# Known Issues and Fixes

This document tracks known issues that may cause test failures and their solutions.

## Fixed Issues

### 1. Timestamp Format Mismatches ✅ FIXED

**Issue:**
Tests were failing with timestamp format mismatches due to inconsistent serialization:
- Expected: `2024-06-15T10:00:00`
- Actual: `2024-06-15T10:00:00.123456789` or `2024-06-15T10:00`

**Root Cause:**
- TestSecurityConfig had a custom LocalDateTimeSerializer with format `yyyy-MM-dd'T'HH:mm`
- This conflicted with default Jackson ISO-8601 serialization
- Different configurations between test and production code

**Fix:**
1. Created `JacksonConfig` class for consistent configuration
2. Updated `TestSecurityConfig` to match production configuration
3. Both now use JavaTimeModule with default ISO-8601 format

**Files Changed:**
- `backend/src/main/java/com/example/backend/config/JacksonConfig.java` (NEW)
- `backend/src/test/java/com/example/backend/config/TestSecurityConfig.java` (MODIFIED)

**Verification:**
```java
// Test assertions should use:
.andExpect(jsonPath("$.createdAt").value(startsWith("2024-06-15T10:00")))
// OR
.andExpect(jsonPath("$.createdAt").exists())
```

### 2. Enum Serialization Issues ✅ FIXED

**Issue:**
Tests were expecting uppercase enum values but sometimes receiving lowercase:
- Expected: `"SCHEDULED"`, `"EMAIL"`, `"INBOUND"`
- Actual: `"scheduled"`, `"email"`, `"inbound"`

**Root Cause:**
- Some enums had custom value fields (e.g., MessageChannel)
- Unclear whether to use `toString()` or `name()` for serialization
- Inconsistent configuration across different parts of the code

**Fix:**
1. Configured Jackson to use enum `name()` method (not `toString()`)
2. Ensured all enums serialize as uppercase strings
3. Documented that enums should not override `toString()` for serialization

**Configuration:**
```java
objectMapper.disable(SerializationFeature.WRITE_ENUMS_USING_TO_STRING);
objectMapper.disable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);
```

**Files Changed:**
- `backend/src/main/java/com/example/backend/config/JacksonConfig.java` (NEW)
- `backend/src/test/java/com/example/backend/config/TestSecurityConfig.java` (MODIFIED)

**Verification:**
```java
// All enum assertions should use uppercase:
.andExpect(jsonPath("$.status").value("SCHEDULED"))
.andExpect(jsonPath("$.channel").value("EMAIL"))
.andExpect(jsonPath("$.direction").value("INBOUND"))
```

### 3. Missing Test Data Issues ✅ FIXED (Documentation)

**Issue:**
Tests were failing with EntityNotFoundException or referential integrity violations due to:
- Creating entities directly without proper relationships
- Missing required foreign key references
- Not using test data builder consistently

**Root Cause:**
- Inconsistent use of `BackendE2ETestDataBuilder`
- Manual entity creation bypassing orgId and tenant context
- Forgetting to call `.persist()` method

**Fix:**
1. Documented proper usage of `BackendE2ETestDataBuilder` in AGENTS.md
2. Added examples of correct test data creation
3. Highlighted common mistakes to avoid

**Best Practice:**
```java
@Autowired
private BackendE2ETestDataBuilder testDataBuilder;

@BeforeEach
void setUp() {
    testDataBuilder.withOrgId(ORG_ID);
    
    Dossier dossier = testDataBuilder.dossierBuilder()
        .withLeadPhone("+33612345678")
        .withStatus(DossierStatus.NEW)
        .persist();  // Don't forget to persist!
    
    AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
        .withDossier(dossier)  // Use actual dossier object
        .withStatus(AppointmentStatus.SCHEDULED)
        .persist();
}

@AfterEach
void tearDown() {
    testDataBuilder.deleteAllTestData();  // Cleanup
}
```

**Files Changed:**
- `AGENTS.md` (MODIFIED - Added troubleshooting section)

## Potential Issues

### 1. H2 vs PostgreSQL Dialect Differences ⚠️ POTENTIAL

**Description:**
Tests may pass with H2 but fail with PostgreSQL or vice versa due to:
- Case sensitivity differences
- NULL ordering behavior
- JSON vs JSONB types
- Sequence generation strategies

**Mitigation:**
1. H2 configured in PostgreSQL mode: `MODE=PostgreSQL`
2. Database case normalization: `DATABASE_TO_LOWER=TRUE`
3. NULL ordering compatibility: `DEFAULT_NULL_ORDERING=HIGH`
4. Flyway placeholders for JSON types

**Verification:**
Run tests with both profiles:
```bash
mvn verify -Pbackend-e2e-h2
mvn verify -Pbackend-e2e-postgres
```

**Status:** Mitigated through configuration

### 2. Concurrent Test Execution 📋 MONITORING

**Description:**
Tests may interfere with each other when run in parallel due to:
- Shared database state
- Thread-local context leaks
- Race conditions in test data creation

**Current Mitigation:**
- Tests use `@Transactional` for automatic rollback
- BackendE2ETestDataBuilder tracks created entities
- TenantContext properly isolated per request

**Status:** No known issues currently, but monitoring

### 3. Flyway Migration Order 📋 MONITORING

**Description:**
New migrations might cause issues if:
- Version numbers conflict
- Dependencies between migrations not satisfied
- Schema changes break existing tests

**Prevention:**
- Sequential migration versioning (V1, V2, V3...)
- Baseline-on-migrate enabled for tests
- Review migrations before running tests

**Status:** No known issues currently, but monitoring

## Testing Workflow

### Before Committing Code

1. **Run H2 tests:**
   ```bash
   mvn verify -Pbackend-e2e-h2
   ```

2. **Run PostgreSQL tests (if Docker available):**
   ```bash
   mvn verify -Pbackend-e2e-postgres
   ```

3. **Check for warnings:**
   - No timestamp format warnings
   - No enum deserialization errors
   - No entity not found errors

4. **Review test output:**
   - All tests passed
   - No skipped tests (unless intentional)
   - Reasonable execution time

### When Adding New Tests

1. **Use BackendE2ETestDataBuilder:**
   - Always use builder for entity creation
   - Always call `.persist()`
   - Always cleanup in `@AfterEach`

2. **Use appropriate matchers:**
   - Timestamps: `startsWith()` or `exists()`
   - Enums: Exact uppercase match
   - IDs: Use actual IDs from created entities

3. **Test multi-tenancy:**
   - Verify tenant isolation
   - Use correct X-Org-Id headers
   - Test cross-tenant access prevention

### When Debugging Test Failures

1. **Check recent changes:**
   - Entity modifications
   - Migration changes
   - Configuration updates

2. **Review error messages:**
   - EntityNotFoundException → Check test data creation
   - Timestamp mismatch → Check assertion matcher
   - Enum deserialization → Check enum value case

3. **Enable SQL logging:**
   ```yaml
   # application-backend-e2e-h2.yml
   spring:
     jpa:
       show-sql: true
       properties:
         hibernate:
           format_sql: true
   ```

4. **Run single test:**
   ```bash
   mvn test -Dtest=AppointmentBackendE2ETest -Pbackend-e2e-h2
   ```

## Quick Reference

### Timestamp Assertions
```java
// ✅ GOOD
.andExpect(jsonPath("$.createdAt").exists())
.andExpect(jsonPath("$.startTime").value(startsWith("2024-06-15T10:00")))

// ❌ BAD
.andExpect(jsonPath("$.createdAt").value("2024-06-15T10:00:00"))  // May fail due to nanoseconds
```

### Enum Assertions
```java
// ✅ GOOD
.andExpect(jsonPath("$.status").value("SCHEDULED"))
.andExpect(jsonPath("$.channel").value("EMAIL"))

// ❌ BAD
.andExpect(jsonPath("$.status").value("scheduled"))  // Wrong case
.andExpect(jsonPath("$.channel").value("email"))     // Wrong case
```

### Test Data Creation
```java
// ✅ GOOD
Dossier dossier = testDataBuilder.dossierBuilder()
    .withOrgId(ORG_ID)
    .persist();

AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
    .withDossier(dossier)
    .persist();

// ❌ BAD
Dossier dossier = new Dossier();  // Bypasses tenant context
dossier.setOrgId(ORG_ID);
dossierRepository.save(dossier);  // Not tracked for cleanup
```

## Contact and Support

For questions or issues:
1. Check `AGENTS.md` troubleshooting section
2. Review this document for known issues
3. Check test documentation in individual test files
4. Review `BackendE2ETestDataBuilder` javadoc
