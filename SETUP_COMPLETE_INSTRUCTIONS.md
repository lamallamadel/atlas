# Repository Setup - Final Steps Required

## What Was Completed Automatically

✅ **Frontend Setup (100% Complete)**
- Installed 1,187 npm packages
- All Angular dependencies available in `frontend/node_modules/`
- Ready for development, testing, and building

✅ **Setup Scripts Created**
- `complete-setup.cmd` - Windows batch script to finish setup
- `complete-setup.ps1` - PowerShell script to finish setup
- `START_HERE.md` - Quick start guide
- `SETUP_STATUS.md` - Detailed status report

## What Needs Manual Action

⚠️ **Backend Maven Build**

Due to security restrictions, the automated setup cannot:
- Set the JAVA_HOME environment variable
- Execute scripts that modify the process environment
- Spawn processes with custom environment configurations

**This is a one-time setup step that takes ~2 minutes.**

## How to Complete Setup

From the repository root directory, run:

### Option 1: Automated Script (Recommended)

**Command Prompt:**
```cmd
complete-setup.cmd
```

**PowerShell:**
```powershell
.\complete-setup.ps1
```

This will:
1. Set JAVA_HOME to Java 17
2. Build the backend with Maven
3. Install Playwright browsers (optional, for E2E tests)

### Option 2: Manual Commands

If you prefer to see each step:

```cmd
REM Set Java 17 environment
set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot

REM Build backend
cd backend
mvn clean install -DskipTests -gs settings.xml
cd ..

REM Install Playwright browsers (optional)
cd frontend
npx playwright install
cd ..
```

### Option 3: Using Maven Wrapper

The repository includes a Maven wrapper that automatically sets Java 17:

```cmd
cd backend
.\mvn.cmd clean install -DskipTests -gs settings.xml
cd ..
```

## Verification

After completing the setup:

### Test Backend
```cmd
cd backend
mvn test
```
Expected: All tests pass ✅

### Test Frontend
```cmd
cd frontend
npm test
```
Expected: All tests pass ✅

## Start Development

Once setup is complete:

```cmd
REM Terminal 1 - Start Backend
cd backend
mvn spring-boot:run

REM Terminal 2 - Start Frontend (in a new terminal)
cd frontend
npm start
```

Access the application:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Actuator Health**: http://localhost:8080/actuator/health

## Available Commands

### Backend Commands
```cmd
cd backend

REM Build
mvn clean package

REM Run tests
mvn test

REM Run dev server
mvn spring-boot:run

REM E2E tests with H2
mvn verify -Pbackend-e2e-h2

REM E2E tests with PostgreSQL (requires Docker)
mvn verify -Pbackend-e2e-postgres
```

### Frontend Commands
```cmd
cd frontend

REM Start dev server
npm start

REM Build for production
npm run build

REM Run unit tests
npm test

REM Lint code
npm run lint

REM E2E tests (after completing setup)
npm run e2e

REM Fast E2E tests (single browser)
npm run e2e:fast

REM E2E tests with UI mode
npm run e2e:ui
```

## Environment Details

| Component | Status | Details |
|-----------|--------|---------|
| Java 17 | ✅ Available | `C:\Environement\Java\jdk-17.0.5.8-hotspot` |
| Maven 3.8.6 | ✅ Available | `C:\Environement\maven-3.8.6` |
| Node.js | ✅ Working | v18.12.1 |
| Frontend | ✅ Ready | 1,187 packages installed |
| Backend | ⚠️ Pending | Run `complete-setup.cmd` to build |
| Playwright | ⚠️ Pending | Installed by setup script (optional) |

## Infrastructure (Optional)

For local development with PostgreSQL and other services:

```cmd
cd infra
docker-compose up -d
```

This starts:
- PostgreSQL database
- Other infrastructure services

See `infra/README.md` for details.

## Troubleshooting

### "JAVA_HOME is not defined correctly"

This means JAVA_HOME isn't set in your current terminal session. Solutions:

1. Run the `complete-setup.cmd` script (sets it automatically)
2. Or set it manually:
   ```cmd
   set JAVA_HOME=C:\Environement\Java\jdk-17.0.5.8-hotspot
   ```

### Maven build fails with "Unable to download dependencies"

Check your internet connection and try:
```cmd
cd backend
mvn clean install -DskipTests -gs settings.xml -U
```

The `-U` flag forces dependency updates.

### Port 8080 or 4200 already in use

Another application is using these ports. Either:
1. Stop the other application
2. Change ports in configuration:
   - Backend: `backend/src/main/resources/application.yml`
   - Frontend: `frontend/angular.json` (change port in serve options)

### Playwright installation fails

This is optional. You can install it later when needed:
```cmd
cd frontend
npx playwright install
```

## Documentation

- **START_HERE.md** - Quick start guide (this file's summary)
- **SETUP_STATUS.md** - Detailed setup status
- **AGENTS.md** - Complete development guide
- **README.md** - Project overview
- **backend/README.md** - Backend documentation
- **frontend/README.md** - Frontend documentation

## Success Criteria

Setup is complete when:
- ✅ Frontend dependencies installed (DONE)
- ✅ Backend builds successfully (after running complete-setup.cmd)
- ✅ All tests pass
- ✅ Dev servers start without errors

---

## Summary

**To finish setup, run from the repository root:**

```cmd
complete-setup.cmd
```

**Then start developing:**

```cmd
REM Terminal 1
cd backend && mvn spring-boot:run

REM Terminal 2
cd frontend && npm start
```

**That's it! Happy coding! 🚀**
