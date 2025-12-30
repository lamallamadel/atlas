# Backend Application

Spring Boot application with Java 17, featuring Web, Validation, and Actuator capabilities.

## Requirements

- Java 17
- Maven 3.6+

## Quick Setup

### Option 1: Set JAVA_HOME (Recommended)

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean install
```

**Linux/Mac:**
```bash
export JAVA_HOME=/path/to/jdk-17
mvn clean install
```

### Option 2: Use Helper Script (Windows Only)

```cmd
mvn-java17.cmd clean install
```

The `mvn-java17.cmd` script automatically sets JAVA_HOME to Java 17 before running Maven.

### Option 3: Maven Toolchains

Copy `toolchains.xml` to `~/.m2/toolchains.xml` (or `%USERPROFILE%\.m2\toolchains.xml` on Windows) and modify the Java path if needed. Note: You still need to set JAVA_HOME for Maven to run.

## Tech Stack

- Spring Boot 3.2.1
- Spring Web
- Spring Validation
- Spring Actuator
- Java 17

## Build

```bash
mvn clean package
```

## Run

```bash
# Run with local profile (default)
mvn spring-boot:run

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=test
```

Or run the JAR:

```bash
java -jar target/backend.jar
```

## Profiles

### local (default)
- In-memory H2 database
- Debug logging enabled
- Full health details exposed
- Port: 8080

### test
- PostgreSQL database (test-db-host:5432/testdb)
- Credentials from environment variables
- Port: 8080

### prod
- PostgreSQL database (prod-db-host:5432/proddb)
- Credentials from environment variables
- Connection pooling configured
- Minimal error details
- Port: 8080

## Actuator Endpoints

- **Health**: `/actuator/health` - Application health status
- **Info**: `/actuator/info` - Application build metadata

### Health Endpoint

Returns application health status with optional details based on profile.

```bash
curl http://localhost:8080/actuator/health
```

### Info Endpoint

Returns build information including version, build time, and application metadata.

```bash
curl http://localhost:8080/actuator/info
```

## Environment Variables

### Test Profile
- `DB_PASSWORD` - Database password

### Production Profile
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password

## Configuration

Application configuration is managed through:
- `application.yml` - Base configuration
- `application-local.yml` - Local development
- `application-test.yml` - Test environment
- `application-prod.yml` - Production environment
