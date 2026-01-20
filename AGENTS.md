# Agent Development Guide

## Setup

### Prerequisites
- Java 17 (JDK 17.0.5.8 or later)
- Maven 3.6+
- Docker (for infrastructure)

### Initial Setup

**IMPORTANT:** This project requires Java 17. Before running any Maven commands, set JAVA_HOME:

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install
```

**Linux/Mac:**
```bash
export JAVA_HOME=/path/to/jdk-17
cd backend
mvn clean install
```

See `SETUP.md` for detailed setup instructions including toolchains configuration.

## Commands

### Backend (Spring Boot)
- **Build**: `cd backend && mvn clean package`
- **Lint**: `mvn checkstyle:check` (when configured)
- **Test**: `mvn test`
- **Dev Server**: `mvn spring-boot:run`
- **E2E Tests (H2)**: `mvn verify -Pbackend-e2e-h2`
- **E2E Tests (PostgreSQL)**: `mvn verify -Pbackend-e2e-postgres`

### Frontend (Angular)
- **E2E Tests (H2 + Mock Auth)**: `npm run e2e`
- **E2E Tests (PostgreSQL + Mock Auth)**: `npm run e2e:postgres`
- **E2E Tests (All Configurations)**: `npm run e2e:full`
- **E2E Tests (Fast)**: `npm run e2e:fast`
- **E2E Tests (UI Mode)**: `npm run e2e:ui`

### Infrastructure
- **Start services**: `cd infra && docker-compose up -d`
- **Stop services**: `cd infra && docker-compose down`
- **Reset database**: `cd infra && .\reset-db.ps1` (Windows) or `./reset-db.sh` (Linux/Mac)

## Tech Stack

### Backend
- Spring Boot 3.2.1
- Java 17
- Spring Web
- Spring Validation
- Spring Actuator
- Maven 3.6+

### Infrastructure
- Docker & Docker Compose
- PostgreSQL (for test/prod profiles)

## Architecture

```
/
├── backend/          # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   └── pom.xml
├── infra/           # Infrastructure configuration
│   ├── docker-compose.yml
│   ├── .env.example
│   └── reset-db scripts
└── AGENTS.md        # This file
```

## Code Style
- Java: Follow Spring Boot conventions
- Maven: Standard Maven project structure
- Configuration: YAML-based Spring configuration

## End-to-End Testing

### Overview

The project supports comprehensive end-to-end testing for both backend and frontend with multiple database and authentication configurations.

### Backend E2E Tests

Backend E2E tests are located in `backend/src/test/java/com/example/backend/` with filenames ending in `*BackendE2ETest.java`.

#### Running Backend E2E Tests

**With H2 (In-Memory Database):**
```bash
cd backend
mvn verify -Pbackend-e2e-h2
```

**With PostgreSQL (Testcontainers):**
```bash
cd backend
mvn verify -Pbackend-e2e-postgres
```

#### Test Data Builder Usage

The `BackendE2ETestDataBuilder` class provides a fluent API for creating test data. It's available in all E2E tests via dependency injection.

**Example Usage:**

```java
@Autowired
private BackendE2ETestDataBuilder testDataBuilder;

