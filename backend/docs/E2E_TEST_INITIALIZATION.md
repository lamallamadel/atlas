# E2E Test Initialization Order Documentation

## Overview

This document describes the initialization order for Backend E2E tests using PostgreSQL Testcontainers and Flyway migrations.

## Initialization Sequence

The test initialization follows this precise order to ensure proper database setup before tests execute:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: PostgreSQL Testcontainer Startup                        │
│ ────────────────────────────────────────────────────────────── │
│ • Static initialization block in                                 │
│   PostgresTestcontainersConfiguration                            │
│ • Container image: postgres:16-alpine                            │
│ • Container reuse enabled for performance                        │
│ • UTF8 encoding configured                                       │
│ • Listening port wait strategy                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: DataSource Configuration                                │
│ ────────────────────────────────────────────────────────────── │
│ • @ServiceConnection annotation auto-configures datasource      │
│ • Spring Boot extracts JDBC URL, username, password             │
│ • HikariCP connection pool initialized                           │
│ • Connection pooling parameters configured                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Flyway Configuration                                    │
│ ────────────────────────────────────────────────────────────── │
│ • FlywayConfigurationCustomizer registers callbacks             │
│ • Flyway placeholder json_type=JSONB set                        │
│ • Migration locations: classpath:db/migration                   │
│ • Baseline-on-migrate enabled                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Flyway Migration Execution                              │
│ ────────────────────────────────────────────────────────────── │
│ • Flyway scans db/migration directory                           │
│ • Executes migrations in version order (V1, V2, V3, ...)       │
│ • Each migration logged via FlywayTestCallback                  │
│ • Creates all tables, indexes, constraints                       │
│ • Records migration history in flyway_schema_history            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: JPA/Hibernate Initialization                            │
│ ────────────────────────────────────────────────────────────── │
│ • EntityManagerFactory created                                   │
│ • hibernate.ddl-auto=validate verifies schema matches entities  │
│ • Transaction management configured                              │
│ • Repository beans instantiated                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Spring Application Context Ready                        │
│ ────────────────────────────────────────────────────────────── │
│ • All Spring beans loaded                                        │
│ • ApplicationReadyEvent fired                                    │
│ • DataSourceHealthCheck performs verification                    │
│ • MockMvc configured for test execution                          │
│ • Tests can now safely execute                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. PostgresTestcontainersConfiguration

**Location:** `backend/src/test/java/com/example/backend/config/PostgresTestcontainersConfiguration.java`

**Purpose:** Manages the PostgreSQL Testcontainer lifecycle

**Key Features:**
- Static initialization ensures container starts before Spring context
- `@Order(Integer.MIN_VALUE)` ensures highest priority
- `@ServiceConnection` enables auto-configuration
- Container reuse for faster subsequent test runs
- Comprehensive logging of container details

### 2. FlywayTestCallback

**Location:** Nested class in `PostgresTestcontainersConfiguration`

**Purpose:** Logs Flyway migration execution in detail

**Key Features:**
- Logs each migration as it executes
- Reports total migration count and duration
- Detects and reports migration failures
- Provides clear visual separation in logs

### 3. DataSourceHealthCheck

**Location:** `backend/src/test/java/com/example/backend/config/DataSourceHealthCheck.java`

**Purpose:** Verifies database connectivity and migration status

**Key Features:**
- Validates connection to PostgreSQL
- Lists database metadata (version, driver, etc.)
- Counts applied Flyway migrations
- Lists all available tables
- Executes on ApplicationStartedEvent

### 4. TestExecutionLogger

**Location:** `backend/src/test/java/com/example/backend/config/TestExecutionLogger.java`

**Purpose:** Logs test execution lifecycle

**Key Features:**
- Logs test class initialization
- Logs each test method execution
- Reports test success/failure
- Provides summary after test class completes

## Configuration Files

### application-backend-e2e-postgres.yml

**Location:** `backend/src/test/resources/application-backend-e2e-postgres.yml`

**Key Settings:**
```yaml
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      connection-timeout: 30000
      
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate  # Important: validates schema matches entities
      
  flyway:
    enabled: true
    baseline-on-migrate: true
    validate-on-migrate: true
    placeholders:
      json_type: JSONB  # PostgreSQL uses JSONB, H2 uses JSON
      
logging:
  level:
    org.flywaydb: DEBUG
    org.testcontainers: INFO
    com.example.backend: DEBUG
```

## Running E2E Tests with PostgreSQL

### Command

```bash
cd backend
mvn verify -Pbackend-e2e-postgres
```

