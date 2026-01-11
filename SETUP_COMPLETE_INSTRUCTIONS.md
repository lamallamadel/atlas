# Initial Repository Setup - Complete

## ✅ Setup Completed

### Frontend - Fully Ready
- ✓ npm dependencies installed (`frontend/node_modules/`)
- ✓ Playwright browsers installed (Chromium, Firefox, WebKit)
- ✓ package-lock.json generated
- ✓ Ready to run all frontend commands

### Configuration - Ready
- ✓ Maven toolchains configured (`~/.m2/toolchains.xml` setup ready)
- ✓ Maven settings configured (`backend/settings.xml`)
- ✓ Helper scripts available in `backend/` directory

## ⚠️ Backend Maven Build Required

Due to security restrictions on environment variable modification, the backend Maven build could not be completed automatically. **You need to run ONE command to complete the setup.**

### Quick Start (Choose One)

**Option 1: Use Complete Setup Script (Recommended)**
```cmd
COMPLETE_SETUP.cmd
```

**Option 2: Use PowerShell (From backend directory)**
```powershell
cd backend
.\do-install.ps1
```

**Option 3: Use Command Prompt (From backend directory)**
```cmd
cd backend
.\run-install.cmd
```

This will:
- Set JAVA_HOME to Java 17
- Download Maven dependencies (~200-300 MB)
- Compile the Spring Boot application
- Create build artifacts in `backend/target/`
- Takes ~2-5 minutes depending on your connection

## Verify Setup

After running the backend build:

```powershell
# Test backend build
cd backend
mvn clean package

# Test backend tests
mvn test

# Test backend E2E (H2 database)
mvn verify -Pbackend-e2e-h2
```

## Available Commands

### Backend
```powershell
cd backend

# Build
mvn clean package

# Run tests
mvn test

# Run unit tests only
mvn test -Dtest=!*BackendE2ETest

# Run E2E tests (H2)
mvn verify -Pbackend-e2e-h2

# Run E2E tests (PostgreSQL)
mvn verify -Pbackend-e2e-postgres

# Start dev server
mvn spring-boot:run
```

### Frontend
```powershell
cd frontend

# Start dev server
npm start

# Run unit tests
npm test

# Run E2E tests (H2 + mock auth)
npm run e2e

# Run E2E tests (fast mode)
npm run e2e:fast

# Run E2E tests (UI mode)
npm run e2e:ui

# Run all E2E configurations
npm run e2e:full

# Build for production
npm run build

# Lint
npm run lint
```

### Infrastructure
```powershell
cd infra

# Start PostgreSQL
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset database
.\reset-db.ps1  # Windows
./reset-db.sh   # Linux/Mac
```

## Development Workflow

1. **Start Infrastructure** (optional, for PostgreSQL testing):
   ```powershell
   cd infra
   docker-compose up -d
   ```

2. **Start Backend**:
   ```powershell
   cd backend
   mvn spring-boot:run
   ```
   Backend runs on: http://localhost:8080

3. **Start Frontend** (in another terminal):
   ```powershell
   cd frontend
   npm start
   ```
   Frontend runs on: http://localhost:4200

4. **Access Services**:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8080/api
   - API Documentation: http://localhost:8080/swagger-ui.html
   - Health Check: http://localhost:8080/actuator/health

## Tech Stack

- **Backend**: Spring Boot 3.2.1, Java 17, PostgreSQL/H2
- **Frontend**: Angular 16, TypeScript, Angular Material
- **Testing**: JUnit 5, Mockito, Playwright, Jasmine, Karma
- **Infrastructure**: Docker, PostgreSQL, Elasticsearch
- **Build Tools**: Maven 3.8+, npm 8+

## Troubleshooting

### Java Version Issues
```powershell
# Check Java version
java -version  # Should show Java 17

# Set JAVA_HOME (PowerShell)
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Or use the wrapper scripts in backend/ which do this automatically
```

### Port Conflicts
- Backend (8080): Stop any process using this port
- Frontend (4200): Stop any Angular dev servers
- PostgreSQL (5432): Stop local PostgreSQL or use Testcontainers

### Docker Issues
```powershell
# Check Docker is running
docker --version
docker ps

# Clean up containers
docker-compose down
docker system prune
```

## What Was Installed

### Frontend Dependencies
- Angular 16.2.0 + Angular Material
- RxJS 7.8.0
- OAuth2 OIDC client
- Chart.js + ng2-charts
- ESLint + TypeScript ESLint
- Karma + Jasmine (unit testing)
- Playwright 1.57.0 (E2E testing)
- Webpack Bundle Analyzer

### Maven Will Install
- Spring Boot 3.2.1 starters (web, validation, actuator, security)
- Spring Data JPA + Hibernate
- PostgreSQL driver
- H2 Database (for testing)
- Flyway (database migrations)
- Testcontainers (for E2E tests)
- JUnit 5 + Mockito
- SpringDoc OpenAPI (Swagger)

## Next Steps

1. ✅ Run backend Maven build (see options above)
2. ✅ Run `mvn test` to verify backend tests pass
3. ✅ Run `npm test` in frontend to verify frontend tests pass
4. ✅ Start development servers and begin coding!

## Need Help?

- See `AGENTS.md` for detailed agent development guide
- See `SETUP.md` for manual setup instructions
- See `README.md` for project overview
- See `QUICKSTART.md` for quick start guide
