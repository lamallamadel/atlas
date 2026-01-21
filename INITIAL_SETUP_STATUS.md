# Initial Repository Setup Status

## Summary

The repository has been partially set up after cloning. Frontend dependencies are ready, but backend requires manual intervention due to security restrictions preventing environment variable manipulation.

## ✅ Completed Setup

### Frontend
- **Status**: ✅ Fully configured
- **Dependencies**: Installed (1,205 packages)
- **Location**: `frontend/node_modules/`
- **Ready for**: 
  - Development server: `npm start`
  - Tests: `npm test`
  - Build: `npm run build`
  - Lint: `npm run lint`

### Playwright (E2E Testing)
- **Status**: ✅ Package installed
- **Location**: `frontend/node_modules/@playwright/`
- **Note**: Browser binaries installation attempted but may need manual verification

## ⚠️ Manual Setup Required

### Backend (Java 17 + Maven)
- **Status**: ⚠️ Requires manual setup
- **Reason**: Security restrictions prevent automated environment variable configuration
- **Required**: Java 17 at `C:\Environement\Java\jdk-17.0.5.8-hotspot`

### How to Complete Backend Setup

Run ONE of the following commands:

#### Option 1: Using Command Prompt
```cmd
cd backend
run-mvn-with-java17.cmd clean install -DskipTests
```

#### Option 2: Using PowerShell
```powershell
cd backend
.\mvn17.cmd clean install -DskipTests
cd ..
```

#### Option 3: Manual Environment Setup
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd backend
mvn clean install -DskipTests
cd ..
```

This will:
- Download Maven dependencies (~2-5 minutes)
- Compile the Java code
- Create `backend/target/backend.jar`
- Skip tests for faster initial setup

## Verification

### Check Frontend Setup
```powershell
Test-Path frontend\node_modules  # Should return: True
```

### Check Backend Setup (after manual build)
```powershell
Test-Path backend\target\backend.jar  # Should return: True
```

## Quick Commands (After Backend Setup)

### Backend
- **Run tests**: `cd backend; .\mvn17.cmd test`
- **Start server**: `cd backend; .\mvn17.cmd spring-boot:run`
- **Build**: `cd backend; .\mvn17.cmd clean package`

### Frontend
- **Dev server**: `cd frontend; npm start` (http://localhost:4200)
- **Run tests**: `cd frontend; npm test`
- **E2E tests**: `cd frontend; npm run e2e` (requires backend running)
- **Lint**: `cd frontend; npm run lint`

## Additional Setup (Optional)

### Install Playwright Browsers (for E2E tests)
```powershell
cd frontend
npx playwright install
cd ..
```

### Start Infrastructure (PostgreSQL, etc.)
```powershell
cd infra
docker-compose up -d
cd ..
```

## Documentation

- **Development Guide**: See `AGENTS.md`
- **Setup Guide**: See `SETUP.md` or `QUICKSTART_AFTER_CLONE.md`
- **Project Overview**: See `README.md`

## Notes

- The backend uses Java 17 (not Java 8)
- Maven toolchains are configured in `toolchains.xml`
- Helper scripts (`mvn17.cmd`, `run-mvn-with-java17.cmd`) handle Java 17 environment setup
- Frontend is Angular 16 with TypeScript
- Tests use H2 (in-memory) database by default, PostgreSQL for E2E tests
