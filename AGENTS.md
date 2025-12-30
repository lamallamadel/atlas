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
