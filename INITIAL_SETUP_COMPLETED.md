# Initial Repository Setup - Status

## Summary

✅ **Frontend**: Fully configured and ready to use  
⚠️ **Backend**: Requires one manual command (see below)  
⚠️ **Playwright Browsers**: Requires one manual command (see below)

---

## What Has Been Completed

### ✅ Frontend Dependencies - COMPLETE
- ✅ npm packages installed: **1,177 packages**
- ✅ Location: `frontend/node_modules/`
- ✅ All Angular, testing, and development dependencies ready
- ✅ Package versions verified and consistent

### ⚠️ Backend Dependencies - ONE COMMAND NEEDED
The backend Maven dependencies require one manual command due to environment restrictions.

### ⚠️ Playwright Browsers - ONE COMMAND NEEDED
Browser binaries for E2E testing need to be installed.

---

## Required Manual Steps

### 1. Backend Maven Dependencies

Run **ONE** of these commands:

**Option A - Using setup script (recommended):**
```cmd
cd backend
setup.cmd
```

**Option B - Using PowerShell wrapper:**
```powershell
cd backend
.\run-maven.ps1
```

**Option C - Direct Maven command:**
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean install -DskipTests
```

**What this does:**
- Sets Java 17 as active JDK
- Downloads ~300+ Maven dependencies
- Compiles the Spring Boot application
- Takes 3-5 minutes

### 2. Playwright Browsers (Optional - Only needed for E2E tests)

```powershell
cd frontend
npx playwright install
```

**What this does:**
- Downloads Chromium, Firefox, and WebKit browsers
- Installs browser dependencies
- Takes 2-3 minutes
- Only needed if you plan to run E2E tests

---

## Verification

After running the setup commands, verify everything works:

### Backend Verification
```powershell
cd backend
mvn --version
# Should show: Java 17

mvn test
# Should run tests successfully
```

### Frontend Verification
```powershell
cd frontend
npm test
# Should run Angular tests

# If you installed Playwright browsers:
npm run e2e:fast
# Should run E2E tests
```

---

## Development Commands

Once setup is complete, use these commands:

### Start Development Servers

**Backend:**
```powershell
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

**Frontend:**
```powershell
cd frontend
npm start
# Runs on http://localhost:4200
```

### Run Tests

**Backend Unit Tests:**
```powershell
cd backend
mvn test
```

**Backend E2E Tests:**
```powershell
cd backend
mvn verify -Pbackend-e2e-h2           # With H2 database
mvn verify -Pbackend-e2e-postgres     # With PostgreSQL (requires Docker)
```

**Frontend Unit Tests:**
```powershell
cd frontend
npm test
```

**Frontend E2E Tests:**
```powershell
cd frontend
npm run e2e              # Default (H2 + mock auth)
npm run e2e:fast         # Fastest (single browser)
npm run e2e:postgres     # With PostgreSQL
npm run e2e:full         # All configurations
```

### Build for Production

**Backend:**
```powershell
cd backend
mvn clean package
# Output: backend/target/backend.jar
```

**Frontend:**
```powershell
cd frontend
npm run build
# Output: frontend/dist/
```

### Lint Code

**Frontend:**
```powershell
cd frontend
npm run lint
```

---

## Infrastructure (Optional)

To use PostgreSQL instead of H2 in-memory database:

```powershell
cd infra
docker-compose up -d
```

**Services provided:**
- PostgreSQL database on port 5432
- (Add other services if configured)

To stop:
```powershell
cd infra
docker-compose down
```

---

## File Structure

```
/
├── backend/              # Spring Boot application
│   ├── src/             # Source code
│   ├── target/          # Build output (created after mvn install)
│   ├── pom.xml          # Maven dependencies
│   ├── setup.cmd        # Setup script for Windows
│   └── run-maven.ps1    # Maven wrapper with Java 17
│
├── frontend/            # Angular application  
│   ├── src/            # Source code
│   ├── e2e/            # E2E tests
│   ├── node_modules/   # ✅ Dependencies installed
│   ├── package.json    # npm dependencies
│   └── angular.json    # Angular configuration
│
├── infra/              # Infrastructure (Docker)
│   └── docker-compose.yml
│
├── toolchains.xml      # Maven Java 17 configuration
└── AGENTS.md          # Complete development guide
```

---

## Access Points

Once servers are running:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4200 | Angular application |
| Backend API | http://localhost:8080 | Spring Boot REST API |
| API Docs | http://localhost:8080/swagger-ui.html | OpenAPI documentation |
| Health Check | http://localhost:8080/actuator/health | Application health |

---

## Helper Scripts

Several helper scripts are available in the `backend/` directory:

- `setup.cmd` - One-time setup with Java 17
- `run-maven.ps1` - Run Maven commands with Java 17
- `mvn-java17.cmd` - Wrapper to run any Maven command
- `install-java17.ps1` - PowerShell setup script

**Example usage:**
```powershell
cd backend
.\run-maven.ps1 test              # Run tests
.\run-maven.ps1 spring-boot:run   # Start server
.\run-maven.ps1 clean package     # Build
```

---

## Troubleshooting

### Backend: Maven not found
Ensure Maven is installed and in your PATH:
```powershell
mvn --version
```

### Backend: Wrong Java version
The scripts automatically set Java 17. If issues persist:
```powershell
java -version  # Should show Java 17 when using scripts
```

### Frontend: Port 4200 already in use
```powershell
npm start -- --port 4201  # Use different port
```

### Backend: Port 8080 already in use
Edit `backend/src/main/resources/application.yml` and change `server.port`

---

## Additional Resources

- **[AGENTS.md](AGENTS.md)** - Complete development guide with all commands and workflows
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[backend/README.md](backend/README.md)** - Backend-specific documentation
- **[frontend/README.md](frontend/README.md)** - Frontend-specific documentation

---

## Next Steps

1. ✅ Frontend is ready - you can start developing immediately
2. ⚠️ Run the backend setup command above
3. ⚠️ (Optional) Install Playwright browsers if you need E2E tests
4. 🚀 Start development with `mvn spring-boot:run` and `npm start`

---

**Questions?** Check [AGENTS.md](AGENTS.md) for comprehensive documentation.
