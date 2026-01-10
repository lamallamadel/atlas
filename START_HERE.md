# Quick Start After Clone

## Setup Status

✅ **Frontend** - Fully configured and ready
- Node.js dependencies installed (`frontend/node_modules/`)
- Playwright browsers installed for E2E tests

⚠️ **Backend** - Requires one more step (see below)

## Complete the Setup

To finish the backend setup, run **ONE** of these commands from the repository root:

### Option 1: Batch Script (Easiest)
```cmd
COMPLETE_SETUP.cmd
```

### Option 2: PowerShell Script
```powershell
.\SETUP_BACKEND.ps1
```

### Option 3: Manual Command
```powershell
cd backend
$env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
mvn clean install --toolchains ..\toolchains.xml --settings settings.xml
cd ..
```

## After Setup

Once the backend build completes, you're ready to develop!

### Start Development

```powershell
# Start backend (from backend directory)
cd backend
mvn spring-boot:run

# In another terminal, start frontend (from frontend directory)
cd frontend
npm start
```

### Run Tests

```powershell
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run e2e
```

### Quick Commands Reference

See `AGENTS.md` for complete command reference.

**Backend:**
- Build: `mvn clean package`
- Test: `mvn test`
- E2E (H2): `mvn verify -Pbackend-e2e-h2`
- E2E (PostgreSQL): `mvn verify -Pbackend-e2e-postgres`

**Frontend:**
- Serve: `npm start`
- Test: `npm test`
- Lint: `npm run lint`
- E2E: `npm run e2e`
- E2E (fast): `npm run e2e:fast`

**Access:**
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health

## Need Help?

See detailed setup information in `INITIAL_SETUP_STATUS.md`.