@Test
void testAnnonceWorkflow() {
    // Create an annonce with photos and rules
    Annonce annonce = testDataBuilder.annonceBuilder()
        .withTitle("Test Property")
        .withType(AnnonceType.SALE)
        .withPrice(new BigDecimal("350000"))
        .withCity("Paris")
        .withPhotos()  // Auto-generates 3 photo URLs
        .withRulesJson()  // Auto-generates rules JSON
        .persist();
    
    // Create a dossier linked to the annonce
    Dossier dossier = testDataBuilder.dossierBuilder()
        .withAnnonceId(annonce.getId())
        .withLeadName("John Doe")
        .withLeadPhone("+33612345678")
        .withStatus(DossierStatus.NEW)
        .withInitialParty(PartiePrenanteRole.BUYER)  // Creates initial party
        .persist();
    
    // Add a message to the dossier
    MessageEntity message = testDataBuilder.messageBuilder()
        .withDossier(dossier)
        .withChannel(MessageChannel.EMAIL)
        .withContent("Hello, I'm interested")
        .persist();
    
    // Add an appointment
    AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
        .withDossier(dossier)
        .withStatus(AppointmentStatus.SCHEDULED)
        .withLocation("123 Main Street")
        .persist();
    
    // Test cleanup is automatic via @AfterEach
}
```

**Builder Methods:**

- `annonceBuilder()` - Create properties/listings
  - `.withPhotos()` - Auto-generate photo URLs
  - `.withRulesJson()` - Auto-generate property rules
  - `.withMeta(Map)` - Add custom metadata
  
- `dossierBuilder()` - Create lead/deal folders
  - `.withInitialParty()` - Auto-create associated party
  - `.withAnnonceId(Long)` - Link to property
  
- `partiePrenanteBuilder()` - Create stakeholders
  - `.withDossier(Dossier)` - Required before persist
  - `.withRole(Role)` - Set role (BUYER, SELLER, etc.)
  
- `messageBuilder()` - Create messages
  - `.withDossier(Dossier)` - Required before persist
  - `.withChannel(Channel)` - SMS, EMAIL, WHATSAPP
  
- `appointmentBuilder()` - Create appointments
  - `.withDossier(Dossier)` - Required before persist
  - `.withTimeRange(start, end)` - Set appointment time
  
- `consentementBuilder()` - Create consent records
- `notificationBuilder()` - Create notifications

**Cleanup:**

Test data is automatically cleaned up after each test via the `@AfterEach` hook in base test classes. You can also manually cleanup:

```java
testDataBuilder.deleteAllTestData();
```

### Frontend E2E Tests

Frontend E2E tests use Playwright and are located in `frontend/e2e/`.

#### Running Frontend E2E Tests

**H2 + Mock Auth (Default - Fastest):**
```bash
cd frontend
npm run e2e
```

**PostgreSQL + Mock Auth:**
```bash
cd frontend
npm run e2e:postgres
```

**All Configurations (H2, PostgreSQL, Keycloak):**
```bash
cd frontend
npm run e2e:full
```

**Fast Mode (Single browser, H2 only):**
```bash
cd frontend
npm run e2e:fast
```

**UI Mode (Interactive debugging):**
```bash
cd frontend
npm run e2e:ui
```

#### Configuration Files

Different Playwright configuration files control test behavior:

- `playwright.config.ts` - Default (H2 + mock auth)
- `playwright-postgres-mock.config.ts` - PostgreSQL + mock auth
- `playwright-h2-keycloak.config.ts` - H2 + real Keycloak
- `playwright-postgres-keycloak.config.ts` - PostgreSQL + real Keycloak
- `playwright.fast.config.ts` - Fast mode (single browser)

### Prerequisites

#### Docker

**Required for:**
- Backend E2E tests with PostgreSQL profile (uses Testcontainers)
- Frontend E2E tests with PostgreSQL configurations

**Installation:**
- Docker Desktop (Windows/Mac)
- Docker Engine (Linux)

**Verify installation:**
```bash
docker --version
docker ps
```

#### Playwright Browsers

**Required for:** Frontend E2E tests

**Installation:**
```bash
cd frontend
npx playwright install
```

This installs Chromium, Firefox, and WebKit browsers needed for cross-browser testing.

### Troubleshooting

#### Port 5432 Already in Use

If PostgreSQL tests fail due to port conflicts:

**Windows (PowerShell):**
```powershell
# Find process using port 5432
Get-NetTCPConnection -LocalPort 5432

# Stop the process
Stop-Process -Id <PID>

# Or stop your local PostgreSQL service
Stop-Service postgresql-x64-16
```

**Linux/Mac:**
```bash
# Find process using port 5432
lsof -i :5432

# Stop the process
kill <PID>

# Or stop PostgreSQL service
sudo systemctl stop postgresql
```

**Alternative:** Testcontainers will use a random port if 5432 is unavailable.

#### Container Cleanup

If Docker containers from previous test runs aren't cleaned up:

```bash
# List all containers
docker ps -a

# Remove Testcontainers orphans
docker rm $(docker ps -a -q --filter "label=org.testcontainers=true")