### Expected Log Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║ STEP 1: Initializing PostgreSQL Testcontainer (Static Initialization)      ║
╚════════════════════════════════════════════════════════════════════════════╝
Starting PostgreSQL container with image: postgres:16-alpine
Container reuse enabled: true
╔════════════════════════════════════════════════════════════════════════════╗
║ PostgreSQL Testcontainer Started Successfully                              ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Container Details:                                                          ║
║   • Container ID: abc123...                                                 ║
║   • JDBC URL: jdbc:postgresql://localhost:xxxxx/testdb                     ║
║   • Database: testdb                                                        ║
║   • Username: test                                                          ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║ STEP 2: Registering PostgreSQL Container as Spring Bean                    ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║ STEP 3: Configuring Flyway with Custom Callback                            ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║ STEP 4: Starting Flyway Database Migrations                                ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Schema: public                                                              ║
║ Locations: [classpath:db/migration]                                        ║
╚════════════════════════════════════════════════════════════════════════════╝
  → Executing Migration #1: V1 - Initial schema
  ✓ Migration completed successfully
  → Executing Migration #2: V2 - Add jsonb and missing columns
  ✓ Migration completed successfully
  ...
╔════════════════════════════════════════════════════════════════════════════╗
║ Flyway Migrations Completed Successfully                                   ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Total Migrations: 12                                                        ║
║ Duration: 1234 ms                                                           ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║ DataSource Connection Health Check                                          ║
╚════════════════════════════════════════════════════════════════════════════╝
✓ Connection established successfully
  → Database: PostgreSQL 16.x
  → JDBC URL: jdbc:postgresql://localhost:xxxxx/testdb
✓ Flyway schema history table exists
✓ Successfully applied migrations: 12
Available tables:
  • annonce
  • dossier
  • partie_prenante
  • consentement
  • message
  • appointment
  • audit_event
  • dossier_status_history
  ...

╔════════════════════════════════════════════════════════════════════════════╗
║ STEP 6: Spring Application Context Ready - Tests Can Begin                 ║
╠════════════════════════════════════════════════════════════════════════════╣
║ ✓ PostgreSQL Container: RUNNING                                            ║
║ ✓ DataSource: CONFIGURED                                                    ║
║ ✓ Flyway Migrations: COMPLETED                                              ║
║ ✓ Application Context: INITIALIZED                                          ║
║                                                                             ║
║ Test execution can now proceed safely.                                      ║
╚════════════════════════════════════════════════════════════════════════════╝

[Test execution begins...]
```

## Verification Test

A dedicated test class `InitializationOrderBackendE2ETest` verifies the initialization order:

### Tests Included:

1. **verifyTestcontainerIsRunning** - Confirms container is running
2. **verifyDataSourceConnection** - Validates database connection
3. **verifyFlywayMigrationsExecuted** - Checks all migrations succeeded
4. **verifyRequiredTablesExist** - Ensures all expected tables exist
5. **verifyApplicationContextIsReady** - Confirms Spring beans loaded
6. **verifyInitializationOrderSummary** - Displays complete summary

### Running Verification Test Only:

```bash
cd backend
mvn test -Dtest=InitializationOrderBackendE2ETest -Pbackend-e2e-postgres
```

## Troubleshooting

### Container Won't Start

**Symptom:** Testcontainer fails to start or times out

**Solutions:**
- Ensure Docker is running: `docker ps`
- Check Docker memory/resource limits
- Verify network connectivity to Docker hub
- Check for port conflicts on 5432

### Flyway Migration Errors

**Symptom:** Migration fails with SQL errors

**Solutions:**
- Check migration files in `backend/src/main/resources/db/migration/`
- Verify placeholder `${json_type}` is set correctly
- Ensure PostgreSQL version compatibility
- Check logs for specific SQL error

### Connection Errors

**Symptom:** "Unable to obtain connection from database"

**Solutions:**
- Verify container started successfully (check logs)
- Check HikariCP configuration in YAML
- Ensure no firewall blocking connection
- Verify PostgreSQL is accepting connections

### Schema Validation Errors

**Symptom:** "Schema validation failed" from Hibernate

**Solutions:**
- Ensure Flyway migrations executed successfully
- Check entity classes match migration schema
- Verify `hibernate.ddl-auto=validate` setting
- Compare entity annotations with table definitions

## Performance Optimization

### Container Reuse

Testcontainers supports container reuse across test runs:

```java
POSTGRES_CONTAINER = new PostgreSQLContainer<>("postgres:16-alpine")
    .withReuse(true)  // ← Enables reuse
```

**Benefits:**
- First run: ~10-15 seconds container startup
- Subsequent runs: ~1-2 seconds (reuses existing container)
- Significant time savings for iterative development

### Flyway Baseline

Using `baseline-on-migrate: true` allows Flyway to work with existing databases:

```yaml
flyway:
  baseline-on-migrate: true
  baseline-version: 0
```

## Related Documentation

- [AGENTS.md](../AGENTS.md) - Full E2E testing guide
- [Backend E2E Tests](./src/test/java/com/example/backend/) - Test implementations
- [Flyway Migrations](./src/main/resources/db/migration/) - Database migrations
- [Testcontainers Documentation](https://www.testcontainers.org/)
