# Backend E2E Test Fixes Summary

## Overview
This document summarizes the fixes implemented to address test failures related to timestamp format mismatches, enum serialization issues, and missing test data.

## Changes Made

### 1. Jackson Configuration (New File)
**File:** `backend/src/main/java/com/example/backend/config/JacksonConfig.java`

**Purpose:** Ensure consistent JSON serialization/deserialization across all endpoints and tests.

**Key Configurations:**
- **Timestamp Serialization:** Uses ISO-8601 format (e.g., `2024-06-15T10:00:00`) instead of Unix timestamps
- **Enum Serialization:** Uses enum `name()` method for uppercase serialization (e.g., `SCHEDULED`, `EMAIL`, `INBOUND`)
- **Deserialization:** Accepts unknown properties gracefully, treats empty strings as null

**Code:**
```java
@Configuration
public class JacksonConfig {
    @Bean
    @Primary
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        ObjectMapper objectMapper = builder.createXmlMapper(false).build();
        
        // ISO-8601 timestamp format
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);
        
        // Enum name() serialization (uppercase)
        objectMapper.disable(SerializationFeature.WRITE_ENUMS_USING_TO_STRING);
        objectMapper.disable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);
        
        // Lenient deserialization
        objectMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        objectMapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);
        
        return objectMapper;
    }
}
```

### 2. Test Security Configuration (Updated)
**File:** `backend/src/test/java/com/example/backend/config/TestSecurityConfig.java`

**Changes:**
- Removed custom `LocalDateTimeSerializer` with custom format pattern
- Updated to use same configuration as production `JacksonConfig`
- Ensures test and production serialization behavior is identical

**Before:**
```java
DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
JavaTimeModule javaTimeModule = new JavaTimeModule();
javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
```

**After:**
```java
// Register JavaTimeModule for Java 8 date/time types with default ISO-8601 format
mapper.registerModule(new JavaTimeModule());
mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
mapper.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);
```

### 3. Documentation Updates (Updated)
**File:** `AGENTS.md`

**Added Troubleshooting Sections:**

#### Timestamp Format Mismatches
- **Symptom:** Timestamp precision mismatches (e.g., `2024-01-15T10:30:00` vs `2024-01-15T10:30:00.123456`)
- **Solution:** Use `startsWith()` matcher or `exists()` matcher in tests
- **Best Practice:** Avoid comparing exact timestamps with nanosecond precision

#### Enum Serialization Issues
- **Symptom:** Case mismatches (e.g., `SCHEDULED` vs `scheduled`)
- **Solution:** Enums always serialize using `name()` (uppercase)
- **Best Practice:** Always use uppercase enum values in test assertions

#### Missing Test Data Issues
- **Symptom:** EntityNotFoundException or referential integrity violations
- **Solution:** Use `BackendE2ETestDataBuilder` consistently
- **Best Practice:** Always call `.persist()` and use `@AfterEach` cleanup

#### H2 vs PostgreSQL Dialect Differences
- **Common Issues:** Case sensitivity, NULL ordering, JSON types, sequence generation
- **Solution:** Test profiles configured with H2 PostgreSQL mode
- **Best Practice:** Run tests with both profiles before committing

## Verification Steps

To verify these fixes work correctly:

1. **Set JAVA_HOME:**
   ```powershell
   $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
   ```

2. **Run H2 E2E Tests:**
   ```bash
   cd backend
   mvn verify -Pbackend-e2e-h2
   ```

3. **Run PostgreSQL E2E Tests (if Docker available):**
   ```bash
   cd backend
   mvn verify -Pbackend-e2e-postgres
   ```

## Expected Results

All tests should pass with:
- ✅ Timestamps serialized in ISO-8601 format
- ✅ Enums serialized as uppercase strings
- ✅ Test data properly created and cleaned up
- ✅ H2 and PostgreSQL tests behave consistently

## Known Limitations

1. **Timestamp Precision:** Tests should use `startsWith()` matcher for timestamps to avoid nanosecond precision issues
2. **Enum Validation:** Enum deserialization is case-sensitive (uppercase only)
3. **Database Differences:** Some minor differences between H2 and PostgreSQL may still exist for edge cases

## Rollback Instructions

If these changes cause issues, revert:

1. **JacksonConfig:** Delete `backend/src/main/java/com/example/backend/config/JacksonConfig.java`
2. **TestSecurityConfig:** Restore previous version from git history
3. **AGENTS.md:** Restore previous version from git history

## Related Files

- `backend/src/main/java/com/example/backend/config/JacksonConfig.java` (NEW)
- `backend/src/test/java/com/example/backend/config/TestSecurityConfig.java` (MODIFIED)
- `AGENTS.md` (MODIFIED - Added troubleshooting sections)
- `backend/test-e2e-h2.ps1` (NEW - Helper script for running tests)

## Testing Checklist

Before committing, ensure:

- [ ] All BackendE2E tests pass with H2 profile
- [ ] All BackendE2E tests pass with PostgreSQL profile (if available)
- [ ] Timestamp assertions use appropriate matchers
- [ ] Enum assertions use uppercase values
- [ ] Test data is properly created and cleaned up
- [ ] No test data leaks between tests
- [ ] Security context is properly mocked
- [ ] Tenant isolation is maintained

## Contact

For questions or issues related to these changes, refer to:
- AGENTS.md Troubleshooting section
- Test documentation in individual test files
- BackendE2ETestDataBuilder javadoc