# Remove all stopped containers
docker container prune
```

#### Flyway Version Conflicts

If you encounter Flyway version mismatch errors:

**Symptom:**
```
Flyway Community Edition X.X.X by Redgate does not support PostgreSQL version Y.Y
```

**Solution:**
Update Flyway version in `backend/pom.xml`:
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
    <version>10.0.0</version> <!-- Update to compatible version -->
</dependency>
```

Or downgrade PostgreSQL in Testcontainers configuration.

#### JSONB vs JSON Compatibility

**Symptom:**
```
ERROR: column "rules_json" is of type jsonb but expression is of type json
```

**Solution:**

This occurs when H2 and PostgreSQL have different JSON type expectations. Ensure your entity uses the correct Hibernate type:

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "rules_json", columnDefinition = "jsonb")
private Map<String, Object> rulesJson;
```

For H2 compatibility in tests, use:
```yaml
# application-test.yml
spring:
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
```

#### JWT Mock Decoder Setup

For tests using mock authentication, ensure the JWT decoder is configured:

**In Test Configuration:**
```java
@TestConfiguration
public class TestSecurityConfig {
    
    @Bean
    @Primary
    public JwtDecoder jwtDecoder() {
        // Mock decoder for testing
        return token -> {
            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", "test-user");
            claims.put("org_id", "test-org");
            claims.put("scope", "read write");
            return new Jwt(
                token,
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "none"),
                claims
            );
        };
    }
}
```

**In Test Properties:**
```yaml
# application-test.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/mock
```

#### Playwright Installation Issues

If browser installation fails:

```bash
# Clear Playwright cache
npx playwright uninstall --all

# Reinstall browsers
npx playwright install

# Install system dependencies (Linux)
npx playwright install-deps
```

#### Backend Server Not Starting

If E2E tests fail because the backend doesn't start:

1. **Check Java version:**
   ```bash
   java -version  # Must be Java 17
   ```

2. **Set JAVA_HOME:**
   ```bash
   export JAVA_HOME=/path/to/jdk-17
   ```

3. **Check for port conflicts:**
   ```bash
   lsof -i :8080  # Linux/Mac
   Get-NetTCPConnection -LocalPort 8080  # Windows
   ```

4. **Check logs:**
   ```bash
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=test
   ```

#### Timestamp Format Mismatches

**Symptom:**
```
java.lang.AssertionError: JSON path "$.createdAt" expected:<2024-01-15T10:30:00> but was:<2024-01-15T10:30:00.123456>
```
or
```
Expected timestamp format: 2024-06-15T10:00:00
Actual timestamp format: 2024-06-15T10:00:00.0
```

**Solution:**

The application uses ISO-8601 format for LocalDateTime serialization. A JacksonConfig class has been added to ensure consistent timestamp formatting:

```java
// backend/src/main/java/com/example/backend/config/JacksonConfig.java
@Configuration
public class JacksonConfig {
    @Bean
    @Primary
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        ObjectMapper objectMapper = builder.createXmlMapper(false).build();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);
        return objectMapper;
    }
}
```

**Best Practices for Tests:**
- Use `startsWith()` matcher for timestamps: `.andExpect(jsonPath("$.createdAt").value(startsWith("2024-01-15T10:30")))`
- Or use `exists()` matcher when exact timestamp isn't critical: `.andExpect(jsonPath("$.createdAt").exists())`
- Avoid comparing exact timestamps with nanosecond precision

#### Enum Serialization Issues

**Symptom:**
```
Expected: "SCHEDULED"
Actual: "scheduled" or "Scheduled"
```
or
```
Cannot deserialize value of type `AppointmentStatus` from String "scheduled"
```

**Solution:**

Enums are serialized using their `name()` method (uppercase) by default. The JacksonConfig ensures consistent enum handling:

```java
// Use name() method for enum serialization (not toString())
objectMapper.disable(SerializationFeature.WRITE_ENUMS_USING_TO_STRING);
objectMapper.disable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);
```

**Enum Definitions:**

Enums should be defined with simple uppercase constants:
```java
public enum AppointmentStatus {
    SCHEDULED,
    COMPLETED,
    CANCELLED,
    NO_SHOW
}
```

If an enum needs a custom value field for database storage or external APIs, it should not override `toString()`:
```java
public enum MessageChannel {
    EMAIL("email"),
    SMS("sms"),
    WHATSAPP("whatsapp");
    
