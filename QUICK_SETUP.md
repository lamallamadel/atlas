# Quick Setup Guide - After Clone

## What's Already Done ✓

1. **Frontend**: All npm packages installed (`npm install` completed successfully)
2. **Configuration**: Maven toolchains and settings are configured
3. **Helper scripts**: Maven wrapper scripts created for easy backend setup

## Complete the Setup (2 steps)

### Step 1: Install Backend Dependencies

Open PowerShell and run:

```powershell
# Set Java 17 environment
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Install backend dependencies
cd backend
mvn clean install -DskipTests
```

**Alternative**: Use the provided wrapper script:
```cmd
cd backend
.\mvn.cmd clean install -DskipTests
```

### Step 2 (Optional): Install Playwright Browsers

Only needed if you plan to run frontend E2E tests:

```powershell
cd frontend
npx playwright install
```

## Quick Start - Run the Application

### Option 1: Using the Dev Script

```powershell
# Set JAVA_HOME
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'

# Start the full stack
.\dev.ps1 up
```

Access:
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html
- Health Check: http://localhost:8080/actuator/health

### Option 2: Manual Start

**Start Infrastructure:**
```powershell
cd infra
docker-compose up -d
cd ..
```

**Start Backend:**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn spring-boot:run
```

**Start Frontend** (in a new terminal):
```powershell
cd frontend
npm start
```

## Build & Test Commands

### Backend
```powershell
cd backend

# Build
.\mvn.cmd clean package

# Run tests
.\mvn.cmd test

# Run E2E tests (H2)
.\mvn.cmd verify -Pbackend-e2e-h2

# Run E2E tests (PostgreSQL)
.\mvn.cmd verify -Pbackend-e2e-postgres
```

### Frontend
```powershell
cd frontend

# Build
npm run build

# Run tests
npm test

# Run E2E tests
npm run e2e

# Run E2E tests (fast mode)
npm run e2e:fast

# Run E2E tests (UI mode)
npm run e2e:ui
```

## Troubleshooting

### "JAVA_HOME is not defined correctly"

Set JAVA_HOME before running Maven:
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
```

Or use the wrapper script:
```cmd
cd backend
.\mvn.cmd <your-maven-command>
```

### "Port already in use"

**Port 8080 (Backend):**
```powershell
# Find and stop the process
Get-NetTCPConnection -LocalPort 8080
Stop-Process -Id <PID>
```

**Port 4200 (Frontend):**
```powershell
# Find and stop the process
Get-NetTCPConnection -LocalPort 4200
Stop-Process -Id <PID>
```

### "Module not found" (Frontend)

Re-install dependencies:
```powershell
cd frontend
rm -r node_modules
npm install
```

## More Information

- **Full Documentation**: See `AGENTS.md` for detailed commands and architecture
- **Setup Details**: See `SETUP.md` for environment configuration
- **Setup Status**: See `SETUP_STATUS_AFTER_CLONE.md` for what's been completed
