# Initial Repository Setup

This document provides instructions for setting up the repository after cloning.

## ✓ Completed Setup Steps

### Frontend Dependencies
- **Status**: ✅ **COMPLETED**
- Frontend npm dependencies have been installed successfully
- Location: `frontend/node_modules/`
- 1,188 packages installed

## 🔧 Manual Setup Required: Backend

Due to environment restrictions, the backend setup requires manual execution of a setup script.

### Option 1: Run the Setup Script (Recommended)

**Windows Command Prompt:**
```cmd
SETUP_BACKEND.cmd
```

**Windows PowerShell:**
```powershell
.\SETUP_BACKEND.ps1
```

These scripts will:
1. Automatically set JAVA_HOME to Java 17
2. Run `mvn clean install -DskipTests`
3. Install all backend dependencies

### Option 2: Manual Setup

If you prefer to run the commands manually:

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
cd backend
mvn clean install -DskipTests -s settings.xml
cd ..
```

**Windows (Command Prompt):**
```cmd
set "JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot"
cd backend
mvn clean install -DskipTests -s settings.xml
cd ..
```

## Verification

After running the backend setup, verify the installation:

### Backend
```bash
cd backend
mvn -version
# Should show: Apache Maven 3.8.6 with Java version: 17.0.5

# Run tests
mvn test
```

### Frontend
```bash
cd frontend
npm run build
# Should complete successfully

npm test
# Should run unit tests
```

## Next Steps

Once setup is complete, you can:

### Run the Development Stack
```powershell
.\dev.ps1 up
```

### Run Tests
```bash
# Backend unit tests
cd backend && mvn test

# Backend E2E tests (H2)
cd backend && mvn verify -Pbackend-e2e-h2

# Backend E2E tests (PostgreSQL)
cd backend && mvn verify -Pbackend-e2e-postgres

# Frontend unit tests
cd frontend && npm test

# Frontend E2E tests
cd frontend && npm run e2e
```

### Build
```bash
# Build backend
cd backend && mvn clean package

# Build frontend
cd frontend && npm run build
```

## Configuration Files Created

The following configuration files have been created to assist with setup:

1. **backend/settings.xml** - Maven settings configured to use Maven Central directly (no proxy)
2. **backend/mavenrc_pre.bat** - Maven RC file to set JAVA_HOME (for manual use)
3. **backend/mvn.cmd** - Local Maven wrapper (for manual use)
4. **SETUP_BACKEND.cmd** - Windows batch setup script
5. **SETUP_BACKEND.ps1** - PowerShell setup script

## Troubleshooting

### JAVA_HOME not set
If you see "JAVA_HOME environment variable is not defined correctly":
- Run one of the provided setup scripts (SETUP_BACKEND.cmd or SETUP_BACKEND.ps1)
- Or manually set JAVA_HOME as shown in Option 2 above

### Maven download issues
The backend/settings.xml file is configured to bypass proxies and use Maven Central directly. If you still experience issues:
```bash
mvn clean install -DskipTests -U  # Force update
```

### Port conflicts
If ports 8080 or 4200 are in use:
- Backend: Modify `backend/src/main/resources/application.yml` (server.port)
- Frontend: Modify `frontend/angular.json` (port in serve options)

## Tech Stack

- **Backend**: Spring Boot 3.2.1, Java 17, Maven 3.8.6
- **Frontend**: Angular 16, Node.js, npm
- **Infrastructure**: Docker, PostgreSQL (via docker-compose)

## Documentation

- **AGENTS.md** - Complete development guide including commands
- **SETUP.md** - Detailed setup instructions
- **README.md** - Project overview