    private final String value;
    
    MessageChannel(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    // No toString() override - Jackson will use name() for JSON serialization
}
```

**Test Assertions:**
```java
.andExpect(jsonPath("$.status").value("SCHEDULED"))  // Always uppercase
.andExpect(jsonPath("$.channel").value("EMAIL"))     // Always uppercase
.andExpect(jsonPath("$.direction").value("INBOUND")) // Always uppercase
```

#### E2E Test Authentication and Audit Fixes

**Issue:** E2E tests were failing due to missing authentication context and audit field population issues.

**Root Causes:**

1. **Timestamp Format Inconsistencies:**
   - LocalDateTime was serializing with milliseconds: `2024-01-15T10:30:00.123456`
   - Tests expected format without milliseconds: `2024-01-15T10:30:00`

2. **Missing createdBy/updatedBy Population:**
   - Entity audit fields (createdBy, updatedBy) were not being populated automatically
   - JPA auditing was not enabled

3. **Enum Serialization Format:**
   - Enums needed to consistently serialize as uppercase (e.g., "SCHEDULED" not "scheduled")

**Solutions Implemented:**

1. **Custom LocalDateTime Serializer (JacksonConfig):**
   ```java
   // Serializes LocalDateTime without milliseconds: 2024-01-15T10:30:00
   private static class LocalDateTimeWithoutMillisSerializer extends JsonSerializer<LocalDateTime> {
       private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
       
       @Override
       public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
           if (value == null) {
               gen.writeNull();
           } else {
               gen.writeString(value.format(FORMATTER));
           }
       }
   }
   ```

2. **JPA Auditing Configuration (JpaAuditingConfig):**
   ```java
   @Configuration
   @EnableJpaAuditing(auditorAwareRef = "auditorProvider")
   public class JpaAuditingConfig {
       @Bean
       public AuditorAware<String> auditorProvider() {
           return new AuditorAwareImpl();
       }
       
       static class AuditorAwareImpl implements AuditorAware<String> {
           @Override
           public Optional<String> getCurrentAuditor() {
               Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
               if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                   return Optional.of(jwt.getSubject());
               }
               return Optional.of("system");
           }
       }
   }
   ```

3. **Entity Annotations:**
   - Added `@EntityListeners(AuditingEntityListener.class)` to entities with audit fields
   - Added `@CreatedBy` and `@LastModifiedBy` annotations to audit fields
   ```java
   @Entity
   @EntityListeners(AuditingEntityListener.class)
   public class Dossier extends BaseEntity {
       @CreatedBy
       @Column(name = "created_by", length = 255)
       private String createdBy;
       
       @LastModifiedBy
       @Column(name = "updated_by", length = 255)
       private String updatedBy;
   }
   ```

**Entities with JPA Auditing Enabled:**
- Dossier
- Annonce
- AppointmentEntity
- ActivityEntity

**Test Authentication Setup:**

All E2E tests use `createMockJwt()` helper method from `BaseBackendE2ETest`:
```java
protected Jwt createMockJwt(String orgId, String subject, String... roles) {
    return Jwt.withTokenValue("mock-token-" + orgId)
            .header("alg", "none")
            .claim("sub", subject)
            .claim("org_id", orgId)
            .claim("roles", List.of(roles))
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
}
```

**Known Limitations:**

- JPA auditing only works when entities are persisted through Spring Data repositories
- Manual entity creation (e.g., in test data builders) may need explicit setCreatedBy/setUpdatedBy calls
- Timestamp format is now locked to seconds precision; milliseconds are truncated

#### Missing Test Data Issues

**Symptom:**
```
jakarta.persistence.EntityNotFoundException: Dossier not found with id: 123
```
or
```
org.springframework.dao.DataIntegrityViolationException: could not execute statement [Referential integrity constraint violation]
```

**Solution:**

Use the `BackendE2ETestDataBuilder` consistently to create test data:

```java
@Autowired
private BackendE2ETestDataBuilder testDataBuilder;

