# Project Repository

A Spring Boot backend application with Docker-based infrastructure.

## Quick Start

### 1. Prerequisites

- **Java 17** (JDK 17.0.5.8 or later)
- **Maven 3.6+**
- **Docker & Docker Compose** (for infrastructure services)

### 2. Setup Java Environment

**IMPORTANT:** Set JAVA_HOME to Java 17 before running Maven commands.

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

**Linux/Mac:**
```bash
export JAVA_HOME=/path/to/jdk-17
```

### 3. Install Dependencies

```bash
cd backend
mvn clean install
```

**Alternative for Windows users:** Use the provided wrapper script:
```cmd
cd backend
mvn-java17.cmd clean install
```

### 4. Start Infrastructure (Optional)

To run with PostgreSQL database:

```bash
cd infra
docker-compose up -d
```

## Project Structure

```
/
├── backend/              # Spring Boot application
│   ├── src/             # Source code
│   ├── pom.xml          # Maven configuration
│   ├── mvn-java17.cmd   # Windows Maven wrapper with Java 17
│   └── toolchains.xml   # Maven toolchains example
├── infra/               # Infrastructure configuration
│   ├── docker-compose.yml
│   ├── .env             # Environment variables (created from .env.example)
│   └── .env.example     # Environment template
├── AGENTS.md            # Developer guide
└── SETUP.md             # Detailed setup instructions
```

## Common Commands

### Backend
- **Build:** `cd backend && mvn clean package`
- **Test:** `cd backend && mvn test`
- **Run:** `cd backend && mvn spring-boot:run`

### Infrastructure
- **Start services:** `cd infra && docker-compose up -d`
- **Stop services:** `cd infra && docker-compose down`
- **View logs:** `cd infra && docker-compose logs -f`

## Documentation

- **[AGENTS.md](./AGENTS.md)** - Comprehensive development guide
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions with troubleshooting
- **[backend/README.md](./backend/README.md)** - Backend application details

## Notes

- The backend runs on port **8080** by default
- PostgreSQL runs on port **5432** (configurable in `infra/.env`)
- Default database credentials are in `infra/.env` (username: postgres, password: postgres)
- The application supports multiple profiles: `local` (default with H2), `test`, and `prod`

## Setup Status

✅ Repository cloned
✅ Infrastructure configuration ready (.env created)
✅ Maven helper scripts prepared
⚠️ **Manual step required:** Set JAVA_HOME to Java 17 and run `mvn clean install` in the backend directory

See [SETUP.md](./SETUP.md) for detailed instructions on completing the setup.
