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