@BeforeEach
void setUp() {
    testDataBuilder.withOrgId(ORG_ID);
    
    // Create test data with proper relationships
    Dossier dossier = testDataBuilder.dossierBuilder()
        .withOrgId(ORG_ID)
        .withLeadPhone("+33612345678")
        .withStatus(DossierStatus.NEW)
        .persist();
    
    // Use the created dossier in subsequent tests
    AppointmentEntity appointment = testDataBuilder.appointmentBuilder()
        .withDossier(dossier)  // Pass the actual dossier object
        .withStatus(AppointmentStatus.SCHEDULED)
        .persist();
}

@AfterEach
void tearDown() {
    testDataBuilder.deleteAllTestData();
}
```

**Common Mistakes to Avoid:**
1. Creating entities directly without using the builder (bypasses orgId and tenant context)
2. Not calling `.persist()` on the builder
3. Forgetting to set required foreign keys (e.g., dossier for appointments)
4. Not cleaning up test data in @AfterEach hooks
5. Using hardcoded IDs that don't exist in the database

**Data Builder Features:**
- Automatic orgId assignment from context or default
- Foreign key relationship management
- Automatic cleanup tracking
- Random data generation for non-essential fields
- Thread-safe for parallel test execution

#### H2 vs PostgreSQL Dialect Differences

**Symptom:**
Tests pass with H2 but fail with PostgreSQL or vice versa.

**Common Differences:**
1. **Case Sensitivity**: PostgreSQL is case-sensitive, H2 can be configured either way
2. **NULL Ordering**: PostgreSQL and H2 handle NULL differently in ORDER BY
3. **JSON Types**: PostgreSQL uses JSONB, H2 uses JSON
4. **Sequence Generation**: Different ID generation strategies

**Solution:**

The test profiles are configured to handle these differences:

```yaml
# application-backend-e2e-h2.yml
spring:
  datasource:
    url: jdbc:h2:mem:e2edb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
  flyway:
    placeholders:
      json_type: JSON
```

**Best Practices:**
- Run tests with both profiles before committing: `mvn verify -Pbackend-e2e-h2 && mvn verify -Pbackend-e2e-postgres`
- Use database-agnostic SQL in migrations
- Avoid database-specific functions in queries
- Use Hibernate's `@JdbcTypeCode` for portable type mapping

#### Pagination Size Parameter Error (size=0)

**Symptom:**
```
java.lang.IllegalArgumentException: Page size must be at least 1
```
or
```
400 Bad Request: Page size must be at least 1
```

**Cause:**

The pagination `size` parameter must be a positive integer (minimum value is 1). Attempting to use `size=0` or negative values will result in a validation error.

**Solution:**

Use a valid page size when making paginated requests:

**Correct Usage:**
```bash
# Default size (20)
GET /api/v1/dossiers?page=0

# Custom size
GET /api/v1/dossiers?page=0&size=20

# Smaller page
GET /api/v1/dossiers?page=0&size=10

# Larger page
GET /api/v1/dossiers?page=0&size=50
```

**Incorrect Usage:**
```bash
# Will fail: size=0
GET /api/v1/dossiers?page=0&size=0

# Will fail: negative size
GET /api/v1/dossiers?page=0&size=-1
```

**API Documentation:**

All paginated endpoints enforce `size >= 1`:
- **Default value**: 20
- **Minimum value**: 1
- **Maximum value**: Not enforced (but recommended to stay under 100 for performance)

Refer to the Swagger/OpenAPI documentation for examples of proper pagination usage.

#### JOIN FETCH with Pagination Warning

**Symptom:**
```
HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory
```
or
```
org.hibernate.QueryException: query specified join fetching, but the owner of the fetched association was not present in the select list
```
or test failures with:
```
org.hibernate.loader.MultipleBagFetchException: cannot simultaneously fetch multiple bags
```

**Root Cause:**

When using `JOIN FETCH` in JPQL queries with pagination (using `Pageable`), Hibernate cannot properly apply database-level pagination because:

1. **Memory Pagination**: Hibernate must load all results into memory first, then apply pagination in-memory, which defeats the purpose of pagination
2. **Duplicate Results**: JOIN FETCH with one-to-many/many-to-many relationships can produce duplicate parent rows
3. **Performance Impact**: Database fetches all rows regardless of page size

**Example of Problematic Code:**

```java
@Query("SELECT m FROM MessageEntity m JOIN FETCH m.dossier WHERE m.dossier.id = :dossierId " +
       "AND (:channel IS NULL OR m.channel = :channel)")
Page<MessageEntity> findByDossierIdWithFilters(
        @Param("dossierId") Long dossierId,
        @Param("channel") MessageChannel channel,
        Pageable pageable);
```

**Exception Details:**

- **Type**: `org.hibernate.HibernateException` or warning `HHH90003004`
- **Location**: Query execution during pagination
- **Impact**: Tests may pass but with degraded performance, or fail entirely with PostgreSQL

**Solutions:**

**Option 1: Remove JOIN FETCH (Recommended for ManyToOne/Lazy)**

For `@ManyToOne(fetch = FetchType.LAZY)` relationships, remove `JOIN FETCH` entirely. Hibernate can efficiently load the association later if needed:

```java
@Query("SELECT m FROM MessageEntity m WHERE m.dossier.id = :dossierId " +
       "AND (:channel IS NULL OR m.channel = :channel)")
Page<MessageEntity> findByDossierIdWithFilters(
        @Param("dossierId") Long dossierId,
        @Param("channel") MessageChannel channel,
        Pageable pageable);
```

**Option 2: Use @EntityGraph**

For cases where eager loading is necessary, use `@EntityGraph` instead:

```java
@EntityGraph(attributePaths = {"dossier"})
@Query("SELECT m FROM MessageEntity m WHERE m.dossier.id = :dossierId " +
       "AND (:channel IS NULL OR m.channel = :channel)")
Page<MessageEntity> findByDossierIdWithFilters(
        @Param("dossierId") Long dossierId,
        @Param("channel") MessageChannel channel,
        Pageable pageable);
```

**Option 3: Two-Query Approach (For Collections)**

For one-to-many/many-to-many, use two queries:

```java
// Query 1: Paginated IDs
@Query("SELECT m.id FROM MessageEntity m WHERE m.dossier.id = :dossierId")
Page<Long> findIdsByDossierId(@Param("dossierId") Long dossierId, Pageable pageable);

// Query 2: Fetch entities with associations
@Query("SELECT DISTINCT m FROM MessageEntity m JOIN FETCH m.details WHERE m.id IN :ids")
List<MessageEntity> findByIdsWithDetails(@Param("ids") List<Long> ids);
```

**Option 4: DTO Projection (Best Performance)**

Use DTO projections to avoid fetching unnecessary associations:

```java
@Query("SELECT new com.example.backend.dto.MessageProjection(m.id, m.content, m.channel, d.id, d.leadName) " +
       "FROM MessageEntity m JOIN m.dossier d WHERE d.id = :dossierId")
Page<MessageProjection> findProjectedByDossierId(@Param("dossierId") Long dossierId, Pageable pageable);
```

**Testing Considerations:**

1. **Run with PostgreSQL**: H2 may not show the warning, but PostgreSQL will
2. **Check Logs**: Look for `HHH90003004` warnings in Hibernate logs
3. **Performance Testing**: Verify database queries are using LIMIT/OFFSET correctly
4. **N+1 Query Detection**: Use Hibernate statistics to detect inefficient queries

**Related Files:**
- `backend/src/main/java/com/example/backend/repository/MessageRepository.java`
- `backend/src/main/java/com/example/backend/service/MessageService.java`
- `backend/src/test/java/com/example/backend/MessageBackendE2ETest.java`

**Best Practices:**
- Avoid `JOIN FETCH` with pagination for collections (one-to-many, many-to-many)
- For `ManyToOne` relationships, prefer lazy loading without JOIN FETCH
- Use `@EntityGraph` when you need controlled eager loading with pagination
- Consider DTO projections for read-heavy operations
- Always test with both H2 and PostgreSQL profiles
